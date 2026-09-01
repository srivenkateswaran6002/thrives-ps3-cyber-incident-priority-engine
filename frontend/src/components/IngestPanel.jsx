import { useEffect, useRef, useState } from "react"
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
  const loadAlertsFromJson = useAlertStore((s) => s.loadAlertsFromJson)
  const dripRef = useRef(null)

  const [ingestTab, setIngestTab] = useState("demo")
  const [jsonText, setJsonText] = useState("")
  const [ingestMsg, setIngestMsg] = useState(null)

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

  const handleJsonLoad = () => {
    if (!jsonText.trim()) return
    const result = loadAlertsFromJson(jsonText)
    if (result.ok) {
      setIngestMsg({ type: "success", text: `Loaded ${result.count} alert(s)` })
      setJsonText("")
    } else {
      setIngestMsg({ type: "error", text: `Parse error: ${result.error}` })
    }
    setTimeout(() => setIngestMsg(null), 4000)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target.result
      const result = loadAlertsFromJson(text)
      if (result.ok) {
        setIngestMsg({ type: "success", text: `Loaded ${result.count} alert(s) from ${file.name}` })
      } else {
        setIngestMsg({ type: "error", text: `Parse error: ${result.error}` })
      }
      setTimeout(() => setIngestMsg(null), 4000)
    }
    reader.readAsText(file)
    e.target.value = ""
  }

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

      {/* Ingest Tabs */}
      <div className="ingest-tabs">
        <button
          type="button"
          className={`ingest-tab ${ingestTab === "demo" ? "ingest-tab-active" : ""}`}
          onClick={() => setIngestTab("demo")}
        >
          Demo
        </button>
        <button
          type="button"
          className={`ingest-tab ${ingestTab === "json" ? "ingest-tab-active" : ""}`}
          onClick={() => setIngestTab("json")}
        >
          Paste JSON
        </button>
        <button
          type="button"
          className={`ingest-tab ${ingestTab === "file" ? "ingest-tab-active" : ""}`}
          onClick={() => setIngestTab("file")}
        >
          Upload
        </button>
      </div>

      {ingestTab === "demo" && (
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
      )}

      {ingestTab === "json" && (
        <div className="ingest-json-section">
          <textarea
            className="ingest-textarea"
            placeholder={'[\n  {\n    "id": "ALT-0001",\n    "type": "Malware",\n    "factors": {\n      "severity": 8,\n      "assetImportance": 7,\n      "affectedUsers": 200,\n      "dataSensitivity": 9,\n      "attackConfidence": 0.85,\n      "businessImpact": 8\n    }\n  }\n]'}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={6}
          />
          <button type="button" className="ingest-btn ingest-btn-primary" onClick={handleJsonLoad}>
            Load JSON
          </button>
        </div>
      )}

      {ingestTab === "file" && (
        <div className="ingest-file-section">
          <label className="ingest-file-label">
            <input
              type="file"
              accept=".json,.txt"
              className="ingest-file-input"
              onChange={handleFileUpload}
            />
            <span className="ingest-file-cta">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              Choose .json or .txt file
            </span>
          </label>
        </div>
      )}

      {ingestMsg && (
        <div className={`ingest-msg ${ingestMsg.type === "error" ? "ingest-msg-error" : "ingest-msg-success"}`}>
          {ingestMsg.text}
        </div>
      )}
    </div>
  )
}

export default IngestPanel
