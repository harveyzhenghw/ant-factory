import { ref, get, update } from 'firebase/database';
import { db } from './firebase';
import { UserProfile } from '../types';
import { gainXp } from '../game/progression';

export async function applyXp(userId: string, amount: number): Promise<{ xp: number; level: number } | null> {
  const snap = await get(ref(db, `users/${userId}`));
  if (!snap.exists()) return null;
  const profile = snap.val() as UserProfile;
  const next = gainXp(profile, amount);
  await update(ref(db, `users/${userId}`), next);
  return next;
}

export async function addItemToInventory(userId: string, itemId: string) {
  const snap = await get(ref(db, `users/${userId}`));
  if (!snap.exists()) return;
  const profile = snap.val() as UserProfile;
  const inventory = profile.inventory ?? [];
  await update(ref(db, `users/${userId}`), { inventory: [...inventory, itemId] });
}

export async function removeItemFromInventory(userId: string, itemId: string) {
  const snap = await get(ref(db, `users/${userId}`));
  if (!snap.exists()) return;
  const profile = snap.val() as UserProfile;
  const inventory = profile.inventory ?? [];
  await update(ref(db, `users/${userId}`), { inventory: inventory.filter((id) => id !== itemId) });
}
