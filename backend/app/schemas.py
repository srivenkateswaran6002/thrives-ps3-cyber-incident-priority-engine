"""Pydantic request/response models for the scoring API."""

from pydantic import BaseModel


class Factors(BaseModel):
    severity: float
    assetImportance: float
    affectedUsers: float
    dataSensitivity: float
    attackConfidence: float
    businessImpact: float


class AlertIn(BaseModel):
    id: str
    type: str
    typeId: str | None = None
    timestamp: str
    status: str
    factors: Factors


class ScoreBatchRequest(BaseModel):
    alerts: list[AlertIn]


class AlertOut(AlertIn):
    pass


class ScoredAlert(AlertOut):
    score: float
    breakdown: dict[str, dict[str, float]]


class ScoreBatchResponse(BaseModel):
    alerts: list[ScoredAlert]
    modelFeatureImportance: dict[str, float]


class ModelInfoResponse(BaseModel):
    featureImportance: dict[str, float]
    modelType: str
    validationMAE: float
