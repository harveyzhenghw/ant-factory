import { AntFarm, Chamber, Tunnel, Ant } from '../types';

const DECAY_PER_HOUR = {
  food: 5,
  water: 4,
  cleanliness: 2,
};

const CARE_RESTORE = {
  feed: { food: 35, health: 5 },
  water: { water: 35, health: 3 },
  clean: { cleanliness: 50, health: 2 },
};

export function createDefaultFarm(userId: string, name: string): AntFarm {
  const now = Date.now();
  return {
    id: '',
    userId,
    name,
    createdAt: now,
    lastFedAt: now,
    lastWateredAt: now,
    lastCleanedAt: now,
    health: 100,
    population: 10,
    foodLevel: 80,
    waterLevel: 80,
    cleanliness: 80,
    size: { width: 300, height: 500 },
    chambers: [
      { id: 'chamber-1', type: 'queen', x: 120, y: 180, width: 60, height: 40 },
      { id: 'chamber-2', type: 'nursery', x: 50, y: 280, width: 50, height: 35 },
      { id: 'chamber-3', type: 'food_storage', x: 190, y: 280, width: 50, height: 35 },
      { id: 'chamber-4', type: 'empty', x: 120, y: 370, width: 45, height: 30 },
    ],
    tunnels: [
      {
        id: 'tunnel-1',
        points: [{ x: 150, y: 150 }, { x: 150, y: 180 }, { x: 120, y: 180 }],
      },
      {
        id: 'tunnel-2',
        points: [{ x: 150, y: 180 }, { x: 150, y: 220 }, { x: 75, y: 280 }, { x: 50, y: 280 }],
      },
      {
        id: 'tunnel-3',
        points: [{ x: 150, y: 220 }, { x: 215, y: 280 }, { x: 190, y: 280 }],
      },
      {
        id: 'tunnel-4',
        points: [{ x: 150, y: 220 }, { x: 150, y: 370 }, { x: 120, y: 370 }],
      },
    ],
    decorations: [],
  };
}

export function computeDecay(farm: AntFarm): Partial<AntFarm> {
  const now = Date.now();
  const hoursSinceFeed = (now - farm.lastFedAt) / 3600000;
  const hoursSinceWater = (now - farm.lastWateredAt) / 3600000;
  const hoursSinceClean = (now - farm.lastCleanedAt) / 3600000;

  const foodDecay = Math.floor(hoursSinceFeed * DECAY_PER_HOUR.food);
  const waterDecay = Math.floor(hoursSinceWater * DECAY_PER_HOUR.water);
  const cleanDecay = Math.floor(hoursSinceClean * DECAY_PER_HOUR.cleanliness);

  const newFood = Math.max(0, farm.foodLevel - foodDecay);
  const newWater = Math.max(0, farm.waterLevel - waterDecay);
  const newClean = Math.max(0, farm.cleanliness - cleanDecay);

  const avg = (newFood + newWater + newClean) / 3;
  let newHealth: number;
  if (avg < 20) {
    newHealth = Math.max(0, farm.health - 10);
  } else if (avg < 40) {
    newHealth = Math.max(0, farm.health - 4);
  } else if (avg > 80) {
    newHealth = Math.min(100, farm.health + 2);
  } else {
    newHealth = farm.health;
  }

  const popMultiplier = newHealth / 100;
  const newPopulation = Math.max(0, Math.floor(farm.population * popMultiplier));

  return {
    foodLevel: newFood,
    waterLevel: newWater,
    cleanliness: newClean,
    health: newHealth,
    population: newPopulation || 1,
  };
}

export function applyCare(
  farm: AntFarm,
  action: 'feed' | 'water' | 'clean'
): Partial<AntFarm> {
  const now = Date.now();
  const updates: Partial<AntFarm> = {};

  if (action === 'feed') {
    updates.foodLevel = Math.min(100, farm.foodLevel + CARE_RESTORE.feed.food);
    updates.lastFedAt = now;
    updates.health = Math.min(100, farm.health + CARE_RESTORE.feed.health);
  } else if (action === 'water') {
    updates.waterLevel = Math.min(100, farm.waterLevel + CARE_RESTORE.water.water);
    updates.lastWateredAt = now;
    updates.health = Math.min(100, farm.health + CARE_RESTORE.water.health);
  } else if (action === 'clean') {
    updates.cleanliness = Math.min(100, farm.cleanliness + CARE_RESTORE.clean.cleanliness);
    updates.lastCleanedAt = now;
    updates.health = Math.min(100, farm.health + CARE_RESTORE.clean.health);
  }

  return updates;
}

export function simulateAnts(farm: AntFarm): Ant[] {
  const ants: Ant[] = [];
  const workerCount = Math.max(1, Math.floor(farm.population * 0.8));
  const soldierCount = Math.max(0, Math.floor(farm.population * 0.15));
  const stationary = Math.max(2, farm.population - workerCount - soldierCount);
  const larvaCount = Math.max(1, Math.floor(stationary * 0.7));
  const eggCount = Math.max(0, stationary - larvaCount);

  const queenChamber = farm.chambers.find((c) => c.type === 'queen');
  const queenPoint = queenChamber
    ? { x: queenChamber.x + queenChamber.width / 2, y: queenChamber.y + queenChamber.height / 2 }
    : { x: 150, y: 200 };

  ants.push({
    id: `ant-queen-0`,
    farmId: farm.id,
    type: 'queen',
    x: queenPoint.x,
    y: queenPoint.y,
    state: 'idle',
    facing: 'left',
  });

  for (let i = 0; i < workerCount; i++) {
    ants.push({
      id: `ant-worker-${i}`,
      farmId: farm.id,
      type: 'worker',
      ...randomPoint(farm),
      state: randomWorkerState(),
      facing: randomFacing(),
    });
  }

  for (let i = 0; i < soldierCount; i++) {
    ants.push({
      id: `ant-soldier-${i}`,
      farmId: farm.id,
      type: 'soldier',
      ...randomPoint(farm),
      state: randomWorkerState(),
      facing: randomFacing(),
    });
  }

  for (let i = 0; i < larvaCount; i++) {
    ants.push({
      id: `ant-larva-${i}`,
      farmId: farm.id,
      type: 'larva',
      ...randomPoint(farm),
      state: 'idle',
      facing: 'right',
    });
  }

  for (let i = 0; i < eggCount; i++) {
    ants.push({
      id: `ant-egg-${i}`,
      farmId: farm.id,
      type: 'egg',
      ...randomPoint(farm),
      state: 'idle',
      facing: 'right',
    });
  }

  return ants;
}

function randomPoint(farm: AntFarm): { x: number; y: number } {
  return {
    x: 50 + Math.random() * Math.max(0, farm.size.width - 100),
    y: 100 + Math.random() * Math.max(0, farm.size.height - 130),
  };
}

function randomWorkerState(): Ant['state'] {
  const r = Math.random();
  if (r < 0.45) return 'moving';
  if (r < 0.6) return 'carrying';
  if (r < 0.75) return 'eating';
  return 'idle';
}

function randomFacing(): 'left' | 'right' {
  return Math.random() < 0.5 ? 'left' : 'right';
}
