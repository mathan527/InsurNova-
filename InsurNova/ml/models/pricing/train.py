"""
India Pricing Model (INR) - NumPy implementation.

Formula:
weekly_premium = base_weekly_premium + risk_adjustment - trust_discount

This implementation avoids heavy native dependencies so it can train reliably
in restricted environments.
"""

import json
import os
import pickle
from datetime import datetime

import numpy as np


class PricingModel:
    def __init__(self):
        self.model = {
            "weights": None,
            "intercept": None,
            "lambda": 0.8,
        }
        self.scaler = {
            "mean": None,
            "std": None,
        }
        self.feature_columns = [
            "user_fraud_risk",
            "user_churn_score",
            "kyc_verified",
            "loss_ratio",
            "total_claims",
            "approved_claims",
            "rejected_claims",
            "avg_claim_amount",
            "coverage_amount",
            "existing_policies_count",
            "user_age_days",
            "trust_score",
            "avg_daily_earnings",
            "working_hours",
            "platform_risk",
            "event_risk",
            "metro_city",
            "claims_per_policy",
            "claim_acceptance_rate",
            "earnings_protection_ratio",
        ]
        self.base_weekly_premium = 10.0
        self.model_metadata = {}

    def _normalize_input_rows(self, X):
        if hasattr(X, "to_dict"):
            rows = X.to_dict(orient="records")
        elif isinstance(X, list):
            rows = X
        elif isinstance(X, dict):
            rows = [X]
        else:
            raise ValueError("Unsupported input type for pricing model")

        normalized = []
        for row in rows:
            trust_score = float(row.get("trust_score", 60) or 60)
            avg_daily_earnings = float(row.get("avg_daily_earnings", 1200) or 1200)
            total_claims = float(row.get("total_claims", 0) or 0)
            approved_claims = float(row.get("approved_claims", 0) or 0)
            existing_policies_count = float(row.get("existing_policies_count", 0) or 0)
            coverage_amount = float(row.get("coverage_amount", 20000) or 20000)

            claims_per_policy = total_claims / (existing_policies_count + 1.0)
            claim_acceptance_rate = approved_claims / (total_claims + 1.0)
            earnings_protection_ratio = coverage_amount / (avg_daily_earnings * 30.0 + 1.0)

            normalized.append(
                {
                    "user_fraud_risk": float(row.get("user_fraud_risk", 0) or 0),
                    "user_churn_score": float(row.get("user_churn_score", 0) or 0),
                    "kyc_verified": float(row.get("kyc_verified", 0) or 0),
                    "loss_ratio": float(row.get("loss_ratio", 0) or 0),
                    "total_claims": total_claims,
                    "approved_claims": approved_claims,
                    "rejected_claims": float(row.get("rejected_claims", 0) or 0),
                    "avg_claim_amount": float(row.get("avg_claim_amount", 0) or 0),
                    "coverage_amount": coverage_amount,
                    "existing_policies_count": existing_policies_count,
                    "user_age_days": float(row.get("user_age_days", 1) or 1),
                    "trust_score": trust_score,
                    "avg_daily_earnings": avg_daily_earnings,
                    "working_hours": float(row.get("working_hours", 8) or 8),
                    "platform_risk": float(row.get("platform_risk", 0.5) or 0.5),
                    "event_risk": float(row.get("event_risk", 0.5) or 0.5),
                    "metro_city": float(row.get("metro_city", 0) or 0),
                    "claims_per_policy": claims_per_policy,
                    "claim_acceptance_rate": claim_acceptance_rate,
                    "earnings_protection_ratio": earnings_protection_ratio,
                }
            )

        matrix = np.array(
            [[row[col] for col in self.feature_columns] for row in normalized], dtype=np.float64
        )
        return matrix, normalized

    def _fit_scaler(self, X):
        mean = X.mean(axis=0)
        std = X.std(axis=0)
        std[std < 1e-8] = 1.0
        self.scaler["mean"] = mean
        self.scaler["std"] = std

    def _transform(self, X):
        return (X - self.scaler["mean"]) / self.scaler["std"]

    def train(self, X, y, random_state=42):
        print("=" * 60)
        print("INDIA PRICING MODEL TRAINING (NUMPY)")
        print("=" * 60)

        np.random.seed(random_state)

        X_matrix, _ = self._normalize_input_rows(X)
        y_matrix = np.array(y, dtype=np.float64)

        self._fit_scaler(X_matrix)
        X_scaled = self._transform(X_matrix)

        X_design = np.hstack([X_scaled, np.ones((X_scaled.shape[0], 1))])
        l2 = self.model["lambda"]
        reg = np.eye(X_design.shape[1]) * l2
        reg[-1, -1] = 0.0

        # Solve two-target ridge regression in one shot.
        params = np.linalg.solve(X_design.T @ X_design + reg, X_design.T @ y_matrix)

        self.model["weights"] = params[:-1, :]
        self.model["intercept"] = params[-1, :]

        y_pred = X_design @ params
        risk_pred = np.clip(y_pred[:, 0], 0, 20)
        trust_pred = np.clip(y_pred[:, 1], 0, 10)
        weekly_pred = np.clip(self.base_weekly_premium + risk_pred - trust_pred, 6, 45)

        risk_true = y_matrix[:, 0]
        trust_true = y_matrix[:, 1]
        weekly_true = np.clip(self.base_weekly_premium + risk_true - trust_true, 6, 45)

        premium_mae = float(np.mean(np.abs(weekly_true - weekly_pred)))
        rmse_risk = float(np.sqrt(np.mean((risk_true - risk_pred) ** 2)))
        rmse_trust = float(np.sqrt(np.mean((trust_true - trust_pred) ** 2)))

        self.model_metadata = {
            "model_type": "RidgeLinearRegression-Numpy",
            "region": "India",
            "currency": "INR",
            "pricing_formula": "weekly_premium = base_weekly_premium + risk_adjustment - trust_discount",
            "base_weekly_premium": self.base_weekly_premium,
            "premium_mae_inr": premium_mae,
            "risk_adjustment_rmse": rmse_risk,
            "trust_discount_rmse": rmse_trust,
            "training_date": datetime.now().isoformat(),
        }

        print(f"Samples: {X_matrix.shape[0]}")
        print(f"Premium MAE (INR): {premium_mae:.4f}")
        print(f"Risk Adjustment RMSE: {rmse_risk:.4f}")
        print(f"Trust Discount RMSE: {rmse_trust:.4f}")
        print("✅ Training complete")

        return self.model_metadata

    def predict(self, X):
        X_matrix, rows = self._normalize_input_rows(X)
        X_scaled = self._transform(X_matrix)

        y_pred = X_scaled @ self.model["weights"] + self.model["intercept"]

        risk_adjustment = np.clip(y_pred[:, 0], 0, 20)
        trust_discount = np.clip(y_pred[:, 1], 0, 10)
        weekly_premium = np.clip(self.base_weekly_premium + risk_adjustment - trust_discount, 6, 45)

        risk_multiplier = weekly_premium / self.base_weekly_premium
        loss_ratio = np.array([float(r.get("loss_ratio", 0) or 0) for r in rows], dtype=np.float64)
        predicted_loss_ratio = np.clip(loss_ratio * risk_multiplier, 0, 2.5)

        confidence = np.full(len(rows), 0.86, dtype=np.float64)
        confidence -= np.clip(np.array([float(r.get("user_fraud_risk", 0)) for r in rows]) * 0.08, 0, 0.08)
        confidence -= np.clip((loss_ratio - 0.8) * 0.15, 0, 0.12)
        confidence = np.clip(confidence, 0.62, 0.94)

        return {
            "risk_adjustment_inr": risk_adjustment,
            "trust_discount_inr": trust_discount,
            "weekly_premium_inr": weekly_premium,
            "risk_multiplier": risk_multiplier,
            "predicted_loss_ratio": predicted_loss_ratio,
            "confidence": confidence,
        }

    def save(self, model_dir="ml/models/pricing"):
        os.makedirs(model_dir, exist_ok=True)

        with open(f"{model_dir}/model.pkl", "wb") as f:
            pickle.dump(self.model, f)

        with open(f"{model_dir}/scaler.pkl", "wb") as f:
            pickle.dump(self.scaler, f)

        with open(f"{model_dir}/feature_columns.pkl", "wb") as f:
            pickle.dump(self.feature_columns, f)

        with open(f"{model_dir}/metadata.json", "w", encoding="utf-8") as f:
            json.dump(self.model_metadata, f, indent=2)

        print(f"✅ Model saved to {model_dir}")

    def load(self, model_dir="ml/models/pricing"):
        with open(f"{model_dir}/model.pkl", "rb") as f:
            self.model = pickle.load(f)

        with open(f"{model_dir}/scaler.pkl", "rb") as f:
            self.scaler = pickle.load(f)

        with open(f"{model_dir}/feature_columns.pkl", "rb") as f:
            self.feature_columns = pickle.load(f)

        with open(f"{model_dir}/metadata.json", "r", encoding="utf-8") as f:
            self.model_metadata = json.load(f)

        self.base_weekly_premium = self.model_metadata.get("base_weekly_premium", 10.0)
        print(f"✅ Model loaded from {model_dir}")


def build_india_training_dataset(n_samples=5500, random_state=42):
    rng = np.random.default_rng(random_state)

    trust_score = np.clip(rng.normal(72, 18, n_samples), 20, 100)
    kyc_verified = rng.choice([0, 1], n_samples, p=[0.25, 0.75])
    user_fraud_risk = np.clip(rng.beta(2.2, 8.0, n_samples), 0, 1)
    loss_ratio = np.clip(rng.beta(3.5, 5.5, n_samples), 0, 1.8)
    event_risk = rng.choice([0.35, 0.45, 0.5, 0.6, 0.75, 0.85], n_samples, p=[0.22, 0.15, 0.2, 0.16, 0.17, 0.1])

    rows = []
    for i in range(n_samples):
        rows.append(
            {
                "user_fraud_risk": float(user_fraud_risk[i]),
                "user_churn_score": float(np.clip(rng.beta(2.5, 6.5), 0, 1)),
                "kyc_verified": float(kyc_verified[i]),
                "loss_ratio": float(loss_ratio[i]),
                "total_claims": float(rng.poisson(2.8)),
                "approved_claims": float(rng.poisson(2.0)),
                "rejected_claims": float(rng.poisson(0.7)),
                "avg_claim_amount": float(np.clip(rng.normal(820, 260), 100, 3500)),
                "coverage_amount": float(rng.choice([10000, 15000, 20000, 30000, 50000, 70000])),
                "existing_policies_count": float(rng.poisson(1.2)),
                "user_age_days": float(np.clip(rng.exponential(320), 1, 3650)),
                "trust_score": float(trust_score[i]),
                "avg_daily_earnings": float(np.clip(rng.normal(1400, 480), 350, 4500)),
                "working_hours": float(np.clip(rng.normal(9, 2.3), 3, 16)),
                "platform_risk": float(rng.choice([0.35, 0.45, 0.55, 0.7], p=[0.25, 0.35, 0.25, 0.15])),
                "event_risk": float(event_risk[i]),
                "metro_city": float(rng.choice([0, 1], p=[0.6, 0.4])),
            }
        )

    base_weekly_premium = 10.0

    risk_adjustments = []
    trust_discounts = []
    for row in rows:
        risk_adj = (
            1.7
            + (row["event_risk"] * 8.5)
            + (row["user_fraud_risk"] * 6.0)
            + (row["loss_ratio"] * 5.2)
            + ((1 - row["kyc_verified"]) * 1.8)
            + (row["platform_risk"] * 1.6)
            + np.clip((row["coverage_amount"] - 15000) / 20000, 0, 4)
            + rng.normal(0, 0.8)
        )

        trust_disc = (
            0.8
            + (row["trust_score"] * 0.05)
            + (row["kyc_verified"] * 0.9)
            + np.clip(row["user_age_days"] / 420, 0, 3)
            - (row["user_fraud_risk"] * 1.4)
            - np.clip((row["working_hours"] - 10) * 0.12, 0, 0.8)
            + rng.normal(0, 0.45)
        )

        risk_adj = float(np.clip(risk_adj, 0.5, 20))
        trust_disc = float(np.clip(trust_disc, 0.5, 10))

        weekly = float(np.clip(base_weekly_premium + risk_adj - trust_disc, 6, 45))
        trust_disc = float(np.clip(base_weekly_premium + risk_adj - weekly, 0.5, 10))

        risk_adjustments.append(risk_adj)
        trust_discounts.append(trust_disc)

    y = np.column_stack([np.array(risk_adjustments), np.array(trust_discounts)])
    return rows, y


if __name__ == "__main__":
    X_train, y_train = build_india_training_dataset()

    model = PricingModel()
    model.train(X_train, y_train)
    model.save("ml/models/pricing")
