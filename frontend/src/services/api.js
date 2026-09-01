const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function checkHealth() {
  if (!API_BASE_URL) return false
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(`${API_BASE_URL}/api/health`, { signal: controller.signal })
    clearTimeout(timeout)
    return res.ok
  } catch {
    return false
  }
}

export async function scoreAlertsRemote(alerts) {
  if (!API_BASE_URL) throw new Error("VITE_API_BASE_URL is not configured")
  const res = await fetch(`${API_BASE_URL}/api/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ alerts }),
  })
  if (!res.ok) throw new Error(`Backend scoring failed: ${res.status}`)
  return res.json()
}

export async function getModelInfo() {
  if (!API_BASE_URL) throw new Error("VITE_API_BASE_URL is not configured")
  const res = await fetch(`${API_BASE_URL}/api/model-info`)
  if (!res.ok) throw new Error(`Failed to fetch model info: ${res.status}`)
  return res.json()
}

export async function fetchJustification(alertData) {
  if (!API_BASE_URL) throw new Error("VITE_API_BASE_URL is not configured")
  const res = await fetch(`${API_BASE_URL}/api/justify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(alertData),
  })
  if (!res.ok) throw new Error(`Justification failed: ${res.status}`)
  const data = await res.json()
  return data.justification
}
