import os
import sqlite3
import pandas as pd
import pickle
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor

BASEDIR = os.path.dirname(os.path.abspath(__file__))
DBPATH = os.path.join(BASEDIR, "Data", "nba_stats.db")
MODEL_PATH = os.path.join(BASEDIR, "models", "player_points_model.pkl")


def train_player_model():
    conn = sqlite3.connect(DBPATH)
    df = pd.read_sql("SELECT * FROM player_games", conn)
    conn.close()

    print(f"Loaded {len(df)} rows from player_games")

    df = df.sort_values(["player_id", "game_date"])

    df["points_roll"] = (
        df.groupby("player_id")["points"]
        .shift(1)
        .rolling(5, min_periods=1)
        .mean()
        .reset_index(level=0, drop=True)
    )

    df["minutes_roll"] = (
        df.groupby("player_id")["minutes"]
        .shift(1)
        .rolling(5, min_periods=1)
        .mean()
        .reset_index(level=0, drop=True)
    )

    df["usage_roll"] = (
        df.groupby("player_id")["usage_proxy"]
        .shift(1)
        .rolling(5, min_periods=1)
        .mean()
        .reset_index(level=0, drop=True)
    )

    df = df.dropna(subset=["points_roll", "minutes_roll", "usage_roll"])

    print(f"Rows after feature engineering: {len(df)}")

    X = df[["points_roll", "minutes_roll", "usage_roll"]]
    y = df["points"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.3, random_state=42
    )
    model = RandomForestRegressor(n_estimators=200, random_state=42)
    model.fit(X_train, y_train)

    score = model.score(X_test, y_test)
    print("R² Score:", score)

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    pickle.dump(model, open(MODEL_PATH, "wb"))


def predict_player_points(points_roll, minutes_roll, usage_roll):
    model = pickle.load(open(MODEL_PATH, "rb"))

    features = pd.DataFrame([{
        "points_roll": points_roll,
        "minutes_roll": minutes_roll,
        "usage_roll": usage_roll
    }])

    return float(model.predict(features)[0])
