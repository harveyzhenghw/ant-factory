import { ref, get, update } from 'firebase/database';
import { db } from './firebase';
import { AntFarm, ShopItem, UserProfile } from '../types';
import { purchaseItem } from './economyService';
import { updateFarm } from './farmService';
import { addItemToInventory } from './progressionService';

const FOOD_EFFECTS: Record<string, (farm: AntFarm) => Partial<AntFarm>> = {
  'food-granules': (farm) => ({ foodLevel: Math.min(100, farm.foodLevel + 15), lastFedAt: Date.now() }),
  'food-sugar': (farm) => ({
    foodLevel: Math.min(100, farm.foodLevel + 25),
    waterLevel: Math.min(100, farm.waterLevel + 10),
    lastFedAt: Date.now(),
  }),
  'food-protein': (farm) => ({
    foodLevel: Math.min(100, farm.foodLevel + 10),
    population: farm.population + 5,
    lastFedAt: Date.now(),
  }),
};

const DECORATION_MAP: Record<string, { type: AntFarm['decorations'][number]['type'] }> = {
  'decoration-plant': { type: 'plant' },
  'decoration-rock': { type: 'rock' },
  'decoration-branch': { type: 'branch' },
};

function randomUnderground(farm: AntFarm) {
  return {
    x: 40 + Math.random() * Math.max(60, farm.size.width - 100),
    y: 120 + Math.random() * Math.max(80, farm.size.height - 260),
  };
}

export async function applyPurchase(userId: string, farm: AntFarm, item: ShopItem): Promise<void> {
  const ok = await purchaseItem(userId, item);
  if (!ok) throw new Error('Not enough Honeydew');

  if (item.type === 'food') {
    const effect = FOOD_EFFECTS[item.id];
    if (effect) {
      const updates = effect(farm);
      await updateFarm(farm.id, updates);
    }
  } else if (item.type === 'decoration') {
    const deco = DECORATION_MAP[item.id];
    if (deco) {
      const { x, y } = randomUnderground(farm);
      await updateFarm(farm.id, {
        decorations: [...(farm.decorations ?? []), { id: `deco-${Date.now()}`, type: deco.type, x, y }],
      });
    }
  } else if (item.type === 'expansion') {
    const id = `chamber-${Date.now()}`;
    const isLarge = item.id === 'expansion-large';
    const { x, y } = randomUnderground(farm);
    const newChamber = { id, type: 'empty' as const, x, y, width: isLarge ? 70 : 50, height: isLarge ? 45 : 35 };
    const newTunnel = {
      id: `tunnel-${Date.now()}`,
      points: [
        { x: farm.size.width / 2, y: 60 },
        { x: farm.size.width / 2, y: y + newChamber.height / 2 },
        { x: x + newChamber.width / 2, y: y + newChamber.height / 2 },
      ],
    };
    await updateFarm(farm.id, {
      chambers: [...(farm.chambers ?? []), newChamber],
      tunnels: [...(farm.tunnels ?? []), newTunnel],
    });
  } else if (item.type === 'supplies') {
    await addItemToInventory(userId, item.id);
  }
}

export async function getUserHoneydew(userId: string): Promise<number> {
  const snap = await get(ref(db, `users/${userId}`));
  return snap.exists() ? ((snap.val() as UserProfile).honeydew ?? 0) : 0;
}

export async function updateUserDoc(userId: string, updates: Partial<UserProfile>) {
  await update(ref(db, `users/${userId}`), updates);
}
