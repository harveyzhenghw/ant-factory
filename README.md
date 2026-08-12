# Ant Factory

Build and care for your own virtual ant colony. Feed, water, and clean your
farm, watch the colony grow with animated sprite ants, catch queens, trade on
the market, share your farm with the community, and learn about real ants.

Built with **Expo (SDK 57) + expo-router**, **TypeScript**, **react-native-svg**
sprite rendering, and **Firebase** (Auth, Realtime Database, Storage).

## Quick start

```bash
npm install
npm run web        # start the Expo web dev server (also see start-web.bat)
```

Open http://localhost:8081. Before you can sign in you need a Firebase project —
follow [SETTING_UP_FIREBASE.md](SETTING_UP_FIREBASE.md) (free tier, ~15 minutes)
and fill in `.env` from `.env.example`.

> If the page is blank, make sure no old dev server is occupying port 8081, then
> start with a cleared cache: `npx expo start --web --clear`.

## Scripts

| Script              | Purpose                                    |
|---------------------|--------------------------------------------|
| `npm run web`       | Start the web dev server                   |
| `npm run start`     | Start the dev server (all platforms)       |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`)          |
| `npm test`          | Unit tests for game logic (jest-expo)      |
| `npm run doctor`    | Check Expo dependency versions             |
| `npm run build:web` | Export a static web build to `dist/`       |
| `npm run rules:deploy` | Deploy Realtime Database + Storage rules |

Windows convenience launchers: `start-web.bat`, `start-android.bat`, `start.bat`.

## Project layout

```
app/                        expo-router routes (auth, farm, learn, community, profile)
src/
  components/               AntFarmRenderer (SVG), SpriteAnt, CatchQueenModal, Header, ErrorBoundary
  constants/                colors, ant species, education articles
  contexts/                 AuthProvider, FarmProvider
  game/                     simulation (decay/care), economy, progression, sprite atlases
  services/                 firebase, auth, farm, economy, shop, queen, community, storage
  types/                    shared TypeScript models
assets/ants/pavement/       animated ant sprite atlases (JSON + PNG)
database.rules.json         Realtime Database security rules
storage.rules               Storage security rules
```

## Features

- **Auth**: email/password and Google sign-in (Firebase Auth).
- **Farm**: living colony renderer with animated pavement-ant sprites, food /
  water / cleanliness / health stats that decay over time, daily care actions,
  leveling + XP, and a Honeydew economy.
- **Colonies**: multiple farms with an in-app switcher; create new colonies.
- **Shop**: food, decorations, expansions (new chambers/tunnels), and Test Tube
  kits for catching queens.
- **Queen catching & market**: catch queens from nuptial flights, list them for
  sale, and buy other keepers' queens.
- **Community**: share farm photos, like and comment on posts, and get
  notifications.
- **Education**: articles about ant biology, behavior, and care (some gated by
  player level).

## Testing

```bash
npm test
```

Covers the pure game logic: colony decay, care actions, ant simulation,
leveling/XP, and the queen price formula.

## Deployment (Netlify)

The web app is a static Expo export, so it hosts cleanly on Netlify's free tier.
`netlify.toml` is already configured:

- **Build**: `npx expo export --platform web` → publishes `dist/`
- **Routing**: a catch-all redirect to `index.html` (Expo Router is an SPA)

Set the `EXPO_PUBLIC_FIREBASE_*` variables from `.env.example` in **Site settings
→ Environment variables** so they're inlined at build time. Local dev is
unchanged — keep using `npm run web`; to preview the production bundle locally,
run `npm run build:web && npx serve dist`.

## Security model

This is a single-player colony sim on free infrastructure (Firebase Realtime
Database, no server), so the design is:

- **Balances are client-trusted.** With no server, a determined user could
  inflate *their own* Honeydew. That only affects their own colony, so it's
  accepted. All balance changes go through **atomic transactions / server-side
  `increment()`** (`economyService`, `progressionService`) so concurrent care,
  income, and purchases can never clobber each other.
- **Other players are protected by rules.** `database.rules.json` restricts
  every user to writing only their own record; the *one* cross-user exception is
  that a buyer may **increase** a seller's Honeydew (market payout) and nothing
  else, and balances can never go negative. Market purchases claim the listing
  atomically so two buyers can't both win.
- **Hardening path:** to make balances fully server-authoritative without
  leaving the free tier, move the economy writes behind a **Netlify Function**
  using the Firebase Admin SDK (which bypasses rules and can verify authority).
  The client service layer is the only thing that would change.

See `SETTING_UP_FIREBASE.md` for deploying the rules (`npm run rules:deploy`).
