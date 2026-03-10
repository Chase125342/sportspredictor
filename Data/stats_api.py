import sqlite3
import os

#no longer used
DB_PATH = os.path.join(os.path.dirname(__file__), "cbb_stats.db")
conn = sqlite3.connect(DB_PATH)
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

conn.commit()
conn.close()

