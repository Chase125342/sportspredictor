# sportspredictor

## API (local)

- Install deps (recommend venv): `pip install -r requirements-api.txt`
- Run: `uvicorn api.main:app --reload --host 0.0.0.0 --port 8000`
- Test health: `curl http://localhost:8000/health`
- Get teams from DB:
  - `curl http://localhost:8000/teams`
- Predict from matchup (DB + model):
  - `curl -X POST http://localhost:8000/predict/matchup -H "Content-Type: application/json" -d "{\"team_1\":\"LAL\",\"team_2\":\"BOS\",\"home_team\":1}"`
- Predict from manual feature vector (model only):
  - `curl -X POST http://localhost:8000/predict -H "Content-Type: application/json" -d "{\"points_diff\":0,\"team_reb_roll\":4,\"opponent_reb_roll\":5,\"team_ast_roll\":4,\"opponent_ast_roll\":5,\"home\":1}"`

The frontend prediction screen now uses `/teams` + `/predict/matchup` when mock mode is OFF.

## Mobile V0 (frontend only)

- Lives in `sportspredictor-mobile/`. Plan in [PLAN.md](PLAN.md).
- Install deps: `cd sportspredictor-mobile && npm install`.
- Run locally with Expo: `npm start` → scan QR with Expo Go or press `w` for web.
- Toggle mock/real API in-app (Settings tab). Default base URL `http://localhost:8000`.
- V0 uses mock API client; no real data/model/auth yet.

## Local run guide

See [RUN_LOCAL.md](RUN_LOCAL.md) for web/Android/iOS steps (Expo Go, web, and optional API).

## Authentication setup

See [AUTH_SETUP.md](AUTH_SETUP.md) for Supabase email/password setup and required Expo env vars.

## Parlay probability

[parlay.py](parlay.py) now provides parlay probability utilities:

- Multiply multiple prediction probabilities together.
- Optionally apply a penalty for larger parlays.
- Evaluate the final result with a simple recommendation (`Good Parlay Bet`, `Risky but Playable`, `Avoid`).

Example:

- Probabilities: 0.70, 0.60, 0.80
- Combined parlay probability: 0.70 × 0.60 × 0.80 = 0.336

Note: the mobile Parlay tab is still a UI placeholder and is not yet wired to this parlay logic.
