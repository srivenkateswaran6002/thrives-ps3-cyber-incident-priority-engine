export function normalizeBounded(value, max = 10) {
  return Math.max(0, Math.min(1, value / max))
}

export function normalizeLogScale(value, maxValue) {
  if (maxValue <= 0) return 0
  return Math.log(1 + Math.max(0, value)) / Math.log(1 + maxValue)
}

export function passthrough(value) {
  return Math.max(0, Math.min(1, value))
}

export const FACTOR_KEYS = [
  "severity",
  "assetImportance",
  "affectedUsers",
  "dataSensitivity",
  "attackConfidence",
  "businessImpact",
]

export const FACTOR_LABELS = {
  severity: "Severity",
  assetImportance: "Asset Importance",
  affectedUsers: "Affected Users",
  dataSensitivity: "Data Sensitivity",
  attackConfidence: "Attack Confidence",
  businessImpact: "Business Impact",
}

export function autoNormalizeWeights(weights) {
  const total = FACTOR_KEYS.reduce((s, k) => s + (weights[k] || 0), 0)
  if (total <= 0) {
    const each = 1 / FACTOR_KEYS.length
    const out = {}
    for (const k of FACTOR_KEYS) out[k] = each
    return out
  }
  const out = {}
  for (const k of FACTOR_KEYS) out[k] = (weights[k] || 0) / total
  return out
}
