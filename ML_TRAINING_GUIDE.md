# 🤖 ML Model Training Guide

Complete guide to train all 4 machine learning models for InsurNova.

## 📋 Prerequisites

✅ Python 3.8+ installed
✅ Required packages: scikit-learn, pandas, numpy, joblib

Install dependencies:
```bash
pip install scikit-learn pandas numpy joblib matplotlib seaborn
```

---

## 🎯 Training All Models (Quick Start)

### Option 1: Train All Models at Once

```bash
# Navigate to project root
cd c:\Users\chars\OneDrive\Desktop\InsurNova

# Train all 4 models sequentially
python ml/models/risk/train.py && \
python ml/models/fraud/train.py && \
python ml/models/churn/train.py && \
python ml/models/pricing/train.py
```

### Option 2: Train Each Model Individually

#### 1️⃣ Risk Prediction Model

```bash
cd c:\Users\chars\OneDrive\Desktop\InsurNova
python ml/models/risk/train.py
```

**Output:** `ml/models/risk/model.pkl`
- Predicts risk score (0-100)
- Used by Risk Agent
- Features: event type, severity, location, user history

---

#### 2️⃣ Fraud Detection Model

```bash
cd c:\Users\chars\OneDrive\Desktop\InsurNova
python ml/models/fraud/train.py
```

**Output:** `ml/models/fraud/model.pkl`
- Detects fraudulent claims (binary classification)
- Used by Fraud Agent
- Features: claim frequency, payout patterns, behavioral signals

---

#### 3️⃣ Churn Prediction Model

```bash
cd c:\Users\chars\OneDrive\Desktop\InsurNova
python ml/models/churn/train.py
```

**Output:** `ml/models/churn/model.pkl`
- Predicts user churn probability
- Used by Churn Agent
- Features: engagement metrics, claim history, satisfaction

---

#### 4️⃣ Pricing/Premium Model

```bash
cd c:\Users\chars\OneDrive\Desktop\InsurNova
python ml/models/pricing/train.py
```

**Output:** `ml/models/pricing/model.pkl`
- Calculates optimal premium pricing
- Used by Pricing Agent
- Features: risk profile, coverage amount, user segment

---

## 🔄 Retraining After Training

Once models are trained, restart the ML API to load them:

### PowerShell (Windows):
```powershell
# Stop current ML API (Ctrl+C in the terminal where it's running)

# Restart ML API
cd c:\Users\chars\OneDrive\Desktop\InsurNova
python services/ml-api/app.py
```

---

## 📊 Model Performance

After training, you'll see:
- **Accuracy metrics** (accuracy, precision, recall, F1)
- **Feature importance** (which features matter most)
- **Model saved location** (confirms .pkl file created)

Example output:
```
============================================================
Training Risk Prediction Model
============================================================

✅ Generated 1000 synthetic training samples

📊 Model Performance:
   Accuracy: 87.5%
   Precision: 0.89
   Recall: 0.85
   F1 Score: 0.87

💾 Model saved: ml/models/risk/model.pkl
============================================================
```

---

## 🧪 Testing Trained Models

Test if models are loaded:

```bash
# Check ML API health
curl http://localhost:8000/health

# Test risk prediction
curl -X POST http://localhost:8000/predict/risk \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "RAIN",
    "severity": 85,
    "location": "Mumbai",
    "historical_claims": 2
  }'

# Test fraud detection
curl -X POST http://localhost:8000/predict/fraud \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USER_001",
    "claim_amount": 5000,
    "claim_frequency": 3,
    "days_since_policy": 30
  }'
```

---

## 🎯 Production Workflow

1. **Train models** (run training scripts)
2. **Restart ML API** (loads new .pkl files)
3. **Test predictions** (verify via API calls)
4. **Use in frontend** (process events through UI)

---

## 📝 Notes

- Models use **synthetic data** for demo purposes
- Training takes ~5-30 seconds per model
- Models auto-save to `ml/models/{model_name}/model.pkl`
- ML API auto-loads models on startup
- Retrain models as you collect real data

---

## 🚀 Quick Commands (Copy-Paste Ready)

### Train All Models:
```bash
cd c:\Users\chars\OneDrive\Desktop\InsurNova && python ml/models/risk/train.py && python ml/models/fraud/train.py && python ml/models/churn/train.py && python ml/models/pricing/train.py
```

### Restart ML API (after training):
```bash
# (Stop current ML API first with Ctrl+C)
cd c:\Users\chars\OneDrive\Desktop\InsurNova && python services/ml-api/app.py
```

---

**Ready to train? Pick a command above and run it!** 🎓
