# Cyber Incident Prioritization Engine

**PS-03 · Transforming SOC noise into actionable intelligence**

![React](https://img.shields.io/badge/React-Vite-149eca) ![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688) ![scikit--learn](https://img.shields.io/badge/scikit--learn-GradientBoosting-f7931e) ![Groq](https://img.shields.io/badge/Groq-llama--3.3--70b-orange) ![License](https://img.shields.io/badge/license-MIT-lightgrey)

[**Live demo**](https://frontend-ashy-ten-12.vercel.app) · [Jump to setup](#getting-started)

> First request after a period of inactivity can take ~20–30s while the free-tier backend wakes up — see [Known Limitations](#known-limitations).

---

## The problem

A SOC analyst on a busy shift sees hundreds of alerts. Treated as a flat list, the loudest one wins attention — usually a brute-force spike or a scan. The alert that actually matters, like slow data exfiltration from a high-value asset, sits somewhere in the middle, indistinguishable from the noise around it.

This project re-ranks incidents by a learned, explainable priority score instead of raw alert volume or a fixed rule table, so the top of the queue is the incident worth acting on first.

## How it works

```
Ingest ──▶ Normalize ──▶ Score ──▶ Justify ──▶ Sorted Queue
              │             │
              │             └── GradientBoosting model (FastAPI)
              │
              └── if backend unreachable ──▶ local deterministic
                                              scorer (frontend)
                                                    │
                                                    ▼
                                              Sorted Queue
```

1. **Ingest** — incidents arrive with six risk factors on very different scales (e.g. affected-user count vs. an 8-point severity rating).
2. **Normalize** — features are put on a comparable footing; the frontend fallback path applies log-scaling here for large counts.
3. **Score** — a `GradientBoostingClassifier`/`Regressor` served over FastAPI learns the non-linear relationships between the six factors and outputs a 0–100 priority score. If the backend is unreachable, a local deterministic scorer with hand-set weights takes over instantly so the queue never goes empty.
4. **Justify** — for each ranked incident, Groq (`llama-3.3-70b-versatile`) reads the model's own feature-weight breakdown and produces a one- or two-sentence plain-language explanation of why it ranked where it did.
5. **Sorted Queue** — the frontend renders the ranked list, re-sorting live as new incidents stream in.

## Features

- **Live incident streaming** — a simulated feed of incidents drips into the queue and the ranking updates in real time, with visible tie-breaking.
- **Side-by-side comparison** — Shift+Click two incidents to open a radar-chart comparison of their six risk factors.
- **Policy overrides** — toggle profiles like *Compliance Priority* to temporarily boost alerts tied to sensitive data, without retraining the model.
- **Graceful degradation** — the ranking never depends on the ML backend being up; the fallback path is exercised automatically, not just on paper.

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React, Vite, Zustand, Tailwind CSS, TanStack Table, Recharts |
| Backend | Python, FastAPI, scikit-learn (GradientBoosting), Uvicorn |
| AI | Groq API — `llama-3.3-70b-versatile` for justification text |
| Deployment | Vercel (frontend), Render (backend) |

## Getting started

### Prerequisites
- Node.js 18+
- Python 3.10+
- A [Groq API key](https://console.groq.com)

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# create .env
echo "GROQ_API_KEY=your_key_here" > .env

uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install

# create .env.local
echo "VITE_API_BASE_URL=http://localhost:8000" > .env.local

npm run dev
```

The app runs at `http://localhost:5173` and expects the backend at the URL in `VITE_API_BASE_URL`. If that endpoint is unreachable, the UI falls back to the local scorer automatically — no config needed to see that path in action.

> Adjust script names, ports, and env var keys above to match your actual project layout if they differ.

## Project structure

```
.
├── frontend/
│   ├── src/
│   │   ├── components/     # queue table, comparison panel, radar chart
│   │   ├── lib/             # local deterministic scorer (fallback engine)
│   │   └── store/           # Zustand state
│   └── package.json
├── backend/
│   ├── main.py               # FastAPI app + scoring endpoint
│   ├── model/                 # trained GradientBoosting model
│   └── requirements.txt
└── README.md
```

## Known limitations

- **Cold start on Render's free tier.** The backend sleeps after inactivity; the first scoring request afterward can take ~20–30 seconds. The frontend's local fallback scorer keeps the queue usable during that window. Planned fix: a scheduled keep-alive ping during demo windows, and a move to an always-on low-cost tier after the hackathon.
- Model is trained on synthetic/sample incident data, not production SOC telemetry.

## Team

- _Add names, roles, and links here._

## License

MIT — see [LICENSE](LICENSE).
