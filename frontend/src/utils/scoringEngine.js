import {
  autoNormalizeWeights,
  FACTOR_KEYS,
  FACTOR_LABELS,
  normalizeBounded,
  normalizeLogScale,
  passthrough,
} from "./normalize.js"

const EPSILON = 0.005

export function computeScore(alert, weights, batchMaxUsers) {
  const w = autoNormalizeWeights(weights)
  const maxUsers = batchMaxUsers || alert.factors.affectedUsers || 1

  const normalized = {}
  const weighted = {}
  let score = 0

  for (const key of FACTOR_KEYS) {
    const value = alert.factors[key]
    let n
    switch (key) {
      case "affectedUsers":
        n = normalizeLogScale(value, maxUsers)
        break
      case "attackConfidence":
        n = passthrough(value)
        break
      default:
        n = normalizeBounded(value)
    }
    n = Math.max(0, Math.min(1, n))
    normalized[key] = n
    weighted[key] = n * w[key]
    score += weighted[key]
  }

  score = Math.max(0, Math.min(1, score))

  return {
    score,
    normalized,
    weighted,
    weights: w,
  }
}

export function rankAlerts(alerts, weights, maxUsers) {
  const scored = alerts.map((alert) => {
    const { score, normalized, weighted } = computeScore(alert, weights, maxUsers)
    return { ...alert, score, breakdown: { normalized, weighted } }
  })

  scored.sort((a, b) => {
    const diff = b.score - a.score
    if (Math.abs(diff) > EPSILON) return diff
    const conf = b.factors.attackConfidence - a.factors.attackConfidence
    if (conf !== 0) return conf
    return b.factors.assetImportance - a.factors.assetImportance
  })

  return scored.map((alert, i) => ({ ...alert, rank: i + 1 }))
}

export function generateJustification(a, b) {
  if (!a || !b || !a.breakdown || !b.breakdown) return ""

  const gaps = FACTOR_KEYS.map((key) => ({
    key,
    label: FACTOR_LABELS[key],
    gap: (a.breakdown.weighted[key] || 0) - (b.breakdown.weighted[key] || 0),
  })).filter((g) => Math.abs(g.gap) > 0.0001)

  gaps.sort((x, y) => Math.abs(y.gap) - Math.abs(x.gap))

  const top = gaps.slice(0, 2)

  if (top.length === 0) {
    return `${a.id} and ${b.id} are effectively tied on weighted risk.`
  }

  const reasons = top
    .map((g) => `${g.label.toLowerCase()} (${g.gap >= 0 ? "higher" : "lower"} by ${(Math.abs(g.gap) * 100).toFixed(1)}% weight contribution)`)
    .join(" and ")

  return `${a.id} ranks above ${b.id} primarily due to ${reasons}.`
}

export function scoreLabel(score) {
  if (score >= 0.8) return { tier: "Critical", color: "var(--danger)" }
  if (score >= 0.6) return { tier: "High", color: "var(--warning)" }
  if (score >= 0.4) return { tier: "Medium", color: "#eab308" }
  return { tier: "Low", color: "var(--success)" }
}
