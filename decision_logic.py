import sqlite3
import pandas as pd

from Data.generate_features import DBPATH

def decision_maker(team: str, home_team):
    conn = sqlite3.connect(DBPATH)

    query = f"""
    SELECT *
    FROM team_game_stats
    WHERE team = '{team}'
    ORDER BY game_id DESC
    LIMIT 1
    """

    df = pd.read_sql(query, conn)
    conn.close()

    if df.empty:
        raise ValueError(f"No data found for team: {team}")
    
    team_stats = df.iloc[0]
    
    features = {
        "points": team_stats["team_points_roll"],
        "team_reb_roll": team_stats["team_reb_roll"],
        "team_ast_roll": team_stats["team_ast_roll"],
    }

    points_decision = "High" if features["points"] > 120 else "Average" if features["points"] > 110 else "Low"
    team_reb_decision = "Strong" if features["team_reb_roll"] > 49 else "Average" if features["team_reb_roll"] > 40 else "Weak"
    team_ast_decision = "Strong" if features["team_ast_roll"] > 26 else "Average" if features["team_ast_roll"] > 23 else "Weak"
    home_decision = "Home" if home_team == 1 else "Away"


    return {
        "points": points_decision,
        "team_reb_roll": team_reb_decision,
        "team_ast_roll": team_ast_decision,     
        "home": home_decision
    }


        
    
