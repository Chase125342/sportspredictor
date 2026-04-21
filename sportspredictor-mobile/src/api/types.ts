export type PredictRequest = {
  points_diff: number;
  team_reb_roll: number;
  opponent_reb_roll: number;
  team_ast_roll: number;
  opponent_ast_roll: number;
  home: number;
};

export type MatchupPredictRequest = {
  team_1: string;
  team_2: string;
  home_team: number;
};

export type PredictResponse = {
  probability: number;
  label: "Good Bet" | "Slight Edge" | "Avoid";
  source: "api" | "mock" | "api-manual" | "api-matchup";
};

export type MatchupPredictResponse = PredictResponse & {
  team_1: string;
  team_2: string;
  features: {
    points_diff: number;
    team_reb_roll: number;
    opponent_reb_roll: number;
    team_ast_roll: number;
    opponent_ast_roll: number;
    home: number;
  };
};

export type TeamsResponse = {
  teams: string[];
};

export type HealthResponse = {
  status: string;
  mode?: string;
  model_ready?: boolean;
  database_ready?: boolean;
};
