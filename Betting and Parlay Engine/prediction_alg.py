
team_winw = [0.5, 0.3, 0.2] # Weights for the most recent 3 games
team_lossw = [0.3, 0.2, 0.1] 
team_draww = [0.2, 0.2, 0.2]

opponent_winw = [0.4, 0.3, 0.2]
opponent_lossw = [0.3, 0.2, 0.1]
opponent_draww = [0.3, 0.2, 0.1]

team_ppgw = 0.4
team_rpgw = 0.3
team_apgw = 0.2
team_spgw = 0.1
team_oopgw = 0.1

def team_prediction(team_stats):
    if not team_stats:
        return 0
    



player_ppgw = 0.4 
player_apgw = 0.3
player_rpgw = 0.2

def player_prediction(player_stats):
    if not player_stats:
        return 0
    
    