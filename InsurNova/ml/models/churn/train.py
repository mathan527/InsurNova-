"""
Churn Prediction Model
Predicts likelihood of user churning/cancelling policy

Problem: Binary Classification - predict if user will churn
Input: User behavior, policy usage, claim history
Output: Churn probability
Model: XGBoost Classifier
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix
import joblib
import json
from datetime import datetime
import os

class ChurnPredictionModel:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_columns = []
        self.model_metadata = {}
        
    def prepare_features(self, df):
        """
        Prepare features for churn prediction
        """
        self.feature_columns = [
            'user_age_days', 'kyc_verified', 'wallet_balance',
            'policy_age_days', 'policy_status', 'premium_amount',
            'premium_is_paid', 'coverage_amount',
            'total_claims', 'approved_claims', 'rejected_claims',
            'fraud_detected_claims', 'approval_rate', 'rejection_rate',
            'avg_claim_amount', 'days_since_last_claim',
            'last_claim_approved', 'claims_last_30_days',
            'days_until_policy_end'
        ]
        
        for col in self.feature_columns:
            if col not in df.columns:
                df[col] = 0
            df[col] = df[col].fillna(0)
        
        # Feature engineering
        df['engagement_score'] = (df['total_claims'] > 0).astype(int) * (df['claims_last_30_days'] + 1)
        df['satisfaction_proxy'] = df['approval_rate'] - df['rejection_rate']
        df['premium_to_coverage_ratio'] = df['premium_amount'] / (df['coverage_amount'] + 1)
        df['is_dormant'] = (df['days_since_last_claim'] > 90).astype(int)
        
        self.feature_columns.extend(['engagement_score', 'satisfaction_proxy', 
                                     'premium_to_coverage_ratio', 'is_dormant'])
        
        return df[self.feature_columns]
    
    def train(self, X, y, test_size=0.2, random_state=42):
        """
        Train churn prediction model
        """
        print("=" * 60)
        print("CHURN PREDICTION MODEL TRAINING")
        print("=" * 60)
        
        X_features = self.prepare_features(X.copy())
        
        X_train, X_test, y_train, y_test = train_test_split(
            X_features, y, test_size=test_size, random_state=random_state, stratify=y
        )
        
        print(f"Training samples: {len(X_train)}")
        print(f"Churn rate in training: {y_train.mean():.2%}")
        
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        print("\nTraining Gradient Boosting Classifier...")
        self.model = GradientBoostingClassifier(
            n_estimators=150,
            learning_rate=0.1,
            max_depth=4,
            min_samples_split=20,
            min_samples_leaf=10,
            subsample=0.8,
            random_state=random_state,
            verbose=1
        )
        
        self.model.fit(X_train_scaled, y_train)
        
        y_test_pred = self.model.predict(X_test_scaled)
        y_test_proba = self.model.predict_proba(X_test_scaled)[:, 1]
        
        print("\n" + "=" * 60)
        print("MODEL EVALUATION")
        print("=" * 60)
        print(classification_report(y_test, y_test_pred, target_names=['Retained', 'Churned']))
        
        roc_auc = roc_auc_score(y_test, y_test_proba)
        print(f"\nROC-AUC Score: {roc_auc:.4f}")
        
        feature_importance = pd.DataFrame({
            'feature': self.feature_columns,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print("\nTop 10 Churn Factors:")
        print(feature_importance.head(10).to_string(index=False))
        
        self.model_metadata = {
            'model_type': 'GradientBoostingClassifier',
            'roc_auc': float(roc_auc),
            'training_date': datetime.now().isoformat()
        }
        
        print("\n✅ Training completed!")
        return self.model_metadata
    
    def predict(self, X):
        """
        Predict churn probability
        """
        X_features = self.prepare_features(X.copy())
        X_scaled = self.scaler.transform(X_features)
        churn_proba = self.model.predict_proba(X_scaled)[:, 1]
        confidence = np.abs(churn_proba - 0.5) * 2
        
        # Identify churn factors
        factors = []
        for idx, row in X.iterrows():
            row_factors = []
            if row.get('rejection_rate', 0) > 0.5:
                row_factors.append('High claim rejection rate')
            if not row.get('premium_is_paid', True):
                row_factors.append('Premium not paid')
            if row.get('days_since_last_claim', 0) > 90:
                row_factors.append('No recent activity')
            if row.get('fraud_detected_claims', 0) > 0:
                row_factors.append('Previous fraud detection')
            
            factors.append(row_factors)
        
        return churn_proba, confidence, factors
    
    def save(self, model_dir='ml/models/churn'):
        """Save model"""
        os.makedirs(model_dir, exist_ok=True)
        joblib.dump(self.model, f'{model_dir}/model.pkl')
        joblib.dump(self.scaler, f'{model_dir}/scaler.pkl')
        joblib.dump(self.feature_columns, f'{model_dir}/feature_columns.pkl')
        with open(f'{model_dir}/metadata.json', 'w') as f:
            json.dump(self.model_metadata, f, indent=2)
        print(f"✅ Model saved to {model_dir}")
    
    def load(self, model_dir='ml/models/churn'):
        """Load model"""
        self.model = joblib.load(f'{model_dir}/model.pkl')
        self.scaler = joblib.load(f'{model_dir}/scaler.pkl')
        self.feature_columns = joblib.load(f'{model_dir}/feature_columns.pkl')
        with open(f'{model_dir}/metadata.json', 'r') as f:
            self.model_metadata = json.load(f)
        print(f"✅ Model loaded from {model_dir}")


if __name__ == "__main__":
    np.random.seed(42)
    n_samples = 5000
    
    data = {
        'user_age_days': np.random.exponential(200, n_samples),
        'kyc_verified': np.random.choice([0, 1], n_samples, p=[0.1, 0.9]),
        'wallet_balance': np.random.gamma(2, 50, n_samples),
        'policy_age_days': np.random.exponential(150, n_samples),
        'policy_status': np.random.choice([0, 1], n_samples, p=[0.1, 0.9]),
        'premium_amount': np.random.choice([50, 100, 200, 300], n_samples),
        'premium_is_paid': np.random.choice([0, 1], n_samples, p=[0.15, 0.85]),
        'coverage_amount': np.random.choice([1000, 2500, 5000], n_samples),
        'total_claims': np.random.poisson(3, n_samples),
        'approved_claims': np.random.poisson(2, n_samples),
        'rejected_claims': np.random.poisson(0.5, n_samples),
        'fraud_detected_claims': np.random.poisson(0.1, n_samples),
        'approval_rate': np.random.beta(8, 2, n_samples),
        'rejection_rate': np.random.beta(2, 8, n_samples),
        'avg_claim_amount': np.random.gamma(3, 100, n_samples),
        'days_since_last_claim': np.random.exponential(60, n_samples),
        'last_claim_approved': np.random.choice([0, 1], n_samples, p=[0.3, 0.7]),
        'claims_last_30_days': np.random.poisson(0.8, n_samples),
        'days_until_policy_end': np.random.uniform(0, 365, n_samples)
    }
    
    X = pd.DataFrame(data)
    
    # Generate churn with patterns
    churn_score = (
        (X['rejection_rate'] > 0.5).astype(int) * 0.4 +
        (X['premium_is_paid'] == 0).astype(int) * 0.3 +
        (X['days_since_last_claim'] > 90).astype(int) * 0.2 +
        (X['policy_status'] == 0).astype(int) * 0.3 +
        np.random.normal(0, 0.15, n_samples)
    )
    
    y = (churn_score > 0.6).astype(int)
    print(f"Churn rate: {y.mean():.2%}")
    
    model = ChurnPredictionModel()
    model.train(X, y)
    model.save()
