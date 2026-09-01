import { useAlertStore } from "../store/useAlertStore.js"
import ThemeToggle from "./ThemeToggle.jsx"
import QueueTable from "./QueueTable.jsx"
import IncidentDrawer from "./IncidentDrawer.jsx"
import ComparisonView from "./ComparisonView.jsx"
import PolicyAdjustments from "./PolicyAdjustments.jsx"
import IngestPanel from "./IngestPanel.jsx"
import FilterBar from "./FilterBar.jsx"
import RankingHeadline from "./RankingHeadline.jsx"
import "./Dashboard.css"

function ScoringModeBanner() {
  const scoringMode = useAlertStore((s) => s.scoringMode)
  const backendStatus = useAlertStore((s) => s.backendStatus)

  if (backendStatus === "checking") {
    return (
      <div className="scoring-banner scoring-banner-loading">
        <span className="scoring-banner-dot" />
        <span>Connecting to ML Backend…</span>
      </div>
    )
  }

  if (scoringMode === "ml") {
    return (
      <div className="scoring-banner scoring-banner-ml">
        <span className="scoring-banner-icon">✓</span>
        <span>ML Backend Connected — GradientBoosting model scoring live</span>
      </div>
    )
  }

  if (scoringMode === "loading") {
    return (
      <div className="scoring-banner scoring-banner-loading">
        <span className="scoring-banner-dot" />
        <span>Scoring alerts with ML model…</span>
      </div>
    )
  }

  return (
    <div className="scoring-banner scoring-banner-fallback">
      <span className="scoring-banner-icon">⚠</span>
      <span>Backend Unreachable — Using local weighted fallback scoring</span>
    </div>
  )
}

function LoadingOverlay() {
  const backendStatus = useAlertStore((s) => s.backendStatus)
  if (backendStatus !== "checking") return null

  return (
    <div className="loading-overlay">
      <div className="loading-card">
        <div className="loading-spinner" />
        <div className="loading-title">Cyber Incident Priority Engine</div>
        <div className="loading-subtitle">Connecting to ML Backend…</div>
      </div>
    </div>
  )
}

function Dashboard() {
  const alerts = useAlertStore((s) => s.alerts)
  const backendStatus = useAlertStore((s) => s.backendStatus)

  return (
    <>
      <LoadingOverlay />
      <div className={`dashboard ${backendStatus === "checking" ? "dashboard-hidden" : ""}`}>
        <aside className="dashboard-sidebar">
          <IngestPanel />
          <PolicyAdjustments />
        </aside>

        <main className="dashboard-main">
          <ScoringModeBanner />
          <header className="header">
            <div className="header-title">
              <h1>Cyber Incident Priority Engine</h1>
              <span className="header-subtitle">PS-03 · Live-ranked incident queue</span>
            </div>
            <div className="header-right">
              <span className="alert-count-badge">{alerts.length} alerts</span>
              <ThemeToggle />
            </div>
          </header>

          <div className="dashboard-body">
            <section className="dashboard-content">
              <FilterBar />
              <RankingHeadline />
              <QueueTable />
              <ComparisonView />
            </section>

            <aside className="dashboard-right">
              <IncidentDrawer />
            </aside>
          </div>
        </main>
      </div>
    </>
  )
}

export default Dashboard
