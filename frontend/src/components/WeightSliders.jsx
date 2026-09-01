import { useAlertStore } from "../store/useAlertStore.js"
import { FACTOR_KEYS, FACTOR_LABELS } from "../utils/normalize.js"
import "./WeightSliders.css"

const PRESET_LABELS = {
  default: "Default",
  compliance: "Compliance-heavy",
  availability: "Availability-focused",
}

function WeightSliders() {
  const weights = useAlertStore((s) => s.weights)
  const updateWeight = useAlertStore((s) => s.updateWeight)
  const activePreset = useAlertStore((s) => s.activePreset)
  const applyPreset = useAlertStore((s) => s.applyPreset)

  const total = FACTOR_KEYS.reduce((s, k) => s + weights[k], 0)

  return (
    <div className="panel">
      <div className="panel-title">Weights</div>

      <div className="preset-row">
        {Object.keys(PRESET_LABELS).map((name) => (
          <button
            key={name}
            type="button"
            className={`preset-btn ${activePreset === name ? "preset-btn-active" : ""}`}
            onClick={() => applyPreset(name)}
          >
            {PRESET_LABELS[name]}
          </button>
        ))}
      </div>

      <div style={{ height: 12 }} />

      {FACTOR_KEYS.map((key) => (
        <div key={key} className="weight-row">
          <div className="weight-label-row">
            <span className="weight-label">{FACTOR_LABELS[key]}</span>
            <span className="weight-value">{Math.round((weights[key] / total) * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="40"
            value={weights[key]}
            className="weight-slider"
            onChange={(e) => updateWeight(key, Number(e.target.value))}
          />
        </div>
      ))}
    </div>
  )
}

export default WeightSliders
