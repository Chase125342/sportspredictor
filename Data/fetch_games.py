import requests
import sqlite3
import os

DBPATH = os.path.join(os.path.dirname(__file__), "cbb_stats.db")
APIURL = "https://api.collegebasketballdata.com/games"

def fetch_games(year, api_key):
    print(f"Fetching games for {year}...")

    headers = {}
    if api_key:
        headers['Authorization'] = f'Bearer {api_key}'

    params = {"year": year}

    response = requests.get(APIURL, params=params, headers=headers)
    data = response.json()

    conn = sqlite3.connect(DBPATH)
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS games (
        game_id TEXT PRIMARY KEY,
        date TEXT,
        team TEXT,
        opponent TEXT,
        team_points INTEGER,
        opponent_points INTEGER,
        team_reb INTEGER,
        opponent_reb INTEGER,
        team_ast INTEGER,
        opponent_ast INTEGER,
        home INTEGER,
        win INTEGER
    )
    """)

    for g in data:
        game_id = str(g["id"])

        home_team = g.get("homeTeam", "Unknown")
        away_team = g.get("awayTeam", "Unknown")
        home_score = g.get("homePoints", 0)
        away_score = g.get("awayPoints", 0)

        home_win = 1 if home_score > away_score else 0
        away_win = 1 if away_score > home_score else 0

        cursor.execute("""
        INSERT OR IGNORE INTO games VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            game_id + "_home",
            g.get("startDate"),
            home_team,
            away_team,
            home_score,
            away_score,
            None,
            None,
            None,
            None,
            1,
            home_win
        ))

        cursor.execute("""
        INSERT OR IGNORE INTO games VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            game_id + "_away",
            g.get("startDate"),
            away_team,
            home_team,
            away_score,
            home_score,
            None,
            None,
            None,
            None,
            0,
            away_win
        ))

    conn.commit()
    conn.close()
    print(f"Inserted {len(data) * 2} rows into database.")



