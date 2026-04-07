import os
import sqlite3
import pandas as pd
import pickle
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier

BASEDIR = os.path.dirname(os.path.abspath(__file__))
DBPATH = os.path.join(BASEDIR, "Data", "nba_stats.db")
MODELPATH = os.path.join(BASEDIR, "models", "totals_model.pkl")


def train_totals_model():
    conn = sqlite3.connect(DBPATH)
    df = pd.read_sql("SELECT * FROM games", conn)
    conn.close()

    #total points
    df['total_points'] = df['team_points'] + df['opponent_points']

    #rolling averages
    df = df.sort_values(by=['team', 'date'])
    df['team_points_roll'] = df.groupby('team')['team_points'].rolling(5, min_periods=1).mean().reset_index(0, drop=True)
    df['opp_points_roll'] = df.groupby('team')['opponent_points'].rolling(5, min_periods=1).mean().reset_index(0, drop=True)

    #PLACEHOLDER: line at 140 for over/under 
    df['over'] = (df['total_points'] > 140).astype(int)

    X = df[['team_points_roll', 'opp_points_roll', 'home']]
    y = df['over']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3)

    model = RandomForestClassifier(n_estimators=200)
    model.fit(X_train, y_train)

    os.makedirs(os.path.dirname(MODELPATH), exist_ok=True)
    pickle.dump(model, open(MODELPATH, "wb"))

    print("Totals model trained.")


def predict_over_under(team_points_roll, opp_points_roll, home, line=140):
    model = pickle.load(open(MODELPATH, "rb"))

    X = [[team_points_roll, opp_points_roll, home]]
    prob = model.predict_proba(X)[0][1]

    return prob


def evaluate_total(prob):
    if prob > 0.6:
        return "Over (Good Bet)"
    elif prob > 0.52:
        return "Lean Over"
    elif prob < 0.4:
        return "Under (Good Bet)"
    else:
        return "Avoid"
