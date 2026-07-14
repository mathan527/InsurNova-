# ML Model Integration Guide

## Overview

This document explains how machine learning models are integrated with the InsurNova agent system.

---

## Architecture

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│              │         │              │         │              │
│  Node.js     │  HTTP   │   FastAPI    │ Python  │  ML Models   │
│  Agents      │ ──────> │   ML API     │ ──────> │  (Trained)   │
│              │         │              │         │              │
└──────────────┘         └──────────────┘         └──────────────┘
```

The ML models are served via a FastAPI REST API that agents call over HTTP.

---

## Model Loading Flow

### Startup Sequence

1. **ML API Server Starts**
   ```python
   @app.on_event("startup")
   async def load_models():
       models['risk'] = RiskPredictionModel()
       models['risk'].load('models/risk')
       # ... load other models
   ```

2. **Models Loaded from Disk**
   - model.pkl (trained model)
   - scaler.pkl (feature scaler)
   - label_encoders.pkl (categorical encoders)
   - metadata.json (model info)

3. **Server Ready**
   - Health check endpoint active
   - Models ready for inference

---

## Agent → ML Integration

### Example: Risk Agent

```javascript
// agents/risk/index.js

async execute(input) {
  const { event, policy, user } = input;
  
  // 1. Extract features
  const features = this.extractFeatures(event, policy, user);
  
  // 2. Call ML model via HTTP
  const prediction = await this.callRiskModel(features);
  
  // 3. Use prediction in agent logic
  const payoutPercentage = this.calculatePayoutPercentage(
    event.severity,
    prediction.riskScore,
    policy.coverage.payoutStructure
  );
  
  return this.success({ riskScore, payoutPercentage });
}

async callRiskModel(features) {
  const response = await axios.post(
    `${this.mlApiUrl}/predict/risk`,
    { features },
    { timeout: 30000 }
  );
  
  return {
    riskScore: response.data.risk_score,
    confidence: response.data.confidence
  };
}
```

---

## API Endpoints

### 1. Risk Prediction

**Endpoint:** `POST /predict/risk`

**Request:**
```json
{
  "features": {
    "severity": 75,
    "duration": 6,
    "temperature": 18,
    "rainfall": 45,
    "pollution_index": 120,
    "wind_speed": 25,
    "humidity": 85,
    "policy_age_days": 60,
    "coverage_limit": 1000,
    "deductible": 50,
    "user_claim_history": 2,
    "user_fraud_risk": 0.1,
    "hour_of_day": 14,
    "day_of_week": 2,
    "month": 11,
    "event_type": "RAIN",
    "location_city": "San Francisco",
    "location_state": "CA"
  }
}
```

**Response:**
```json
{
  "risk_score": 0.753,
  "confidence": 0.89,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. Fraud Detection

**Endpoint:** `POST /predict/fraud`

**Request:**
```json
{
  "features": {
    "user_claim_count": 2,
    "user_fraud_risk": 0.1,
    "user_account_age_days": 180,
    "kyc_verified": 1,
    "policy_age_hours": 720,
    "policy_coverage_amount": 1000,
    "claims_last_7_days": 0,
    "claims_last_30_days": 1,
    "event_severity": 75,
    "location_matches_policy": 1,
    "location_matches_user": 1,
    "claim_hour": 14,
    "claim_day_of_week": 2,
    "is_weekend": 0,
    "is_night": 0
  }
}
```

**Response:**
```json
{
  "fraud_score": 0.12,
  "is_fraudulent": false,
  "confidence": 0.92,
  "reasons": [],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 3. Churn Prediction

**Endpoint:** `POST /predict/churn`

**Request:**
```json
{
  "features": {
    "user_age_days": 180,
    "kyc_verified": 1,
    "wallet_balance": 250,
    "policy_age_days": 60,
    "policy_status": 1,
    "premium_amount": 50,
    "premium_is_paid": 1,
    "coverage_amount": 1000,
    "total_claims": 2,
    "approved_claims": 2,
    "rejected_claims": 0,
    "fraud_detected_claims": 0,
    "approval_rate": 1.0,
    "rejection_rate": 0.0,
    "avg_claim_amount": 400,
    "days_since_last_claim": 30,
    "last_claim_approved": 1,
    "claims_last_30_days": 1,
    "days_until_policy_end": 305
  }
}
```

**Response:**
```json
{
  "churn_score": 0.15,
  "confidence": 0.85,
  "factors": [],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 4. Pricing Calculation

**Endpoint:** `POST /predict/pricing`

**Request:**
```json
{
  "features": {
    "user_fraud_risk": 0.1,
    "user_churn_score": 0.15,
    "user_claim_history": 2,
    "kyc_verified": 1,
    "loss_ratio": 0.35,
    "total_claims": 2,
    "approved_claims": 2,
    "rejected_claims": 0,
    "avg_claim_amount": 400,
    "coverage_amount": 1000,
    "existing_policies_count": 1,
    "user_age_days": 180
  }
}
```

**Response:**
```json
{
  "risk_multiplier": 1.15,
  "predicted_loss_ratio": 0.40,
  "confidence": 0.80,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Error Handling

### Fallback Mechanisms

Each agent implements fallback logic when ML API is unavailable:

```javascript
async callRiskModel(features) {
  try {
    const response = await axios.post(
      `${this.mlApiUrl}/predict/risk`,
      { features },
      { timeout: config.mlApi.timeout }
    );
    return response.data;
  } catch (error) {
    this.logger.error('ML API call failed', { error: error.message });
    
    // Fallback: Use rule-based calculation
    this.logger.warn('Using fallback rule-based risk calculation');
    return this.fallbackRiskCalculation(features);
  }
}

fallbackRiskCalculation(features) {
  let riskScore = features.severity / 100;
  
  const eventTypeMultiplier = {
    'RAIN': 1.0,
    'FLOOD': 1.5,
    'STORM': 1.4
  };
  
  riskScore *= (eventTypeMultiplier[features.event_type] || 1.0);
  riskScore = Math.min(Math.max(riskScore, 0), 1);
  
  return {
    riskScore: riskScore,
    confidence: 0.6  // Lower confidence for fallback
  };
}
```

### Retry Logic

```javascript
async callRiskModel(features, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.post(
        `${this.mlApiUrl}/predict/risk`,
        { features },
        { timeout: 30000 }
      );
      return response.data;
    } catch (error) {
      if (i === retries - 1) {
        // Last retry failed, use fallback
        return this.fallbackRiskCalculation(features);
      }
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}
```

---

## Model Monitoring

### Prediction Logging

All ML predictions are logged to MongoDB for monitoring:

```javascript
const { PredictionLog } = require('../../shared/database/models');

await PredictionLog.create({
  modelName: 'risk',
  modelVersion: '1.0',
  input: features,
  output: { risk_score, confidence },
  confidence: confidence,
  latency: Date.now() - startTime,
  eventId: event.eventId,
  timestamp: new Date()
});
```

### Metrics to Track

1. **Latency:** Response time per model
2. **Accuracy:** Compare predictions vs actual outcomes
3. **Confidence:** Distribution of confidence scores
4. **Error Rate:** Failed predictions
5. **Drift Detection:** Feature distribution changes

---

## Model Retraining Pipeline

### 1. Data Collection

```python
# Collect historical data
from shared.database.models import Claim, Event, Policy

claims = Claim.objects.filter(status='PAID')
events = Event.objects.filter(id__in=[c.eventId for c in claims])

# Build training dataset
training_data = []
for claim in claims:
    event = Event.objects.get(eventId=claim.eventId)
    policy = Policy.objects.get(policyId=claim.policyId)
    
    features = extract_features(event, policy, claim.user)
    target = claim.assessment.riskScore  # or actual payout
    
    training_data.append((features, target))
```

### 2. Retrain Model

```python
# retrain_risk_model.py

from ml.models.risk.train import RiskPredictionModel
import pandas as pd

# Load new data
X_new = pd.read_csv('ml/data/training_data_new.csv')
y_new = pd.read_csv('ml/data/training_labels_new.csv')

# Load existing model
model = RiskPredictionModel()
model.load('ml/models/risk')

# Incremental training or full retrain
model.train(X_new, y_new)

# Save with version
model.save('ml/models/risk_v2')
```

### 3. A/B Testing

```javascript
// Route some traffic to new model
const modelVersion = Math.random() < 0.1 ? 'v2' : 'v1';

const response = await axios.post(
  `${this.mlApiUrl}/predict/risk`,
  { features, modelVersion }
);
```

### 4. Deployment

```bash
# Backup old model
mv ml/models/risk ml/models/risk_v1_backup

# Deploy new model
mv ml/models/risk_v2 ml/models/risk

# Restart ML API
docker-compose restart ml-api
```

---

## Performance Optimization

### 1. Batch Predictions

```python
@app.post("/predict/risk/batch")
async def predict_risk_batch(requests: List[RiskPredictionRequest]):
    # Process multiple predictions in one call
    df = pd.DataFrame([r.features for r in requests])
    predictions, confidences = models['risk'].predict(df)
    
    return [
        RiskPredictionResponse(
            risk_score=float(pred),
            confidence=float(conf),
            timestamp=datetime.now().isoformat()
        )
        for pred, conf in zip(predictions, confidences)
    ]
```

### 2. Caching

```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // 5 minute cache

async callRiskModel(features) {
  const cacheKey = JSON.stringify(features);
  
  // Check cache
  const cached = cache.get(cacheKey);
  if (cached) {
    this.logger.info('Using cached prediction');
    return cached;
  }
  
  // Make prediction
  const result = await axios.post(...);
  
  // Cache result
  cache.set(cacheKey, result.data);
  
  return result.data;
}
```

### 3. Model Quantization

```python
# Reduce model size for faster inference
import joblib
from sklearn.tree import _tree

# Convert model to smaller precision
model_compressed = compress_model(model)
joblib.dump(model_compressed, 'model_compressed.pkl', compress=9)
```

---

## Testing ML Integration

### Unit Tests

```javascript
// tests/agents/risk.test.js

const RiskAgent = require('../../agents/risk');
const axios = require('axios');

jest.mock('axios');

describe('RiskAgent', () => {
  it('should call ML API and return risk score', async () => {
    axios.post.mockResolvedValue({
      data: {
        risk_score: 0.75,
        confidence: 0.9
      }
    });
    
    const agent = new RiskAgent();
    const result = await agent.execute({
      event: { severity: 75, type: 'RAIN' },
      policy: { coverage: { maxPayoutPerEvent: 1000 } },
      user: { userId: 'TEST' }
    });
    
    expect(result.success).toBe(true);
    expect(result.data.riskScore).toBe(0.75);
  });
  
  it('should use fallback when ML API fails', async () => {
    axios.post.mockRejectedValue(new Error('API Error'));
    
    const agent = new RiskAgent();
    const result = await agent.execute({
      event: { severity: 75, type: 'RAIN' },
      policy: { coverage: { maxPayoutPerEvent: 1000 } },
      user: { userId: 'TEST' }
    });
    
    expect(result.success).toBe(true);
    expect(result.data.riskScore).toBeGreaterThan(0);
  });
});
```

### Integration Tests

```javascript
// Test end-to-end with real ML API
const request = require('supertest');
const app = require('../../services/event-processor');

describe('Integration: Event Processing with ML', () => {
  it('should process event with ML predictions', async () => {
    const response = await request(app)
      .post('/process-event')
      .send({
        eventId: 'TEST_EVENT',
        userId: 'TEST_USER',
        policyId: 'TEST_POLICY'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.decisions.risk).toBeDefined();
  });
});
```

---

## Troubleshooting

### Common Issues

1. **ML API Not Responding**
   - Check if service is running: `curl http://localhost:8000/health`
   - Check logs: `docker logs insurnova-ml-api`
   - Verify environment variable: `ML_API_URL`

2. **Model Not Found**
   - Train models first: `python ml/models/risk/train.py`
   - Check model directory exists: `ls ml/models/risk/`

3. **Feature Mismatch**
   - Ensure agent sends all required features
   - Check feature names match training script
   - Verify data types (Number vs String)

4. **Low Confidence Scores**
   - May indicate need for model retraining
   - Check if input data is within expected ranges
   - Review feature engineering

---

## Best Practices

1. **Always implement fallback logic** for ML API failures
2. **Log all predictions** for monitoring and debugging
3. **Version your models** to enable rollback
4. **Monitor latency** and set appropriate timeouts
5. **Validate inputs** before sending to ML API
6. **Cache predictions** when appropriate
7. **A/B test** new models before full deployment
8. **Retrain periodically** with new data

---

**For questions or issues, contact the ML team or file a GitHub issue.**
