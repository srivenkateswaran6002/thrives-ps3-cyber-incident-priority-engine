"""Train a regression model on the synthetic incident dataset.

Loads training_data.csv, normalizes features using the shared preprocessing
module (app/preprocessing.py) so inference uses identical preprocessing,
trains RandomForestRegressor vs GradientBoostingRegressor, keeps the better
one by validation MAE, and saves model.joblib + feature_importance.json.
"""

import csv
import json
import os

import joblib
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import train_test_split

import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.preprocessing import FACTOR_KEYS, max_users_in_batch, normalize_factors

BASE_DIR = os.path.dirname(__file__)
DATA_PATH = os.path.join(BASE_DIR, "training_data.csv")
MODEL_PATH = os.path.join(BASE_DIR, "..", "model.joblib")
IMPORTANCE_PATH = os.path.join(BASE_DIR, "..", "feature_importance.json")


def load_data(path):
    with open(path, newline="") as fh:
        rows = list(csv.DictReader(fh))
    alerts = [
        {"factors": {k: float(r[k]) for k in FACTOR_KEYS}, "target": float(r["true_priority"])}
        for r in rows
    ]
    return alerts


def build_features(alerts):
    max_users = max((a["factors"]["affectedUsers"] for a in alerts), default=1.0)
    X = np.array([normalize_factors(a["factors"], max_users) for a in alerts])
    y = np.array([a["target"] for a in alerts])
    return X, y


def main():
    alerts = load_data(DATA_PATH)
    X, y = build_features(alerts)
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    models = {
        "RandomForest": RandomForestRegressor(n_estimators=300, random_state=42, n_jobs=-1),
        "GradientBoosting": GradientBoostingRegressor(random_state=42),
    }

    best = None
    best_name = None
    best_mae = float("inf")
    for name, model in models.items():
        model.fit(X_train, y_train)
        preds = model.predict(X_val)
        mae = mean_absolute_error(y_val, preds)
        print(f"{name} validation MAE: {mae:.3f}")
        if mae < best_mae:
            best_mae = mae
            best = model
            best_name = name

    print(f"Best model: {best_name} (MAE {best_mae:.3f})")

    joblib.dump(best, MODEL_PATH)
    print(f"Saved model to {MODEL_PATH}")

    importance = dict(zip(FACTOR_KEYS, [float(v) for v in best.feature_importances_]))
    total = sum(importance.values())
    importance = {k: v / total for k, v in importance.items()}
    with open(IMPORTANCE_PATH, "w") as fh:
        json.dump(importance, fh, indent=2)
    print(f"Saved feature importances to {IMPORTANCE_PATH}")
    print("Feature importances (normalized to sum 1):")
    for k, v in importance.items():
        print(f"  {k}: {v:.3f}")


if __name__ == "__main__":
    main()
