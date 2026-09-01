import { useEffect } from "react"
import { useAlertStore } from "./store/useAlertStore.js"
import { generateAlerts } from "./utils/mockAlerts.js"
import Dashboard from "./components/Dashboard.jsx"

function App() {
  const loadAlerts = useAlertStore((s) => s.loadAlerts)
  const initTheme = useAlertStore((s) => s.initTheme)

  useEffect(() => {
    loadAlerts(generateAlerts(100))
    initTheme()
  }, [loadAlerts, initTheme])

  return <Dashboard />
}

export default App
