from typing import Literal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Sports Predictor API (Mock)", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    points_diff: float = Field(..., description="Rolling points diff (team minus opponent)")
    team_reb_roll: float = Field(..., description="Team rolling rebounds average")
    opponent_reb_roll: float = Field(..., description="Opponent rolling rebounds average")
    team_ast_roll: float = Field(..., description="Team rolling assists average")
    opponent_ast_roll: float = Field(..., description="Opponent rolling assists average")
    home: int = Field(..., ge=0, le=1, description="1 if home game, 0 if away")


class PredictResponse(BaseModel):
    probability: float = Field(..., ge=0.0, le=1.0)
    label: Literal["Good Bet", "Slight Edge", "Avoid"]
    source: Literal["mock"]


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "mode": "mock",
    }


def evaluate_bet(probability: float) -> Literal["Good Bet", "Slight Edge", "Avoid"]:
    if probability > 0.60:
        return "Good Bet"
    if probability > 0.52:
        return "Slight Edge"
    return "Avoid"


def mock_probability(payload: PredictRequest) -> float:
    # Simple heuristic-only mock model; keeps response deterministic for UI work.
    base = 0.50
    base += 0.015 * payload.points_diff
    base += 0.010 * (payload.team_reb_roll - payload.opponent_reb_roll)
    base += 0.010 * (payload.team_ast_roll - payload.opponent_ast_roll)
    base += 0.020 * payload.home
    return max(0.01, min(0.99, base))


@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest) -> PredictResponse:
    probability = mock_probability(request)
    label = evaluate_bet(probability)
    return PredictResponse(probability=probability, label=label, source="mock")
