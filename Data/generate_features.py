import sqlite3
import pandas as pd
import os

DBPATH = os.path.join(os.path.dirname(__file__), "nba_stats.db")

def generate_features(rolling_window: int = 5):

    conn = sqlite3.connect(DBPATH)
    df = pd.read_sql("SELECT * FROM games", conn)
    print(f"Loaded {len(df)} rows from 'games' table.")

    #data cleaning no longer needed
    '''
    df['date'] = pd.to_datetime(df['date'], format='%Y-%m-%dT%H:%M:%S.%fZ', errors='coerce', utc=True)
    
    df = df.sort_values(by=['team', 'date'])
    '''

    numeric_cols = ['team_points', 'opponent_points', 'team_reb', 'opponent_reb', 'team_ast', 'opponent_ast']
    df[numeric_cols] = df[numeric_cols].fillna(0)

    #calculations
    for stat in ['team_points', 'opponent_points', 'team_reb', 'opponent_reb', 'team_ast', 'opponent_ast']:
        df[f'{stat}_roll'] = df.groupby('team')[stat].rolling(rolling_window, min_periods=1).mean().reset_index(0, drop=True)

    df['points_diff'] = df['team_points_roll'] - df['opponent_points_roll']
    df['elo_diff'] = 0

    #team_game_stats table
    features = df[['game_id', 'team', 'opponent', 'points_diff', 'elo_diff', 'home', 'win', 'team_points_roll', 'opponent_points_roll', 'team_reb_roll', 'opponent_reb_roll', 'team_ast_roll', 'opponent_ast_roll']].copy()

    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS team_game_stats (
        game_id TEXT PRIMARY KEY,
        team TEXT,
        opponent TEXT,
        points_diff REAL,
        elo_diff REAL,
        home INTEGER,
        win INTEGER,
        team_points_roll REAL,
        opponent_points_roll REAL,
        team_reb_roll REAL,
        opponent_reb_roll REAL,
        team_ast_roll REAL,
        opponent_ast_roll REAL
    )
    """)
    
    #insert features
    features.to_sql('team_game_stats', conn, if_exists='replace', index=False)
    print(f"Generated {len(features)} rows in 'team_game_stats'.")

    conn.close()







