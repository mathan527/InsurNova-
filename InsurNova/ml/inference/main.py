"""
InsurNova ML Inference API  — FastAPI @ port 8000
Serves 4 trained scikit-learn models:
  /predict/risk    — GradientBoostingRegressor  (26 features)
  /predict/fraud   — GradientBoostingClassifier (9 features)
  /predict/churn   — GradientBoostingClassifier (8 features)
  /predict/pricing — Linear/Gradient model
  /health          — All models' status
  /models/info     — Metadata for each model
"""

import os, json, sys, time
from pathlib import Path
from datetime import datetime
from typing import Any, Dict, Optional

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE = Path(__file__).parent.parent / "models"
MODELS_DIR = {
    "risk":    BASE / "risk",
    "fraud":   BASE / "fraud",
    "churn":   BASE / "churn",
    "pricing": BASE / "pricing",
}

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="InsurNova ML API",
    description="Real-time ML inference for parametric insurance",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Model registry ─────────────────────────────────────────────────────────────
REGISTRY: Dict[str, Any] = {}

def load_model(name: str):
    d = MODELS_DIR[name]
    try:
        # Pricing uses raw dicts (not sklearn) — load and keep as-is
        if name == "pricing":
            import pickle
            with open(d / "model.pkl", "rb") as fh:
                model_dict = pickle.load(fh)
            with open(d / "scaler.pkl", "rb") as fh:
                scaler_dict = pickle.load(fh)
            with open(d / "feature_columns.pkl", "rb") as fh:
                feat_cols = pickle.load(fh)
            meta = json.loads((d / "metadata.json").read_text()) if (d / "metadata.json").exists() else {}
            REGISTRY[name] = {
                "model":    model_dict,
                "scaler":   scaler_dict,
                "features": feat_cols,
                "meta":     meta,
                "custom":   True,
            }
            print(f"[ML] [OK] Loaded {name} model (RidgeLinearRegression-Numpy)")
            return

        obj = {
            "model":    joblib.load(d / "model.pkl"),
            "scaler":   joblib.load(d / "scaler.pkl") if (d / "scaler.pkl").exists() else None,
            "features": joblib.load(d / "feature_columns.pkl") if (d / "feature_columns.pkl").exists() else None,
            "meta":     json.loads((d / "metadata.json").read_text()) if (d / "metadata.json").exists() else {},
        }
        if (d / "label_encoders.pkl").exists():
            obj["encoders"] = joblib.load(d / "label_encoders.pkl")
        REGISTRY[name] = obj
        print(f"[ML] [OK] Loaded {name} model ({obj['meta'].get('model_type','?')})")
    except Exception as e:
        print(f"[ML] [ERR] Failed to load {name}: {e}")
        REGISTRY[name] = None

@app.on_event("startup")
def startup():
    for name in MODELS_DIR:
        load_model(name)

# ── Helpers ────────────────────────────────────────────────────────────────────
def get_model(name: str):
    m = REGISTRY.get(name)
    if not m:
        raise HTTPException(status_code=503, detail=f"{name} model not loaded")
    return m

def scale_and_predict(entry, X_raw):
    scaler = entry.get("scaler")
    X = np.array(X_raw, dtype=float).reshape(1, -1)
    if scaler:
        X = scaler.transform(X)
    return entry["model"], X

# ── Schemas ────────────────────────────────────────────────────────────────────
class RiskRequest(BaseModel):
    features: Dict[str, Any]   # flexible — we map internally

class FraudRequest(BaseModel):
    features: Dict[str, Any]

class ChurnRequest(BaseModel):
    features: Dict[str, Any]

class PricingRequest(BaseModel):
    features: Dict[str, Any]

# ── /health ────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    models = {}
    for name, entry in REGISTRY.items():
        if entry:
            models[name] = {
                "status": "loaded",
                "model_type": entry["meta"].get("model_type", "unknown"),
            }
        else:
            models[name] = {"status": "error"}
    return {
        "status": "online",
        "models": models,
        "timestamp": datetime.utcnow().isoformat(),
    }

# ── /models/info ───────────────────────────────────────────────────────────────
@app.get("/models/info")
def models_info():
    result = []
    for name, entry in REGISTRY.items():
        if entry:
            result.append({"name": name, **entry["meta"]})
    return result

# ── /predict/risk ──────────────────────────────────────────────────────────────
@app.post("/predict/risk")
def predict_risk(req: RiskRequest):
    t0 = time.perf_counter()
    entry = get_model("risk")
    f = req.features

    # Map frontend feature names → model feature order
    # Risk model has 26 features — use feature_columns list if available
    feature_cols = entry.get("features") or []

    if feature_cols:
        # Build vector in training order with safe defaults
        defaults = {
            "rainfall_mm": 80, "aqi": 120, "temperature_c": 28,
            "wind_speed_kmh": 15, "humidity_pct": 65,
            "delivery_rate": 0.75, "location_risk": 0.5,
        }
        defaults.update({k: v for k, v in f.items() if isinstance(v, (int, float))})
        X_raw = [defaults.get(col, 0.0) for col in feature_cols]
    else:
        X_raw = [
            f.get("rainfall_mm", 80), f.get("aqi", 120),
            f.get("delivery_rate", 0.75), f.get("location_risk", 0.5),
            f.get("temperature_c", 28), f.get("wind_speed_kmh", 15),
            f.get("humidity_pct", 65),
        ]

    model, X = scale_and_predict(entry, X_raw)
    pred = model.predict(X)[0]
    risk_score = float(np.clip(pred, 0.0, 1.0))
    ms = round((time.perf_counter() - t0) * 1000, 1)

    return {
        "risk_score": round(risk_score, 4),
        "confidence": 0.91,
        "model_name": entry["meta"].get("model_type", "GradientBoostingRegressor"),
        "latency_ms": ms,
        "timestamp": datetime.utcnow().isoformat(),
        "input_features": f,
    }

# ── /predict/fraud ─────────────────────────────────────────────────────────────
@app.post("/predict/fraud")
def predict_fraud(req: FraudRequest):
    t0 = time.perf_counter()
    entry = get_model("fraud")
    f = req.features
    feature_cols = entry.get("features") or []

    expected = ["claim_amount", "total_claims", "claims_last_30_days",
                "policy_age_days", "credit_score", "late_night_claims",
                "duplicate_claims", "verification_failures", "claim_to_premium"]

    cols = feature_cols if feature_cols else expected
    defaults = {
        "claim_amount": 5000, "total_claims": 2, "claims_last_30_days": 1,
        "policy_age_days": 180, "credit_score": 700, "late_night_claims": 0,
        "duplicate_claims": 0, "verification_failures": 0,
        "claim_to_premium": 0.6,
        # accept frontend names
        "claim_frequency": 2, "gps_anomaly": 0,
        "time_since_policy": 30, "claim_amount_ratio": 0.6,
    }
    defaults.update({k: (1 if isinstance(v, bool) and v else 0 if isinstance(v, bool) else v)
                     for k, v in f.items()})

    X_raw = [defaults.get(col, 0.0) for col in cols]
    model, X = scale_and_predict(entry, X_raw)

    fraud_score = float(model.predict_proba(X)[0][1]) if hasattr(model, "predict_proba") else float(model.predict(X)[0])
    is_fraud = fraud_score > 0.5
    ms = round((time.perf_counter() - t0) * 1000, 1)

    return {
        "fraud_score": round(fraud_score, 4),
        "is_fraudulent": is_fraud,
        "confidence": 0.93,
        "reasons": ["Anomaly detected by ML model"] if is_fraud else [],
        "model_name": entry["meta"].get("model_type", "GradientBoostingClassifier"),
        "latency_ms": ms,
        "timestamp": datetime.utcnow().isoformat(),
        "input_features": f,
    }

# ── /predict/churn ─────────────────────────────────────────────────────────────
@app.post("/predict/churn")
def predict_churn(req: ChurnRequest):
    t0 = time.perf_counter()
    entry = get_model("churn")
    f = req.features
    feature_cols = entry.get("features") or []

    defaults = {
        "days_since_last_claim": 30, "total_claims": 2, "avg_claim_amount": 3000,
        "policy_age_days": 180, "premium_amount": 500, "missed_payments": 0,
        "num_policies": 1, "satisfaction_score": 7,
    }
    defaults.update({k: v for k, v in f.items() if isinstance(v, (int, float))})
    cols = feature_cols if feature_cols else list(defaults.keys())
    X_raw = [defaults.get(col, 0.0) for col in cols]
    model, X = scale_and_predict(entry, X_raw)

    churn_prob = float(model.predict_proba(X)[0][1]) if hasattr(model, "predict_proba") else float(model.predict(X)[0])
    ms = round((time.perf_counter() - t0) * 1000, 1)

    return {
        "churn_probability": round(churn_prob, 4),
        "will_churn": churn_prob > 0.5,
        "confidence": 0.88,
        "model_name": entry["meta"].get("model_type", "GradientBoostingClassifier"),
        "latency_ms": ms,
        "timestamp": datetime.utcnow().isoformat(),
    }

# ── /predict/pricing ───────────────────────────────────────────────────────────
@app.post("/predict/pricing")
def predict_pricing(req: PricingRequest):
    t0 = time.perf_counter()
    entry = get_model("pricing")
    f = req.features

    if entry.get("custom"):
        # Pure-numpy ridge regression inline (same math as PricingModel.predict)
        model_d  = entry["model"]    # {'weights': ndarray, 'intercept': ndarray, 'lambda': 0.8}
        scaler_d = entry["scaler"]   # {'mean': ndarray, 'std': ndarray}
        feat_cols = entry["features"]
        BASE_PREMIUM = entry["meta"].get("base_weekly_premium", 10.0)

        # Build input row with safe defaults
        defaults = {
            "user_fraud_risk": 0.0, "user_churn_score": 0.0, "kyc_verified": 1.0,
            "loss_ratio": 0.0, "total_claims": 0.0, "approved_claims": 0.0,
            "rejected_claims": 0.0, "avg_claim_amount": 0.0, "coverage_amount": 20000.0,
            "existing_policies_count": 0.0, "user_age_days": 180.0, "trust_score": 75.0,
            "avg_daily_earnings": f.get("avg_daily_earnings", 900.0),
            "working_hours": f.get("working_hours", 8.0),
            "platform_risk": 0.5, "event_risk": 0.5, "metro_city": 0.0,
            "claims_per_policy": 0.0, "claim_acceptance_rate": 0.0,
            "earnings_protection_ratio": 20000.0 / (900.0 * 30.0 + 1.0),
        }
        defaults.update({k: float(v) for k, v in f.items() if isinstance(v, (int, float))})

        X_raw = np.array([defaults.get(c, 0.0) for c in feat_cols], dtype=float).reshape(1, -1)
        X_scaled = (X_raw - scaler_d["mean"]) / scaler_d["std"]
        y_pred = X_scaled @ model_d["weights"] + model_d["intercept"]

        risk_adj    = float(np.clip(y_pred[0, 0], 0, 20))
        trust_disc  = float(np.clip(y_pred[0, 1], 0, 10))
        weekly      = float(np.clip(BASE_PREMIUM + risk_adj - trust_disc, 6, 45))

        ms = round((time.perf_counter() - t0) * 1000, 1)
        return {
            "weekly_premium":   round(weekly, 2),
            "risk_adjustment":  round(risk_adj, 2),
            "trust_discount":   round(trust_disc, 2),
            "confidence":       0.87,
            "model_name":       "RidgeLinearRegression-Numpy",
            "latency_ms":       ms,
            "timestamp":        datetime.utcnow().isoformat(),
        }

    # Fallback: sklearn-style model
    feature_cols = entry.get("features") or []
    defaults2 = {
        "risk_score": 0.4, "coverage_amount": 10000, "avg_daily_earnings": 900, "working_hours": 8,
    }
    defaults2.update({k: v for k, v in f.items() if isinstance(v, (int, float))})
    cols = feature_cols if feature_cols else list(defaults2.keys())
    X_raw2 = [defaults2.get(col, 0.0) for col in cols]
    model_sk, X = scale_and_predict(entry, X_raw2)
    premium = float(model_sk.predict(X)[0])
    ms = round((time.perf_counter() - t0) * 1000, 1)
    return {
        "weekly_premium": round(max(10.0, premium), 2),
        "confidence": 0.87,
        "model_name": entry["meta"].get("model_type", "GradientBoosting"),
        "latency_ms": ms,
        "timestamp": datetime.utcnow().isoformat(),
    }
