import { AntFarm, Ant } from '../types';

const DECAY_PER_HOUR = {
  food: 5,
  water: 4,
  cleanliness: 2,
};

// Health drifts based on how well-resourced the colony is, expressed as points
// per hour so the outcome is independent of how often the decay tick runs.
const HEALTH_PER_HOUR = {
  critical: -12, // avg resources < 20
  low: -5, // avg resources < 40
  thriving: 3, // avg resources > 80
};

// Population grows toward its cap while the colony is healthy, and only shrinks
// while it is in poor health — so good care is rewarded, not just damage control.
const POP_DECLINE_PER_HOUR = 0.1; // fraction lost per hour when health < 30
const POP_GROWTH_PER_HOUR = 0.2; // approach rate toward the cap when thriving
const CHAMBER_CAPACITY = 15; // population supported per chamber

/** Max population a farm can sustain: its chambers plus an installed queen's fertility. */
export function populationCap(farm: AntFarm): number {
  const chambers = farm.chambers?.length ?? 4;
  const queenBonus = farm.queenFertility ? Math.round(farm.queenFertility * 0.5) : 0;
  return chambers * CHAMBER_CAPACITY + queenBonus;
}

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
    lastTickAt: now,
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

/**
 * Compute the colony's decayed state. This is idempotent when persisted: it
 * advances each resource clock by exactly the whole units of decay it applied
 * (and moves `lastTickAt` to now), so re-running it on the persisted result
 * produces no further decay until real time passes. Applying it repeatedly
 * without persisting is also safe — it always measures from the stored clocks.
 */
export function computeDecay(farm: AntFarm, now: number = Date.now()): Partial<AntFarm> {
  const lastTickAt = farm.lastTickAt ?? farm.createdAt ?? now;

  const decayResource = (
    level: number,
    lastAt: number,
    ratePerHour: number
  ): { level: number; lastAt: number } => {
    const hours = Math.max(0, now - lastAt) / 3600000;
    const dropped = Math.floor(hours * ratePerHour);
    if (dropped <= 0) return { level, lastAt };
    // Advance the clock only by the time represented by the whole units we
    // consumed, so the sub-unit remainder carries into the next call.
    return {
      level: Math.max(0, level - dropped),
      lastAt: lastAt + (dropped / ratePerHour) * 3600000,
    };
  };

  const food = decayResource(farm.foodLevel, farm.lastFedAt, DECAY_PER_HOUR.food);
  const water = decayResource(farm.waterLevel, farm.lastWateredAt, DECAY_PER_HOUR.water);
  const clean = decayResource(farm.cleanliness, farm.lastCleanedAt, DECAY_PER_HOUR.cleanliness);

  const elapsedHours = Math.max(0, now - lastTickAt) / 3600000;
  const avg = (food.level + water.level + clean.level) / 3;

  let healthRate = 0;
  if (avg < 20) healthRate = HEALTH_PER_HOUR.critical;
  else if (avg < 40) healthRate = HEALTH_PER_HOUR.low;
  else if (avg > 80) healthRate = HEALTH_PER_HOUR.thriving;

  const newHealth = Math.min(100, Math.max(0, farm.health + healthRate * elapsedHours));

  // Population is kept as a float so slow per-tick growth accumulates instead of
  // being floored away; callers floor it for display and ant simulation.
  const cap = populationCap(farm);
  let newPopulation = farm.population;
  if (newHealth < 30) {
    newPopulation = Math.max(1, farm.population * (1 - POP_DECLINE_PER_HOUR * elapsedHours));
  } else if (newHealth >= 60 && avg >= 40 && farm.population < cap) {
    // Exponential approach to the cap: fast when far below, tapering near it.
    newPopulation = Math.min(
      cap,
      farm.population + (cap - farm.population) * (1 - Math.exp(-POP_GROWTH_PER_HOUR * elapsedHours))
    );
  }

  return {
    foodLevel: food.level,
    waterLevel: water.level,
    cleanliness: clean.level,
    lastFedAt: food.lastAt,
    lastWateredAt: water.lastAt,
    lastCleanedAt: clean.lastAt,
    lastTickAt: now,
    health: newHealth,
    population: newPopulation,
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
