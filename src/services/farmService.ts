import { ref, get, update, remove, push, query, orderByChild, equalTo } from 'firebase/database';
import { db } from './firebase';
import { AntFarm } from '../types';
import { createDefaultFarm } from '../game/simulation';
import { toEpoch } from './time';

export function sanitizeFarm(farm: AntFarm): AntFarm {
  return {
    ...farm,
    createdAt: toEpoch(farm.createdAt),
    lastFedAt: toEpoch(farm.lastFedAt),
    lastWateredAt: toEpoch(farm.lastWateredAt),
    lastCleanedAt: toEpoch(farm.lastCleanedAt),
    // Legacy farms predate lastTickAt; seed it from createdAt so decay starts fresh.
    lastTickAt: toEpoch(farm.lastTickAt ?? farm.createdAt),
  };
}

export async function createFarm(userId: string, name: string): Promise<AntFarm> {
  const farm = createDefaultFarm(userId, name);
  const newRef = await push(ref(db, 'farms'), farm);
  return { ...farm, id: newRef.key as string };
}

export async function getUserFarms(userId: string): Promise<AntFarm[]> {
  const snap = await get(query(ref(db, 'farms'), orderByChild('userId'), equalTo(userId)));
  const farms: AntFarm[] = [];
  snap.forEach((child) => {
    farms.push(sanitizeFarm({ ...(child.val() as AntFarm), id: child.key as string }));
  });
  return farms;
}

export async function getFarm(farmId: string): Promise<AntFarm | null> {
  const snap = await get(ref(db, `farms/${farmId}`));
  return snap.exists() ? sanitizeFarm({ ...(snap.val() as AntFarm), id: snap.key as string }) : null;
}

export async function updateFarm(farmId: string, updates: Partial<AntFarm>) {
  await update(ref(db, `farms/${farmId}`), updates);
}

export async function deleteFarm(farmId: string) {
  await remove(ref(db, `farms/${farmId}`));
}
