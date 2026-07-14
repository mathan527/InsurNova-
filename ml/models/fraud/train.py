"""
Fraud Detection Model
Binary classification to detect fraudulent insurance claims

Problem: Binary Classification - detect if claim is fraudulent
Input: User behavior, claim patterns, policy features
Output: Fraud probability, fraud indicators
Model: Random Forest Classifier
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    classification_report, confusion_matrix, roc_auc_score, 
    precision_recall_curve, average_precision_score
)
from imblearn.over_sampling import SMOTE
import joblib
import json
from datetime import datetime
import os

class FraudDetectionModel:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_columns = []
        self.model_metadata = {}
        self.fraud_indicators = [
            'Claim within 24h of policy',
            'Multiple claims in short period',
            'KYC not verified',
            'Location mismatch',
            'Pattern of max severity',
            'High-value claim from new user'
        ]
        
    def prepare_features(self, df):
        """
        Prepare features for fraud detection
        """
        # Select feature columns
        self.feature_columns = [
            'user_claim_count', 'user_fraud_risk', 'user_account_age_days',
            'kyc_verified', 'policy_age_hours', 'policy_coverage_amount',
            'claims_last_7_days', 'claims_last_30_days',
            'event_severity', 'location_matches_policy', 'location_matches_user',
            'claim_hour', 'claim_day_of_week', 'is_weekend', 'is_night'
        ]
        
        # Fill missing values
        for col in self.feature_columns:
            if col not in df.columns:
                df[col] = 0
            df[col] = df[col].fillna(0)
        
        # Feature engineering
        df['claim_frequency_score'] = df['claims_last_7_days'] * 4 + df['claims_last_30_days']
        df['timing_suspicion'] = ((df['policy_age_hours'] < 24) | df['is_night']).astype(int)
        df['verification_risk'] = (1 - df['kyc_verified']) + (1 - df['location_matches_policy'])
        
        self.feature_columns.extend(['claim_frequency_score', 'timing_suspicion', 'verification_risk'])
        
        return df[self.feature_columns]
    
    def train(self, X, y, test_size=0.2, random_state=42, use_smote=True):
        """
        Train fraud detection model
        """
        print("=" * 60)
        print("FRAUD DETECTION MODEL TRAINING")
        print("=" * 60)
        
        # Prepare features
        X_features = self.prepare_features(X.copy())
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X_features, y, test_size=test_size, random_state=random_state, stratify=y
        )
        
        print(f"Training samples: {len(X_train)}")
        print(f"Test samples: {len(X_test)}")
        print(f"Fraud rate in training: {y_train.mean():.2%}")
        print(f"Fraud rate in test: {y_test.mean():.2%}")
        
        # Handle class imbalance with SMOTE
        if use_smote and y_train.mean() < 0.3:
            print("\nApplying SMOTE for class balancing...")
            smote = SMOTE(random_state=random_state)
            X_train_resampled, y_train_resampled = smote.fit_resample(X_train, y_train)
            print(f"After SMOTE: {len(X_train_resampled)} samples")
            print(f"Fraud rate after SMOTE: {y_train_resampled.mean():.2%}")
        else:
            X_train_resampled = X_train
            y_train_resampled = y_train
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train_resampled)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train model
        print("\nTraining Random Forest Classifier...")
        self.model = RandomForestClassifier(
            n_estimators=200,
            max_depth=10,
            min_samples_split=10,
            min_samples_leaf=5,
            max_features='sqrt',
            class_weight='balanced',
            random_state=random_state,
            n_jobs=-1,
            verbose=1
        )
        
        self.model.fit(X_train_scaled, y_train_resampled)
        
        # Predictions
        y_train_pred = self.model.predict(X_train_scaled)
        y_test_pred = self.model.predict(X_test_scaled)
        y_test_proba = self.model.predict_proba(X_test_scaled)[:, 1]
        
        # Evaluate
        print("\n" + "=" * 60)
        print("MODEL EVALUATION - TEST SET")
        print("=" * 60)
        print("\nClassification Report:")
        print(classification_report(y_test, y_test_pred, target_names=['Legitimate', 'Fraud']))
        
        print("\nConfusion Matrix:")
        cm = confusion_matrix(y_test, y_test_pred)
        print(f"                Predicted")
        print(f"              Legit  Fraud")
        print(f"Actual Legit  {cm[0][0]:5d}  {cm[0][1]:5d}")
        print(f"       Fraud  {cm[1][0]:5d}  {cm[1][1]:5d}")
        
        # ROC-AUC
        roc_auc = roc_auc_score(y_test, y_test_proba)
        avg_precision = average_precision_score(y_test, y_test_proba)
        
        print(f"\nROC-AUC Score: {roc_auc:.4f}")
        print(f"Average Precision: {avg_precision:.4f}")
        
        # Feature importance
        feature_importance = pd.DataFrame({
            'feature': self.feature_columns,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print("\nTop 10 Feature Importances:")
        print(feature_importance.head(10).to_string(index=False))
        
        # Store metadata
        self.model_metadata = {
            'model_type': 'RandomForestClassifier',
            'roc_auc': float(roc_auc),
            'avg_precision': float(avg_precision),
            'n_features': len(self.feature_columns),
            'training_date': datetime.now().isoformat(),
            'training_samples': len(X_train_resampled),
            'used_smote': use_smote
        }
        
        print("\n✅ Training completed successfully!")
        return self.model_metadata
    
    def predict(self, X):
        """
        Predict fraud probability and identify indicators
        """
        if self.model is None:
            raise ValueError("Model not trained yet!")
        
        X_features = self.prepare_features(X.copy())
        X_scaled = self.scaler.transform(X_features)
        
        fraud_proba = self.model.predict_proba(X_scaled)[:, 1]
        predictions = self.model.predict(X_scaled)
        
        # Identify fraud indicators
        reasons = []
        for idx, row in X.iterrows():
            row_reasons = []
            if row.get('policy_age_hours', 999) < 24:
                row_reasons.append(self.fraud_indicators[0])
            if row.get('claims_last_7_days', 0) > 3:
                row_reasons.append(self.fraud_indicators[1])
            if not row.get('kyc_verified', True):
                row_reasons.append(self.fraud_indicators[2])
            if not row.get('location_matches_policy', True):
                row_reasons.append(self.fraud_indicators[3])
            if row.get('event_severity', 0) >= 90:
                row_reasons.append(self.fraud_indicators[4])
            if row.get('user_account_age_days', 999) < 7 and row.get('policy_coverage_amount', 0) > 5000:
                row_reasons.append(self.fraud_indicators[5])
            
            reasons.append(row_reasons)
        
        # Confidence = probability for positive class
        confidence = np.abs(fraud_proba - 0.5) * 2  # Scale to 0-1
        
        return fraud_proba, predictions, confidence, reasons
    
    def save(self, model_dir='ml/models/fraud'):
        """
        Save model and metadata
        """
        os.makedirs(model_dir, exist_ok=True)
        
        joblib.dump(self.model, f'{model_dir}/model.pkl')
        joblib.dump(self.scaler, f'{model_dir}/scaler.pkl')
        joblib.dump(self.feature_columns, f'{model_dir}/feature_columns.pkl')
        
        with open(f'{model_dir}/metadata.json', 'w') as f:
            json.dump(self.model_metadata, f, indent=2)
        
        print(f"\n✅ Model saved to {model_dir}")
    
    def load(self, model_dir='ml/models/fraud'):
        """
        Load model and metadata
        """
        self.model = joblib.load(f'{model_dir}/model.pkl')
        self.scaler = joblib.load(f'{model_dir}/scaler.pkl')
        self.feature_columns = joblib.load(f'{model_dir}/feature_columns.pkl')
        
        with open(f'{model_dir}/metadata.json', 'r') as f:
            self.model_metadata = json.load(f)
        
        print(f"✅ Model loaded from {model_dir}")


if __name__ == "__main__":
    print("Generating synthetic training data...")
    
    np.random.seed(42)
    n_samples = 10000
    fraud_rate = 0.05  # 5% fraud rate
    
    # Generate synthetic features
    data = {
        'user_claim_count': np.random.poisson(2, n_samples),
        'user_fraud_risk': np.random.beta(2, 8, n_samples),
        'user_account_age_days': np.random.exponential(180, n_samples),
        'kyc_verified': np.random.choice([0, 1], n_samples, p=[0.1, 0.9]),
        'policy_age_hours': np.random.exponential(500, n_samples),
        'policy_coverage_amount': np.random.choice([1000, 2500, 5000, 10000], n_samples),
        'claims_last_7_days': np.random.poisson(0.5, n_samples),
        'claims_last_30_days': np.random.poisson(1.5, n_samples),
        'event_severity': np.random.uniform(0, 100, n_samples),
        'location_matches_policy': np.random.choice([0, 1], n_samples, p=[0.05, 0.95]),
        'location_matches_user': np.random.choice([0, 1], n_samples, p=[0.1, 0.9]),
        'claim_hour': np.random.randint(0, 24, n_samples),
        'claim_day_of_week': np.random.randint(0, 7, n_samples),
        'is_weekend': np.random.choice([0, 1], n_samples, p=[0.7, 0.3]),
        'is_night': np.random.choice([0, 1], n_samples, p=[0.7, 0.3])
    }
    
    X = pd.DataFrame(data)
    
    # Generate target with fraud patterns
    fraud_score = (
        (X['policy_age_hours'] < 24).astype(int) * 0.3 +
        (X['claims_last_7_days'] > 2).astype(int) * 0.3 +
        (X['kyc_verified'] == 0).astype(int) * 0.2 +
        (X['location_matches_policy'] == 0).astype(int) * 0.2 +
        X['user_fraud_risk'] * 0.3 +
        np.random.normal(0, 0.1, n_samples)
    )
    
    y = (fraud_score > np.percentile(fraud_score, (1 - fraud_rate) * 100)).astype(int)
    
    print(f"Generated {n_samples} samples with {y.sum()} fraud cases ({y.mean():.2%})")
    
    # Train model
    model = FraudDetectionModel()
    model.train(X, y)
    model.save()
    
    # Test prediction
    print("\n" + "=" * 60)
    print("TESTING PREDICTION")
    print("=" * 60)
    test_sample = X.iloc[:5]
    fraud_proba, predictions, confidence, reasons = model.predict(test_sample)
    
    for i, (prob, pred, conf, reas) in enumerate(zip(fraud_proba, predictions, confidence, reasons)):
        print(f"\nSample {i+1}:")
        print(f"  Fraud Probability: {prob:.3f}")
        print(f"  Prediction: {'FRAUD' if pred else 'LEGITIMATE'}")
        print(f"  Confidence: {conf:.3f}")
        print(f"  Reasons: {', '.join(reas) if reas else 'None'}")
