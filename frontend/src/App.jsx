import { useEffect } from "react"
import { useAlertStore } from "./store/useAlertStore.js"
import Layout from "./components/Layout.jsx"

function App() {
  const checkBackend = useAlertStore((s) => s.checkBackend)
  const initTheme = useAlertStore((s) => s.initTheme)

  useEffect(() => {
    initTheme()
    checkBackend()
  }, [initTheme, checkBackend])

  return <Layout />
}

export default App
