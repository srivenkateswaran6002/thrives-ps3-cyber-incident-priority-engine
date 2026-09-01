import { useEffect, useRef, useState } from "react"
import { useAlertStore } from "../store/useAlertStore.js"
import { generateAlerts, dripAlert } from "../utils/mockAlerts.js"
import "./IngestPage.css"

const TYPE_COLORS = {
  "brute-force": "#ef4444",
  malware: "#f59e0b",
  phishing: "#3b82f6",
  "port-scan": "#8b5cf6",
  "failed-login": "#06b6d4",
  "data-exfiltration": "#ec4899",
}

function IngestPage() {
  const alerts = useAlertStore((s) => s.alerts)
  const loadAlerts = useAlertStore((s) => s.loadAlerts)
  const addAlert = useAlertStore((s) => s.addAlert)
  const isDripping = useAlertStore((s) => s.isDripping)
  const setDrip = useAlertStore((s) => s.setDrip)
  const loadAlertsFromJson = useAlertStore((s) => s.loadAlertsFromJson)
  const setPage = useAlertStore((s) => s.setPage)
  const backendStatus = useAlertStore((s) => s.backendStatus)
  const dripRef = useRef(null)

  const [jsonText, setJsonText] = useState("")
  const [ingestMsg, setIngestMsg] = useState(null)

  useEffect(() => {
    if (!isDripping) {
      clearInterval(dripRef.current)
      return
    }
    dripRef.current = setInterval(() => addAlert(dripAlert()), 800)
    return () => clearInterval(dripRef.current)
  }, [isDripping, addAlert])

  const counts = {}
  for (const a of alerts) counts[a.typeId] = (counts[a.typeId] || 0) + 1
  const typeList = Object.entries(counts).sort((x, y) => y[1] - x[1])
  const max = Math.max(1, ...typeList.map(([, c]) => c))

  const showMsg = (type, text) => {
    setIngestMsg({ type, text })
    setTimeout(() => setIngestMsg(null), 4000)
  }

  const handleJsonLoad = () => {
    if (!jsonText.trim()) return
    const result = loadAlertsFromJson(jsonText)
    if (result.ok) { showMsg("success", `Loaded ${result.count} alert(s)`); setJsonText("") }
    else showMsg("error", `Parse error: ${result.error}`)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const result = loadAlertsFromJson(evt.target.result)
      if (result.ok) showMsg("success", `Loaded ${result.count} alert(s) from ${file.name}`)
      else showMsg("error", `Parse error: ${result.error}`)
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  return (
    <div className="ingest-page">
      <div className="ingest-hero">
        <h1 className="ingest-hero-title">Data Ingest</h1>
        <p className="ingest-hero-desc">Load incident data to begin prioritization analysis</p>
      </div>

      <div className="ingest-grid">
        {/* Connection Status */}
        <div className="card-lg ingest-card">
          <div className="section-title">Connection Status</div>
          <div className={`conn-status ${backendStatus === "connected" ? "conn-ok" : "conn-fail"}`}>
            <span className="conn-dot" />
            {backendStatus === "connected"
              ? "ML Backend Connected"
              : "Backend Unreachable — Fallback Mode"}
          </div>
          <p className="conn-desc">
            {backendStatus === "connected"
              ? "Alerts will be scored using the trained GradientBoosting model via the backend API."
              : "Alerts will be scored using local weighted fallback. Start the backend to enable ML scoring."}
          </p>
        </div>

        {/* Demo Data */}
        <div className="card-lg ingest-card">
          <div className="section-title">Demo Data</div>
          <p className="ingest-card-desc">Generate synthetic incident data for demonstration purposes. Use the live stream to simulate a real-time SOC environment.</p>
          <div className="ingest-btn-row">
            <button type="button" className="btn btn-primary" onClick={() => loadAlerts(generateAlerts(100))}>
              Load Batch (100 alerts)
            </button>
            <button
              type="button"
              className={isDripping ? "btn btn-danger" : "btn btn-outline"}
              onClick={() => setDrip(!isDripping)}
            >
              {isDripping ? "⏹ Stop Live Stream" : "▶ Start Live Stream"}
            </button>
          </div>
          <p className="text-[11px] text-muted mt-3" style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "12px" }}>
            {isDripping ? "Streaming ~1 incident per second..." : "Live stream injects incidents continuously to test queue resorting."}
          </p>
        </div>

        {/* Paste JSON */}
        <div className="card-lg ingest-card">
          <div className="section-title">Paste JSON</div>
          <p className="ingest-card-desc">Paste an array of alert objects in JSON format.</p>
          <textarea
            className="ingest-textarea"
            placeholder={'[\n  {\n    "id": "ALT-0001",\n    "type": "Malware",\n    "factors": {\n      "severity": 8,\n      "assetImportance": 7,\n      "affectedUsers": 200,\n      "dataSensitivity": 9,\n      "attackConfidence": 0.85,\n      "businessImpact": 8\n    }\n  }\n]'}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={7}
          />
          <button type="button" className="btn btn-primary" style={{ marginTop: 8 }} onClick={handleJsonLoad}>
            Load JSON
          </button>
        </div>

        {/* Upload File */}
        <div className="card-lg ingest-card">
          <div className="section-title">Upload File</div>
          <p className="ingest-card-desc">Upload a .json or .txt file containing alert data.</p>
          <label className="file-drop">
            <input type="file" accept=".json,.txt" className="file-input" onChange={handleFileUpload} />
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            <span>Choose file or drag here</span>
          </label>
        </div>
      </div>

      {/* Feedback message */}
      {ingestMsg && (
        <div className={`ingest-toast ${ingestMsg.type === "error" ? "ingest-toast-error" : "ingest-toast-success"}`}>
          {ingestMsg.text}
        </div>
      )}

      {/* Current Data Summary */}
      {alerts.length > 0 && (
        <div className="card-lg ingest-summary">
          <div className="ingest-summary-header">
            <div>
              <div className="section-title" style={{ marginBottom: 4 }}>Loaded Data</div>
              <span className="ingest-summary-count">{alerts.length} alerts in queue</span>
            </div>
            <button type="button" className="btn btn-primary" onClick={() => setPage("queue")}>
              Go to Queue →
            </button>
          </div>
          <div className="type-bars">
            {typeList.map(([id, count]) => (
              <div key={id} className="type-bar-row">
                <span className="type-bar-name">{id.replace(/-/g, " ")}</span>
                <div className="type-bar-track">
                  <div className="type-bar-fill" style={{ width: `${(count / max) * 100}%`, background: TYPE_COLORS[id] || "var(--accent)" }} />
                </div>
                <span className="type-bar-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default IngestPage
