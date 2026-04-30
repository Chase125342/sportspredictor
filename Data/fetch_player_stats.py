from nba_api.stats.endpoints import playergamelog
import sqlite3
import pandas as pd
import os

BASEDIR = os.path.dirname(os.path.abspath(__file__))
DBPATH = os.path.join(BASEDIR, "nba_stats.db")


def fetch_player_games(player_id, season="2025-26"):
    conn = sqlite3.connect(DBPATH)
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS player_games (
        game_id TEXT,
        player_id INTEGER,
        player_name TEXT,
        game_date TEXT,
        minutes REAL,
        points INTEGER,
        rebounds INTEGER,
        assists INTEGER,
        usage_proxy REAL,
        home INTEGER,
        PRIMARY KEY (game_id, player_id)
    )
    """)

    print(f"Fetching player {player_id} for {season}")

    df = playergamelog.PlayerGameLog(
        player_id=player_id,
        season=season,
        season_type_all_star="Regular Season"
    ).get_data_frames()[0]

    df.columns = [col.upper() for col in df.columns]

    print("Columns returned:", df.columns.tolist())

    required = ["GAME_ID", "GAME_DATE", "MATCHUP", "MIN", "PTS", "REB", "AST"]
    df = df[[col for col in required if col in df.columns]].copy()

    df["GAME_ID"] = df["GAME_ID"].astype(str)
    df["game_id"] = df["GAME_DATE"].astype(str) + "_" + df["MATCHUP"]

    df["home"] = df["MATCHUP"].apply(lambda x: 1 if "VS." in str(x).upper() else 0)

    df["usage_proxy"] = df["PTS"] + df["REB"] + df["AST"]

    df.rename(columns={
        "GAME_DATE": "game_date",
        "MIN": "minutes",
        "PTS": "points",
        "REB": "rebounds",
        "AST": "assists"
    }, inplace=True)

    df["player_id"] = player_id
    df["player_name"] = "UNKNOWN"

    rows = 0

    for _, row in df.iterrows():
        cursor.execute("""
        INSERT OR REPLACE INTO player_games (
            game_id, player_id, player_name, game_date,
            minutes, points, rebounds,
            assists, usage_proxy, home
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            row["game_id"],
            int(row["player_id"]),
            row["player_name"],
            row["game_date"],
            float(row["minutes"]),
            int(row["points"]),
            int(row["rebounds"]),
            int(row["assists"]),
            float(row["usage_proxy"]),
            int(row["home"])
        ))

        rows += 1

    conn.commit()
    conn.close()

