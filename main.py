from Data.generate_features import generate_features
from Data.fetch_games import fetch_games
from prediction_ai import train_model, predict_game, evaluate_bet

print("Getting game data...")
fetch_games(2026, api_key="jqlM+HDzctI9oyuGgU/DSPUXWjFGgyfHemuGDxpA6eTwI85153RFO6/9LbW+2IFH")


print("Populating database...")
generate_features()  

print("Training model on data...")
train_model()

print("Getting results...")
prob = predict_game(
    points_diff=0,
    team_reb_roll=1,
    opponent_reb_roll=8,
    team_ast_roll=1,
    opponent_ast_roll=6,
    home=0
)
print("Win Probability:", round(prob, 3))
print("Evaluation:", evaluate_bet(prob))






