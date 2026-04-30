import sqlite3
import pandas as pd
import os

BASEDIR = os.path.dirname(os.path.abspath(__file__))
DBPATH = os.path.join(BASEDIR, "nba_stats.db")

def generate_totals_features(rolling_window: int = 5):
    conn = sqlite3.connect(DBPATH)
    df = pd.read_sql("SELECT * FROM games", conn)

    print(f"Loaded {len(df)} rows from 'games' table.")

    df['game_date'] = pd.to_datetime(df['game_date'])
    df = df.sort_values(by=['team', 'game_date'])

    numeric_cols = ['team_points', 'opponent_points', 'team_reb', 'opponent_reb', 'team_ast', 'opponent_ast']
    df[numeric_cols] = df[numeric_cols].fillna(0)

    for stat in numeric_cols:
        df[f'{stat}_roll'] = (
            df.groupby('team')[stat]
            .shift(1)
            .rolling(rolling_window, min_periods=1)
            .mean()
        )

    home_df = df[df['home'] == 1].copy()
    away_df = df[df['home'] == 0].copy()

    games = home_df.merge(
        away_df,
        on="game_id",
        suffixes=("_home", "_away")
    )

    games['total_points'] = games['team_points_home'] + games['team_points_away']

    games['points_avg_total'] = games['team_points_roll_home'] + games['team_points_roll_away']
    games['reb_total'] = games['team_reb_roll_home'] + games['team_reb_roll_away']
    games['ast_total'] = games['team_ast_roll_home'] + games['team_ast_roll_away']

    features = games[[
        'game_id',
        'points_avg_total',
        'reb_total',
        'ast_total',
        'total_points'
    ]].copy()

    features.to_sql('game_totals_features', conn, if_exists='replace', index=False)

    print(f"Generated {len(features)} rows in 'game_totals_features'.")

    conn.close()
