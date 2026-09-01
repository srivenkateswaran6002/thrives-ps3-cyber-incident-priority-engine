"""Shared normalization between training and inference.

The exact same functions must be used by training, inference, and (optionally)
data generation so that training and serving can never drift apart. This module
mirrors `frontend/src/utils/normalize.js`.
"""

import math

FACTOR_KEYS = [
    "severity",
    "assetImportance",
    "affectedUsers",
    "dataSensitivity",
    "attackConfidence",
    "businessImpact",
]

BOUNDED_KEYS = {"severity", "assetImportance", "dataSensitivity", "businessImpact"}


def normalize_bounded(value, max_value=10.0):
    value = max(0.0, min(float(max_value), value))
    return value / max_value


def normalize_log_scale(value, max_value):
    if max_value <= 0:
        return 0.0
    return math.log(1.0 + max(0.0, value)) / math.log(1.0 + max_value)


def passthrough(value):
    return max(0.0, min(1.0, value))


def normalize_factors(factors, max_users):
    """Return an ordered list of normalized feature floats (FACTOR_KEYS order)."""
    normalized = []
    for key in FACTOR_KEYS:
        value = factors[key]
        if key == "affectedUsers":
            n = normalize_log_scale(value, max_users)
        elif key == "attackConfidence":
            n = passthrough(value)
        else:
            n = normalize_bounded(value)
        normalized.append(max(0.0, min(1.0, n)))
    return normalized


def max_users_in_batch(alerts):
    """Compute the max affectedUsers across a list of alert factor dicts."""
    return max((float(a["factors"]["affectedUsers"] or 0) for a in alerts), default=1.0)
