/**
 * @jest-environment node
 *
 * Security-rules tests for the Realtime Database.
 *
 * These require the RTDB emulator (which needs Java) and are therefore NOT part
 * of the default `npm test` run — they live behind `npm run test:rules`, which
 * boots the emulator via `firebase emulators:exec`. See README "Testing".
 */
import { readFileSync } from 'fs';
import path from 'path';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { ref, get, set, update } from 'firebase/database';

let testEnv: RulesTestEnvironment;

const ALICE = 'alice';
const BOB = 'bob';

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'ant-factory-rules-test',
    database: {
      rules: readFileSync(path.resolve(__dirname, '../../database.rules.json'), 'utf8'),
      host: '127.0.0.1',
      port: 9000,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearDatabase();
  // Seed two user records with security rules disabled.
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.database();
    await set(ref(db, `users/${ALICE}`), {
      username: 'alice', displayName: 'Alice', level: 1, xp: 0, honeydew: 100,
    });
    await set(ref(db, `users/${BOB}`), {
      username: 'bob', displayName: 'Bob', level: 1, xp: 0, honeydew: 100,
    });
  });
});

function db(uid: string | null) {
  return uid
    ? testEnv.authenticatedContext(uid).database()
    : testEnv.unauthenticatedContext().database();
}

describe('users node', () => {
  it('lets the owner read and write their own record', async () => {
    await assertSucceeds(get(ref(db(ALICE), `users/${ALICE}`)));
    await assertSucceeds(update(ref(db(ALICE), `users/${ALICE}`), { displayName: 'Alice2' }));
  });

  it('blocks reading another user record', async () => {
    await assertFails(get(ref(db(ALICE), `users/${BOB}`)));
  });

  it('blocks tampering with another user profile fields', async () => {
    await assertFails(update(ref(db(ALICE), `users/${BOB}`), { displayName: 'hacked' }));
    await assertFails(update(ref(db(ALICE), `users/${BOB}`), { level: 99 }));
  });

  it('allows only increasing another user honeydew (market payout)', async () => {
    // Paying Bob (increase) is allowed; draining Bob (decrease) is denied.
    await assertSucceeds(update(ref(db(ALICE), `users/${BOB}`), { honeydew: 150 }));
    await assertFails(update(ref(db(ALICE), `users/${BOB}`), { honeydew: 50 }));
  });

  it('forbids negative balances', async () => {
    await assertFails(update(ref(db(ALICE), `users/${ALICE}`), { honeydew: -1 }));
  });

  it('rejects unauthenticated access', async () => {
    await assertFails(get(ref(db(null), `users/${ALICE}`)));
  });
});
