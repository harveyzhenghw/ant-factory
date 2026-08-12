import { ref, runTransaction } from 'firebase/database';
import { db } from './firebase';
import { UserProfile } from '../types';
import { gainXp } from '../game/progression';

// XP and level advance together, so transact over the whole user record to keep
// them consistent under concurrent care/catch rewards.
export async function applyXp(userId: string, amount: number): Promise<{ xp: number; level: number } | null> {
  const result = await runTransaction(ref(db, `users/${userId}`), (profile: UserProfile | null) => {
    if (!profile) return profile; // user record missing → abort
    const next = gainXp(profile, amount);
    return { ...profile, xp: next.xp, level: next.level };
  });
  if (!result.committed || !result.snapshot.exists()) return null;
  const p = result.snapshot.val() as UserProfile;
  return { xp: p.xp, level: p.level };
}

export async function addItemToInventory(userId: string, itemId: string) {
  await runTransaction(ref(db, `users/${userId}/inventory`), (inventory: string[] | null) => {
    return [...(inventory ?? []), itemId];
  });
}

export async function removeItemFromInventory(userId: string, itemId: string) {
  await runTransaction(ref(db, `users/${userId}/inventory`), (inventory: string[] | null) => {
    const arr = inventory ?? [];
    const idx = arr.indexOf(itemId);
    if (idx === -1) return arr;
    // Remove a single instance (inventory can hold duplicates, e.g. test tubes).
    return [...arr.slice(0, idx), ...arr.slice(idx + 1)];
  });
}
