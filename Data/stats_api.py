import sqlite3
import os

#no longer used
DB_PATH = os.path.join(os.path.dirname(__file__), "nba_stats.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()


    cursor.execute("""
    CREATE TABLE IF NOT EXISTS games (
    game_id TEXT, 
    game_date TEXT,
    team_id TEXT,
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

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()






