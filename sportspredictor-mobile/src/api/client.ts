import {
  HealthResponse,
  MatchupPredictRequest,
  MatchupPredictResponse,
  PredictRequest,
  PredictResponse,
  TeamsResponse,
} from "./types";

const defaultBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const defaultUseMock = (process.env.EXPO_PUBLIC_USE_MOCK ?? "true").toLowerCase() !== "false";

const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

const evaluateBet = (probability: number): PredictResponse["label"] => {
  if (probability > 0.6) return "Good Bet";
  if (probability > 0.52) return "Slight Edge";
  return "Avoid";
};

const mockProbability = (payload: PredictRequest): number => {
  let base = 0.5;
  base += 0.015 * payload.points_diff;
  base += 0.01 * (payload.team_reb_roll - payload.opponent_reb_roll);
  base += 0.01 * (payload.team_ast_roll - payload.opponent_ast_roll);
  base += 0.02 * payload.home;
  return clamp(base, 0.01, 0.99);
};

export async function getHealth(options?: { baseUrl?: string; useMock?: boolean }): Promise<HealthResponse> {
  const baseUrl = options?.baseUrl ?? defaultBaseUrl;
  const useMock = options?.useMock ?? defaultUseMock;

  if (useMock) {
    return { status: "ok", mode: "mock" };
  }

  const res = await fetch(`${baseUrl}/health`);
  if (!res.ok) {
    throw new Error(`Health check failed with status ${res.status}`);
  }
  return res.json();
}

const mockTeams = [
  "ATL",
  "BOS",
  "BKN",
  "CHA",
  "CHI",
  "CLE",
  "DAL",
  "DEN",
  "DET",
  "GSW",
  "HOU",
  "IND",
  "LAC",
  "LAL",
  "MEM",
  "MIA",
  "MIL",
  "MIN",
  "NOP",
  "NYK",
  "OKC",
  "ORL",
  "PHI",
  "PHX",
  "POR",
  "SAC",
  "SAS",
  "TOR",
  "UTA",
  "WAS",
];

export async function getTeams(options?: { baseUrl?: string; useMock?: boolean }): Promise<TeamsResponse> {
  const baseUrl = options?.baseUrl ?? defaultBaseUrl;
  const useMock = options?.useMock ?? defaultUseMock;

  if (useMock) {
    return { teams: mockTeams };
  }

  const res = await fetch(`${baseUrl}/teams`);
  if (!res.ok) {
    throw new Error(`Teams request failed with status ${res.status}`);
  }

  return res.json();
}

export async function predict(
  payload: PredictRequest,
  options?: { baseUrl?: string; useMock?: boolean }
): Promise<PredictResponse> {
  const baseUrl = options?.baseUrl ?? defaultBaseUrl;
  const useMock = options?.useMock ?? defaultUseMock;

  if (useMock) {
    const probability = mockProbability(payload);
    return { probability, label: evaluateBet(probability), source: "mock" };
  }

  const res = await fetch(`${baseUrl}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Predict request failed with status ${res.status}`);
  }

  const data = (await res.json()) as PredictResponse;
  return {
    probability: data.probability,
    label: data.label ?? evaluateBet(data.probability),
    source: data.source ?? "api",
  };
}

export async function predictMatchup(
  payload: MatchupPredictRequest,
  options?: { baseUrl?: string; useMock?: boolean }
): Promise<MatchupPredictResponse> {
  const baseUrl = options?.baseUrl ?? defaultBaseUrl;
  const useMock = options?.useMock ?? defaultUseMock;

  if (useMock) {
    const home = payload.home_team > 0 ? 1 : 0;
    const nameBias = ((payload.team_1.charCodeAt(0) || 75) - (payload.team_2.charCodeAt(0) || 75)) / 50;
    const probability = clamp(0.5 + nameBias + home * 0.03, 0.01, 0.99);
    return {
      team_1: payload.team_1.toUpperCase(),
      team_2: payload.team_2.toUpperCase(),
      probability,
      label: evaluateBet(probability),
      source: "mock",
      features: {
        points_diff: Number((nameBias * 12).toFixed(2)),
        team_reb_roll: 44,
        opponent_reb_roll: 43,
        team_ast_roll: 26,
        opponent_ast_roll: 24,
        home,
      },
    };
  }

  const res = await fetch(`${baseUrl}/predict/matchup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Matchup predict failed with status ${res.status}`);
  }

  return res.json();
}
