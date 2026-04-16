# Run Local: Web and Mobile

This app uses Expo (managed workflow). Choose web or device. For mobile, the fastest path is Expo Go. iOS builds require macOS or Expo Go.

## Prereqs
- Node 18+ with npm.
- Install Expo CLI (optional): `npm install -g expo-cli` (or use `npx expo`).
- For API: Python 3.10+ if you want the mock FastAPI service running.

## Start the mock API (optional, for real calls)
```bash
pip install -r requirements-api.txt
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```
Defaults to mock mode in-app, so API is optional for UI-only testing.

## Web (Expo web)
```bash
cd sportspredictor-mobile
npm install   # first time
npm run web   # opens http://localhost:19006
```
- Use the Settings tab to toggle mock/real API and set base URL (default `http://localhost:8000`).

## Android (Expo Go, Windows or macOS)
1) Install Expo Go from Play Store on the device.
2) Ensure device and dev machine are on the same network. If corporate Wi-Fi blocks LAN, use USB or Tunnel (press `?` in Expo CLI and choose Tunnel).
3) Run:
   ```bash
   cd sportspredictor-mobile
   npm start
   ```
4) When the QR appears in the terminal or browser UI, scan with Expo Go (Android camera). The app will load.

## iOS
### Fastest (Expo Go)
- Works on Windows and macOS.
- Install Expo Go from App Store on the iPhone.
- Same steps as Android: `npm start`, ensure same network or Tunnel, scan the QR with the iPhone camera → open in Expo Go.

### Building an iOS binary (requires macOS)
- Only possible on macOS (or via Expo Application Services cloud builds):
  ```bash
  cd sportspredictor-mobile
  npm install
  npx expo prebuild ios   # if you switch to bare workflow (not needed for Expo Go)
  npx expo run:ios        # runs on local Simulator (needs Xcode)
  ```
- For cloud build without Xcode: `npx expo build:ios` or `npx eas build -p ios` (requires Expo account and credentials).

## Troubleshooting
- If web complains about missing deps, run: `npx expo install react-dom react-native-web` (already added in repo).
- If devices can’t connect, try Expo Tunnel from the CLI menu, or verify firewalls/LAN settings.
- If API calls fail, toggle mock mode in Settings or start the FastAPI server at `http://localhost:8000`.
