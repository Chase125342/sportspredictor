import sqlite3
import pandas as pd
import os
from nba_api.stats.endpoints import scoreboardv2
from datetime import datetime
from datetime import timedelta
import time

BASEDIR = os.path.dirname(os.path.abspath(__file__))
DBPATH = os.path.join(BASEDIR, "Data", "nba_stats.db")

def get_connection():
    return sqlite3.connect(DBPATH)

def get_team_features(team_name):

    conn = get_connection()

    df = pd.read_sql("""
        SELECT *
        FROM team_game_stats
        WHERE team = ?
        ORDER BY game_id DESC
        LIMIT 1
    """, conn, params=(team_name,))

    conn.close()

    if df.empty:
        return None

    row = df.iloc[0]

    return {
        "points_diff": row["points_diff"],
        "team_reb_roll": row["team_reb_roll"],
        "opponent_reb_roll": row["opponent_reb_roll"],
        "team_ast_roll": row["team_ast_roll"],
        "opponent_ast_roll": row["opponent_ast_roll"],
        "home": row["home"]
    }


def get_upcoming_games(days_ahead=3):

    all_games = []

    for i in range(days_ahead):

        date = (datetime.now() + timedelta(days=i)).strftime("%m/%d/%Y")

        try:
            scoreboard = scoreboardv2.ScoreboardV2(game_date=date)
            df = scoreboard.get_data_frames()[0]

            if not df.empty:
                df["QUERY_DATE"] = date
                all_games.append(df)

            #avoids hitting API rate limits
            time.sleep(0.6)

        except Exception as e:
            print(f"Failed for {date}: {e}")

    if not all_games:
        return pd.DataFrame()

    return pd.concat(all_games, ignore_index=True)


def get_team_lookup():

    conn = get_connection()

    df = pd.read_sql("""
        SELECT DISTINCT team_id, team
        FROM games
    """, conn)

    conn.close()

    return dict(zip(df["team_id"], df["team"]))


def build_live_feed(limit=10):

    games_df = get_upcoming_games(days_ahead=3)
    team_lookup = get_team_lookup()

    output = []

    for _, row in games_df.iterrows():

        home_id = row["HOME_TEAM_ID"]
        away_id = row["VISITOR_TEAM_ID"]

        home_team = team_lookup.get(home_id)
        away_team = team_lookup.get(away_id)

        if not home_team or not away_team:
            continue


        raw_datetime = row["GAME_DATE_EST"]

        dt = datetime.fromisoformat(str(raw_datetime))

        game_date = dt.strftime("%m/%d/%Y")
        game_time = dt.strftime("%I:%M %p")  
        
        output.append({
            "team1": home_team,
            "team2": away_team,
            "team1_home": 1,
            "game_date": game_date,
            "game_time": game_time
        })

        if len(output) >= limit:
            break

    return output

