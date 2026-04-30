import os
import sqlite3
import pandas as pd
import pickle
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier

BASEDIR = os.path.dirname(os.path.abspath(__file__))
DBPATH = os.path.join(BASEDIR, "Data", "nba_stats.db")
MODELPATH = os.path.join(BASEDIR, "models", "totals_model.pkl")

def train_totals_model(line: float = 220.0):
    conn = sqlite3.connect(DBPATH)
    df = pd.read_sql("SELECT * FROM game_totals_features", conn)
    conn.close()

    df['over'] = (df['total_points'] > line).astype(int)

    X = df[['points_avg_total', 'reb_total', 'ast_total']]
    y = df['over']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.3, random_state=42
    )

    model = RandomForestClassifier(n_estimators=200, random_state=0)
    model.fit(X_train, y_train)

    accuracy = model.score(X_test, y_test)
    print("Model Accuracy:", accuracy)

    os.makedirs(os.path.dirname(MODELPATH), exist_ok=True)
    pickle.dump(model, open(MODELPATH, "wb"))


def predict_over_under(points_avg_total, reb_total, ast_total, line, bet_type):
    model = pickle.load(open(MODELPATH, "rb"))

    features = pd.DataFrame([{
        "points_avg_total": points_avg_total,
        "reb_total": reb_total,
        "ast_total": ast_total
    }])

    prob_over = model.predict_proba(features)[0][1]

    if bet_type.lower() == "over":
        return prob_over
    else:
        return 1 - prob_over


def evaluate_totals_bet(probability):
    if probability > 0.60:
        return "Good Bet"
    elif probability > 0.52:
        return "Slight Edge"
    return "Avoid"
