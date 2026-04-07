from nba_api.stats.endpoints import playergamelog
from nba_api.stats.static import players
import pandas as pd
import sqlite3
import os

DBPATH = os.path.join(os.path.dirname(__file__), "nba_stats.db")


def fetch_player_stats(season="2025-2026"):
    conn = sqlite3.connect(DBPATH)
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS player_game_stats (
        game_id TEXT,
        game_date TEXT,
        player_id INTEGER,
        player TEXT,
        team TEXT,
        opponent TEXT,
        minutes REAL,
        points INTEGER,
        rebounds INTEGER,
        assists INTEGER,
        home INTEGER,
        PRIMARY KEY (game_id, player_id)
    )
    """)


    player_list = players.get_players()

    total_rows = 0

    for p in player_list:
        try:
            gamelog = playergamelog.PlayerGameLog(
                player_id=p["id"],
                season=season
            ).get_data_frames()[0]

            if gamelog.empty:
                continue

            df = gamelog[[
                "Game_ID",
                "GAME_DATE",
                "PLAYER_ID",
                "PLAYER_NAME",
                "MATCHUP",
                "MIN",
                "PTS",
                "REB",
                "AST"
            ]].copy()

            #home/away
            df["home"] = df["MATCHUP"].apply(lambda x: 1 if "vs." in x else 0)

            #opponent/team
            df["opponent"] = df["MATCHUP"].apply(lambda x: x.split(" ")[-1])
            df["team"] = df["MATCHUP"].apply(lambda x: x.split(" ")[0])

            for _, row in df.iterrows():
                cursor.execute("""
                INSERT OR REPLACE INTO player_game_stats VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    row["Game_ID"],
                    row["GAME_DATE"],
                    int(row["PLAYER_ID"]),
                    row["PLAYER_NAME"],
                    row["team"],
                    row["opponent"],
                    float(row["MIN"]) if row["MIN"] else 0,
                    int(row["PTS"]),
                    int(row["REB"]),
                    int(row["AST"]),
                    int(row["home"])
                ))

                total_rows += 1

        except Exception as e:
            continue

    conn.commit()
    conn.close()

    print(f"Inserted/updated {total_rows} player-game rows.")
