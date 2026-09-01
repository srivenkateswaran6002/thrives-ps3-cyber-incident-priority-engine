import { useMemo } from "react"
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  PolarRadiusAxis,
  Legend,
} from "recharts"
import { useAlertStore } from "../store/useAlertStore.js"
import { useFilteredAlerts } from "../store/useAlertStore.js"
import { FACTOR_KEYS, FACTOR_SHORT_LABELS } from "../utils/normalize.js"
import { generateJustification, scoreLabel } from "../utils/scoringEngine.js"
import "./ComparisonView.css"

function CompareCard({ alert }) {
  const { color } = scoreLabel(alert.score)
  return (
    <div className="compare-card">
      <div className="compare-card-id">{alert.id}</div>
      <div className="compare-card-type">{alert.type}</div>
      <div className="compare-card-score" style={{ color }}>
        {Math.round(alert.score * 100)}
      </div>
      <div className="compare-track">
        <div className="compare-fill" style={{ width: `${alert.score * 100}%`, background: color }} />
      </div>
    </div>
  )
}

function ComparisonView() {
  const comparisonIds = useAlertStore((s) => s.comparisonIds)
  const rankedAlerts = useFilteredAlerts()

  const [a, b] = useMemo(() => {
    const first = rankedAlerts.find((x) => x.id === comparisonIds[0])
    const second = rankedAlerts.find((x) => x.id === comparisonIds[1])
    return [first, second]
  }, [rankedAlerts, comparisonIds])

  if (!a && !b) {
    return <div className="comparison-empty">Hold shift and click two rows to compare them</div>
  }

  const justification = a && b ? generateJustification(a, b) : "Select a second incident to compare."

  const chartData = FACTOR_KEYS.map((key) => ({
    factor: FACTOR_SHORT_LABELS[key],
    A: a ? Math.round((a.breakdown?.normalized?.[key] ?? 0) * 100) : 0,
    B: b ? Math.round((b.breakdown?.normalized?.[key] ?? 0) * 100) : 0,
  }))

  return (
    <div className="comparison">
      <div className="comparison-inner">
        <div className="comparison-grid">
          <div>
            {a ? (
              <CompareCard alert={a} />
            ) : (
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Click an incident (with shift)</div>
            )}
          </div>
          <div>
            {b ? (
              <CompareCard alert={b} />
            ) : (
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Pick a second incident</div>
            )}
          </div>
        </div>

        {a && b && (
          <div className="comparison-chart" style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer>
              <RadarChart data={chartData} outerRadius="65%">
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="factor" tick={{ fill: "var(--text)", fontSize: 12, fontWeight: 500 }} />
                <PolarRadiusAxis tick={false} axisLine={false} />
                <Radar name={a.id} dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} />
                <Radar name={b.id} dataKey="B" stroke="#ef4444" fill="#ef4444" fillOpacity={0.25} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="justification">
          <div className="justification-label">Why {a?.id ?? ""} outranks {b?.id ?? ""}</div>
          {justification}
        </div>
      </div>
    </div>
  )
}

export default ComparisonView
