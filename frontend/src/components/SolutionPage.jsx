import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useAlertStore } from "../store/useAlertStore.js"
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts"
import "./SolutionPage.css"

const MOCK_RADAR = [
  { factor: "Severity", value: 90 },
  { factor: "Asset Imp.", value: 100 },
  { factor: "Users", value: 40 },
  { factor: "Data Sens.", value: 85 },
  { factor: "Confidence", value: 70 },
  { factor: "Biz Impact", value: 95 },
]

function HeroAnimation() {
  const [isSorted, setIsSorted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsSorted(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  // 40 nodes
  const nodes = Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    randX: Math.random() * 80 + 10, // 10% to 90%
    randY: Math.random() * 80 + 10,
    randSize: Math.random() * 8 + 4,
  }))

  return (
    <div className="hero-visual">
      {nodes.map((node, i) => {
        const sortedY = 15 + (i * 70) / 40 // Distribute down the container
        const sortedWidth = 100 - i * 2 // Narrower as we go down
        const isTop = i < 5
        const color = isTop ? "var(--ember)" : i < 15 ? "var(--queue-mid)" : "var(--ash)"

        return (
          <motion.div
            key={node.id}
            layout
            transition={{ type: "spring", stiffness: 40, damping: 12, mass: 1 }}
            style={{
              position: "absolute",
              background: isSorted ? color : "var(--scatter-dot)",
            }}
            initial={false}
            animate={
              isSorted
                ? {
                    left: "50%",
                    top: `${sortedY}%`,
                    width: `${sortedWidth}%`,
                    x: "-50%",
                    height: 4,
                    borderRadius: 0,
                  }
                : {
                    left: `${node.randX}%`,
                    top: `${node.randY}%`,
                    width: node.randSize,
                    height: node.randSize,
                    x: 0,
                    borderRadius: "50%",
                  }
            }
          />
        )
      })}
    </div>
  )
}

function SolutionPage() {
  const setPage = useAlertStore((s) => s.setPage)

  return (
    <div className="solution-theme">
      <div className="sol-container">
        
        {/* HERO */}
        <section>
          <HeroAnimation />
          <div className="hero-content">
            <h1 className="hero-h1 font-display">
              Every alert looks urgent. Only one of them isn't noise.
            </h1>
            <p className="hero-sub font-body">
              A prioritization engine that scores, ranks, and explains SOC incidents — so analysts see the real threat first, not the loudest one.
            </p>
            <div className="hero-actions">
              <button className="btn-ember" onClick={() => setPage("queue")}>
                View live queue
              </button>
              <a className="link-ash" href="#approach">
                Read the approach
              </a>
            </div>
          </div>
        </section>

        {/* THE PROBLEM */}
        <section id="approach" className="split-55-45">
          <div className="sol-col-text prose-width">
            <h2 className="sol-h2 font-display">Signal vs. Noise</h2>
            <p className="sol-p">
              A shift gets hundreds of alerts. A brute-force spike is loud, a slow data exfiltration on a crown-jewel asset is quiet, and flat queues rank them the same way.
            </p>
            <p className="sol-p">
              Treating every alert equally results in missed critical threats. The cost is analyst fatigue and breached networks.
            </p>
          </div>
          <div className="sol-col-visual noise-visual">
            <div className="noise-row">
              <span className="noise-label font-body">Flat queue (default)</span>
              <div className="noise-list">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="noise-item">
                    <div className="noise-item-bar" style={{ width: "100%" }} />
                  </div>
                ))}
              </div>
            </div>
            <div className="noise-arrow">↓</div>
            <div className="noise-row">
              <span className="noise-label font-body">Ranked by engine</span>
              <div className="noise-list">
                {[1, 2, 3, 4, 5, 6].map((i) => {
                  const isTop = i === 1
                  return (
                    <div key={i} className="noise-item">
                      <div
                        className="noise-item-bar"
                        style={{
                          width: `${100 - i * 12}%`,
                          background: isTop ? "var(--ember)" : "var(--ash)",
                          opacity: isTop ? 1 : 1 - i * 0.1,
                        }}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="split-45-55">
          <div className="sol-col-visual">
            <div className="arch-diagram">
              <div className="arch-pipeline">
                <div className="arch-node">
                  <div className="arch-num font-data">1</div>
                  <div className="arch-label font-body">Ingest</div>
                </div>
                <div className="arch-node">
                  <div className="arch-num font-data">2</div>
                  <div className="arch-label font-body">
                    Normalize <span className="arch-label-sub">(log-scale + weights)</span>
                  </div>
                </div>
                <div className="arch-node">
                  <div className="arch-num font-data">3</div>
                  <div className="arch-label font-body">
                    Score <span className="arch-label-sub">(GradientBoosting, FastAPI)</span>
                  </div>
                </div>
                <div className="arch-node">
                  <div className="arch-num font-data">4</div>
                  <div className="arch-label font-body">
                    Justify <span className="arch-label-sub">(Groq · llama-3.3-70b)</span>
                  </div>
                </div>
                <div className="arch-node">
                  <div className="arch-num font-data">5</div>
                  <div className="arch-label font-body">Sorted Queue</div>
                </div>
              </div>
              <div className="arch-fallback font-body">
                If the ML backend is unreachable → local deterministic scorer takes over instantly
              </div>
            </div>
          </div>
          <div className="sol-col-text prose-width">
            <h2 className="sol-h2 font-display">Architecture</h2>
            <p className="sol-p">
              We normalize wildly different scales — thousands of affected users versus an 8-point severity score. A learned model beats a hardcoded formula because it maps the non-linear relationships between these features to output a single, trustworthy priority metric.
            </p>
          </div>
        </section>

        {/* THE QUEUE */}
        <section>
          <div className="mockup-wrap">
            <div className="mockup-table">
              {[
                { type: "Data Exfiltration", score: 98, cls: "mock-color-1" },
                { type: "Malware Detection", score: 87, cls: "mock-color-2" },
                { type: "Brute Force", score: 71, cls: "mock-color-3" },
                { type: "Suspicious Email", score: 45, cls: "mock-color-4" },
                { type: "Failed Login", score: 22, cls: "mock-color-5" },
              ].map((row, i) => (
                <div key={i} className="mockup-row">
                  <div className={row.cls} style={{ height: "100%" }} />
                  <div className="mock-score font-data">{row.score}</div>
                  <div className="mock-type font-body">{row.type}</div>
                  <div className="font-data" style={{ fontSize: 11, color: "var(--ash)", textAlign: "right" }}>
                    T-{(i + 1) * 12}M
                  </div>
                </div>
              ))}
            </div>
            <div className="mock-caption font-body">
              Click Start Live Stream to watch the queue re-sort as new incidents arrive.
            </div>
          </div>
        </section>

        {/* WHY TRUST IT */}
        <section className="split-45-55">
          <div className="sol-col-visual">
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <RadarChart data={MOCK_RADAR} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                  <PolarGrid stroke="var(--divider)" />
                  <PolarAngleAxis dataKey="factor" tick={{ fill: "var(--ash)", fontSize: 11 }} />
                  <Radar
                    dataKey="value"
                    stroke="var(--ember)"
                    fill="var(--ember)"
                    fillOpacity={0.15}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="sol-col-text prose-width">
            <p className="sol-p" style={{ marginBottom: 24 }}>
              An analyst won't act on a number they don't understand, so the model's own feature weights are turned into plain language, not a black box.
            </p>
            <div className="justification-terminal">
              <div className="term-label">SCORE</div>
              <div className="term-score font-data">98%</div>
              <div className="term-label">AI JUSTIFICATION</div>
              <div className="term-text font-body">
                Ranked #1 driven by high Asset Importance (100%) and Business Impact (95%).
              </div>
            </div>
          </div>
        </section>

        {/* LIVE POLICY OVERRIDES */}
        <section className="policy-strip">
          <div className="prose-width">
            <p className="sol-p" style={{ margin: 0, color: "var(--fog)" }}>
              A manager can temporarily boost alerts tied to sensitive data without retraining anything.
            </p>
          </div>
          <div className="policy-toggle">
            <span className="toggle-label font-body">Compliance Priority</span>
            <div className="toggle-switch" />
          </div>
        </section>

        {/* ENGINEERING HONESTY */}
        <section className="prose-width">
          <h2 className="sol-h2 font-display">Tradeoffs</h2>
          <div className="tradeoff-block font-body">
            <p className="sol-p" style={{ margin: 0 }}>
              Known limitation: the ML backend runs on Render's free tier, which sleeps after inactivity — the first score after a cold start can take up to ~20–30 seconds. The frontend's local fallback scorer keeps the queue usable in the meantime, and we're moving the backend to an always-on low-cost tier post-hackathon.
            </p>
          </div>
        </section>

        {/* STACK */}
        <section className="stack-strip">
          <div className="stack-label font-body">Built with</div>
          <div className="stack-logos font-display">
            <span className="stack-item">React</span>
            <span className="stack-item">Vite</span>
            <span className="stack-item">FastAPI</span>
            <span className="stack-item">Scikit-Learn</span>
            <span className="stack-item">Groq</span>
            <span className="stack-item">Vercel</span>
            <span className="stack-item">Render</span>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="sol-footer">
          <div className="footer-actions">
            <button className="btn-ember" onClick={() => setPage("queue")}>
              View live queue
            </button>
            <a
              className="link-ash font-body"
              href="https://github.com/srivenkateswaran6002/thrives-ps3-cyber-incident-priority-engine"
              target="_blank"
              rel="noreferrer"
            >
              View source
            </a>
          </div>
          <div className="footer-micro font-body">
            First load may take a few seconds while the engine wakes up.
          </div>
        </footer>

      </div>
    </div>
  )
}

export default SolutionPage
