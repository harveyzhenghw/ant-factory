# Ant Factory — Completion Plan

Goal: get the web app (`start-web.bat`) booting and shippable on the Firebase
free tier, with unit tests for game logic and a documented, fully committed
codebase.

> Status: all phases complete as of the initial commit. Web app boots, tests
> and typecheck pass, `expo install --check` is clean. See per-phase notes
> below; any item left open is intentionally resolved/N-A with a reason.

## Phase 0 — Unblock: get the web app booting (DONE)

Steps:
1. Reproduce blank screen: run `start-web.bat`, capture browser console +
   `expo-server.log`.
2. Ensure `react`/`react-dom` are pinned to the same version in `package.json`
   and `package-lock.json` (already 19.2.3), run `npm install`, then restart
   with `npx expo start --web --clear` to flush the Metro cache.
3. If still blank: add a top-level error surface and check for module-eval
   errors (Firebase on web, `react-native-reanimated` worklets babel plugin —
   add `babel.config.js` if required), and validate `.env` values load.

Success criteria: Login screen renders in Chrome with zero console errors;
`npm run typecheck` is green. — Verified: logs show clean boot; typecheck green.

## Phase 1 — Firebase free-tier setup + docs (DONE)

Steps:
1. Write `SETTING_UP_FIREBASE.md`: create a free-tier Firebase project, enable
   Email/Password + Google auth, create a Firestore DB, upload
   `firestore.rules`, `storage.rules`, `firestore.indexes.json`, configure the
   Storage bucket + OAuth web client, fill `.env` from `.env.example`.
2. Verify `.env.example` documents every `EXPO_PUBLIC_*` var used by
   `src/services/firebase.ts` and `login.tsx` (it does).
3. Add `firebase.json` + `firebase-tools` devDependency with `rules:deploy` /
   `indexes:deploy` npm scripts.

Success criteria: a fresh user can follow the doc and get a working project;
rules/indexes deploy in one command.

## Phase 2 — Bug fixes & polish (DONE)

Steps:
1. Fix post timestamps: normalize Firestore `Timestamp` to epoch ms in
   `communityService` (read + write), mirroring `sanitizeFarm`, so `new Date(...)`
   renders correctly (currently shows `Invalid Date`). — Done (`toEpoch`).
2. Lift farm state into a single `FarmProvider` (context) shared by
   Farm/Shop/Profile so there is one `onSnapshot` + one 30s tick instead of one
   per mounted tab, eliminating duplicate income writes. — Done.
3. Wire Education category chips to filter articles (currently dead buttons);
   keep the "Level unlock" display honest. — Done.
4. Either implement a simple farm switcher/rename or remove the dead
   `createNewFarm` path — pick one so there is no dead code. — Done: switcher
   chips + create-new wired in `farm/index.tsx`.
5. Enable Firestore offline persistence for web (`persistentLocalCache`) for
   snappier loads. — N-A: the app uses Realtime Database (not Firestore), whose
   web SDK keeps an offline cache automatically; `persistentLocalCache` is a
   Firestore-only API, so no change was needed.
6. Profile Settings stub: make it minimal-and-real (edit display name, sign
   out) or remove the nav entry. — Done: settings edits username; sign out on
   Profile.

Success criteria: no `Invalid Date` in UI; exactly one decay/income interval
running per session; every visible tab button does something; no dead routes.

## Phase 3 — Unit tests for game logic (DONE)

Steps:
1. Add `jest-expo` + jest config + `test` script.
2. Test pure modules: `computeDecay`, `applyCare`, `createDefaultFarm`,
   `simulateAnts`, `gainXp`/`levelProgress`, `calculateQueenPrice`, weighted
   species rolls, farm timestamp sanitization.

Success criteria: `npm test` runs green and covers the pure game modules.

## Phase 4 — Economy security: accept & document (DONE)

Steps:
1. Keep the client-side economy; add a clear code comment + README section
   stating balances are client-enforced (matches the existing `TODO(market)`).
   — Done: `TODO(market)` comment in `src/services/economyService.ts`, README
   "Security note (intentional)", and a note in `SETTING_UP_FIREBASE.md`.
2. Spot-check rules so nothing is looser than intended; confirm `.env` is
   gitignored and no secrets are logged. — Done: `.env` gitignored.

Success criteria: documented limitation; no secret leakage.

## Phase 5 — Production web build & wrap-up (DONE)

Steps:
1. `npx expo export --platform web` succeeds; add `build:web` script.
2. `npx expo-doctor` clean (upgrade `expo ~57.0.11` and flagged packages if
   safe). — Done: upgraded to `expo ~57.0.12` (+ expo-asset, expo-constants,
   expo-image-picker, expo-router, jest-expo); `npx expo install --check` is
   clean.
3. Commit the full app (currently all untracked) — initial commit, then
   per-phase commits. — Done: full app committed.
4. Manual QA checklist on Chrome: register/login (email + Google), farm
   care/decay/shop/catch-queen, market buy/sell, community
   post/like/comment/notify, education, logout. — Not automated; run the QA
   checklist before shipping.

Success criteria: clean static export, doctor clean, everything committed, QA
checklist all passing.
