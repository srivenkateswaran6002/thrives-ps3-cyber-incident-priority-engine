import { create } from "zustand"
import { useShallow } from "zustand/react/shallow"
import { useMemo } from "react"
import { rankAlerts } from "../utils/scoringEngine.js"
import { autoNormalizeWeights } from "../utils/normalize.js"

const DEFAULT_WEIGHTS = {
  severity: 18,
  assetImportance: 17,
  affectedUsers: 15,
  dataSensitivity: 18,
  attackConfidence: 15,
  businessImpact: 17,
}

const PRESETS = {
  default: { ...DEFAULT_WEIGHTS },
  compliance: {
    severity: 14,
    assetImportance: 15,
    affectedUsers: 15,
    dataSensitivity: 30,
    attackConfidence: 14,
    businessImpact: 12,
  },
  availability: {
    severity: 28,
    assetImportance: 20,
    affectedUsers: 10,
    dataSensitivity: 10,
    attackConfidence: 12,
    businessImpact: 20,
  },
}

function applyThemeClass(theme) {
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }
}

export const useAlertStore = create((set, get) => ({
  alerts: [],
  weights: { ...DEFAULT_WEIGHTS },
  activePreset: "default",
  selectedAlertId: null,
  comparisonIds: [null, null],
  theme: "light",
  isDripping: false,

  loadAlerts: (alerts) => {
    set({
      alerts: alerts.map((a) => ({ ...a, score: 0, breakdown: {} })),
      selectedAlertId: null,
      comparisonIds: [null, null],
    })
  },

  addAlert: (alert) =>
    set((state) => ({ alerts: [...state.alerts, { ...alert, score: 0, breakdown: {} }] })),

  updateWeight: (key, value) =>
    set((state) => ({ weights: { ...state.weights, [key]: value } })),

  applyPreset: (name) => {
    const weights = PRESETS[name] || PRESETS.default
    set({ weights: { ...weights }, activePreset: name })
  },

  selectAlert: (id) => set({ selectedAlertId: id }),

  setComparison: (idsOrFn) =>
    set((state) => ({
      comparisonIds: typeof idsOrFn === "function" ? idsOrFn(state.comparisonIds) : idsOrFn,
    })),

  updateAlertStatus: (id, status) =>
    set((state) => ({
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

export function useRankedAlerts() {
  const { alerts, weights } = useAlertStore(
    useShallow((state) => ({ alerts: state.alerts, weights: state.weights }))
  )
  return useMemo(() => {
    const norm = autoNormalizeWeights(weights)
    const maxUsers = alerts.reduce((m, a) => Math.max(m, a.factors.affectedUsers || 0), 1)
    return rankAlerts(alerts, norm, maxUsers)
  }, [alerts, weights])
}

export { PRESETS }
