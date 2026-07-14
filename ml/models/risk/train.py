"""
Risk Prediction Model
Predicts risk score and severity for insurance events

Problem: Regression - predict risk score (0-1) based on event and policy features
Input: Event features, policy features, user history
Output: Risk score, confidence
Model: Gradient Boosting Regressor
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import joblib
import json
from datetime import datetime
import os

class RiskPredictionModel:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_columns = []
        self.model_metadata = {}
        
    def prepare_features(self, df):
        """
        Prepare and engineer features for the model
        """
        # Categorical encoding
        categorical_cols = ['event_type', 'location_city', 'location_state']
        
        for col in categorical_cols:
            if col in df.columns:
                if col not in self.label_encoders:
                    self.label_encoders[col] = LabelEncoder()
                    df[f'{col}_encoded'] = self.label_encoders[col].fit_transform(df[col].astype(str))
                else:
                    # Handle unknown categories
                    df[f'{col}_encoded'] = df[col].apply(
                        lambda x: self.label_encoders[col].transform([str(x)])[0] 
                        if str(x) in self.label_encoders[col].classes_ 
                        else -1
                    )
        
        # Feature engineering
        df['severity_duration_interaction'] = df['severity'] * df['duration']
        df['coverage_to_severity_ratio'] = df['coverage_limit'] / (df['severity'] + 1)
        df['is_extreme_weather'] = ((df['temperature'] > 40) | (df['temperature'] < 0)).astype(int)
        df['is_high_pollution'] = (df['pollution_index'] > 200).astype(int)
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        
        # Select feature columns
        self.feature_columns = [
            'severity', 'duration', 'temperature', 'rainfall', 'pollution_index',
            'wind_speed', 'humidity', 'policy_age_days', 'coverage_limit',
            'deductible', 'user_claim_history', 'user_fraud_risk',
            'hour_of_day', 'day_of_week', 'month',
            'event_type_encoded', 'location_city_encoded', 'location_state_encoded',
            'severity_duration_interaction', 'coverage_to_severity_ratio',
            'is_extreme_weather', 'is_high_pollution', 'is_weekend'
        ]
        
        # Fill missing values
        for col in self.feature_columns:
            if col not in df.columns:
                df[col] = 0
            df[col] = df[col].fillna(0)
        
        return df[self.feature_columns]
    
    def train(self, X, y, test_size=0.2, random_state=42):
        """
        Train the risk prediction model
        """
        print("=" * 60)
        print("RISK PREDICTION MODEL TRAINING")
        print("=" * 60)
        
        # Prepare features
        X_features = self.prepare_features(X.copy())
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X_features, y, test_size=test_size, random_state=random_state
        )
        
        print(f"Training samples: {len(X_train)}")
        print(f"Test samples: {len(X_test)}")
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train model
        print("\nTraining Gradient Boosting Regressor...")
        self.model = GradientBoostingRegressor(
            n_estimators=200,
            learning_rate=0.1,
            max_depth=5,
            min_samples_split=10,
            min_samples_leaf=4,
            subsample=0.8,
            random_state=random_state,
            verbose=1
        )
        
        self.model.fit(X_train_scaled, y_train)
        
        # Predictions
        y_train_pred = self.model.predict(X_train_scaled)
        y_test_pred = self.model.predict(X_test_scaled)
        
        # Clip predictions to [0, 1]
        y_train_pred = np.clip(y_train_pred, 0, 1)
        y_test_pred = np.clip(y_test_pred, 0, 1)
        
        # Evaluate
        train_rmse = np.sqrt(mean_squared_error(y_train, y_train_pred))
        test_rmse = np.sqrt(mean_squared_error(y_test, y_test_pred))
        train_mae = mean_absolute_error(y_train, y_train_pred)
        test_mae = mean_absolute_error(y_test, y_test_pred)
        train_r2 = r2_score(y_train, y_train_pred)
        test_r2 = r2_score(y_test, y_test_pred)
        
        print("\n" + "=" * 60)
        print("MODEL EVALUATION")
        print("=" * 60)
        print(f"Train RMSE: {train_rmse:.4f}")
        print(f"Test RMSE:  {test_rmse:.4f}")
        print(f"Train MAE:  {train_mae:.4f}")
        print(f"Test MAE:   {test_mae:.4f}")
        print(f"Train R²:   {train_r2:.4f}")
        print(f"Test R²:    {test_r2:.4f}")
        
        # Feature importance
        feature_importance = pd.DataFrame({
            'feature': self.feature_columns,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print("\nTop 10 Feature Importances:")
        print(feature_importance.head(10).to_string(index=False))
        
        # Store metadata
        self.model_metadata = {
            'model_type': 'GradientBoostingRegressor',
            'train_rmse': float(train_rmse),
            'test_rmse': float(test_rmse),
            'train_mae': float(train_mae),
            'test_mae': float(test_mae),
            'train_r2': float(train_r2),
            'test_r2': float(test_r2),
            'n_features': len(self.feature_columns),
            'training_date': datetime.now().isoformat(),
            'training_samples': len(X_train)
        }
        
        print("\n✅ Training completed successfully!")
        return self.model_metadata
    
    def predict(self, X):
        """
        Make predictions
        """
        if self.model is None:
            raise ValueError("Model not trained yet!")
        
        X_features = self.prepare_features(X.copy())
        X_scaled = self.scaler.transform(X_features)
        predictions = self.model.predict(X_scaled)
        predictions = np.clip(predictions, 0, 1)
        
        # Calculate confidence based on prediction variance
        # Using estimators' predictions variance
        all_predictions = np.array([tree.predict(X_scaled) for tree in self.model.estimators_.flatten()])
        confidence = 1 - np.std(all_predictions, axis=0)
        confidence = np.clip(confidence, 0, 1)
        
        return predictions, confidence
    
    def save(self, model_dir='ml/models/risk'):
        """
        Save model, scaler, and metadata
        """
        os.makedirs(model_dir, exist_ok=True)
        
        joblib.dump(self.model, f'{model_dir}/model.pkl')
        joblib.dump(self.scaler, f'{model_dir}/scaler.pkl')
        joblib.dump(self.label_encoders, f'{model_dir}/label_encoders.pkl')
        joblib.dump(self.feature_columns, f'{model_dir}/feature_columns.pkl')
        
        with open(f'{model_dir}/metadata.json', 'w') as f:
            json.dump(self.model_metadata, f, indent=2)
        
        print(f"\n✅ Model saved to {model_dir}")
    
    def load(self, model_dir='ml/models/risk'):
        """
        Load model, scaler, and metadata
        """
        self.model = joblib.load(f'{model_dir}/model.pkl')
        self.scaler = joblib.load(f'{model_dir}/scaler.pkl')
        self.label_encoders = joblib.load(f'{model_dir}/label_encoders.pkl')
        self.feature_columns = joblib.load(f'{model_dir}/feature_columns.pkl')
        
        with open(f'{model_dir}/metadata.json', 'r') as f:
            self.model_metadata = json.load(f)
        
        print(f"✅ Model loaded from {model_dir}")


if __name__ == "__main__":
    # Example usage with synthetic data
    print("Generating synthetic training data...")
    
    np.random.seed(42)
    n_samples = 10000
    
    # Generate synthetic features
    data = {
        'severity': np.random.uniform(0, 100, n_samples),
        'duration': np.random.exponential(12, n_samples),
        'temperature': np.random.normal(25, 15, n_samples),
        'rainfall': np.random.gamma(2, 10, n_samples),
        'pollution_index': np.random.gamma(3, 30, n_samples),
        'wind_speed': np.random.gamma(2, 10, n_samples),
        'humidity': np.random.uniform(30, 100, n_samples),
        'policy_age_days': np.random.randint(0, 365, n_samples),
        'coverage_limit': np.random.choice([1000, 2500, 5000, 10000], n_samples),
        'deductible': np.random.choice([0, 100, 250, 500], n_samples),
        'user_claim_history': np.random.poisson(2, n_samples),
        'user_fraud_risk': np.random.beta(2, 5, n_samples),
        'hour_of_day': np.random.randint(0, 24, n_samples),
        'day_of_week': np.random.randint(0, 7, n_samples),
        'month': np.random.randint(1, 13, n_samples),
        'event_type': np.random.choice(['RAIN', 'HEAT', 'POLLUTION', 'FLOOD', 'STORM'], n_samples),
        'location_city': np.random.choice(['NYC', 'LA', 'Chicago', 'Houston', 'Phoenix'], n_samples),
        'location_state': np.random.choice(['NY', 'CA', 'IL', 'TX', 'AZ'], n_samples)
    }
    
    X = pd.DataFrame(data)
    
    # Generate synthetic target (risk score)
    y = (
        X['severity'] / 150 +
        X['duration'] / 100 +
        (X['temperature'] > 35).astype(int) * 0.2 +
        X['rainfall'] / 300 +
        X['pollution_index'] / 400 +
        X['user_fraud_risk'] * 0.3 +
        np.random.normal(0, 0.05, n_samples)
    )
    y = np.clip(y, 0, 1)
    
    # Train model
    model = RiskPredictionModel()
    model.train(X, y)
    model.save()
    
    # Test prediction
    print("\n" + "=" * 60)
    print("TESTING PREDICTION")
    print("=" * 60)
    test_sample = X.iloc[:5]
    predictions, confidence = model.predict(test_sample)
    
    for i, (pred, conf) in enumerate(zip(predictions, confidence)):
        print(f"Sample {i+1}: Risk Score = {pred:.3f}, Confidence = {conf:.3f}")
