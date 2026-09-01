import { useAlertStore } from "../store/useAlertStore.js"
import "./PolicyAdjustments.css"

const POLICIES = [
  { key: "complianceBoost", label: "Compliance Priority", desc: "+20% when data sensitivity > 7" },
  { key: "availabilityBoost", label: "Availability Priority", desc: "+20% when business impact > 7" },
  { key: "highConfidenceOnly", label: "High-Confidence Only", desc: "Demote alerts with confidence < 30%" },
]

const MODE_TEXT = {
  ml: { cls: "mode-readout mode-ml", text: "Scoring engine: ML model (live)" },
  fallback: { cls: "mode-readout mode-fallback", text: "Scoring engine: Local fallback (backend unreachable)" },
  loading: { cls: "mode-readout mode-loading", text: "Scoring engine: Loading…" },
}

function PolicyAdjustments() {
  const policyAdjustments = useAlertStore((s) => s.policyAdjustments)
  const togglePolicy = useAlertStore((s) => s.togglePolicy)
  const scoringMode = useAlertStore((s) => s.scoringMode)

  const mode = MODE_TEXT[scoringMode] || MODE_TEXT.fallback

  return (
    <div className="panel">
      <div className="panel-title">Policy Adjustments</div>

      {POLICIES.map((p) => {
        const on = policyAdjustments[p.key]
        return (
          <div key={p.key} className="policy-row">
            <div>
              <div className="policy-label">{p.label}</div>
              <div className="policy-desc">{p.desc}</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={on}
              className={`policy-switch ${on ? "policy-switch-on" : ""}`}
              onClick={() => togglePolicy(p.key)}
            />
          </div>
        )
      })}

      <div className={mode.cls}>
        <span className="mode-dot" />
        {mode.text}
      </div>
    </div>
  )
}

export default PolicyAdjustments
