import { useEffect, useRef } from "react"
import { useAlertStore } from "../store/useAlertStore.js"
import { generateAlerts, dripAlert } from "../utils/mockAlerts.js"
import "./IngestPanel.css"

const TYPE_COLORS = {
  "brute-force": "#ef4444",
  malware: "#f59e0b",
  phishing: "#3b82f6",
  "port-scan": "#8b5cf6",
  "failed-login": "#06b6d4",
  "data-exfiltration": "#ec4899",
}

function IngestPanel() {
  const alerts = useAlertStore((s) => s.alerts)
  const loadAlerts = useAlertStore((s) => s.loadAlerts)
  const addAlert = useAlertStore((s) => s.addAlert)
  const isDripping = useAlertStore((s) => s.isDripping)
  const setDrip = useAlertStore((s) => s.setDrip)
  const dripRef = useRef(null)

  useEffect(() => {
    if (!isDripping) {
      clearInterval(dripRef.current)
      return
    }
    dripRef.current = setInterval(() => {
      addAlert(dripAlert())
    }, 2500)
    return () => clearInterval(dripRef.current)
  }, [isDripping, addAlert])

  const counts = {}
  for (const a of alerts) {
    counts[a.typeId] = (counts[a.typeId] || 0) + 1
  }
  const typeList = Object.entries(counts).sort((x, y) => y[1] - x[1])
  const max = Math.max(1, ...typeList.map(([, c]) => c))

  return (
    <div className="panel">
      <div className="panel-title">Alert Ingest</div>

      <div style={{ marginBottom: 14 }}>
        {typeList.length === 0 ? (
          <div style={{ color: "var(--text-muted)", fontSize: 13 }}>No alerts loaded</div>
        ) : (
          typeList.map(([id, count]) => (
            <div key={id} className="ingest-type-row">
              <span className="ingest-type-name">{id.replace("-", " ")}</span>
              <div className="ingest-type-track">
                <div
                  className="ingest-type-fill"
                  style={{ width: `${(count / max) * 100}%`, background: TYPE_COLORS[id] }}
                />
              </div>
              <span className="ingest-type-count">{count}</span>
            </div>
          ))
        )}
      </div>

      <div className="ingest-actions">
        <button type="button" className="ingest-btn ingest-btn-primary" onClick={() => loadAlerts(generateAlerts(100))}>
          Load Batch
        </button>
        <button
          type="button"
          className={isDripping ? "ingest-btn ingest-btn-danger" : "ingest-btn ingest-btn-ghost"}
          onClick={() => setDrip(!isDripping)}
        >
          {isDripping ? "Stop Drip" : "Start Drip"}
        </button>
      </div>
    </div>
  )
}

export default IngestPanel
