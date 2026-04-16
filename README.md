# sportspredictor

## Mock API (local)

- Install deps (recommend venv): `pip install -r requirements-api.txt`
- Run: `uvicorn api.main:app --reload --host 0.0.0.0 --port 8000`
- Test health: `curl http://localhost:8000/health`
- Test predict (mocked, no model/DB):
  - `curl -X POST http://localhost:8000/predict -H "Content-Type: application/json" -d "{\"points_diff\":0,\"team_reb_roll\":4,\"opponent_reb_roll\":5,\"team_ast_roll\":4,\"opponent_ast_roll\":5,\"home\":1}"`

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
