import os
import sqlite3
from typing import Dict, Tuple

import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, roc_auc_score
from sklearn.model_selection import train_test_split
import pickle

BASEDIR = os.path.dirname(os.path.abspath(__file__))
DBPATH = os.path.join(BASEDIR, "Data", "nba_stats.db")
MODELPATH_V2 = os.path.join(BASEDIR, "models", "nba_model_v2.pkl")

FEATURE_COLUMNS = [
    "points_diff",
    "elo_diff",
    "home",
    "team_points_roll",
    "opponent_points_roll",
    "team_reb_roll",
    "opponent_reb_roll",
    "team_ast_roll",
    "opponent_ast_roll",
]


def load_dataset() -> Tuple[pd.DataFrame, pd.Series]:
    conn = sqlite3.connect(DBPATH)
    df = pd.read_sql("SELECT * FROM team_game_stats", conn)
    conn.close()

    df = df.dropna(subset=FEATURE_COLUMNS + ["win"])
    X = df[FEATURE_COLUMNS].astype(float)
    y = df["win"].astype(int)
    return X, y


def evaluate_model(name: str, model, X_train, X_test, y_train, y_test) -> Dict[str, float]:
    model.fit(X_train, y_train)
    probs = model.predict_proba(X_test)[:, 1]
    preds = (probs >= 0.5).astype(int)
    return {
        "name": name,
        "accuracy": accuracy_score(y_test, preds),
        "roc_auc": roc_auc_score(y_test, probs),
    }


def train_model_teamwins_v2() -> Dict[str, float]:
    X, y = load_dataset()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    candidates = [
        ("random_forest", RandomForestClassifier(n_estimators=300, random_state=42)),
        ("gradient_boost", GradientBoostingClassifier(random_state=42)),
        ("log_reg", LogisticRegression(max_iter=2000)),
    ]

    results = []
    best = None
    best_score = -1.0

    for name, model in candidates:
        metrics = evaluate_model(name, model, X_train, X_test, y_train, y_test)
        results.append(metrics)
        if metrics["roc_auc"] > best_score:
            best_score = metrics["roc_auc"]
            best = (name, model, metrics)

    if best is None:
        raise RuntimeError("No model candidates were evaluated.")

    _, best_model, best_metrics = best
    best_model.fit(X_train, y_train)

    os.makedirs(os.path.dirname(MODELPATH_V2), exist_ok=True)
    with open(MODELPATH_V2, "wb") as model_file:
        pickle.dump(best_model, model_file)

    return {
        "saved_model": MODELPATH_V2,
        "accuracy": best_metrics["accuracy"],
        "roc_auc": best_metrics["roc_auc"],
        "model": best_metrics["name"],
    }


if __name__ == "__main__":
    summary = train_model_teamwins_v2()
    print("Model saved:", summary["saved_model"])
    print("Best model:", summary["model"])
    print("Accuracy:", round(summary["accuracy"], 4))
    print("ROC AUC:", round(summary["roc_auc"], 4))
