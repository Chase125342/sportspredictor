# React Native App (V0) Plan

Goal: Stand up a frontend-only React Native app that runs locally (Expo for fastest iteration) with stubbed API layer and screens; no real data/model usage yet.

## 1) Tooling & Dev Loop

- Use Expo (managed workflow) for quick local preview via Expo Go on iOS/Android or web preview; fall back to React Native CLI only if device policies block Expo Go.
- Install Node 18+, npm or yarn. Install Expo CLI globally (`npm install -g expo-cli` or `npx expo`).
- Local run: `npx expo start` → scan QR with Expo Go or press `w` for web preview.

## 2) Project Bootstrap

- Create app: `npx create-expo-app sportspredictor-mobile --template blank-typescript`.
- Enable ESLint/Prettier; add `babel-plugin-module-resolver` for clean import aliases (e.g., `@/components`).
- Set up `app.json` with name/icon placeholders; set `scheme` for future deep links.

## 3) App Structure (Frontend Only)

- `app/` (Expo router) or `src/` with React Navigation stack:
  - `navigation/RootNavigator.tsx` (stack + tab setup).
  - `screens/`:
    - `HomeScreen`: static hero + CTA buttons to Predictions/Parlays.
    - `PredictionsScreen`: form UI stub (inputs for points_diff, rebounds, assists, home toggle) and a disabled "Predict" button; shows placeholder result card.
    - `ParlayScreen`: list of placeholder legs and a stubbed payout section.
    - `SettingsScreen`: toggle for dark mode (local state only), API base URL text input (stored locally for future use).
  - `components/`: `Button`, `Card`, `FormField`, `Toggle`, `ListItem` with consistent theming.
  - `theme/`: color palette, spacing, typography tokens; light/dark variants.
  - `api/`: stub client with request/response types and mocked responses; no network calls yet.
  - `store/`: simple state (Zustand or React Context) for theme and mock data.

## 4) UI/UX Guidelines

- Avoid default fonts; pick one Google Font via Expo (e.g., Manrope or Space Grotesk).
- Use a clear visual direction (e.g., deep navy background, accent coral) and cards with subtle shadows; avoid generic purple.
- Motion: light entrance fade/slide for cards and CTA; keep 60fps on mobile.
- Responsive layout: flex-based; ensure web preview looks acceptable but mobile is primary.

## 5) Stubbed API Layer

- Create `api/client.ts` with a base URL read from env (`EXPO_PUBLIC_API_BASE_URL`) and a mock mode flag.
- Add `api/types.ts` for DTO shapes: `PredictRequest`, `PredictResponse`, `HealthResponse`.
- Implement mock functions returning hardcoded data to drive the UI (no fetch yet).
- Add a simple status indicator on screens showing "API: mock mode".

## 6) State & Config

- Light global store for theme and API base URL; persist via `expo-secure-store` or `AsyncStorage`.
- Form state local to screens; validation with Zod or lightweight checks.

## 7) Auth Plan (Email + Google)

- Provider: Supabase Auth (managed Postgres + auth, good Expo support). Alternative: Firebase Auth if you already use Firebase elsewhere.
- Flows to stub now: login/register screens with UI only; connect later to Supabase. Show mock user state and a placeholder "Sign in with Google" button.
- Packages to add when wiring: `@supabase/supabase-js`, `@react-native-google-signin/google-signin` (if using native Google), or `expo-auth-session` (works well in Expo managed). Use `expo-secure-store` to persist session tokens.
- Supabase setup (outside codebase):
  1. Create a Supabase project; note the project URL and anon public key.
  2. In Supabase Auth settings, enable Google provider; supply Google OAuth Client IDs (see below).
  3. Configure redirect/deep link scheme in Expo (e.g., `sportspredictor://auth-callback`) and add to Supabase redirect whitelist.
- Google OAuth setup (outside codebase):
  1. Create a Google Cloud project → OAuth consent screen (External) → Scopes: basic profile/email.
  2. Create OAuth client IDs: one for Android, one for iOS, one for Web (Expo auth session). Capture client IDs.
  3. For Android: add package name and SHA-1 (from `expo credentials:android` or `keytool`). For iOS: add bundle ID (from `app.json`/`app.config.ts`). For Web: set redirect URI from Expo Auth Session (`https://auth.expo.io/@your-username/your-app-slug`).
  4. Add those client IDs into app config/env vars (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`).
- Client logic (when enabled):
  - Initialize Supabase client with URL/key.
  - Email/password: call `supabase.auth.signInWithPassword`; handle MFA/edge cases later.
  - Google: use `GoogleSignin` (bare) or `AuthSession` (Expo) to get id_token, then `supabase.auth.signInWithIdToken({ provider: 'google', token })`.
  - Store session in secure storage; refresh on app start; show signed-in/out UI accordingly.

## 7) Navigation & Routing

- Use React Navigation native stack + bottom tabs: Tabs for Home, Predictions, Parlays, Settings.
- Ensure safe-area handling with `react-native-safe-area-context`.

## 8) Testing & Quality

- Add basic unit tests for components with Jest/React Native Testing Library; snapshot for key screens.
- Lint/format scripts: `lint`, `format`, `test` in package.json.

## 9) Delivery Checklist for V0 (no backend wiring)

- Expo app runs locally (device + web) with all screens navigable.
- Theming tokens in place; dark mode toggle works locally.
- Stubbed API client present; UI reflects mock data and shows mock-mode banner.
- Forms render with disabled submit; shows placeholder results/legs.
- Scripts documented in README section (mobile) with run/test instructions.

## 10) Next Step (when ready)

- Add real API calls to your Python service endpoints (`/predict`, `/train`, `/health`) once backend is available; flip off mock mode.
