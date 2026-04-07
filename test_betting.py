'''

from prediction_ai import predict_game, evaluate_bet
#could not get pytest working 
def run_test_cases():
    test_cases = [
        {
            "name": "Strong Home Favorite",
            "points_diff": 10,
            "team_reb_roll": 5,
            "opponent_reb_roll": 3,
            "team_ast_roll": 4,
            "opponent_ast_roll": 2,
            "home": 1
        },
        {
            "name": "Slight Underdog",
            "points_diff": -2,
            "team_reb_roll": 4,
            "opponent_reb_roll": 5,
            "team_ast_roll": 3,
            "opponent_ast_roll": 4,
            "home": 0
        },
        {
            "name": "Even Match",
            "points_diff": 0,
            "team_reb_roll": 3,
            "opponent_reb_roll": 3,
            "team_ast_roll": 3,
            "opponent_ast_roll": 3,
            "home": 1
        },
        {
            "name": "Bad Bet Example",
            "points_diff": -8,
            "team_reb_roll": 2,
            "opponent_reb_roll": 5,
            "team_ast_roll": 1,
            "opponent_ast_roll": 4,
            "home": 0
        }
    ]

    for case in test_cases:
        print(f"\n=== Scenario: {case['name']} ===")
        prob = predict_game(
            points_diff=case["points_diff"],
            team_reb_roll=case["team_reb_roll"],
            opponent_reb_roll=case["opponent_reb_roll"],
            team_ast_roll=case["team_ast_roll"],
            opponent_ast_roll=case["opponent_ast_roll"],
            home=case["home"]
        )
        bet_eval = evaluate_bet(prob)
        print(f"Win Probability: {prob:.3f}")
        print(f"Bet Evaluation: {bet_eval}")

if __name__ == "__main__":
    run_test_cases()
'''

