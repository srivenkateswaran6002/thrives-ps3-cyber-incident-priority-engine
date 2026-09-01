"""Generate a synthetic labeled incident dataset.

There is no real historical dataset, so labels are constructed from a noisy,
non-linear ground-truth function (weighted base + interaction effects + gaussian
noise). This gives a RandomForest/GradientBoosting model something genuinely
non-trivial to learn, rather than a linear formula it could trivially memorize.

Writes `backend/training/training_data.csv` with the 6 raw factors + true_priority.
"""

import csv
import math
import os
import random

RANDOM_STATE = int(os.environ.get("SEED", "42"))

FACTOR_KEYS = [
    "severity",
    "assetImportance",
    "affectedUsers",
    "dataSensitivity",
    "attackConfidence",
    "businessImpact",
]

# Base weights (mirrors the original hand-picked weights scaled to 0-1)
BASE_WEIGHTS = {
    "severity": 0.18,
    "assetImportance": 0.17,
    "affectedUsers": 0.15,
    "dataSensitivity": 0.18,
    "attackConfidence": 0.15,
    "businessImpact": 0.17,
}

# Incident-type factor distributions (mirrors frontend/src/utils/mockAlerts.js)
TYPES = [
    {
        "id": "brute-force",
        "weight": 22,
        "factors": {
            "severity": (3, 8),
            "assetImportance": (4, 9),
            "affectedUsers": (50, 2000),
            "dataSensitivity": (2, 6),
            "attackConfidence": (0.6, 0.95),
            "businessImpact": (3, 7),
        },
    },
    {
        "id": "malware",
        "weight": 18,
        "factors": {
            "severity": (5, 10),
            "assetImportance": (3, 9),
            "affectedUsers": (10, 500),
            "dataSensitivity": (4, 9),
            "attackConfidence": (0.5, 0.9),
            "businessImpact": (5, 9),
        },
    },
    {
        "id": "phishing",
        "weight": 18,
        "factors": {
            "severity": (3, 7),
            "assetImportance": (2, 6),
            "affectedUsers": (100, 5000),
            "dataSensitivity": (3, 8),
            "attackConfidence": (0.4, 0.8),
            "businessImpact": (4, 8),
        },
    },
    {
        "id": "port-scan",
        "weight": 16,
        "factors": {
            "severity": (1, 5),
            "assetImportance": (2, 7),
            "affectedUsers": (5, 200),
            "dataSensitivity": (1, 4),
            "attackConfidence": (0.3, 0.7),
            "businessImpact": (1, 4),
        },
    },
    {
        "id": "failed-login",
        "weight": 16,
        "factors": {
            "severity": (1, 6),
            "assetImportance": (2, 8),
            "affectedUsers": (20, 1500),
            "dataSensitivity": (1, 5),
            "attackConfidence": (0.35, 0.8),
            "businessImpact": (2, 6),
        },
    },
    {
        "id": "data-exfiltration",
        "weight": 10,
        "factors": {
            "severity": (7, 10),
            "assetImportance": (6, 10),
            "affectedUsers": (1000, 10000),
            "dataSensitivity": (8, 10),
            "attackConfidence": (0.7, 0.97),
            "businessImpact": (8, 10),
        },
    },
]


def pick_type(rng):
    total = sum(t["weight"] for t in TYPES)
    r = rng.random() * total
    for t in TYPES:
        r -= t["weight"]
        if r <= 0:
            return t
    return TYPES[0]


def generate_factors(rng, type_spec):
    factors = {}
    for key in FACTOR_KEYS:
        lo, hi = type_spec["factors"][key]
        if key == "attackConfidence":
            factors[key] = round(rng.uniform(lo, hi), 2)
        else:
            factors[key] = round(rng.uniform(lo, hi))
    return factors


def ground_truth_priority(factors, rng):
    # Weighted base (0-1)
    base = sum(
        BASE_WEIGHTS[key] * (factors[key] / 10.0)
        for key in ("severity", "assetImportance", "dataSensitivity", "businessImpact")
    )
    base += BASE_WEIGHTS["affectedUsers"] * (
        math.log(1 + factors["affectedUsers"]) / math.log(1 + 10000)
    )
    base += BASE_WEIGHTS["attackConfidence"] * factors["attackConfidence"]

    # Scale base to 0-100
    score = base * 100

    # Interaction effects (non-linear, breach-scale compounding)
    if factors["dataSensitivity"] > 7 and factors["affectedUsers"] > 200:
        score += 10
    if factors["attackConfidence"] < 0.3:
        score -= 15
    if factors["assetImportance"] > 8 and factors["severity"] > 7:
        score += 8
    if factors["dataSensitivity"] > 8 and factors["businessImpact"] > 8:
        score += 6

    # Gaussian noise to simulate real-world label imperfection
    score += rng.gauss(0, 5)

    return max(0.0, min(100.0, score))


def generate_dataset(count=4000):
    rng = random.Random(RANDOM_STATE)
    rows = []
    for _ in range(count):
        type_spec = pick_type(rng)
        factors = generate_factors(rng, type_spec)
        priority = ground_truth_priority(factors, rng)
        row = {"type": type_spec["id"], **factors, "true_priority": priority}
        rows.append(row)
    return rows


def main():
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=4000)
    parser.add_argument("--out", default=os.path.join(os.path.dirname(__file__), "training_data.csv"))
    args = parser.parse_args()

    rows = generate_dataset(args.count)
    with open(args.out, "w", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=["type"] + FACTOR_KEYS + ["true_priority"])
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} rows to {args.out}")


if __name__ == "__main__":
    main()
