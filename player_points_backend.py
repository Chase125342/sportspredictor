import sqlite3
import pandas as pd
import os
import pickle

BASEDIR = os.path.dirname(os.path.abspath(__file__))
DBPATH = os.path.join(BASEDIR, "Data", "nba_stats.db")
MODEL_PATH = os.path.join(BASEDIR, "models", "player_points_model.pkl")


def get_player_recent(player_id, window=5):
    conn = sqlite3.connect(DBPATH)

    df = pd.read_sql("""
        SELECT * FROM player_games
        WHERE player_id = ?
        ORDER BY game_date DESC
        LIMIT ?
    """, conn, params=(player_id, window))

    conn.close()

    if df.empty:
        return None

    return {
        "points_roll": df["points"].mean(),
        "minutes_roll": df["minutes"].mean(),
        "usage_roll": df["usage_proxy"].mean()
    }


def predict_player_bet(player_id, line, bet_type):
    model = pickle.load(open(MODEL_PATH, "rb"))

    stats = get_player_recent(player_id)

    features = pd.DataFrame([stats])

    predicted_points = model.predict(features)[0]

    if bet_type.lower() == "over":
        confidence = min(1.0, predicted_points / line)
    else:
        confidence = min(1.0, line / predicted_points)

    difference = (predicted_points - line)

    if bet_type == "over":
        if difference > 5:
            recommendation = "Good Bet"
        elif difference > 2:
            recommendation = "Slight Edge"
        else:
            recommendation = "Avoid"
    else:
        if difference < -5:
            recommendation = "Good Bet"
        elif difference < -2:
            recommendation = "Slight Edge"
        else:
            recommendation = "Avoid"

    return {
        "predicted_points": float(predicted_points),
        "line": line,
        "bet_type": bet_type,
        "confidence": float(confidence),
        "recommendation": recommendation
    }
