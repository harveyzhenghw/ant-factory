# Setting Up Firebase (free tier)

Ant Factory uses Firebase for Authentication (Email/Password + Google),
Realtime Database (game data), and Cloud Storage (community photos). All of this
is available on Firebase's free tier (Spark plan) with no credit card.

> **Realtime Database is used instead of Firestore.** Creating a Firestore
> database requires enabling billing on the project, which needs a credit card.
> Realtime Database has the same free tier but can be created without billing.

> **Right now your `.env` is only partially filled.** Without all six
> `EXPO_PUBLIC_FIREBASE_*` values the app shows a "Firebase is not configured"
> screen instead of crashing. Follow this guide to fill it in completely.

---

## 1. Create the Firebase project (free)

1. Go to https://console.firebase.google.com and sign in with a Google account.
2. Click **Add project** (or **Create a project**), name it (e.g. `ant-factory`),
   accept the terms, and click **Create** (turn off Google Analytics if you
   don't need it). This uses the free **Spark** plan.

## 2. Register the web app (this gives you your `.env` values)

1. On the project overview, click the **`</>` Web** icon.
2. Give it a nickname (e.g. `ant-factory-web`) and click **Register app**.
3. On the next screen you'll see a `firebaseConfig` object. Map those values to
   `.env`:

   | `.env` variable                  | `firebaseConfig` field |
   |----------------------------------|------------------------|
   | `EXPO_PUBLIC_FIREBASE_API_KEY`   | `apiKey`               |
   | `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain`         |
   | `EXPO_PUBLIC_FIREBASE_PROJECT_ID`  | `projectId`          |
   | `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | `storageBucket`    |
   | `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
   | `EXPO_PUBLIC_FIREBASE_APP_ID`    | `appId`                |

   Example (real projects have different values):
   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyD...
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=ant-factory.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=ant-factory
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=ant-factory.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
   EXPO_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef
   ```
4. Copy the `firebaseConfig` values into `.env`. **Do not commit `.env`**
   (it's gitignored).

## 3. Enable Authentication

1. In the Firebase console, open **Build → Authentication → Get started**.
2. Go to **Sign-in method** and enable:
   - **Email/Password** (toggle on).
   - **Google** — toggle on. A "Web client ID" will be shown. Copy it to
     `EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB` in `.env`. (The `_IOS` and `_ANDROID`
     values are only needed for native builds; leave them blank for web.)

## 4. Create the Realtime Database

1. Open **Build → Realtime Database → Create database**.
2. Choose a location near you (e.g. `us-central1` or `asia-southeast1`).
3. Choose **Start in locked mode** (rules will be replaced next step).
4. Note the database URL, e.g.
   `https://ant-factory-cb386-default-rtdb.asia-southeast1.firebasedatabase.app/`,
   and put it in `.env` as `EXPO_PUBLIC_FIREBASE_DATABASE_URL`.
5. Open **Rules** and paste the contents of this repo's `database.rules.json`,
   then **Publish**.

## 5. Create the Storage bucket

1. Open **Build → Storage → Get started**.
2. Keep the default bucket (the name matches `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`).
3. Open **Rules** and paste the contents of this repo's `storage.rules`, then
   **Publish**.

## 6. Deploy rules (automatic)

The repo ships with `firebase.json`, `database.rules.json`, and `storage.rules`.
To deploy them in one command:

```bash
npx firebase login         # one-time
npm run rules:deploy
```

This applies the Realtime Database rules and the Storage rules.

## 7. Configure Google Sign-In for web

Google sign-in needs an **Authorized JavaScript origin** matching where the app
runs.

1. In the Firebase console open **Project settings → Your apps → ant-factory-web
   (Web)** → **Authorized JavaScript origins** → **Add domain**.
2. Add `http://localhost:8081` (the Expo dev server) so it works locally.
   When you deploy a static build to a real host, add that domain too — e.g.
   your Netlify URL `https://<your-site>.netlify.app` (see README → Deployment).

## 8. Verify

1. Copy `.env.example` to `.env` and fill every value from steps 2–3.
2. Restart the dev server with a cleared cache:
   ```bash
   npx expo start --web --clear
   ```
3. Open http://localhost:8081 — you should see the **Sign In** screen.
   Create an account and your farm should be created automatically.

---

## Troubleshooting

- **"Firebase is not configured" screen** — one of the six `EXPO_PUBLIC_FIREBASE_*`
  values in `.env` is missing/empty. Check step 2.
- **`auth/invalid-api-key` in the browser console** — `EXPO_PUBLIC_FIREBASE_API_KEY`
  is empty. Fill it and restart with `--clear`.
- **Google button does nothing / pops an error** — `EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB`
  is empty or the localhost origin isn't authorized (step 7).
- **Realtime Database permission errors on the farm screen** — the project is
  still in "locked/test mode" or the rules weren't published. Run
  `npm run rules:deploy`.
- **Sign-in button does nothing / hanging** — hard-refresh the browser and make
  sure the Metro server was started with `--clear`.

## Testing the security rules

The rules are covered by emulator tests (`__tests__/rules/`). They need the
Firebase RTDB emulator, which requires Java:

```bash
npm run test:rules   # boots the emulator and runs the rules tests
```

## Security note

The Honeydew economy is **client-trusted**: with no server, a determined user
could inflate *their own* balance (which only affects their own colony). What
the rules enforce is that **no one can tamper with another player's record**
beyond paying them for a market sale, and balances can't go negative. All
balance changes use atomic transactions/increments so concurrent writes never
corrupt each other. To make balances fully server-authoritative on the free
tier, move the economy writes behind a Netlify Function using the Firebase Admin
SDK — see the README "Security model" section.
