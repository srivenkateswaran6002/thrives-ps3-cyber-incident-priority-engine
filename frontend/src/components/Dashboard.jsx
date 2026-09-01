import { useAlertStore } from "../store/useAlertStore.js"
import ThemeToggle from "./ThemeToggle.jsx"
import QueueTable from "./QueueTable.jsx"
import IncidentDrawer from "./IncidentDrawer.jsx"
import ComparisonView from "./ComparisonView.jsx"
import WeightSliders from "./WeightSliders.jsx"
import IngestPanel from "./IngestPanel.jsx"
import "./Dashboard.css"

function Dashboard() {
  const alerts = useAlertStore((s) => s.alerts)

  return (
    <div className="dashboard">
      <aside className="dashboard-sidebar">
        <IngestPanel />
        <WeightSliders />
      </aside>

      <main className="dashboard-main">
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
            <QueueTable />
            <ComparisonView />
          </section>

          <aside className="dashboard-right">
            <IncidentDrawer />
          </aside>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
