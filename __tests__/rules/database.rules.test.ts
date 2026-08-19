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

async function seed(pathValue: Record<string, unknown>) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const d = ctx.database();
    for (const [p, v] of Object.entries(pathValue)) {
      await set(ref(d, p), v);
    }
  });
}

describe('farms node', () => {
  beforeEach(async () => {
    await seed({ 'farms/f1': { userId: ALICE, name: 'Alice Colony' } });
  });

  it('allows an authenticated user to read the farms collection (needed for the userId query)', async () => {
    await assertSucceeds(get(ref(db(ALICE), 'farms')));
    await assertSucceeds(get(ref(db(BOB), 'farms')));
  });

  it('rejects unauthenticated reads of farms', async () => {
    await assertFails(get(ref(db(null), 'farms')));
  });

  it('lets the owner write their farm but blocks writing someone else\'s', async () => {
    await assertSucceeds(update(ref(db(ALICE), 'farms/f1'), { name: 'Renamed' }));
    await assertFails(update(ref(db(BOB), 'farms/f1'), { name: 'Hijacked' }));
  });
});

describe('queens node', () => {
  beforeEach(async () => {
    await seed({ 'queens/q1': { userId: ALICE, species: 'pavement', forSale: false, price: 0 } });
  });

  it('allows an authenticated user to read the queens collection (needed for getMyQueens/market)', async () => {
    await assertSucceeds(get(ref(db(BOB), 'queens')));
  });

  it('rejects unauthenticated reads of queens', async () => {
    await assertFails(get(ref(db(null), 'queens')));
  });

  it('blocks writing another user\'s queen', async () => {
    await assertFails(update(ref(db(BOB), 'queens/q1'), { price: 1 }));
  });
});

describe('marketListings node', () => {
  beforeEach(async () => {
    await seed({ 'marketListings/l1': { sellerId: ALICE, sellerName: 'alice', type: 'queen', price: 50, createdAt: 1 } });
  });

  it('allows an authenticated user to read the marketListings collection', async () => {
    await assertSucceeds(get(ref(db(BOB), 'marketListings')));
  });

  it('rejects unauthenticated reads of marketListings', async () => {
    await assertFails(get(ref(db(null), 'marketListings')));
  });
});

describe('notifications node', () => {
  beforeEach(async () => {
    await seed({ 'notifications/alice/n1': { userId: ALICE, type: 'system', read: false, createdAt: 1 } });
  });

  it('lets the owner read their own notifications feed', async () => {
    await assertSucceeds(get(ref(db(ALICE), `notifications/${ALICE}`)));
  });

  it('blocks reading another user\'s notifications feed', async () => {
    await assertFails(get(ref(db(BOB), `notifications/${ALICE}`)));
    await assertFails(get(ref(db(null), `notifications/${ALICE}`)));
  });
});
