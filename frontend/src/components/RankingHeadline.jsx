import { useAlertStore } from "../store/useAlertStore.js"
import { FACTOR_LABELS } from "../utils/normalize.js"
import "./RankingHeadline.css"

function RankingHeadline() {
  const scoringMode = useAlertStore((s) => s.scoringMode)
  const modelFeatureImportance = useAlertStore((s) => s.modelFeatureImportance)
  const weights = useAlertStore((s) => s.weights)
  const alerts = useAlertStore((s) => s.alerts)

  if (alerts.length === 0) return null

  const importance =
    scoringMode === "ml" && Object.keys(modelFeatureImportance).length > 0
      ? modelFeatureImportance
      : weights

  const sorted = Object.entries(importance)
    .filter(([key]) => FACTOR_LABELS[key])
    .sort(([, a], [, b]) => b - a)

  const headline = sorted
    .map(([key]) => FACTOR_LABELS[key].toLowerCase())
    .join(" → ")

  const source = scoringMode === "ml" ? "ML feature importances" : "local weight config"

  return (
    <div className="ranking-headline">
      <span className="ranking-headline-label">Ranked by</span>
      <span className="ranking-headline-factors">{headline}</span>
      <span className="ranking-headline-source">({source})</span>
    </div>
  )
}

export default RankingHeadline
