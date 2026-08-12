# Ant Factory — Improvements (round 2)

The original `PLAN.md` got the app booting and shippable. This round hardens
correctness/security, deepens the game loop, and sets up web deployment. Target
stays the same: **localhost dev + a static web build on the free tier**, now
deployable to **Netlify**.

## Phase 1 — Correctness & data-integrity (DONE)

1. **Compounding decay bug.** `computeDecay` persisted decayed values without
   advancing the resource clocks, so `onValue` + the 30s tick re-applied the
   same decay every cycle, collapsing colonies far faster than designed.
   - `computeDecay` now advances each resource clock by exactly the whole units
     of decay it consumed (remainder carries), and a new `lastTickAt` clock
     drives **time-integrated** health/population so behavior no longer depends
     on the tick rate. `FarmContext` stores the raw state as the single source
     of truth and derives decay for display. Idempotency is covered by a test.
2. **Atomic economy.** `addHoneydew`, `purchaseItem`, `applyXp`, inventory
   add/remove, and `buyMarketListing` were read-modify-write and lost updates
   under concurrent care/income/purchases. All now use `runTransaction` /
   server-side `increment()`. Market buys claim the listing atomically so two
   buyers can't both win, and pay via `increment` (no cross-user reads).
3. **Security rules.** The old `users` rule let any authed user overwrite any
   other user's record. Now: owner-only writes, with a single exception — a
   buyer may only **increase** another user's `honeydew` (market payout) and
   nothing else; balances can't go negative; buyers may claim/remove listings.

## Phase 2 — Game-design depth (DONE)

- Population was a monotonic ratchet down. It now **grows toward a capacity**
  (chambers × 15 + installed-queen bonus) when the colony is healthy, and only
  shrinks while health is poor. Population is stored as a float so slow growth
  accumulates instead of being floored away.
- **Caught queens connect to a farm.** `CatchQueenModal` offers "Add to this
  Colony", which raises the population cap/growth via `installQueen`.
- Income is **elapsed-based** (honeydew/hour, capped at 24h of offline earnings)
  instead of a flat per-tick amount, so it's independent of the tick rate.

## Phase 3 — UX & platform polish (DONE)

- Accessibility labels/roles on the farm screen's controls (care actions,
  shop/market buttons, colony chips, catch button, balance).
- Farm screen shows the **resident queen** and uses the real **population cap**
  as the Pop bar's max.
- Cheap "walk bob" for active ants derived from the existing frame counter (no
  extra timers/re-renders). Full positional interpolation was intentionally
  deferred — it'd add per-ant animation state to dozens of SVG nodes for little
  gain in an idle game.

## Phase 4 — Tests & CI (DONE)

- Extracted the duplicated `toEpoch` timestamp helper into `src/services/time.ts`
  with unit tests.
- New simulation tests: idempotent decay, health drift, population growth/cap.
- **Rules tests** (`__tests__/rules/`) via `@firebase/rules-unit-testing`, run
  with `npm run test:rules` (needs the RTDB emulator + Java; kept out of the
  default `npm test`).
- **GitHub Actions CI** (`.github/workflows/ci.yml`): install → typecheck →
  lint → unit tests → rules tests.

## Phase 5 — Tooling, deploy & economy rethink (DONE)

- **ESLint (flat) + Prettier** configured with `lint`/`format` scripts.
- **Netlify** deploy via `netlify.toml` (Expo web export → `dist/` + SPA
  redirect). Localhost dev is unchanged.
- **Economy rethink:** for a single-player sim on free infra, full
  server-authoritative balances are over-engineering. The real risks —
  cross-user tampering and write races — are closed for free (rules + atomic
  transactions). Self-balance stays client-trusted (documented), with Netlify
  Functions + Firebase Admin noted as the optional hardening path.

## Follow-ups (not done)

- Smooth ant pathfinding/motion (deferred, see Phase 3).
- Server-authoritative economy via Netlify Functions (optional; see README).
- Manual QA pass on Chrome after deploying to Netlify.
