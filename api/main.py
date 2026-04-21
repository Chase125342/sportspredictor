import os
import pickle
import sqlite3
from typing import Literal

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASEDIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DBPATH = os.path.join(BASEDIR, "Data", "nba_stats.db")
MODELPATH = os.path.join(BASEDIR, "models", "nba_model.pkl")

app = FastAPI(title="Sports Predictor API", version="1.0.0")

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


class MatchupPredictRequest(BaseModel):
    team_1: str = Field(..., min_length=2, max_length=4, description="Team abbreviation for team 1")
    team_2: str = Field(..., min_length=2, max_length=4, description="Team abbreviation for team 2")
    home_team: int = Field(1, ge=0, le=1, description="1 if team_1 is home, 0 if away")


class PredictResponse(BaseModel):
    probability: float = Field(..., ge=0.0, le=1.0)
    label: Literal["Good Bet", "Slight Edge", "Avoid"]
    source: Literal["api-manual", "api-matchup"]


class MatchupPredictResponse(PredictResponse):
    team_1: str
    team_2: str
    features: dict


class TeamsResponse(BaseModel):
    teams: list[str]


_model = None


def evaluate_bet(probability: float) -> Literal["Good Bet", "Slight Edge", "Avoid"]:
    if probability > 0.60:
        return "Good Bet"
    if probability > 0.52:
        return "Slight Edge"
    return "Avoid"


def ensure_model_loaded():
    global _model
    if _model is None:
        if not os.path.exists(MODELPATH):
            raise HTTPException(
                status_code=503,
                detail=f"Model file not found at {MODELPATH}. Train model first.",
            )
        with open(MODELPATH, "rb") as model_file:
            _model = pickle.load(model_file)
    return _model


def ensure_database_available() -> None:
    if not os.path.exists(DBPATH):
        raise HTTPException(
            status_code=503,
            detail=f"Database not found at {DBPATH}. Populate data first.",
        )


def model_probability(features: dict) -> float:
    model = ensure_model_loaded()
    df = pd.DataFrame([features])
    probability = float(model.predict_proba(df)[0][1])
    return probability


def get_latest_team_stats(team: str) -> dict:
    ensure_database_available()
    conn = sqlite3.connect(DBPATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT team, team_points_roll, team_reb_roll, team_ast_roll
        FROM team_game_stats
        WHERE team = ?
        ORDER BY game_id DESC
        LIMIT 1
        """,
        (team,),
    )
    row = cursor.fetchone()
    conn.close()

    if row is None:
        raise HTTPException(status_code=404, detail=f"No team stats found for {team}")

    return dict(row)


def build_matchup_features(team1_stats: dict, team2_stats: dict, home_team: int) -> dict:
    return {
        "points_diff": float(team1_stats["team_points_roll"] - team2_stats["team_points_roll"]),
        "team_reb_roll": float(team1_stats["team_reb_roll"]),
        "opponent_reb_roll": float(team2_stats["team_reb_roll"]),
        "team_ast_roll": float(team1_stats["team_ast_roll"]),
        "opponent_ast_roll": float(team2_stats["team_ast_roll"]),
        "home": int(home_team),
    }


@app.get("/health")
def health() -> dict:
    has_model = os.path.exists(MODELPATH)
    has_db = os.path.exists(DBPATH)
    return {
        "status": "ok" if has_model and has_db else "degraded",
        "mode": "live-model",
        "model_ready": has_model,
        "database_ready": has_db,
    }


@app.get("/teams", response_model=TeamsResponse)
def list_teams() -> TeamsResponse:
    ensure_database_available()
    conn = sqlite3.connect(DBPATH)
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT team FROM team_game_stats ORDER BY team")
    teams = [row[0] for row in cursor.fetchall()]
    conn.close()
    return TeamsResponse(teams=teams)


@app.post("/predict", response_model=PredictResponse)
def predict_from_manual_features(request: PredictRequest) -> PredictResponse:
    features = {
        "points_diff": request.points_diff,
        "team_reb_roll": request.team_reb_roll,
        "opponent_reb_roll": request.opponent_reb_roll,
        "team_ast_roll": request.team_ast_roll,
        "opponent_ast_roll": request.opponent_ast_roll,
        "home": request.home,
    }
    probability = model_probability(features)
    label = evaluate_bet(probability)
    return PredictResponse(probability=probability, label=label, source="api-manual")


@app.post("/predict/matchup", response_model=MatchupPredictResponse)
def predict_from_matchup(request: MatchupPredictRequest) -> MatchupPredictResponse:
    team_1 = request.team_1.upper().strip()
    team_2 = request.team_2.upper().strip()

    if team_1 == team_2:
        raise HTTPException(status_code=400, detail="team_1 and team_2 must be different.")

    team1_stats = get_latest_team_stats(team_1)
    team2_stats = get_latest_team_stats(team_2)
    features = build_matchup_features(team1_stats, team2_stats, request.home_team)

    probability = model_probability(features)
    label = evaluate_bet(probability)

    return MatchupPredictResponse(
        team_1=team_1,
        team_2=team_2,
        probability=probability,
        label=label,
        source="api-matchup",
        features=features,
    )
