import os
import sqlite3
import pandas as pd

from Data.fetch_games import fetch_games_teamwins
from Data.generate_features import generate_features_teamwins
from prediction_ai import predict_game_teamwins, evaluate_bet_teamwins
from live_games import get_upcoming_games
from parlay import calculate_parlay_probability, evaluate_parlay_bet

from decision_logic import decision_maker

BASEDIR = os.path.dirname(os.path.abspath(__file__))
DBPATH = os.path.join(BASEDIR, "Data", "nba_stats.db")

"""
get_latest_team_stats - Pull most recent rolling stats for a given team

PARAMETERS:
team (str): team abbreviation (e.g. LAL)

OUTPUT:
DataFrame row with latest stats for that team

this function is used later to build the feature vector for prediction
"""
def get_latest_team_stats(team: str):
    """
    Pull most recent rolling stats for a given team
    """
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

    return df.iloc[0]

"""
build_matchup_features - Construct feature vector for prediction based on team stats

PARAMETERS:
team1_stats (Series): latest stats for team 1
team2_stats (Series): latest stats for team 2
home_team (int): 1 if team 1 is home, 0 if team 2 is home

OUTPUT:
Dictionary of features to be used for prediction
"""
def build_matchup_features(team1_stats, team2_stats, home_team=1):
    
    return {
        "points_diff": team1_stats["team_points_roll"] - team2_stats["team_points_roll"],
        "team_reb_roll": team1_stats["team_reb_roll"],
        "opponent_reb_roll": team2_stats["team_reb_roll"],
        "team_ast_roll": team1_stats["team_ast_roll"],
        "opponent_ast_roll": team2_stats["team_ast_roll"],
        "home": home_team
    }

"""
predict_game - Main function to predict outcome of a game between two teams

PARAMETERS:
team1 (str): team abbreviation for team 1 (e.g. LAL)
team2 (str): team abbreviation for team 2 (e.g. BOS)
home_team (int): 1 if team 1 is home, 0 if team 2 is home

OUTPUT:
Dictionary with win probability and bet recommendation
"""

def predict_game(team1: str, team2: str, home_team: int = 1):
    

    #keep data updated
    fetch_games_teamwins()
    generate_features_teamwins()

    #latest stats for both teams
    team1_stats = get_latest_team_stats(team1)
    team2_stats = get_latest_team_stats(team2)

    #feature building
    features = build_matchup_features(team1_stats, team2_stats, home_team)

    #prediction
    probability = predict_game_teamwins(
        features["points_diff"],
        features["team_reb_roll"],
        features["opponent_reb_roll"],
        features["team_ast_roll"],
        features["opponent_ast_roll"],
        features["home"]
    )

    #evaluation
    recommendation = evaluate_bet_teamwins(probability)

    return {
        "team_1": team1,
        "team_2": team2,
        "team_1_win_probability": round(probability, 4),
        "bet_recommendation": recommendation
    }

"""
decision_analysis - Provide reasoning behind prediciotn based on team stats and decision logic

PARAMETERS:
team (str): team abbreviation for team to analyze (e.g. LAL)
home_team (int): 1 if team is home, 0 if away

OUTPUT:
Dictionary with analysis of key factors influencing prediction
"""
def decision_analysis(team: str, home_team: int = 1):
    return decision_maker(team, home_team)

"""
build_live_feed - Function to build live feed of upcoming 10 games in the next three days

PARAMATERS:
days_ahead (int): number of days ahead to pull games for (default 3)

OUTPUT:
Dictionary with game details such as teams, date, time, and home/away status
note: team1 is always the home team, team2 is always the away team for consistency in prediction logic
"""
def build_live_feed(days_ahead=3):

    games = get_upcoming_games(days_ahead)

    return games

"""
select_game - Function to select a game from the live feed for prediction

PARAMETERS:
games: Dictionary of upcoming games from build_live_feed
game_selection: Index of the game to select (0-based)

OUTPUT:
Home team and away team abbreviations to be used in predction. Prediction function will already assume team1 is home."""
def select_game(games, game_selection):
    row = games.iloc[game_selection]

    home_team = row["HOME_TEAM_ID"]
    away_team = row["VISITOR_TEAM_ID"]  

    return home_team, away_team

#TESTING
'''
if __name__ == "__main__":
    team1 = input("Enter Team 1 (e.g. LAL): ").upper()
    team2 = input("Enter Team 2 (e.g. BOS): ").upper()

    result = predict_game(team1, team2)

    print("\n--- Prediction ---")
    print(f"{result['team_1']} vs {result['team_2']}")
    print(f"Win Probability ({team1}): {result['team_1_win_probability']}")
    print(f"Bet Evaluation: {result['bet_recommendation']}")
'''

def predict_parlay(probabilities: list[float], use_penalty: bool = True, penalty_per_extra_bet: float = 0.02):
    """
    Combine multiple bet probabilities into one parlay probability.

    PARAMETERS:
    probabilities (list[float]): list of probabilities from individual bets
    use_penalty (bool): whether to apply extra penalty for more bets
    penalty_per_extra_bet (float): penalty for each extra leg after the first

    OUTPUT:
    Dictionary with parlay probability and recommendation
    """
    parlay_probability = calculate_parlay_probability(
        probabilities,
        use_penalty=use_penalty,
        penalty_per_extra_bet=penalty_per_extra_bet
    )

    recommendation = evaluate_parlay_bet(parlay_probability)

    return {
        "individual_probabilities": probabilities,
        "parlay_probability": round(parlay_probability, 4),
        "bet_recommendation": recommendation
    }

def predict_parlay_from_games(matchups: list[tuple[str, str, int]], use_penalty: bool = True, penalty_per_extra_bet: float = 0.02):
    results = []
    probabilities = []

    for team1, team2, home_team in matchups:
        game_result = predict_game(team1, team2, home_team)
        results.append(game_result)
        probabilities.append(game_result["team_1_win_probability"])

    parlay_probability = calculate_parlay_probability(
        probabilities,
        use_penalty=use_penalty,
        penalty_per_extra_bet=penalty_per_extra_bet
    )

    recommendation = evaluate_parlay_bet(parlay_probability)

    return {
        "legs": results,
        "individual_probabilities": probabilities,
        "parlay_probability": round(parlay_probability, 4),
        "bet_recommendation": recommendation
    }
