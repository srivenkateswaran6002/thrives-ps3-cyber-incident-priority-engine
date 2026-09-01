const TYPES = [
  { id: "brute-force", label: "Brute Force", weight: 22 },
  { id: "malware", label: "Malware", weight: 18 },
  { id: "phishing", label: "Phishing", weight: 18 },
  { id: "port-scan", label: "Port Scan", weight: 16 },
  { id: "failed-login", label: "Failed Login", weight: 16 },
  { id: "data-exfiltration", label: "Data Exfiltration", weight: 10 },
]

export const ALERT_TYPES = TYPES.map((t) => t.id)

function pickType() {
  const total = TYPES.reduce((s, t) => s + t.weight, 0)
  let r = Math.random() * total
  for (const t of TYPES) {
    r -= t.weight
    if (r <= 0) return t
  }
  return TYPES[0]
}

function rand(a, b) {
  return Math.round(a + Math.random() * (b - a))
}

function randf(a, b, decimals = 2) {
  return parseFloat((a + Math.random() * (b - a)).toFixed(decimals))
}

const LAST_MONTH = Date.now() - 30 * 24 * 60 * 60 * 1000
function randomTimestamp() {
  const t = LAST_MONTH + Math.random() * (Date.now() - LAST_MONTH)
  return new Date(t).toISOString()
}

function typeProfile(typeId) {
  switch (typeId) {
    case "brute-force":
      return {
        severity: rand(3, 8),
        assetImportance: rand(4, 9),
        affectedUsers: rand(50, 2000),
        dataSensitivity: rand(2, 6),
        attackConfidence: randf(0.6, 0.95),
        businessImpact: rand(3, 7),
      }
    case "malware":
      return {
        severity: rand(5, 10),
        assetImportance: rand(3, 9),
        affectedUsers: rand(10, 500),
        dataSensitivity: rand(4, 9),
        attackConfidence: randf(0.5, 0.9),
        businessImpact: rand(5, 9),
      }
    case "phishing":
      return {
        severity: rand(3, 7),
        assetImportance: rand(2, 6),
        affectedUsers: rand(100, 5000),
        dataSensitivity: rand(3, 8),
        attackConfidence: randf(0.4, 0.8),
        businessImpact: rand(4, 8),
      }
    case "port-scan":
      return {
        severity: rand(1, 5),
        assetImportance: rand(2, 7),
        affectedUsers: rand(5, 200),
        dataSensitivity: rand(1, 4),
        attackConfidence: randf(0.3, 0.7),
        businessImpact: rand(1, 4),
      }
    case "failed-login":
      return {
        severity: rand(1, 6),
        assetImportance: rand(2, 8),
        affectedUsers: rand(20, 1500),
        dataSensitivity: rand(1, 5),
        attackConfidence: randf(0.35, 0.8),
        businessImpact: rand(2, 6),
      }
    case "data-exfiltration":
      return {
        severity: rand(7, 10),
        assetImportance: rand(6, 10),
        affectedUsers: rand(1000, 10000),
        dataSensitivity: rand(8, 10),
        attackConfidence: randf(0.7, 0.97),
        businessImpact: rand(8, 10),
      }
    default:
      return {
        severity: rand(1, 10),
        assetImportance: rand(1, 10),
        affectedUsers: rand(1, 5000),
        dataSensitivity: rand(1, 10),
        attackConfidence: randf(0, 1),
        businessImpact: rand(1, 10),
      }
  }
}

let idCounter = 1

function buildAlert() {
  const type = pickType()
  const factors = typeProfile(type.id)
  const id = `ALT-${String(idCounter).padStart(4, "0")}`
  idCounter += 1
  return {
    id,
    type: type.label,
    typeId: type.id,
    timestamp: randomTimestamp(),
    status: "new",
    factors,
    score: 0,
    breakdown: {},
  }
}

export function generateAlerts(count = 100) {
  const alerts = []
  for (let i = 0; i < count; i++) {
    alerts.push(buildAlert())
  }
  return alerts
}

export function dripAlert() {
  return buildAlert()
}
