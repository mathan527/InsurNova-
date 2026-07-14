"""
Enhanced Fraud Detection Model - Target: 95%+ Accuracy & F1 Score
Uses XGBoost-style ensemble with balanced data and optimized hyperparameters
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
import joblib
import json
from datetime import datetime
import os

class FraudDetectionModel:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_columns = []
        self.model_metadata = {}
        
    def prepare_features(self, df):
        """Prepare features for fraud detection"""
        categorical_cols = ['event_type', 'user_occupation', 'location']
        
        for col in categorical_cols:
            if col in df.columns:
                if col not in self.label_encoders:
                    self.label_encoders[col] = LabelEncoder()
                    df[f'{col}_encoded'] = self.label_encoders[col].fit_transform(df[col].astype(str))
                else:
                    df[f'{col}_encoded'] = df[col].apply(
                        lambda x: self.label_encoders[col].transform([str(x)])[0] 
                        if str(x) in self.label_encoders[col].classes_ else -1
                    )
        
        # Advanced fraud detection features
        df['claim_to_premium_ratio'] = df['claim_amount'] / (df['premium_paid'] + 1)
        df['claims_per_month'] = df['total_claims'] / (df['policy_age_days'] / 30 + 1)
        df['is_high_frequency'] = (df['total_claims'] > 5).astype(int)
        df['is_recent_policy'] = (df['policy_age_days'] < 30).astype(int)
        df['is_large_claim'] = (df['claim_amount'] > 5000).astype(int)
        df['velocity_score'] = df['claims_last_30_days'] / (df['claims_last_90_days'] + 1)
        df['amount_variance'] = df['claim_amount'] / (df['avg_claim_amount'] + 1)
        df['location_risk'] = df['location_fraud_rate'] * df['is_high_frequency']
        df['behavioral_score'] = df['late_night_claims'] + df['weekend_claims'] + df['duplicate_claims']
        
        self.feature_columns = [
            'claim_amount', 'premium_paid', 'policy_age_days', 'total_claims',
            'claims_last_30_days', 'claims_last_90_days', 'avg_claim_amount',
            'user_age', 'income_level', 'credit_score', 'employment_tenure',
            'location_fraud_rate', 'late_night_claims', 'weekend_claims',
            'duplicate_claims', 'verification_failures', 'documentation_score',
            'claim_processing_time', 'beneficiary_changes',
            'event_type_encoded', 'user_occupation_encoded', 'location_encoded',
            'claim_to_premium_ratio', 'claims_per_month', 'is_high_frequency',
            'is_recent_policy', 'is_large_claim', 'velocity_score',
            'amount_variance', 'location_risk', 'behavioral_score'
        ]
        
        for col in self.feature_columns:
            if col not in df.columns:
                df[col] = 0
            df[col] = df[col].fillna(0)
        
        return df[self.feature_columns]
    
    def train(self, X, y, test_size=0.2, random_state=42):
        """Train with enhanced parameters"""
        print("=" * 60)
        print("🎯 FRAUD DETECTION MODEL TRAINING (TARGET: >95%)")
        print("=" * 60)
        
        X_features = self.prepare_features(X.copy())
        X_train, X_test, y_train, y_test = train_test_split(
            X_features, y, test_size=test_size, random_state=random_state, stratify=y
        )
        
        print(f"📊 Training samples: {len(X_train)} (Fraud: {y_train.sum()}, Legitimate: {(~y_train).sum()})")
        print(f"📊 Test samples: {len(X_test)}")
        
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        print("\n🚀 Training Enhanced Gradient Boosting Classifier...")
        self.model = GradientBoostingClassifier(
            n_estimators=500,
            learning_rate=0.05,
            max_depth=7,
            min_samples_split=5,
            min_samples_leaf=2,
            subsample=0.9,
            max_features='sqrt',
            random_state=random_state,
            verbose=0
        )
        
        self.model.fit(X_train_scaled, y_train)
        
        y_train_pred = self.model.predict(X_train_scaled)
        y_test_pred = self.model.predict(X_test_scaled)
        
        train_acc = accuracy_score(y_train, y_train_pred)
        test_acc = accuracy_score(y_test, y_test_pred)
        train_f1 = f1_score(y_train, y_train_pred)
        test_f1 = f1_score(y_test, y_test_pred)
        train_precision = precision_score(y_train, y_train_pred)
        test_precision = precision_score(y_test, y_test_pred)
        train_recall = recall_score(y_train, y_train_pred)
        test_recall = recall_score(y_test, y_test_pred)
        
        print("\n" + "=" * 60)
        print("📊 MODEL EVALUATION")
        print("=" * 60)
        print(f"✅ Train Accuracy: {train_acc:.4f} ({train_acc*100:.2f}%)")
        print(f"✅ Test Accuracy:  {test_acc:.4f} ({test_acc*100:.2f}%)")
        print(f"✅ Train F1 Score: {train_f1:.4f} ({train_f1*100:.2f}%)")
        print(f"✅ Test F1 Score:  {test_f1:.4f} ({test_f1*100:.2f}%)")
        print(f"   Train Precision: {train_precision:.4f}")
        print(f"   Test Precision:  {test_precision:.4f}")
        print(f"   Train Recall: {train_recall:.4f}")
        print(f"   Test Recall:  {test_recall:.4f}")
        
        if test_acc >= 0.95 and test_f1 >= 0.95:
            print(f"\n🎉 TARGET ACHIEVED! Accuracy={test_acc:.4f}, F1={test_f1:.4f} (both >= 0.95)")
        else:
            print(f"\n⚠️  Partial success. Accuracy={test_acc:.4f}, F1={test_f1:.4f}")
        
        print("\n📊 Confusion Matrix:")
        print(confusion_matrix(y_test, y_test_pred))
        
        self.model_metadata = {
            'model_type': 'GradientBoostingClassifier',
            'train_accuracy': float(train_acc),
            'test_accuracy': float(test_acc),
            'train_f1': float(train_f1),
            'test_f1': float(test_f1),
            'test_precision': float(test_precision),
            'test_recall': float(test_recall),
            'target_achieved': test_acc >= 0.95 and test_f1 >= 0.95,
            'n_features': len(self.feature_columns),
            'training_date': datetime.now().isoformat(),
            'training_samples': len(X_train)
        }
        
        print("\n✅ Training completed!")
        return self.model_metadata
    
    def predict(self, X):
        """Make predictions"""
        if self.model is None:
            raise ValueError("Model not trained yet!")
        
        X_features = self.prepare_features(X.copy())
        X_scaled = self.scaler.transform(X_features)
        predictions = self.model.predict(X_scaled)
        probabilities = self.model.predict_proba(X_scaled)[:, 1]
        
        return predictions, probabilities
    
    def save(self, model_dir='ml/models/fraud'):
        """Save model"""
        os.makedirs(model_dir, exist_ok=True)
        joblib.dump(self.model, f'{model_dir}/model.pkl')
        joblib.dump(self.scaler, f'{model_dir}/scaler.pkl')
        joblib.dump(self.label_encoders, f'{model_dir}/label_encoders.pkl')
        joblib.dump(self.feature_columns, f'{model_dir}/feature_columns.pkl')
        
        with open(f'{model_dir}/metadata.json', 'w') as f:
            json.dump(self.model_metadata, f, indent=2)
        
        print(f"\n💾 Model saved to {model_dir}")
    
    def load(self, model_dir='ml/models/fraud'):
        """Load model"""
        self.model = joblib.load(f'{model_dir}/model.pkl')
        self.scaler = joblib.load(f'{model_dir}/scaler.pkl')
        self.label_encoders = joblib.load(f'{model_dir}/label_encoders.pkl')
        self.feature_columns = joblib.load(f'{model_dir}/feature_columns.pkl')
        
        with open(f'{model_dir}/metadata.json', 'r') as f:
            self.model_metadata = json.load(f)


if __name__ == "__main__":
    print("🔄 Generating enhanced fraud detection training data...")
    
    np.random.seed(42)
    n_samples = 50000
    fraud_rate = 0.15  # 15% fraud rate
    
    data = {
        'claim_amount': np.random.lognormal(7, 1.5, n_samples),
        'premium_paid': np.random.lognormal(5, 1, n_samples),
        'policy_age_days': np.random.randint(1, 1000, n_samples),
        'total_claims': np.random.poisson(3, n_samples),
        'claims_last_30_days': np.random.poisson(0.5, n_samples),
        'claims_last_90_days': np.random.poisson(1.5, n_samples),
        'avg_claim_amount': np.random.lognormal(6.5, 1, n_samples),
        'user_age': np.random.randint(18, 80, n_samples),
        'income_level': np.random.lognormal(10, 0.8, n_samples),
        'credit_score': np.random.randint(300, 850, n_samples),
        'employment_tenure': np.random.randint(0, 30, n_samples),
        'location_fraud_rate': np.random.beta(2, 8, n_samples),
        'late_night_claims': np.random.poisson(0.3, n_samples),
        'weekend_claims': np.random.poisson(0.5, n_samples),
        'duplicate_claims': np.random.poisson(0.2, n_samples),
        'verification_failures': np.random.poisson(0.4, n_samples),
        'documentation_score': np.random.beta(8, 2, n_samples),
        'claim_processing_time': np.random.gamma(2, 3, n_samples),
        'beneficiary_changes': np.random.poisson(0.3, n_samples),
        'event_type': np.random.choice(['RAIN', 'HEAT', 'POLLUTION', 'ACCIDENT'], n_samples),
        'user_occupation': np.random.choice(['Engineer', 'Doctor', 'Teacher', 'Driver', 'Merchant'], n_samples),
        'location': np.random.choice(['NYC', 'LA', 'Chicago', 'Houston', 'Phoenix'], n_samples)
    }
    
    X = pd.DataFrame(data)
    
    # Generate fraud labels with clear patterns
    fraud_score = (
        (X['claim_amount'] > X['avg_claim_amount'] * 3).astype(int) * 0.3 +
        (X['total_claims'] > 7).astype(int) * 0.25 +
        (X['claims_last_30_days'] > 2).astype(int) * 0.2 +
        (X['policy_age_days'] < 30).astype(int) * 0.15 +
        X['late_night_claims'] * 0.1 +
        X['duplicate_claims'] * 0.15 +
        X['verification_failures'] * 0.12 +
        (X['credit_score'] < 500).astype(int) * 0.2 +
        X['location_fraud_rate'] * 0.15 +
        np.random.normal(0, 0.1, n_samples)
    )
    
    y = (fraud_score > 0.5).astype(int)
    
    # Balance classes
    fraud_indices = np.where(y == 1)[0]
    legit_indices = np.where(y == 0)[0]
    n_fraud = int(n_samples * fraud_rate)
    n_legit = n_samples - n_fraud
    
    selected_fraud = np.random.choice(fraud_indices, min(n_fraud, len(fraud_indices)), replace=False)
    selected_legit = np.random.choice(legit_indices, min(n_legit, len(legit_indices)), replace=False)
    selected_indices = np.concatenate([selected_fraud, selected_legit])
    
    X = X.iloc[selected_indices].reset_index(drop=True)
    y = y[selected_indices]
    
    print(f"✅ Generated {len(X):,} samples (Fraud: {y.sum()}, Legitimate: {(~y).sum()})\n")
    
    model = FraudDetectionModel()
    metadata = model.train(X, y)
    model.save()
    
    print("\n" + "=" * 60)
    print("🧪 TESTING PREDICTION")
    print("=" * 60)
    test_sample = X.iloc[:5]
    predictions, probabilities = model.predict(test_sample)
    
    for i, (pred, prob) in enumerate(zip(predictions, probabilities)):
        fraud_status = "FRAUD" if pred == 1 else "LEGITIMATE"
        print(f"Sample {i+1}: {fraud_status} (Probability: {prob:.3f})")
