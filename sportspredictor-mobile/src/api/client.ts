import { PredictRequest, PredictResponse, HealthResponse } from "./types";

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
