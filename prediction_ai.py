import os
import sqlite3
import pandas as pd
import pickle
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn import metrics

BASEDIR = os.path.dirname(os.path.abspath(__file__))
DBPATH = os.path.join(BASEDIR, "Data", "cbb_stats.db")  
MODELPATH = os.path.join(BASEDIR, "models", "cbb_model.pkl")

def train_model():
    #database connection and data loading
    
    conn = sqlite3.connect(DBPATH)
    df = pd.read_sql("SELECT * FROM team_game_stats", conn)
    conn.close()

    X = df[['points_diff', 'team_reb_roll', 'opponent_reb_roll', 'team_ast_roll', 'opponent_ast_roll', 'home']]
    y = df['win']

    #split and training
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.3, random_state=42
    )

    model = RandomForestClassifier(n_estimators=200, random_state=0)
    model.fit(X_train, y_train)
    preds = model.predict(X_test)

    print("Test Accuracy:", metrics.accuracy_score(y_test, preds))

    os.makedirs(os.path.dirname(MODELPATH), exist_ok=True)
    pickle.dump(model, open(MODELPATH, "wb"))

def predict_game(points_diff, team_reb_roll, opponent_reb_roll, team_ast_roll, opponent_ast_roll, home):
    model = pickle.load(open(MODELPATH, "rb"))
    features = pd.DataFrame([{
        "points_diff": points_diff,
        "team_reb_roll": team_reb_roll,
        "opponent_reb_roll": opponent_reb_roll,
        "team_ast_roll": team_ast_roll,
        "opponent_ast_roll": opponent_ast_roll,
        "home": home
    }])

    prob = model.predict_proba(features)[0][1]
    return prob

def evaluate_bet(probability):
    if probability > 0.60:
        return "Good Bet"
    elif probability > 0.52:
        return "Slight Edge"
    return "Avoid"






