from Data.generate_features import generate_features_teamwins
from Data.fetch_games import fetch_games_teamwins
from prediction_ai import train_model_teamwins, predict_game_teamwins, evaluate_bet_teamwins

print("Getting NBA game data...")
fetch_games_teamwins("2025-26")

print("Populating database...")
generate_features_teamwins()  

print("Training model on data...")
train_model_teamwins()

print("Getting results...")
prob = predict_game_teamwins(
    points_diff=0,
    team_reb_roll=4,
    opponent_reb_roll=5,
    team_ast_roll=4,
    opponent_ast_roll=5,
    home=0
)
print("Win Probability:", round(prob, 3))
print("Evaluation:", evaluate_bet_teamwins(prob))






