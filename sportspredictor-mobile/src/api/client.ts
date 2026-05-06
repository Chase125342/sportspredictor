import {
  HealthResponse,
  LiveOddsResponse,
  MatchupPredictRequest,
  MatchupPredictResponse,
  ParlayRequest,
  ParlayResponse,
  PlayerPointsPredictRequest,
  PlayerPointsPredictResponse,
  PlayerSearchResponse,
  PredictRequest,
  PredictResponse,
  TotalsPredictRequest,
  TotalsPredictResponse,
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

const nbaTeamNames: Record<string, string> = {
  ATL: "Atlanta Hawks",
  BOS: "Boston Celtics",
  BKN: "Brooklyn Nets",
  CHA: "Charlotte Hornets",
  CHI: "Chicago Bulls",
  CLE: "Cleveland Cavaliers",
  DAL: "Dallas Mavericks",
  DEN: "Denver Nuggets",
  DET: "Detroit Pistons",
  GSW: "Golden State Warriors",
  HOU: "Houston Rockets",
  IND: "Indiana Pacers",
  LAC: "LA Clippers",
  LAL: "Los Angeles Lakers",
  MEM: "Memphis Grizzlies",
  MIA: "Miami Heat",
  MIL: "Milwaukee Bucks",
  MIN: "Minnesota Timberwolves",
  NOP: "New Orleans Pelicans",
  NYK: "New York Knicks",
  OKC: "Oklahoma City Thunder",
  ORL: "Orlando Magic",
  PHI: "Philadelphia 76ers",
  PHX: "Phoenix Suns",
  POR: "Portland Trail Blazers",
  SAC: "Sacramento Kings",
  SAS: "San Antonio Spurs",
  TOR: "Toronto Raptors",
  UTA: "Utah Jazz",
  WAS: "Washington Wizards",
};

const normalizeName = (value: string) => value.trim().toLowerCase();

const findEventForLeg = (leg: ParlayRequest["legs"][number], events: Array<any>) => {
  const team1Name = nbaTeamNames[leg.team_1?.toUpperCase() ?? ""] ?? leg.team_1 ?? "";
  const team2Name = nbaTeamNames[leg.team_2?.toUpperCase() ?? ""] ?? leg.team_2 ?? "";
  const normalized1 = normalizeName(team1Name);
  const normalized2 = normalizeName(team2Name);

  return events.find((event) => {
    const teams = [event.home_team, event.away_team]
      .filter(Boolean)
      .map(normalizeName);
    if (teams.includes(normalized1) && teams.includes(normalized2)) {
      return true;
    }

    const extraTeams = (event.teams ?? []).filter(Boolean).map(normalizeName);
    return extraTeams.includes(normalized1) && extraTeams.includes(normalized2);
  });
};

export async function getLiveOddsForLeg(
  leg: ParlayRequest["legs"][number],
  options?: { useMock?: boolean; oddsApiKey?: string }
): Promise<LiveOddsResponse> {
  const useMock = options?.useMock ?? defaultUseMock;
  if (useMock || !options?.oddsApiKey) {
    return {
      source: "mock",
      team_1_odds: leg.kind === "moneyline" ? 1.90 : undefined,
      team_2_odds: leg.kind === "moneyline" ? 1.95 : undefined,
      total_line: leg.kind === "totals" ? leg.line ?? 220 : undefined,
      total_over_odds: leg.kind === "totals" ? 1.90 : undefined,
      total_under_odds: leg.kind === "totals" ? 1.95 : undefined,
      message: "Mock odds returned when live odds are disabled or no API key is set.",
    };
  }

  if (!leg.team_1 || !leg.team_2) {
    return { source: "api", message: "Team information is required for live odds." };
  }

  const url = new URL("https://api.the-odds-api.com/v4/sports/basketball_nba/odds");
  url.searchParams.set("regions", "us");
  url.searchParams.set("markets", "h2h,totals");
  url.searchParams.set("oddsFormat", "decimal");
  url.searchParams.set("dateFormat", "iso");
  url.searchParams.set("apiKey", options.oddsApiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Odds API request failed with status ${res.status}`);
  }

  const events = (await res.json()) as Array<any>;
  const event = findEventForLeg(leg, events);
  if (!event) {
    return { source: "api", message: "No live game match found for this matchup." };
  }

  const bookmaker = event.bookmakers?.[0];
  if (!bookmaker) {
    return { source: "api", message: "No bookmaker data available for this game." };
  }

  const h2h = bookmaker.markets?.find((market: any) => market.key === "h2h");
  const totals = bookmaker.markets?.find((market: any) => market.key === "totals");
  const response: LiveOddsResponse = { source: "api" };

  if (h2h) {
    const team1Name = nbaTeamNames[leg.team_1.toUpperCase()] ?? leg.team_1;
    const team2Name = nbaTeamNames[leg.team_2.toUpperCase()] ?? leg.team_2;
    const team1Outcome = h2h.outcomes?.find((outcome: any) => normalizeName(outcome.name) === normalizeName(team1Name));
    const team2Outcome = h2h.outcomes?.find((outcome: any) => normalizeName(outcome.name) === normalizeName(team2Name));
    if (team1Outcome?.price != null) response.team_1_odds = Number(team1Outcome.price);
    if (team2Outcome?.price != null) response.team_2_odds = Number(team2Outcome.price);
  }

  if (totals) {
    const overOutcome = totals.outcomes?.find((outcome: any) => normalizeName(outcome.name) === "over");
    const underOutcome = totals.outcomes?.find((outcome: any) => normalizeName(outcome.name) === "under");
    if (overOutcome?.price != null) response.total_over_odds = Number(overOutcome.price);
    if (underOutcome?.price != null) response.total_under_odds = Number(underOutcome.price);
    if (totals.outcomes?.[0]?.point != null) response.total_line = Number(totals.outcomes[0].point);
  }

  if (!response.team_1_odds && !response.team_2_odds && !response.total_over_odds && !response.total_under_odds) {
    response.message = "Live odds are available but no matching outcome was found.";
  }

  return response;
}

export async function getLiveOddsForLegs(
  legs: ParlayRequest["legs"],
  options?: { useMock?: boolean; oddsApiKey?: string }
): Promise<LiveOddsResponse[]> {
  return Promise.all(legs.map((leg) => getLiveOddsForLeg(leg, options)));
}

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

export async function predictTotals(
  payload: TotalsPredictRequest,
  options?: { baseUrl?: string; useMock?: boolean }
): Promise<TotalsPredictResponse> {
  const baseUrl = options?.baseUrl ?? defaultBaseUrl;
  const useMock = options?.useMock ?? defaultUseMock;

  if (useMock) {
    const probability = clamp(0.5 + (payload.bet_type === "over" ? 0.05 : -0.05), 0.01, 0.99);
    return {
      bet_probability: probability,
      recommendation: evaluateBet(probability),
      line: payload.line,
      bet_type: payload.bet_type,
    };
  }

  const res = await fetch(`${baseUrl}/predict/totals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Totals predict failed with status ${res.status}`);
  }

  return res.json();
}

export async function predictPlayerPoints(
  payload: PlayerPointsPredictRequest,
  options?: { baseUrl?: string; useMock?: boolean }
): Promise<PlayerPointsPredictResponse> {
  const baseUrl = options?.baseUrl ?? defaultBaseUrl;
  const useMock = options?.useMock ?? defaultUseMock;

  if (useMock) {
    const confidence = clamp(0.55, 0.01, 0.99);
    return {
      predicted_points: payload.line + (payload.bet_type === "over" ? 3 : -3),
      line: payload.line,
      bet_type: payload.bet_type,
      confidence,
      recommendation: evaluateBet(confidence),
      player_id: payload.player_id ?? 0,
      player_name: payload.player_name ?? "Unknown",
    };
  }

  const res = await fetch(`${baseUrl}/predict/player`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Player predict failed with status ${res.status}`);
  }

  return res.json();
}

export async function searchPlayers(
  name: string,
  options?: { baseUrl?: string; useMock?: boolean }
): Promise<PlayerSearchResponse> {
  const baseUrl = options?.baseUrl ?? defaultBaseUrl;
  const useMock = options?.useMock ?? defaultUseMock;

  if (useMock) {
    return { players: [] };
  }

  const res = await fetch(`${baseUrl}/players/search?name=${encodeURIComponent(name)}`);
  if (!res.ok) {
    throw new Error(`Player search failed with status ${res.status}`);
  }

  return res.json();
}

export async function quoteParlay(
  payload: ParlayRequest,
  options?: { baseUrl?: string; useMock?: boolean }
): Promise<ParlayResponse> {
  const baseUrl = options?.baseUrl ?? defaultBaseUrl;
  const useMock = options?.useMock ?? defaultUseMock;

  if (useMock) {
    const probabilities = payload.legs.map(() => 0.55);
    const parlayProbability = probabilities.reduce((acc, val) => acc * val, 1);
    return {
      legs: payload.legs.map((leg, idx) => ({
        kind: leg.kind,
        description: `Leg ${idx + 1}`,
        probability: probabilities[idx],
        recommendation: evaluateBet(probabilities[idx]),
        odds_decimal: leg.odds_decimal ?? null,
      })),
      parlay_probability: parlayProbability,
      bet_recommendation: "Risky but Playable",
      stake: payload.stake,
      combined_odds_decimal: null,
      potential_payout: null,
      potential_profit: null,
    };
  }

  const res = await fetch(`${baseUrl}/parlay/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Parlay quote failed with status ${res.status}`);
  }

  return res.json();
}
