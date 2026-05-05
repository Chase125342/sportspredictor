import os
import pickle
import sqlite3
from typing import Literal, Optional

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from nba_api.stats.static import players
from pydantic import BaseModel, Field

from parlay import calculate_parlay_probability, evaluate_parlay_bet
from totals_backend import predict_totals_bet
from player_points_backend import predict_player_bet

BASEDIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DBPATH = os.path.join(BASEDIR, "Data", "nba_stats.db")
MODELPATH = os.path.join(BASEDIR, "models", "nba_model.pkl")
MODELPATH_V2 = os.path.join(BASEDIR, "models", "nba_model_v2.pkl")
TOTALS_MODELPATH = os.path.join(BASEDIR, "models", "totals_model.pkl")
PLAYER_MODELPATH = os.path.join(BASEDIR, "models", "player_points_model.pkl")

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


class PlayerSearchResponse(BaseModel):
    players: list[dict]


class TotalsPredictRequest(BaseModel):
    team_1: str = Field(..., min_length=2, max_length=4)
    team_2: str = Field(..., min_length=2, max_length=4)
    line: float = Field(..., gt=0)
    bet_type: Literal["over", "under"]


class TotalsPredictResponse(BaseModel):
    bet_probability: float
    recommendation: str
    line: float
    bet_type: str


class PlayerPointsPredictRequest(BaseModel):
    player_name: Optional[str] = None
    player_id: Optional[int] = None
    line: float = Field(..., gt=0)
    bet_type: Literal["over", "under"]


class PlayerPointsPredictResponse(BaseModel):
    predicted_points: float
    line: float
    bet_type: str
    confidence: float
    recommendation: str
    player_id: int
    player_name: str


class ParlayLeg(BaseModel):
    kind: Literal["moneyline", "totals", "player_points"]
    odds_decimal: Optional[float] = Field(None, gt=1.0)
    team_1: Optional[str] = None
    team_2: Optional[str] = None
    home_team: Optional[int] = Field(1, ge=0, le=1)
    line: Optional[float] = None
    bet_type: Optional[Literal["over", "under"]] = None
    player_name: Optional[str] = None
    player_id: Optional[int] = None


class ParlayRequest(BaseModel):
    legs: list[ParlayLeg]
    stake: float = Field(100.0, gt=0)
    use_penalty: bool = True
    penalty_per_extra_bet: float = Field(0.02, ge=0.0)


class ParlayLegResult(BaseModel):
    kind: str
    description: str
    probability: float
    recommendation: str
    odds_decimal: Optional[float] = None


class ParlayResponse(BaseModel):
    legs: list[ParlayLegResult]
    parlay_probability: float
    bet_recommendation: str
    stake: float
    combined_odds_decimal: Optional[float]
    potential_payout: Optional[float]
    potential_profit: Optional[float]


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
        model_path = MODELPATH_V2 if os.path.exists(MODELPATH_V2) else MODELPATH
        if not os.path.exists(model_path):
            raise HTTPException(
                status_code=503,
                detail=f"Model file not found at {model_path}. Train model first.",
            )
        with open(model_path, "rb") as model_file:
            _model = pickle.load(model_file)
    return _model


def ensure_totals_model() -> None:
    if not os.path.exists(TOTALS_MODELPATH):
        raise HTTPException(
            status_code=503,
            detail=f"Totals model not found at {TOTALS_MODELPATH}. Train totals model first.",
        )


def ensure_player_model() -> None:
    if not os.path.exists(PLAYER_MODELPATH):
        raise HTTPException(
            status_code=503,
            detail=f"Player model not found at {PLAYER_MODELPATH}. Train player model first.",
        )


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


def ensure_team_games_available(team: str) -> None:
    ensure_database_available()
    conn = sqlite3.connect(DBPATH)
    cursor = conn.cursor()
    cursor.execute("SELECT 1 FROM games WHERE team = ? LIMIT 1", (team,))
    row = cursor.fetchone()
    conn.close()
    if row is None:
        raise HTTPException(status_code=404, detail=f"No game data found for {team} in games table.")


def resolve_player_id(player_name: str) -> Optional[int]:
    all_players = players.get_players()
    for player in all_players:
        if player["full_name"].lower() == player_name.lower():
            return player["id"]

    matches = [
        player for player in all_players
        if player_name.lower() in player["full_name"].lower()
    ]

    if matches:
        return matches[0]["id"]

    return None


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
    has_model = os.path.exists(MODELPATH) or os.path.exists(MODELPATH_V2)
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


@app.get("/players/search", response_model=PlayerSearchResponse)
def search_players(name: str) -> PlayerSearchResponse:
    if len(name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Search term is too short.")

    all_players = players.get_players()
    matches = [
        p for p in all_players
        if name.lower() in p["full_name"].lower()
    ]

    return PlayerSearchResponse(players=matches[:15])


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


@app.post("/predict/totals", response_model=TotalsPredictResponse)
def predict_totals(request: TotalsPredictRequest) -> TotalsPredictResponse:
    ensure_totals_model()
    team_1 = request.team_1.upper().strip()
    team_2 = request.team_2.upper().strip()
    ensure_team_games_available(team_1)
    ensure_team_games_available(team_2)

    try:
        result = predict_totals_bet(team_1, team_2, request.line, request.bet_type)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    normalized = {
        "bet_probability": result.get("bet_probability"),
        "recommendation": result.get("recommendation"),
        "line": result.get("line", request.line),
        "bet_type": result.get("bet_type", result.get("bet_type_input", request.bet_type)),
    }
    return TotalsPredictResponse(**normalized)


@app.post("/predict/player", response_model=PlayerPointsPredictResponse)
def predict_player_points(request: PlayerPointsPredictRequest) -> PlayerPointsPredictResponse:
    ensure_player_model()

    player_id = request.player_id
    player_name = request.player_name or ""
    if player_id is None:
        if not player_name:
            raise HTTPException(status_code=400, detail="Provide player_id or player_name.")
        player_id = resolve_player_id(player_name)
        if player_id is None:
            raise HTTPException(status_code=404, detail=f"No player found for '{player_name}'.")

    try:
        result = predict_player_bet(player_id, request.line, request.bet_type)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return PlayerPointsPredictResponse(
        **result,
        player_id=player_id,
        player_name=player_name or "unknown",
    )


@app.post("/parlay/quote", response_model=ParlayResponse)
def quote_parlay(request: ParlayRequest) -> ParlayResponse:
    if not request.legs:
        raise HTTPException(status_code=400, detail="At least one leg is required.")

    legs_out: list[ParlayLegResult] = []
    probabilities: list[float] = []
    odds_decimal_values: list[float] = []

    for leg in request.legs:
        if leg.kind == "moneyline":
            if not leg.team_1 or not leg.team_2:
                raise HTTPException(status_code=400, detail="Moneyline leg requires team_1 and team_2.")

            team1_stats = get_latest_team_stats(leg.team_1.upper().strip())
            team2_stats = get_latest_team_stats(leg.team_2.upper().strip())
            features = build_matchup_features(team1_stats, team2_stats, leg.home_team or 1)
            probability = model_probability(features)
            recommendation = evaluate_bet(probability)
            description = f"{leg.team_1.upper()} ML vs {leg.team_2.upper()}"

        elif leg.kind == "totals":
            if not leg.team_1 or not leg.team_2 or leg.line is None or leg.bet_type is None:
                raise HTTPException(status_code=400, detail="Totals leg requires teams, line, and bet_type.")

            ensure_totals_model()
            team_1 = leg.team_1.upper().strip()
            team_2 = leg.team_2.upper().strip()
            ensure_team_games_available(team_1)
            ensure_team_games_available(team_2)

            try:
                totals = predict_totals_bet(team_1, team_2, leg.line, leg.bet_type)
            except Exception as exc:
                raise HTTPException(status_code=500, detail=str(exc)) from exc
            probability = totals["bet_probability"]
            recommendation = totals["recommendation"]
            description = f"{leg.team_1.upper()} vs {leg.team_2.upper()} {leg.bet_type} {leg.line}"

        else:
            if leg.line is None or leg.bet_type is None:
                raise HTTPException(status_code=400, detail="Player leg requires line and bet_type.")

            ensure_player_model()
            player_id = leg.player_id
            player_name = leg.player_name or ""
            if player_id is None:
                if not player_name:
                    raise HTTPException(status_code=400, detail="Provide player_id or player_name for player leg.")
                player_id = resolve_player_id(player_name)
                if player_id is None:
                    raise HTTPException(status_code=404, detail=f"No player found for '{player_name}'.")

            try:
                player = predict_player_bet(player_id, leg.line, leg.bet_type)
            except Exception as exc:
                raise HTTPException(status_code=500, detail=str(exc)) from exc
            probability = player["confidence"]
            recommendation = player["recommendation"]
            description = f"{player_name or player_id} {leg.bet_type} {leg.line} pts"

        probabilities.append(probability)
        if leg.odds_decimal:
            odds_decimal_values.append(leg.odds_decimal)

        legs_out.append(
            ParlayLegResult(
                kind=leg.kind,
                description=description,
                probability=round(probability, 4),
                recommendation=recommendation,
                odds_decimal=leg.odds_decimal,
            )
        )

    parlay_probability = calculate_parlay_probability(
        probabilities,
        use_penalty=request.use_penalty,
        penalty_per_extra_bet=request.penalty_per_extra_bet,
    )
    bet_recommendation = evaluate_parlay_bet(parlay_probability)

    combined_odds = None
    potential_payout = None
    potential_profit = None

    if odds_decimal_values and len(odds_decimal_values) == len(request.legs):
        combined_odds = 1.0
        for odd in odds_decimal_values:
            combined_odds *= odd
        potential_payout = round(request.stake * combined_odds, 2)
        potential_profit = round(potential_payout - request.stake, 2)

    return ParlayResponse(
        legs=legs_out,
        parlay_probability=round(parlay_probability, 4),
        bet_recommendation=bet_recommendation,
        stake=request.stake,
        combined_odds_decimal=round(combined_odds, 4) if combined_odds else None,
        potential_payout=potential_payout,
        potential_profit=potential_profit,
    )
