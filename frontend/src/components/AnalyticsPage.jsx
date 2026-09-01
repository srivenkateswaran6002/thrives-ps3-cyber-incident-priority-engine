import { useMemo } from "react"
import { useAlertStore, useFilteredAlerts } from "../store/useAlertStore.js"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  PieChart,
  Pie
} from "recharts"
import { FACTOR_LABELS } from "../utils/normalize.js"
import "./AnalyticsPage.css"

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"]

function AnalyticsPage() {
  const modelFeatureImportance = useAlertStore((s) => s.modelFeatureImportance)
  const scoringMode = useAlertStore((s) => s.scoringMode)
  const weights = useAlertStore((s) => s.weights)
  const alerts = useFilteredAlerts()

  const importanceData = useMemo(() => {
    const source = scoringMode === "ml" && Object.keys(modelFeatureImportance).length > 0 
      ? modelFeatureImportance 
      : weights

    return Object.entries(source)
      .map(([key, val]) => ({
        name: FACTOR_LABELS[key] || key,
        value: Math.round(val * 100),
      }))
      .sort((a, b) => b.value - a.value)
  }, [modelFeatureImportance, scoringMode, weights])

  const typeData = useMemo(() => {
    const counts = {}
    alerts.forEach((a) => {
      counts[a.type] = (counts[a.type] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [alerts])

  const statusData = useMemo(() => {
    const counts = { new: 0, investigating: 0, resolved: 0 }
    alerts.forEach((a) => {
      if (counts[a.status] !== undefined) counts[a.status]++
    })
    return [
      { name: "New", value: counts.new, color: "#ef4444" },
      { name: "Investigating", value: counts.investigating, color: "#f59e0b" },
      { name: "Resolved", value: counts.resolved, color: "#10b981" },
    ].filter(d => d.value > 0)
  }, [alerts])

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <h1 className="analytics-title">Analytics & Model Insights</h1>
        <p className="analytics-subtitle">Visualize incident distribution and ML model parameters</p>
      </div>

      <div className="analytics-grid">
        {/* Model Feature Importance */}
        <div className="card-lg analytics-card">
          <div className="section-title">Feature Importance Weights</div>
          <p className="analytics-desc">
            {scoringMode === "ml"
              ? "Live relative weights utilized by the GradientBoosting ML model."
              : "Currently using fallback static local weights."}
          </p>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={importanceData} layout="vertical" margin={{ left: 40, right: 20, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: "var(--text)", fontSize: 11, fontWeight: 500 }} />
                <Tooltip
                  cursor={{ fill: "var(--surface-3)" }}
                  contentStyle={{ background: "var(--surface)", borderColor: "var(--border)", fontSize: 12, borderRadius: 8, color: "var(--text)" }}
                  itemStyle={{ color: "var(--text)" }}
                />
                <Bar dataKey="value" fill="var(--accent)" radius={[0, 4, 4, 0]} barSize={20}>
                  {importanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="card-lg analytics-card">
          <div className="section-title">Incident Status</div>
          <p className="analytics-desc">Current triaging progress across all active incidents.</p>
          <div className="chart-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "var(--surface)", borderColor: "var(--border)", fontSize: 12, borderRadius: 8, color: "var(--text)" }}
                    itemStyle={{ color: "var(--text)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="analytics-empty">No incidents loaded</div>
            )}
          </div>
        </div>

        {/* Alert Type Distribution */}
        <div className="card-lg analytics-card col-span-full">
          <div className="section-title">Alert Type Distribution</div>
          <p className="analytics-desc">Breakdown of incidents by attack category.</p>
          <div className="chart-container">
            {typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={typeData} margin={{ top: 20, bottom: 20, left: 0, right: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: "var(--surface-3)" }}
                    contentStyle={{ background: "var(--surface)", borderColor: "var(--border)", fontSize: 12, borderRadius: 8, color: "var(--text)" }}
                    itemStyle={{ color: "var(--text)" }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="analytics-empty">No incidents loaded</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsPage
