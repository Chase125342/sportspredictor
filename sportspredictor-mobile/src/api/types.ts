export type PredictRequest = {
  points_diff: number;
  team_reb_roll: number;
  opponent_reb_roll: number;
  team_ast_roll: number;
  opponent_ast_roll: number;
  home: number;
};

export type PredictResponse = {
  probability: number;
  label: "Good Bet" | "Slight Edge" | "Avoid";
  source: "api" | "mock";
};

export type HealthResponse = {
  status: string;
  mode?: string;
};
