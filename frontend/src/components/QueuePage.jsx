import { useAlertStore } from "../store/useAlertStore.js"
import FilterBar from "./FilterBar.jsx"
import RankingHeadline from "./RankingHeadline.jsx"
import QueueTable from "./QueueTable.jsx"
import ComparisonView from "./ComparisonView.jsx"
import IncidentDrawer from "./IncidentDrawer.jsx"
import PolicyAdjustments from "./PolicyAdjustments.jsx"
import "./QueuePage.css"

function QueuePage() {
  const alerts = useAlertStore((s) => s.alerts)
  const selectedAlertId = useAlertStore((s) => s.selectedAlertId)
  const setPage = useAlertStore((s) => s.setPage)

  if (alerts.length === 0) {
    return (
      <div className="queue-empty-page">
        <div className="queue-empty-card">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)", opacity: 0.5 }}>
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h2 className="queue-empty-title">Queue is Empty</h2>
          <p className="queue-empty-desc">Load incident data first to populate the priority queue.</p>
          <button type="button" className="btn btn-primary" onClick={() => setPage("ingest")}>
            Go to Data Ingest
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="queue-page">
      <aside className="queue-sidebar">
        <PolicyAdjustments />
      </aside>
      <div className="queue-main">
        <FilterBar />
        <RankingHeadline />
        <QueueTable />
        <ComparisonView />
      </div>
      {selectedAlertId && (
        <aside className="queue-drawer">
          <IncidentDrawer />
        </aside>
      )}
    </div>
  )
}

export default QueuePage
