# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Platform: Web Only

This project targets **web only** (`npm run web` / `npm run build:web`). Do not add or maintain native iOS/Android-specific code paths unless explicitly asked.

# Google Sign-In on Web: known benign console warnings

Google OAuth uses the expo-auth-session popup flow (`Google.useIdTokenAuthRequest` + `promptAsync` in `app/(auth)/login.tsx`). Chrome logs warnings like:

- `Cross-Origin-Opener-Policy policy would block the window.closed call.`
- `Cross-Origin-Opener-Policy policy would block the window.close call.`

These are **expected and harmless**: `accounts.google.com` serves `Cross-Origin-Opener-Policy: same-origin`, which isolates the popup from the opener window. Sign-in still completes via expo-web-browser's localStorage/AppState fallback when the user returns focus to the main tab. Do not attempt to "fix" these with response-header changes or by switching auth libraries.
