import { create } from "zustand"
import { useShallow } from "zustand/react/shallow"
import { useMemo } from "react"
import { rankAlerts, scoreLabel } from "../utils/scoringEngine.js"
import { autoNormalizeWeights } from "../utils/normalize.js"
import { scoreAlertsRemote } from "../services/api.js"

const DEFAULT_WEIGHTS = {
  severity: 18,
  assetImportance: 17,
  affectedUsers: 15,
  dataSensitivity: 18,
  attackConfidence: 15,
  businessImpact: 17,
}

const DEFAULT_FILTERS = {
  type: "all",
  criticality: "all",
  severityMin: 0,
  severityMax: 10,
  businessImpactMin: 0,
  businessImpactMax: 10,
  assetImportanceMin: 0,
  assetImportanceMax: 10,
  confidenceMin: 0,
  status: "all",
  timeRange: "all",
}

const DEFAULT_POLICY = {
  complianceBoost: false,
  availabilityBoost: false,
  highConfidenceOnly: false,
}

function applyThemeClass(theme) {
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }
}

function toRaw(alert) {
  return {
    id: alert.id,
    type: alert.type,
    typeId: alert.typeId,
    timestamp: alert.timestamp,
    status: alert.status,
    factors: alert.factors,
    score: 0,
    breakdown: {},
  }
}

function stripScore(a) {
  return { ...a, score: 0, breakdown: {} }
}

function applyPolicyAdjustments(scored, policy) {
  let adjusted = scored.map((a) => {
    let s = a.score
    const notes = []
    if (policy.complianceBoost && a.factors.dataSensitivity > 7) {
      s *= 1.2
      notes.push({ label: "Compliance Priority", text: "+20% (data sensitivity > 7)" })
    }
    if (policy.availabilityBoost && a.factors.businessImpact > 7) {
      s *= 1.2
      notes.push({ label: "Availability Priority", text: "+20% (business impact > 7)" })
    }
    if (policy.highConfidenceOnly && a.factors.attackConfidence < 0.3) {
      s *= 0.6
      notes.push({ label: "High-Confidence Only", text: "-40% (confidence < 30%)" })
    }
    return { ...a, score: Math.max(0, Math.min(1, s)), policyNotes: notes }
  })

  adjusted.sort((x, y) => {
    const diff = y.score - x.score
    if (Math.abs(diff) > 0.005) return diff
    const conf = y.factors.attackConfidence - x.factors.attackConfidence
    if (conf !== 0) return conf
    return y.factors.assetImportance - x.factors.assetImportance
  })

  return adjusted.map((a, i) => ({ ...a, rank: i + 1 }))
}

let refreshTimer = null
let refreshInFlight = false
let pendingRefresh = false

export const useAlertStore = create((set, get) => ({
  rawAlerts: [],
  alerts: [],
  weights: { ...DEFAULT_WEIGHTS },
  modelFeatureImportance: {},
  scoringMode: "fallback",
  policyAdjustments: { ...DEFAULT_POLICY },
  selectedAlertId: null,
  comparisonIds: [null, null],
  theme: "light",
  isDripping: false,
  filters: { ...DEFAULT_FILTERS },

  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),

  resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),

  refreshScores: () => {
    clearTimeout(refreshTimer)
    refreshTimer = setTimeout(() => {
      const { rawAlerts, policyAdjustments } = get()
      const run = async () => {
        if (refreshInFlight) {
          pendingRefresh = true
          return
        }
        refreshInFlight = true
        try {
          const { alerts: scored, modelFeatureImportance } = await scoreAlertsRemote(rawAlerts)
          const adjusted = applyPolicyAdjustments(scored, policyAdjustments)
          set({
            alerts: adjusted,
            modelFeatureImportance,
            scoringMode: "ml",
          })
        } catch {
          const scored = rankAlerts(rawAlerts, autoNormalizeWeights(get().weights))
          const adjusted = applyPolicyAdjustments(scored, policyAdjustments)
          set({
            alerts: adjusted,
            scoringMode: "fallback",
          })
        } finally {
          refreshInFlight = false
          if (pendingRefresh) {
            pendingRefresh = false
            get().refreshScores()
          }
        }
      }
      run()
    }, 60)
  },

  loadAlerts: (alerts) => {
    const raw = alerts.map(toRaw)
    set({
      rawAlerts: raw,
      alerts: raw.map(stripScore),
      selectedAlertId: null,
      comparisonIds: [null, null],
      scoringMode: "loading",
    })
    get().refreshScores()
  },

  addAlert: (alert) => {
    set((state) => ({
      rawAlerts: [...state.rawAlerts, toRaw(alert)],
      alerts: [...state.alerts, stripScore(alert)],
    }))
    get().refreshScores()
  },

  togglePolicy: (key) => {
    set((state) => ({
      policyAdjustments: { ...state.policyAdjustments, [key]: !state.policyAdjustments[key] },
    }))
    get().refreshScores()
  },

  selectAlert: (id) => set({ selectedAlertId: id }),

  setComparison: (idsOrFn) =>
    set((state) => ({
      comparisonIds: typeof idsOrFn === "function" ? idsOrFn(state.comparisonIds) : idsOrFn,
    })),

  updateAlertStatus: (id, status) =>
    set((state) => ({
      rawAlerts: state.rawAlerts.map((a) => (a.id === id ? { ...a, status } : a)),
      alerts: state.alerts.map((a) => (a.id === id ? { ...a, status } : a)),
    })),

  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark"
    applyThemeClass(next)
    try {
      localStorage.setItem("theme", next)
    } catch {
      /* noop */
    }
    set({ theme: next })
  },

  initTheme: () => {
    let initial = "light"
    try {
      initial = localStorage.getItem("theme") || "light"
    } catch {
      /* noop */
    }
    applyThemeClass(initial)
    set({ theme: initial })
  },

  toggleDrip: (value) => set({ isDripping: value }),

  setDrip: (value) => set({ isDripping: value }),
}))

const TIER_ORDER = ["Low", "Medium", "High", "Critical"]

function timeRangeCutoff(range) {
  const ms =
    range === "24h"
      ? 24 * 60 * 60 * 1000
      : range === "7d"
      ? 7 * 24 * 60 * 60 * 1000
      : range === "30d"
      ? 30 * 24 * 60 * 60 * 1000
      : 0
  return ms ? Date.now() - ms : 0
}

export function useFilteredAlerts() {
  const { alerts, filters } = useAlertStore(
    useShallow((state) => ({ alerts: state.alerts, filters: state.filters }))
  )

  return useMemo(() => {
    const cutoff = timeRangeCutoff(filters.timeRange)
    const f = filters

    const filtered = alerts.filter((alert) => {
      const fx = alert.factors

      if (f.type !== "all" && alert.typeId !== f.type) return false

      if (f.criticality !== "all") {
        const tier = scoreLabel(alert.score).tier
        if (TIER_ORDER.indexOf(tier) !== TIER_ORDER.indexOf(f.criticality)) return false
      }

      if (fx.severity < f.severityMin || fx.severity > f.severityMax) return false
      if (fx.businessImpact < f.businessImpactMin || fx.businessImpact > f.businessImpactMax) return false
      if (fx.assetImportance < f.assetImportanceMin || fx.assetImportance > f.assetImportanceMax) return false
      if (fx.attackConfidence * 100 < f.confidenceMin) return false

      if (f.status !== "all" && alert.status !== f.status) return false

      if (cutoff && new Date(alert.timestamp).getTime() < cutoff) return false

      return true
    })

    return filtered.map((alert, i) => ({ ...alert, rank: i + 1 }))
  }, [alerts, filters])
}

export { DEFAULT_FILTERS }
