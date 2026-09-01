import { useAlertStore } from "../store/useAlertStore.js"
import "./PolicyAdjustments.css"

const POLICIES = [
  { key: "complianceBoost", label: "Compliance Priority", desc: "+20% when data sensitivity > 7" },
  { key: "availabilityBoost", label: "Availability Priority", desc: "+20% when business impact > 7" },
  { key: "highConfidenceOnly", label: "High-Confidence Only", desc: "Demote alerts with confidence < 30%" },
]

function PolicyAdjustments() {
  const policyAdjustments = useAlertStore((s) => s.policyAdjustments)
  const togglePolicy = useAlertStore((s) => s.togglePolicy)

  return (
    <div className="card p-4">
      <div className="section-title">Policy Adjustments</div>
      <p className="text-xs text-muted mb-4">Temporarily adjust scoring based on current organizational priorities.</p>

      <div className="flex flex-col gap-3">
        {POLICIES.map((p) => {
          const on = policyAdjustments[p.key]
          return (
            <div key={p.key} className="policy-row">
              <div className="flex-1">
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
      </div>
    </div>
  )
}

export default PolicyAdjustments
