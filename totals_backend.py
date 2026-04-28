import sqlite3
import pandas as pd
import os
import pickle

BASEDIR = os.path.dirname(os.path.abspath(__file__))
DBPATH = os.path.join(BASEDIR, "Data", "nba_stats.db")
MODEL_PATH = os.path.join(BASEDIR, "models", "totals_model.pkl")


def get_team_recent_stats(team, window=5):
    conn = sqlite3.connect(DBPATH)

    df = pd.read_sql(
        "SELECT * FROM games WHERE team = ? ORDER BY game_date DESC LIMIT ?",
        conn,
        params=(team, window)
    )

    conn.close()

    if df.empty:
        return None

    return {
        "points_avg": df["team_points"].mean(),
        "reb_avg": df["team_reb"].mean(),
        "ast_avg": df["team_ast"].mean()
    }


def predict_totals_bet(team1, team2, line, bet_type):
    model = pickle.load(open(MODEL_PATH, "rb"))

    t1 = get_team_recent_stats(team1)
    t2 = get_team_recent_stats(team2)

    

    features = pd.DataFrame([{
        "points_avg_total": t1["points_avg"] + t2["points_avg"],
        "reb_total": t1["reb_avg"] + t2["reb_avg"],
        "ast_total": t1["ast_avg"] + t2["ast_avg"],
    }])

    over_prob = model.predict_proba(features)[0][1]
    under_prob = 1 - over_prob

    if bet_type == "over":
        bet_prob = over_prob
        recommendation = "Good Bet" if over_prob > 0.60 else "Slight Edge" if over_prob > 0.52 else "Avoid"
    else: 
        bet_prob = under_prob
        recommendation = "Good Bet" if under_prob > 0.60 else "Slight Edge" if under_prob > 0.52 else "Avoid"
    


    return {
        "bet_probability": float(bet_prob),
        "recommendation": recommendation,
        "line": line,
        "bet_type_input": bet_type
    }
