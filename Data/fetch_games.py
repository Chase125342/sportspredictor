from nba_api.stats.endpoints import leaguegamelog
import pandas as pd
import sqlite3
import os

DBPATH = os.path.join(os.path.dirname(__file__), "nba_stats.db")


def fetch_games(season = "2025-2026"):
    conn = sqlite3.connect(DBPATH)
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS games (
        game_id TEXT,
        game_date TEXT,
        team_id INTEGER,
        team TEXT,
        opponent TEXT,
        team_points INTEGER,
        opponent_points INTEGER,
        team_reb INTEGER,
        opponent_reb INTEGER,
        team_ast INTEGER,
        opponent_ast INTEGER,
        home INTEGER,
        win INTEGER,
        PRIMARY KEY (game_id, team_id)
    )
    """)

    print(f"Pulling NBA data for season {season}...")

    df = leaguegamelog.LeagueGameLog(
        season=season,
        season_type_all_star="Regular Season",
        player_or_team_abbreviation="T"
    ).get_data_frames()[0]

    # Keep useful columns
    df = df[
        [
            "GAME_ID",
            "GAME_DATE",
            "TEAM_ID",
            "TEAM_ABBREVIATION",
            "MATCHUP",
            "WL",
            "PTS",
            "REB",
            "AST"
        ]
    ].copy()

    # Self-join each game so each team row gets opponent stats
    merged = df.merge(
        df,
        on="GAME_ID",
        suffixes=("_team", "_opp")
    )

    # Remove self-match rows
    merged = merged[merged["TEAM_ID_team"] != merged["TEAM_ID_opp"]].copy()

    # Home indicator: "vs." means home, "@" means away
    merged["home"] = merged["MATCHUP_team"].apply(lambda x: 1 if "vs." in x else 0)
    merged["win"] = merged["WL_team"].apply(lambda x: 1 if x == "W" else 0)

    final_df = merged[
        [
            "GAME_ID",
            "GAME_DATE_team",
            "TEAM_ID_team",
            "TEAM_ABBREVIATION_team",
            "TEAM_ABBREVIATION_opp",
            "PTS_team",
            "PTS_opp",
            "REB_team",
            "REB_opp",
            "AST_team",
            "AST_opp",
            "home",
            "win"
        ]
    ].copy()

    final_df.columns = [
        "game_id",
        "game_date",
        "team_id",
        "team",
        "opponent",
        "team_points",
        "opponent_points",
        "team_reb",
        "opponent_reb",
        "team_ast",
        "opponent_ast",
        "home",
        "win"
    ]

    rows_inserted = 0

    for _, row in final_df.iterrows():
        cursor.execute("""
        INSERT OR REPLACE INTO games (
            game_id,
            game_date,
            team_id,
            team,
            opponent,
            team_points,
            opponent_points,
            team_reb,
            opponent_reb,
            team_ast,
            opponent_ast,
            home,
            win
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            row["game_id"],
            row["game_date"],
            int(row["team_id"]),
            row["team"],
            row["opponent"],
            int(row["team_points"]),
            int(row["opponent_points"]),
            int(row["team_reb"]),
            int(row["opponent_reb"]),
            int(row["team_ast"]),
            int(row["opponent_ast"]),
            int(row["home"]),
            int(row["win"])
        ))
        rows_inserted += 1

    conn.commit()
    conn.close()

    print(f"Inserted/updated {rows_inserted} team-game rows.")



