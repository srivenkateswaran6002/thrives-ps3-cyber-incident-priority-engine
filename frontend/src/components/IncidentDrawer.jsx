import { useAlertStore } from "../store/useAlertStore.js"
import { useFilteredAlerts } from "../store/useAlertStore.js"
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  PolarRadiusAxis,
} from "recharts"
import { FACTOR_KEYS, FACTOR_LABELS } from "../utils/normalize.js"
import { scoreLabel } from "../utils/scoringEngine.js"
import "./IncidentDrawer.css"

function formatRaw(key, value) {
  if (key === "affectedUsers") return value.toLocaleString()
  if (key === "attackConfidence") return `${Math.round(value * 100)}%`
  return value
}

function IncidentDrawer() {
  const rankedAlerts = useFilteredAlerts()
  const selectedAlertId = useAlertStore((s) => s.selectedAlertId)
  const updateAlertStatus = useAlertStore((s) => s.updateAlertStatus)
  const selectAlert = useAlertStore((s) => s.selectAlert)

  const alert = rankedAlerts.find((a) => a.id === selectedAlertId)

  if (!alert) {
    return <div className="empty-drawer">Select an incident to inspect details</div>
  }

  const { color } = scoreLabel(alert.score)
  const chartData = FACTOR_KEYS.map((key) => ({
    factor: FACTOR_LABELS[key],
    value: Math.round((alert.breakdown?.normalized?.[key] ?? 0) * 100),
  }))

  return (
    <div className="drawer">
      <div className="drawer-header">
        <div>
          <div className="drawer-id">{alert.id}</div>
          <div className="drawer-type">{alert.type}</div>
        </div>
        <button type="button" className="drawer-close" onClick={() => selectAlert(null)} aria-label="Close">
          ×
        </button>
      </div>

      <div className="drawer-body">
        <div className="drawer-score">
          <span className="drawer-score-label">Risk Score</span>
          <span className="drawer-score-value" style={{ color }}>
            {Math.round(alert.score * 100)}
          </span>
        </div>

        {alert.policyNotes?.length > 0 && (
          <div className="policy-note">
            {alert.policyNotes.map((n) => (
              <span key={n.label}>{n.text} from {n.label}</span>
            ))}
          </div>
        )}

        <div className="chart-wrap" style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <RadarChart data={chartData} outerRadius="70%">
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="factor" tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
              <PolarRadiusAxis tick={false} axisLine={false} />
              <Radar dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.35} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <table className="factor-table">
          <thead>
            <tr>
              <th>Factor</th>
              <th>Raw</th>
              <th style={{ textAlign: "right" }}>Weighted</th>
            </tr>
          </thead>
          <tbody>
            {FACTOR_KEYS.map((key) => {
              const weighted = (alert.breakdown?.weighted?.[key] ?? 0) * 100
              return (
                <tr key={key}>
                  <td className="factor-name">{FACTOR_LABELS[key]}</td>
                  <td className="factor-raw">{formatRaw(key, alert.factors[key])}</td>
                  <td style={{ width: "40%" }}>
                    <div className="track">
                      <div className="track-fill" style={{ width: `${weighted}%` }} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="status-row">
          {["new", "investigating", "resolved"].map((s) => (
            <button
              key={s}
              type="button"
              className={`status-choice ${alert.status === s ? "status-choice-active" : ""}`}
              onClick={() => updateAlertStatus(alert.id, s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default IncidentDrawer
