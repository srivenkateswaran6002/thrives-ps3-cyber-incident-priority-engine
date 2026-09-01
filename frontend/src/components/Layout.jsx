import { useEffect, useState, useRef } from "react"
import { useAlertStore } from "../store/useAlertStore.js"
import ThemeToggle from "./ThemeToggle.jsx"
import IngestPage from "./IngestPage.jsx"
import QueuePage from "./QueuePage.jsx"
import AnalyticsPage from "./AnalyticsPage.jsx"
import SolutionPage from "./SolutionPage.jsx"
import "./Layout.css"

const NAV_ITEMS = [
  { id: "solution", label: "Overview", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { id: "ingest", label: "Data Ingest", icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" },
  { id: "queue", label: "Priority Queue", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
  { id: "analytics", label: "Analytics", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
]

function NavIcon({ d }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

function ScoringBanner() {
  const scoringMode = useAlertStore((s) => s.scoringMode)
  const backendStatus = useAlertStore((s) => s.backendStatus)
  const rawAlerts = useAlertStore((s) => s.rawAlerts)
  
  const [isVisible, setIsVisible] = useState(true)
  const timerRef = useRef(null)

  // Auto-hide logic
  useEffect(() => {
    setIsVisible(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    
    // Only auto-hide if it's connected (don't auto hide warnings/errors)
    if (backendStatus === "connected" || scoringMode === "ml") {
      timerRef.current = setTimeout(() => {
        setIsVisible(false)
      }, 4000)
    }
    
    return () => clearTimeout(timerRef.current)
  }, [scoringMode, backendStatus, rawAlerts.length])

  if (!isVisible) return null

  const renderContent = () => {
    if (backendStatus === "checking") {
      return (
        <div className="banner banner-info">
          <div className="banner-content">
            <span className="banner-dot" /> Connecting to ML Backend…
          </div>
        </div>
      )
    }
    
    if (rawAlerts.length === 0) {
      if (backendStatus === "connected") {
        return (
          <div className="banner banner-success">
            <div className="banner-content">
              <span className="banner-icon">✓</span> ML Backend Connected — GradientBoosting model ready
            </div>
            <button className="banner-close" onClick={() => setIsVisible(false)}>✕</button>
          </div>
        )
      }
      return (
        <div className="banner banner-warn">
          <div className="banner-content">
            <span className="banner-icon">⚠</span> Backend Unreachable — Will use local weighted fallback scoring
          </div>
          <button className="banner-close" onClick={() => setIsVisible(false)}>✕</button>
        </div>
      )
    }

    if (scoringMode === "ml") {
      return (
        <div className="banner banner-success">
          <div className="banner-content">
            <span className="banner-icon">✓</span> ML Backend Connected — GradientBoosting model scoring live
          </div>
          <button className="banner-close" onClick={() => setIsVisible(false)}>✕</button>
        </div>
      )
    }
    if (scoringMode === "loading") {
      return (
        <div className="banner banner-info">
          <div className="banner-content">
            <span className="banner-icon">⟳</span> Scoring alerts with ML model…
          </div>
        </div>
      )
    }
    return (
      <div className="banner banner-warn">
        <div className="banner-content">
          <span className="banner-icon">⚠</span> Backend Unreachable — Using local fallback scoring
        </div>
        <button className="banner-close" onClick={() => setIsVisible(false)}>✕</button>
      </div>
    )
  }

  return renderContent()
}

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-card">
        <div className="loading-spinner" />
        <div className="loading-title">Cyber Incident Priority Engine</div>
        <div className="loading-sub">Connecting to ML Backend…</div>
      </div>
    </div>
  )
}

const PAGES = { solution: SolutionPage, ingest: IngestPage, queue: QueuePage, analytics: AnalyticsPage }

function Layout() {
  const currentPage = useAlertStore((s) => s.currentPage)
  const setPage = useAlertStore((s) => s.setPage)
  const backendStatus = useAlertStore((s) => s.backendStatus)
  const alerts = useAlertStore((s) => s.alerts)

  if (backendStatus === "checking") return <LoadingScreen />

  const Page = PAGES[currentPage] || SolutionPage

  return (
    <div className="app-shell">
      <ScoringBanner />
      <nav className="topnav">
        <div className="topnav-left">
          <span className="topnav-logo">⛨</span>
          <span className="topnav-brand">CIPE</span>
          <span className="topnav-sep" />
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`topnav-link ${currentPage === item.id ? "topnav-link-active" : ""}`}
              onClick={() => setPage(item.id)}
            >
              <NavIcon d={item.icon} />
              {item.label}
              {item.id === "queue" && alerts.length > 0 && (
                <span className="topnav-badge">{alerts.length}</span>
              )}
            </button>
          ))}
        </div>
        <div className="topnav-right">
          <ThemeToggle />
        </div>
      </nav>
      <main className="page-content">
        <Page />
      </main>
    </div>
  )
}

export default Layout
