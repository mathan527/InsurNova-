import urllib.request, json, sys

base = "http://localhost:8000"

# Health
req = urllib.request.urlopen(f"{base}/health")
health = json.loads(req.read())
print("HEALTH:", json.dumps(health, indent=2))

# Models info
req2 = urllib.request.urlopen(f"{base}/models/info")
info = json.loads(req2.read())
print("\nMODELS:")
for m in info:
    print(f"  {m['model_name']}: {m['status']} | type={m['model_type']}")

# Risk prediction
payload = json.dumps({"features": {"rainfall_mm": 140, "aqi": 200, "delivery_rate": 0.6, "location_risk": 0.7}}).encode()
req3 = urllib.request.Request(f"{base}/predict/risk", data=payload, headers={"Content-Type": "application/json"})
risk = json.loads(urllib.request.urlopen(req3).read())
print("\nRISK:")
print(f"  score={risk['risk_score']:.4f}  confidence={risk['confidence']:.4f}  model={risk['model_name']}  accuracy_pct={risk.get('accuracy_pct')}")

# Fraud prediction
payload2 = json.dumps({"features": {"claim_frequency": 2, "gps_anomaly": False, "time_since_policy": 30, "claim_amount_ratio": 0.4}}).encode()
req4 = urllib.request.Request(f"{base}/predict/fraud", data=payload2, headers={"Content-Type": "application/json"})
fraud = json.loads(urllib.request.urlopen(req4).read())
print("\nFRAUD:")
print(f"  score={fraud['fraud_score']:.4f}  is_fraud={fraud['is_fraudulent']}  conf={fraud['confidence']:.4f}  model={fraud['model_name']}")
print(f"  reasons={fraud['reasons']}")
