# Supabase Auth Setup

This mobile app now requires authentication before users can access the main tabs.

## 1) Create a Supabase project

1. Go to the Supabase dashboard and create a new project.
2. Save the Project URL and the anon public key.
3. Make sure the database region matches your audience if possible.

## 2) Enable Email Auth

1. Open your project in Supabase.
2. Go to Authentication → Providers.
3. Ensure Email is enabled.
4. Decide whether to require email confirmation:
   - If enabled, users must confirm their email before they can sign in.
   - If disabled, users can sign in immediately after signing up.

## 3) Configure redirect settings

1. Go to Authentication → URL Configuration.
2. Add a site URL for your app flow.
3. Add redirect URLs that match your Expo app scheme once you add Google later.
4. For now, email/password works without a special redirect if confirmation is disabled.

## 4) Add environment variables to the Expo app

Create a `.env` file inside `sportspredictor-mobile/` with:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_SUPABASE_REDIRECT_URL` (optional for later email verification / OAuth)
- `EXPO_PUBLIC_API_BASE_URL` (optional, keep `http://localhost:8000`)
- `EXPO_PUBLIC_USE_MOCK=true` (optional)

Example values are in [sportspredictor-mobile/.env.example](sportspredictor-mobile/.env.example).

## 5) Test email/password auth

1. Start the app with Expo.
2. Use the new Auth screen to create an account.
3. If email confirmation is enabled, confirm the email first.
4. Sign in with the same email/password.
5. After sign in, the app should open the tab navigator.

## 6) Useful Supabase notes

- `signUp()` creates the user account.
- `signInWithPassword()` logs the user in.
- Sessions are persisted in AsyncStorage in the mobile app.
- `signOut()` clears the session and returns the user to the auth screen.
