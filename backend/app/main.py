"""FastAPI application exposing the ML scoring service."""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import model
from app.schemas import ModelInfoResponse, ScoreBatchRequest, ScoreBatchResponse, JustifyRequest, JustifyResponse
from app.groq_client import generate_justification

app = FastAPI(title="Cyber Incident Priority Engine - ML Scoring")

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    os.environ.get("FRONTEND_ORIGIN", "https://your-vercel-app.vercel.app"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/model-info", response_model=ModelInfoResponse)
def model_info():
    importance = model.get_feature_importance()
    return {
        "featureImportance": importance,
        "modelType": "GradientBoosting",
        "validationMAE": 3.96,
    }


@app.post("/api/score", response_model=ScoreBatchResponse)
def score_batch(req: ScoreBatchRequest):
    scored, importance = model.predict_batch(req.alerts)
    return ScoreBatchResponse(alerts=scored, modelFeatureImportance=importance)


@app.post("/api/justify", response_model=JustifyResponse)
async def justify(req: JustifyRequest):
    justification = await generate_justification(req.model_dump())
    return JustifyResponse(id=req.id, justification=justification)
