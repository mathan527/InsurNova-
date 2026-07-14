"""
ML Model Serving API
FastAPI service that serves all ML models for InsurNova agents

Endpoints:
- POST /predict/risk - Risk prediction
- POST /predict/fraud - Fraud detection
- POST /predict/churn - Churn prediction
- POST /predict/pricing - Premium pricing
- GET /health - Health check
- GET /models/info - Model information
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
import uvicorn
import sys
import os
try:
    import pandas as pd
except Exception:
    pd = None
from datetime import datetime

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
sys.path.insert(0, project_root)

# For now, use mock models since we haven't trained them yet
class MockModel:
    def __init__(self, model_type):
        self.model_type = model_type
        self.is_trained = False
    
    def predict(self, features):
        # Return mock predictions
        if self.model_type == 'risk':
            return {'risk_score': 75, 'risk_level': 'high'}
        elif self.model_type == 'fraud':
            return {'is_fraud': False, 'fraud_probability': 0.15}
        elif self.model_type == 'churn':
            return {'will_churn': False, 'churn_probability': 0.25}
        elif self.model_type == 'pricing':
            return {'premium': 150.0, 'confidence': 0.85}
        return {}

# Use mock models for now
RiskPredictionModel = lambda: MockModel('risk')
FraudDetectionModel = lambda: MockModel('fraud')
ChurnPredictionModel = lambda: MockModel('churn')

try:
    from ml.models.pricing.train import PricingModel as TrainedPricingModel
except Exception:
    TrainedPricingModel = None

PricingModel = TrainedPricingModel if TrainedPricingModel is not None else (lambda: MockModel('pricing'))

# Initialize FastAPI app
app = FastAPI(
    title="InsurNova ML API",
    description="Machine Learning Model Serving API for parametric insurance",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model instances
models = {
    'risk': None,
    'fraud': None,
    'churn': None,
    'pricing': None
}


def to_model_input(features: Dict):
    if pd is not None:
        return pd.DataFrame([features])
    return [features]

# Pydantic models for request/response
class RiskPredictionRequest(BaseModel):
    features: Dict
    
class RiskPredictionResponse(BaseModel):
    risk_score: float = Field(..., ge=0, le=1)
    confidence: float = Field(..., ge=0, le=1)
    timestamp: str

class FraudPredictionRequest(BaseModel):
    features: Dict

class FraudPredictionResponse(BaseModel):
    fraud_score: float = Field(..., ge=0, le=1)
    is_fraudulent: bool
    confidence: float
    reasons: List[str]
    timestamp: str

class ChurnPredictionRequest(BaseModel):
    features: Dict

class ChurnPredictionResponse(BaseModel):
    churn_score: float = Field(..., ge=0, le=1)
    confidence: float
    factors: List[str]
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


@app.on_event("startup")
async def load_models():
    """
    Load all ML models on startup
    """
    print("=" * 60)
    print("Loading ML Models...")
    print("=" * 60)
    
    try:
        # Load Risk Model
        print("\n1. Loading Risk Prediction Model...")
        models['risk'] = RiskPredictionModel()
        try:
            models['risk'].load('models/risk')
        except:
            print("   ⚠️  Pre-trained model not found, initializing empty model")
        
        # Load Fraud Model
        print("\n2. Loading Fraud Detection Model...")
        models['fraud'] = FraudDetectionModel()
        try:
            models['fraud'].load('models/fraud')
        except:
            print("   ⚠️  Pre-trained model not found, initializing empty model")
        
        # Load Churn Model
        print("\n3. Loading Churn Prediction Model...")
        models['churn'] = ChurnPredictionModel()
        try:
            models['churn'].load('models/churn')
        except:
            print("   ⚠️  Pre-trained model not found, initializing empty model")
        
        # Load Pricing Model
        print("\n4. Loading Pricing Model...")
        models['pricing'] = PricingModel()
        try:
            pricing_model_paths = [
                os.path.join(project_root, 'ml', 'models', 'pricing'),
                'ml/models/pricing',
                'models/pricing'
            ]

            loaded = False
            for model_path in pricing_model_paths:
                if os.path.exists(os.path.join(model_path, 'model.pkl')):
                    models['pricing'].load(model_path)
                    print(f"   ✅ Pricing model loaded from {model_path}")
                    loaded = True
                    break

            if not loaded:
                raise FileNotFoundError('No pricing model artifacts found')
        except:
            print("   ⚠️  Pre-trained model not found, initializing empty model")
        
        print("\n" + "=" * 60)
        print("✅ All models loaded successfully!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error loading models: {str(e)}")
        raise


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "InsurNova ML API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "risk": "/predict/risk",
            "fraud": "/predict/fraud",
            "churn": "/predict/churn",
            "pricing": "/predict/pricing",
            "health": "/health",
            "models": "/models/info"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    model_status = {
        name: "loaded" if model is not None and hasattr(model, 'model') and model.model is not None else "not_loaded"
        for name, model in models.items()
    }
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "models": model_status
    }


@app.get("/models/info", response_model=List[ModelInfo])
async def get_models_info():
    """Get information about all loaded models"""
    info = []
    
    for name, model in models.items():
        status = "loaded" if model is not None and hasattr(model, 'model') and model.model is not None else "not_loaded"
        metadata = model.model_metadata if hasattr(model, 'model_metadata') else None
        
        info.append(ModelInfo(
            model_name=name,
            model_type=metadata.get('model_type', 'Unknown') if metadata else 'Unknown',
            status=status,
            metadata=metadata
        ))
    
    return info


@app.post("/predict/risk", response_model=RiskPredictionResponse)
async def predict_risk(request: RiskPredictionRequest):
    """
    Predict risk score for an insurance event
    """
    try:
        if models['risk'] is None or models['risk'].model is None:
            raise HTTPException(status_code=503, detail="Risk model not loaded")
        
        model_input = to_model_input(request.features)
        
        # Make prediction
        risk_scores, confidences = models['risk'].predict(model_input)
        
        return RiskPredictionResponse(
            risk_score=float(risk_scores[0]),
            confidence=float(confidences[0]),
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.post("/predict/fraud", response_model=FraudPredictionResponse)
async def predict_fraud(request: FraudPredictionRequest):
    """
    Detect fraudulent insurance claims
    """
    try:
        if models['fraud'] is None or models['fraud'].model is None:
            raise HTTPException(status_code=503, detail="Fraud model not loaded")
        
        model_input = to_model_input(request.features)
        
        # Make prediction
        fraud_probas, predictions, confidences, reasons = models['fraud'].predict(model_input)
        
        return FraudPredictionResponse(
            fraud_score=float(fraud_probas[0]),
            is_fraudulent=bool(predictions[0]),
            confidence=float(confidences[0]),
            reasons=reasons[0] if reasons else [],
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.post("/predict/churn", response_model=ChurnPredictionResponse)
async def predict_churn(request: ChurnPredictionRequest):
    """
    Predict user churn probability
    """
    try:
        if models['churn'] is None or models['churn'].model is None:
            raise HTTPException(status_code=503, detail="Churn model not loaded")
        
        model_input = to_model_input(request.features)
        
        # Make prediction
        churn_probas, confidences, factors = models['churn'].predict(model_input)
        
        return ChurnPredictionResponse(
            churn_score=float(churn_probas[0]),
            confidence=float(confidences[0]),
            factors=factors[0] if factors else [],
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.post("/predict/pricing", response_model=PricingPredictionResponse)
async def predict_pricing(request: PricingPredictionRequest):
    """
    Calculate optimal premium pricing multiplier
    """
    try:
        if models['pricing'] is None or models['pricing'].model is None:
            raise HTTPException(status_code=503, detail="Pricing model not loaded")
        
        model_input = to_model_input(request.features)
        
        # Make prediction
        prediction = models['pricing'].predict(model_input)

        if isinstance(prediction, dict):
            risk_multiplier = float(prediction['risk_multiplier'][0])
            predicted_loss_ratio = float(prediction['predicted_loss_ratio'][0])
            confidence = float(prediction['confidence'][0])
            risk_adjustment = float(prediction['risk_adjustment_inr'][0])
            trust_discount = float(prediction['trust_discount_inr'][0])
            weekly_premium = float(prediction['weekly_premium_inr'][0])
            base_weekly = float(getattr(models['pricing'], 'base_weekly_premium', 10.0))

            metadata = getattr(models['pricing'], 'model_metadata', {}) or {}

            return PricingPredictionResponse(
                risk_multiplier=risk_multiplier,
                predicted_loss_ratio=predicted_loss_ratio,
                confidence=confidence,
                risk_adjustment_inr=risk_adjustment,
                trust_discount_inr=trust_discount,
                weekly_premium_inr=weekly_premium,
                base_weekly_premium=base_weekly,
                currency=metadata.get('currency', 'INR'),
                region=metadata.get('region', 'India'),
                pricing_formula=metadata.get(
                    'pricing_formula',
                    'weekly_premium = base_weekly_premium + risk_adjustment - trust_discount'
                ),
                timestamp=datetime.now().isoformat()
            )

        # Backward-compatible response for old model interface.
        risk_multipliers, predicted_loss_ratios, confidences = prediction

        return PricingPredictionResponse(
            risk_multiplier=float(risk_multipliers[0]),
            predicted_loss_ratio=float(predicted_loss_ratios[0]),
            confidence=float(confidences[0]),
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


if __name__ == "__main__":
    # Run the server
    print("\n🚀 Starting InsurNova ML API Server...")
    print("=" * 60)
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
