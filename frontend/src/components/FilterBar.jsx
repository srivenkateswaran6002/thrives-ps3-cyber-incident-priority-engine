import { useAlertStore, DEFAULT_FILTERS } from "../store/useAlertStore.js"
import { ALERT_TYPES } from "../utils/mockAlerts.js"
import { useFilteredAlerts } from "../store/useAlertStore.js"
import "./FilterBar.css"

const CRITICALITIES = ["all", "critical", "high", "medium", "low"]
const CRITICALITY_LABELS = { all: "All", critical: "Critical", high: "High", medium: "Medium", low: "Low" }
const STATUSES = ["all", "new", "investigating", "resolved"]
const TIME_RANGES = [
  { id: "all", label: "All time" },
  { id: "24h", label: "24h" },
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
]

function activeFilterCount(filters) {
  let n = 0
  for (const key of Object.keys(DEFAULT_FILTERS)) {
    if (filters[key] !== DEFAULT_FILTERS[key]) n += 1
  }
  return n
}

function RangeFilter({ label, stateKey }) {
  const filters = useAlertStore((s) => s.filters)
  const setFilter = useAlertStore((s) => s.setFilter)
  const minKey = `${stateKey}Min`
  const maxKey = `${stateKey}Max`
  return (
    <div className="filter-group">
      <span className="filter-label">{label}</span>
      <input
        type="range"
        className="filter-range"
        min="0"
        max="10"
        step="1"
        value={filters[minKey]}
        onChange={(e) => {
          const v = Number(e.target.value)
          setFilter(minKey, Math.min(v, filters[maxKey]))
        }}
      />
      <div className="filter-range-inputs">
        <span className="filter-range-val">{filters[minKey]}</span>
        <span>–</span>
        <input
          type="range"
          className="filter-range"
          min="0"
          max="10"
          step="1"
          value={filters[maxKey]}
          onChange={(e) => {
            const v = Number(e.target.value)
            setFilter(maxKey, Math.max(v, filters[minKey]))
          }}
        />
        <span className="filter-range-val">{filters[maxKey]}</span>
      </div>
    </div>
  )
}

function FilterBar() {
  const filters = useAlertStore((s) => s.filters)
  const setFilter = useAlertStore((s) => s.setFilter)
  const resetFilters = useAlertStore((s) => s.resetFilters)
  const filteredAlerts = useFilteredAlerts()
  const total = useAlertStore((s) => s.alerts.length)

  const active = activeFilterCount(filters)
  const label = (id) =>
    ({
      "brute-force": "Brute Force",
      malware: "Malware",
      phishing: "Phishing",
      "port-scan": "Port Scan",
      "failed-login": "Failed Login",
      "data-exfiltration": "Data Exfiltration",
    }[id] || id)

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <span className="filter-label">Type</span>
        <select
          className="filter-select"
          value={filters.type}
          onChange={(e) => setFilter("type", e.target.value)}
        >
          <option value="all">All types</option>
          {ALERT_TYPES.map((t) => (
            <option key={t} value={t}>
              {label(t)}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <span className="filter-label">Criticality</span>
        <div className="filter-seg">
          {CRITICALITIES.map((c) => (
            <button
              key={c}
              type="button"
              className={`filter-seg-btn ${filters.criticality === c ? "filter-seg-active" : ""}`}
              onClick={() => setFilter("criticality", c)}
            >
              {CRITICALITY_LABELS[c]}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <span className="filter-label">Status</span>
        <select
          className="filter-select"
          value={filters.status}
          onChange={(e) => setFilter("status", e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <span className="filter-label">Time</span>
        <div className="filter-seg">
          {TIME_RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`filter-seg-btn ${filters.timeRange === r.id ? "filter-seg-active" : ""}`}
              onClick={() => setFilter("timeRange", r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <span className="filter-label">Min Confidence</span>
        <div className="filter-range-inputs">
          <input
            type="range"
            className="filter-range"
            min="0"
            max="100"
            step="5"
            value={filters.confidenceMin}
            onChange={(e) => setFilter("confidenceMin", Number(e.target.value))}
          />
          <span className="filter-range-val">{filters.confidenceMin}%</span>
        </div>
      </div>

      <RangeFilter label="Severity" stateKey="severity" />
      <RangeFilter label="Business Impact" stateKey="businessImpact" />
      <RangeFilter label="Asset Importance" stateKey="assetImportance" />

      <div className="filter-actions">
        <span className="filter-count">
          {active > 0 && <span className="filter-active-dot" style={{ marginRight: 6 }} />}
          Showing {filteredAlerts.length} of {total}
        </span>
        {active > 0 && (
          <button type="button" className="filter-reset" onClick={resetFilters}>
            Reset
          </button>
        )}
      </div>
    </div>
  )
}

export default FilterBar
