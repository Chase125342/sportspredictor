# Run Local: Web and Mobile

This guide gets the full app running locally with **real predictions** from your backend API and database.

## 1) Prerequisites

- Node 18+ and npm.
- Python 3.13 (or 3.10+) available in terminal.
- From project root, install API dependencies:

```bash
pip install -r requirements-api.txt
```

If `uvicorn` is not found, run with explicit Python:

```bash
c:/python313/python.exe -m pip install -r requirements-api.txt
```

## 2) Environment setup (frontend)

In `sportspredictor-mobile/.env` ensure:

```dotenv
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
EXPO_PUBLIC_USE_MOCK=false
```

`EXPO_PUBLIC_USE_MOCK=false` is required for live predictions.

## 3) Start backend API (required for live predictions)

From project root:

```bash
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

Or with explicit Python:

```bash
c:/python313/python.exe -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

Quick API checks:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/teams
curl -X POST http://localhost:8000/predict/matchup -H "Content-Type: application/json" -d "{\"team_1\":\"LAL\",\"team_2\":\"BOS\",\"home_team\":1}"
```

## 4) Start frontend

From project root:

```bash
cd sportspredictor-mobile
npm install
npm run web
```

For mobile device preview:

```bash
npm start
```

## 5) In-app steps (as a user)

1. Sign in with your Supabase account.
2. Go to **Profile → Connection**.
3. Set **Use mock API** to OFF.
4. Confirm **API Base URL** is `http://localhost:8000`.
5. Tap **Check Health** and verify it returns `ok` / `live-model`.
6. Go to **Predict**:

- Set `Team 1` and `Team 2` (must be different).
- Set `Is Team 1 Home?` to `1` or `0`.
- Tap **Predict matchup**.

7. Read output:

- Probability = Team 1 win probability.
- Label = `Good Bet` / `Slight Edge` / `Avoid`.
- Source should show `api-matchup` when live.

## 6) What is live vs placeholder right now

- **Predictions tab**: live API + DB + trained model.
- **Parlays tab**: UI placeholder only (mock display, no backend odds/parlay engine wired yet).

## 7) Android (Expo Go, Windows or macOS)

1. Install Expo Go on Android.
2. Ensure phone and laptop are on same network.
3. Run `npm start` in `sportspredictor-mobile`.
4. Scan QR in Expo Go.

## 8) iOS options

### iOS on Windows/macOS (recommended)

- Install Expo Go on iPhone.
- Run `npm start` and scan QR with iPhone camera / Expo Go.

### iOS simulator / native build (macOS only)

```bash
cd sportspredictor-mobile
npx expo run:ios
```

## 9) Troubleshooting

- Seeing `mock` in predictions: toggle **Use mock API** OFF in Profile.
- `Health check failed`: backend is not running or URL is wrong.
- Web missing dependencies: run `npx expo install react-dom react-native-web`.
- QR not working: use Expo tunnel (`npx expo start --tunnel`) or manual URL entry in Expo Go.
