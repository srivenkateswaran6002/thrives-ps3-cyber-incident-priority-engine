"""Model loading and batch prediction.

Artifacts are loaded once at module level (not per-request) for latency.
Scores are returned normalized to 0-1 to match the frontend display scale.
"""

import json
import os

import joblib
import numpy as np

from app.preprocessing import FACTOR_KEYS, normalize_factors
from app.schemas import ScoredAlert

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "model.joblib")
IMPORTANCE_PATH = os.path.join(BASE_DIR, "feature_importance.json")

_model = None
_feature_importance = None


def load_artifacts():
    global _model, _feature_importance
    if _model is None:
        _model = joblib.load(MODEL_PATH)
    if _feature_importance is None:
        with open(IMPORTANCE_PATH) as fh:
            _feature_importance = json.load(fh)
    return _model, _feature_importance


def get_feature_importance():
    _, importance = load_artifacts()
    return dict(importance)


def predict_batch(alert_ins, max_users=None):
    """Return (sorted ScoredAlert list, model_feature_importance)."""
    model, importance = load_artifacts()

    if max_users is None:
        max_users = max((a.factors.affectedUsers or 0 for a in alert_ins), default=1.0)

    X = np.array(
        [normalize_factors(a.factors.dict(), max_users) for a in alert_ins],
        dtype=float,
    )
    raw_scores = model.predict(X)

    scored = []
    for alert, raw in zip(alert_ins, raw_scores):
        factors = alert.factors.dict()
        normalized = dict(zip(FACTOR_KEYS, normalize_factors(factors, max_users)))
        weighted = {}
        for key in FACTOR_KEYS:
            weighted[key] = normalized[key] * importance[key]
        score = max(0.0, min(1.0, float(raw) / 100.0))
        scored.append(
            ScoredAlert(
                id=alert.id,
                type=alert.type,
                typeId=alert.typeId,
                timestamp=alert.timestamp,
                status=alert.status,
                factors=alert.factors,
                score=score,
                breakdown={"normalized": normalized, "weighted": weighted},
            )
        )

    # Tie-break: within 0.005 -> higher attackConfidence, then higher assetImportance
    scored.sort(
        key=lambda a: (
            round(-a.score, 4),
            -a.factors.attackConfidence,
            -a.factors.assetImportance,
        )
    )

    return scored, dict(importance)
