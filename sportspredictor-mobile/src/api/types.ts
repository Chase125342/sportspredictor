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

export type TotalsPredictRequest = {
  team_1: string;
  team_2: string;
  line: number;
  bet_type: "over" | "under";
};

export type TotalsPredictResponse = {
  bet_probability: number;
  recommendation: string;
  line: number;
  bet_type: string;
};

export type PlayerPointsPredictRequest = {
  player_name?: string;
  player_id?: number;
  line: number;
  bet_type: "over" | "under";
};

export type PlayerPointsPredictResponse = {
  predicted_points: number;
  line: number;
  bet_type: string;
  confidence: number;
  recommendation: string;
  player_id: number;
  player_name: string;
};

export type ParlayLeg = {
  kind: "moneyline" | "totals" | "player_points";
  odds_decimal?: number;
  team_1?: string;
  team_2?: string;
  home_team?: number;
  line?: number;
  bet_type?: "over" | "under";
  player_name?: string;
  player_id?: number;
};

export type ParlayRequest = {
  legs: ParlayLeg[];
  stake: number;
  use_penalty: boolean;
  penalty_per_extra_bet: number;
};

export type ParlayLegResult = {
  kind: string;
  description: string;
  probability: number;
  recommendation: string;
  odds_decimal?: number | null;
};

export type ParlayResponse = {
  legs: ParlayLegResult[];
  parlay_probability: number;
  bet_recommendation: string;
  stake: number;
  combined_odds_decimal?: number | null;
  potential_payout?: number | null;
  potential_profit?: number | null;
};

export type LiveOddsResponse = {
  source: "api" | "mock";
  team_1_odds?: number | null;
  team_2_odds?: number | null;
  total_line?: number | null;
  total_over_odds?: number | null;
  total_under_odds?: number | null;
  message?: string;
};

export type PlayerSearchResponse = {
  players: Array<{ id: number; full_name: string }>;
};
