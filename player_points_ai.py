import os
import sqlite3
import pandas as pd
import pickle
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor

BASEDIR = os.path.dirname(os.path.abspath(__file__))
DBPATH = os.path.join(BASEDIR, "nba_stats.db")
MODELPATH = os.path.join(BASEDIR, "models", "nba_player_model.pkl")


def train_player_model():
    conn = sqlite3.connect(DBPATH)
    df = pd.read_sql("SELECT * FROM player_game_stats", conn)
    conn.close()

    print(f"Loaded {len(df)} player rows")

    df = df.sort_values(by=["player_id", "game_date"])

    df[["points", "minutes", "rebounds", "assists"]] = df[
        ["points", "minutes", "rebounds", "assists"]
    ].fillna(0)

    #rolling averages for previous 5 games
    df["points_roll"] = df.groupby("player_id")["points"].rolling(5, min_periods=1).mean().reset_index(0, drop=True)
    df["minutes_roll"] = df.groupby("player_id")["minutes"].rolling(5, min_periods=1).mean().reset_index(0, drop=True)
    df["rebounds_roll"] = df.groupby("player_id")["rebounds"].rolling(5, min_periods=1).mean().reset_index(0, drop=True)
    df["assists_roll"] = df.groupby("player_id")["assists"].rolling(5, min_periods=1).mean().reset_index(0, drop=True)
    df["points_std"] = df.groupby("player_id")["points"].rolling(5, min_periods=1).std().reset_index(0, drop=True).fillna(0)

    #features and target
    X = df[
        [
            "points_roll",
            "minutes_roll",
            "rebounds_roll",
            "assists_roll",
            "points_std",
            "home"
        ]
    ]

    y = df["points"]

    #train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.3, random_state=42
    )

    model = RandomForestRegressor(n_estimators=200, random_state=42)
    model.fit(X_train, y_train)

    os.makedirs(os.path.dirname(MODELPATH), exist_ok=True)
    pickle.dump(model, open(MODELPATH, "wb"))

    print("NBA Player model trained.")


def predict_player_points(
    points_roll,
    minutes_roll,
    rebounds_roll,
    assists_roll,
    points_std,
    home
):
    if not os.path.exists(MODELPATH):
        raise FileNotFoundError("Run train_player_model() first")

    model = pickle.load(open(MODELPATH, "rb"))

    X = [[
        points_roll,
        minutes_roll,
        rebounds_roll,
        assists_roll,
        points_std,
        home
    ]]

    return model.predict(X)[0]


def evaluate_player_prop(predicted_points, line):
    diff = predicted_points - line

    if diff > 3:
        return "Over (Good Bet)"
    elif diff > 1:
        return "Slight Edge Over"
    elif diff < -3:
        return "Under (Good Bet)"
    elif diff < -1:
        return "Slight Edge Under"
    else:
        return "Avoid"
