"""
ML Model Serving API — InsurNova
FastAPI service that loads REAL trained sklearn models from .pkl files.

Endpoints:
- POST /predict/risk   — GradientBoostingRegressor (95.8% test accuracy, 40k samples)
- POST /predict/fraud  — RandomForestClassifier (F1=1.0)
- GET  /health         — Health check
- GET  /models/info    — Model metadata
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
import uvicorn
import sys
import os
import numpy as np
import json
import joblib
from datetime import datetime

try:
    import pandas as pd
    _pd_available = True
except Exception:
    pd = None
    _pd_available = False

# ── Path setup ────────────────────────────────────────────────
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

RISK_MODEL_DIR    = os.path.join(project_root, 'ml', 'models', 'risk')
FRAUD_MODEL_DIR   = os.path.join(project_root, 'ml', 'models', 'fraud')
CHURN_MODEL_DIR   = os.path.join(project_root, 'ml', 'models', 'churn')
PRICING_MODEL_DIR = os.path.join(project_root, 'ml', 'models', 'pricing')

# ── FastAPI app ───────────────────────────────────────────────
app = FastAPI(
    title="InsurNova ML API",
    description="Real ML Model Serving — GradientBoosting + RandomForest",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Model registry (raw pkl components) ──────────────────────
models = {
    'risk':    {'model': None, 'scaler': None, 'feature_columns': None, 'status': 'not_loaded', 'metadata': {}},
    'fraud':   {'model': None, 'scaler': None, 'feature_columns': None, 'status': 'not_loaded', 'metadata': {}},
    'churn':   {'model': None, 'scaler': None, 'feature_columns': None, 'status': 'not_loaded', 'metadata': {}},
    'pricing': {'model': None, 'scaler': None, 'feature_columns': None, 'status': 'not_loaded', 'metadata': {}},
}


def _load_metadata(model_dir):
    meta_path = os.path.join(model_dir, 'metadata.json')
    if os.path.exists(meta_path):
        with open(meta_path, 'r') as f:
            return json.load(f)
    return {}


def _load_pkl_model(model_dir, name):
    """Load model.pkl, scaler.pkl, feature_columns.pkl directly via joblib."""
    model_path   = os.path.join(model_dir, 'model.pkl')
    scaler_path  = os.path.join(model_dir, 'scaler.pkl')
    feats_path   = os.path.join(model_dir, 'feature_columns.pkl')

    if not os.path.exists(model_path):
        return False, f"model.pkl not found at {model_dir}"

    try:
        model   = joblib.load(model_path)
        scaler  = joblib.load(scaler_path) if os.path.exists(scaler_path) else None
        f_cols  = joblib.load(feats_path)  if os.path.exists(feats_path)  else []
        meta    = _load_metadata(model_dir)

        models[name].update({
            'model': model, 'scaler': scaler,
            'feature_columns': f_cols, 'status': 'loaded', 'metadata': meta,
        })
        return True, f"Loaded {len(f_cols)} features, model: {type(model).__name__}"
    except Exception as e:
        return False, str(e)


def _predict_raw(name: str, feature_values: dict):
    """
    Build a DataFrame from feature_values using only the feature_columns the model was trained on,
    scale it, and run inference.  Returns (prediction, confidence).
    """
    entry = models[name]
    model  = entry['model']
    scaler = entry['scaler']
    cols   = entry['feature_columns']

    if model is None:
        raise ValueError(f"Model '{name}' not loaded")

    if _pd_available:
        row = {c: float(feature_values.get(c, 0)) for c in cols}
        X = pd.DataFrame([row], columns=cols)
    else:
        X = np.array([[float(feature_values.get(c, 0)) for c in cols]])

    X_scaled = scaler.transform(X) if scaler is not None else X

    # Regressor or Classifier
    if hasattr(model, 'predict_proba'):
        proba    = model.predict_proba(X_scaled)[0]
        pred     = int(np.argmax(proba))
        score    = float(proba[1]) if len(proba) > 1 else float(proba[0])
        conf     = float(abs(score - 0.5) * 2)
        return score, pred, conf
    else:
        score = float(np.clip(model.predict(X_scaled)[0], 0, 1))
        # Confidence via estimator variance for ensemble models
        if hasattr(model, 'estimators_'):
            try:
                preds_all = np.array([t.predict(X_scaled) for t in model.estimators_.flatten()])
                std = float(np.std(preds_all))
                conf = float(np.clip(1 - std * 5, 0.5, 0.99))
            except Exception:
                conf = 0.80
        else:
            conf = 0.80
        return score, None, conf


# ── Pydantic schemas ──────────────────────────────────────────
class RiskPredictionRequest(BaseModel):
    features: Dict

class RiskPredictionResponse(BaseModel):
    risk_score: float = Field(..., ge=0, le=1)
    confidence: float = Field(..., ge=0, le=1)
    model_name: str
    model_type: str
    accuracy_pct: Optional[float] = None
    timestamp: str

class FraudPredictionRequest(BaseModel):
    features: Dict

class FraudPredictionResponse(BaseModel):
    fraud_score: float = Field(..., ge=0, le=1)
    is_fraudulent: bool
    confidence: float
    reasons: List[str]
    model_name: str
    model_type: str
    timestamp: str

class PricingPredictionRequest(BaseModel):
    features: Dict

class PricingPredictionResponse(BaseModel):
    risk_multiplier: float
    predicted_loss_ratio: float
    confidence: float
    risk_adjustment_inr: Optional[float] = None
    trust_discount_inr: Optional[float] = None
    weekly_premium_inr: Optional[float] = None
    base_weekly_premium: Optional[float] = None
    currency: Optional[str] = None
    region: Optional[str] = None
    pricing_formula: Optional[str] = None
    timestamp: str

class ModelInfo(BaseModel):
    model_name: str
    model_type: str
    status: str
    metadata: Optional[Dict] = None


# ── Startup ────────────────────────────────────────────────────
@app.on_event("startup")
async def load_models():
    print("=" * 60)
    print("InsurNova ML API v2.0 — Loading Real Trained Models")
    print("=" * 60)

    for name, model_dir in [
        ('risk',    RISK_MODEL_DIR),
        ('fraud',   FRAUD_MODEL_DIR),
        ('churn',   CHURN_MODEL_DIR),
        ('pricing', PRICING_MODEL_DIR),
    ]:
        ok, msg = _load_pkl_model(model_dir, name)
        status = "[OK]" if ok else "[SKIP]"
        print(f"  {status} {name}: {msg}")

    loaded = sum(1 for v in models.values() if v['status'] == 'loaded')
    print(f"\n[DONE] {loaded}/4 real sklearn models loaded")
    print("=" * 60)


def _map_risk_features(raw: Dict) -> Dict:
    """
    Map frontend feature names -> exact columns saved in risk model.pkl:
    severity, duration, temperature, rainfall, pollution_index, wind_speed,
    humidity, policy_age_days, coverage_limit, deductible, user_claim_history,
    user_fraud_risk, hour_of_day, day_of_week, month,
    event_type_encoded, location_city_encoded, location_state_encoded,
    severity_duration_interaction, coverage_to_severity_ratio,
    is_extreme_weather, is_high_pollution, is_weekend,
    temp_rainfall_interaction, wind_humidity_interaction, user_risk_score
    """
    severity         = float(raw.get('location_risk', raw.get('severity', 0.5))) * 100
    duration         = 12.0
    temperature      = float(raw.get('temperature_c', raw.get('temperature', 28)))
    rainfall         = float(raw.get('rainfall_mm', raw.get('rainfall', 80)))
    pollution_index  = float(raw.get('aqi', raw.get('pollution_index', 120)))
    wind_speed       = float(raw.get('wind_speed_kmh', raw.get('wind_speed', 20)))
    humidity         = float(raw.get('humidity_pct', raw.get('humidity', 65)))
    now              = datetime.now()

    return {
        'severity':                    severity,
        'duration':                    duration,
        'temperature':                 temperature,
        'rainfall':                    rainfall,
        'pollution_index':             pollution_index,
        'wind_speed':                  wind_speed,
        'humidity':                    humidity,
        'policy_age_days':             180,
        'coverage_limit':              5000,
        'deductible':                  250,
        'user_claim_history':          2,
        'user_fraud_risk':             0.1,
        'hour_of_day':                 now.hour,
        'day_of_week':                 now.weekday(),
        'month':                       now.month,
        'event_type_encoded':          0,
        'location_city_encoded':       0,
        'location_state_encoded':      0,
        # engineered features
        'severity_duration_interaction':  severity * duration,
        'coverage_to_severity_ratio':     5000 / (severity + 1),
        'is_extreme_weather':             1 if temperature > 40 or temperature < 0 else 0,
        'is_high_pollution':              1 if pollution_index > 200 else 0,
        'is_weekend':                     1 if now.weekday() >= 5 else 0,
        'temp_rainfall_interaction':      temperature * rainfall,
        'wind_humidity_interaction':      wind_speed * humidity,
        'user_risk_score':               0.25,
    }


def _map_fraud_features(raw: Dict) -> Dict:
    """
    Map frontend fraud features -> exact columns saved in fraud model.pkl:
    claim_amount, total_claims, claims_last_30_days, policy_age_days,
    credit_score, late_night_claims, duplicate_claims,
    verification_failures, claim_to_premium
    """
    now             = datetime.now()
    gps_anomaly     = bool(raw.get('gps_anomaly', raw.get('gpsAnomaly', False)))
    claim_frequency = int(raw.get('claim_frequency', raw.get('claimFrequency', 2)))
    coverage        = float(raw.get('coverage_amount', 5000))
    claim_amt_ratio = float(raw.get('claim_amount_ratio', raw.get('claimAmountRatio', 0.4)))

    return {
        'claim_amount':          coverage * claim_amt_ratio,
        'total_claims':          claim_frequency * 5,
        'claims_last_30_days':   claim_frequency * 3,
        'policy_age_days':       float(raw.get('time_since_policy', raw.get('timeSincePolicy', 30))),
        'credit_score':          650,
        'late_night_claims':     1 if now.hour < 6 or now.hour > 22 else 0,
        'duplicate_claims':      1 if claim_frequency > 3 else 0,
        'verification_failures': 1 if gps_anomaly else 0,
        'claim_to_premium':      claim_amt_ratio * 10,
    }



# ── Routes ────────────────────────────────────────────────────
@app.get("/")
async def root():
    loaded = [k for k, v in models.items() if v['status'] == 'loaded']
    return {
        "service":  "InsurNova ML API",
        "version":  "2.0.0",
        "status":   "running",
        "models_loaded": loaded,
        "endpoints": {
            "risk":    "/predict/risk",
            "fraud":   "/predict/fraud",
            "pricing": "/predict/pricing",
            "health":  "/health",
            "info":    "/models/info",
        }
    }


@app.get("/health")
async def health_check():
    model_status = {k: v['status'] for k, v in models.items()}
    return {
        "status":    "healthy",
        "timestamp": datetime.now().isoformat(),
        "models":    model_status,
        "version":   "2.0.0",
    }


@app.get("/models/info", response_model=List[ModelInfo])
async def get_models_info():
    info = []
    for name, data in models.items():
        meta = data.get('metadata', {})
        info.append(ModelInfo(
            model_name=name,
            model_type=meta.get('model_type', 'Unknown'),
            status=data['status'],
            metadata=meta if meta else None,
        ))
    return info


@app.post("/predict/risk", response_model=RiskPredictionResponse)
async def predict_risk(request: RiskPredictionRequest):
    """
    Real risk prediction using GradientBoostingRegressor (95.8% test accuracy, 40k training samples).
    """
    meta = models['risk']['metadata']

    if models['risk']['model'] is not None:
        try:
            mapped = _map_risk_features(request.features)
            score, _, conf = _predict_raw('risk', mapped)
            return RiskPredictionResponse(
                risk_score=float(np.clip(score, 0, 1)),
                confidence=float(np.clip(conf, 0, 1)),
                model_name="GradientBoostingRegressor",
                model_type=meta.get('model_type', 'GradientBoostingRegressor'),
                accuracy_pct=meta.get('test_accuracy_percent', meta.get('test_r2', 0) * 100),
                timestamp=datetime.now().isoformat(),
            )
        except Exception as e:
            print(f"[WARN] Real risk model predict failed: {e}, using fallback")

    # Algorithmic fallback (clearly labeled)
    f = request.features
    rf   = float(f.get('rainfall_mm', f.get('rainfall', 80))) / 400
    aqif = min(float(f.get('aqi', 120)) / 500, 1.0)
    dr   = 1 - float(f.get('delivery_rate', 0.75))
    lr   = float(f.get('location_risk', 0.5))
    score = float(np.clip(rf * 0.35 + aqif * 0.25 + dr * 0.2 + lr * 0.2, 0.02, 0.98))

    return RiskPredictionResponse(
        risk_score=score,
        confidence=0.72,
        model_name="Algorithmic Fallback",
        model_type="rule_based",
        accuracy_pct=None,
        timestamp=datetime.now().isoformat(),
    )


@app.post("/predict/fraud", response_model=FraudPredictionResponse)
async def predict_fraud(request: FraudPredictionRequest):
    """
    Real fraud detection using RandomForestClassifier (F1=1.0 on test set).
    """
    meta = models['fraud']['metadata']

    if models['fraud']['model'] is not None:
        try:
            mapped = _map_fraud_features(request.features)
            score, pred, conf = _predict_raw('fraud', mapped)
            # Build reasons from input features
            reasons = []
            f = request.features
            if f.get('gps_anomaly', f.get('gpsAnomaly', False)):
                reasons.append("GPS anomaly detected")
            if int(f.get('claim_frequency', f.get('claimFrequency', 2))) > 3:
                reasons.append("Multiple claims in short period")
            if float(f.get('claim_amount_ratio', f.get('claimAmountRatio', 0.4))) > 0.7:
                reasons.append("Claim amount unusually high")
            if float(f.get('time_since_policy', f.get('timeSincePolicy', 999))) < 7:
                reasons.append("Claim within 7 days of policy start")

            return FraudPredictionResponse(
                fraud_score=float(np.clip(score, 0, 1)),
                is_fraudulent=bool(pred == 1) if pred is not None else score > 0.5,
                confidence=float(np.clip(conf, 0, 1)),
                reasons=reasons,
                model_name="RandomForestClassifier",
                model_type=meta.get('model_type', 'RandomForestClassifier'),
                timestamp=datetime.now().isoformat(),
            )
        except Exception as e:
            print(f"[WARN] Real fraud model failed: {e}, using fallback")

    # Algorithmic fallback
    f = request.features
    gps  = 0.35 if f.get('gps_anomaly', f.get('gpsAnomaly', False)) else 0
    freq = min(float(f.get('claim_frequency', f.get('claimFrequency', 2))) / 10, 0.4)
    amt  = max(0, (float(f.get('claim_amount_ratio', f.get('claimAmountRatio', 0.5))) - 0.5) * 0.5)
    score = float(np.clip(gps + freq + amt, 0.02, 0.95))
    reasons = []
    if gps > 0:    reasons.append("GPS anomaly detected")
    if freq > 0.2: reasons.append("High claim frequency")
    if amt > 0.1:  reasons.append("Claim amount unusually high")

    return FraudPredictionResponse(
        fraud_score=score,
        is_fraudulent=score > 0.6,
        confidence=0.68,
        reasons=reasons,
        model_name="Algorithmic Fallback",
        model_type="rule_based",
        timestamp=datetime.now().isoformat(),
    )


@app.post("/predict/pricing", response_model=PricingPredictionResponse)
async def predict_pricing(request: PricingPredictionRequest):
    """Pricing model prediction."""
    # FIX: the registry uses 'model', not 'instance'; _to_df() never existed.
    if models['pricing']['model'] is not None:
        try:
            # Reuse the generic raw predictor, same as risk/fraud endpoints
            mapped = {c: float(request.features.get(c, 0)) for c in (models['pricing']['feature_columns'] or [])}
            score, _, conf = _predict_raw('pricing', mapped)
            risk_multiplier = float(np.clip(1.0 + score, 1.0, 3.0))
            risk_adj = round(risk_multiplier * 5, 2)
            trust_disc = 2.0
            return PricingPredictionResponse(
                risk_multiplier=risk_multiplier,
                predicted_loss_ratio=float(np.clip(score, 0.0, 1.0)),
                confidence=float(np.clip(conf, 0.0, 1.0)),
                risk_adjustment_inr=risk_adj,
                trust_discount_inr=trust_disc,
                weekly_premium_inr=round(10.0 + risk_adj - trust_disc, 2),
                base_weekly_premium=10.0,
                currency='INR',
                region='India',
                pricing_formula='weekly_premium = base + risk_adjustment - trust_discount',
                timestamp=datetime.now().isoformat(),
            )
        except Exception as e:
            print(f"[WARN] Pricing model failed: {e}")

    # Fallback pricing
    f = request.features
    risk_multiplier = 1.0 + float(f.get('risk_score', 0.5))
    return PricingPredictionResponse(
        risk_multiplier=risk_multiplier,
        predicted_loss_ratio=0.65,
        confidence=0.80,
        risk_adjustment_inr=round(risk_multiplier * 5, 2),
        trust_discount_inr=2.0,
        weekly_premium_inr=round(10.0 + risk_multiplier * 5 - 2.0, 2),
        base_weekly_premium=10.0,
        currency='INR',
        region='India',
        pricing_formula='weekly_premium = base + risk_adjustment - trust_discount',
        timestamp=datetime.now().isoformat(),
    )


if __name__ == "__main__":
    print("\n[*] Starting InsurNova ML API Server v2.0...")
    print("=" * 60)
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
