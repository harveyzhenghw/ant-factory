import {
  createDefaultFarm,
  computeDecay,
  applyCare,
  simulateAnts,
  populationCap,
} from '../src/game/simulation';
import { AntFarm } from '../src/types';

function makeFarm(overrides: Partial<AntFarm> = {}): AntFarm {
  return { ...createDefaultFarm('user-1', 'Test Farm'), ...overrides };
}

describe('createDefaultFarm', () => {
  it('creates a healthy starting colony', () => {
    const farm = createDefaultFarm('user-1', 'Test Farm');
    expect(farm.id).toBe('');
    expect(farm.userId).toBe('user-1');
    expect(farm.name).toBe('Test Farm');
    expect(farm.health).toBe(100);
    expect(farm.population).toBe(10);
    expect(farm.foodLevel).toBe(80);
    expect(farm.waterLevel).toBe(80);
    expect(farm.cleanliness).toBe(80);
    expect(farm.chambers).toHaveLength(4);
    expect(farm.tunnels).toHaveLength(4);
  });
});

describe('computeDecay', () => {
  it('returns zero decay for a freshly cared-for farm', () => {
    const farm = makeFarm({ lastFedAt: Date.now(), lastWateredAt: Date.now(), lastCleanedAt: Date.now() });
    const decayed = computeDecay(farm);
    expect(decayed.foodLevel).toBe(80);
    expect(decayed.waterLevel).toBe(80);
    expect(decayed.cleanliness).toBe(80);
    expect(decayed.health).toBe(100);
  });

  it('decays food/water/cleanliness over time', () => {
    const twoHoursAgo = Date.now() - 2 * 3600000;
    const farm = makeFarm({ lastFedAt: twoHoursAgo, lastWateredAt: twoHoursAgo, lastCleanedAt: twoHoursAgo });
    const decayed = computeDecay(farm);
    expect(decayed.foodLevel).toBe(80 - 2 * 5);
    expect(decayed.waterLevel).toBe(80 - 2 * 4);
    expect(decayed.cleanliness).toBe(80 - 2 * 2);
  });

  it('never drops levels below zero', () => {
    const longAgo = Date.now() - 100 * 3600000;
    const farm = makeFarm({ lastFedAt: longAgo, lastWateredAt: longAgo, lastCleanedAt: longAgo });
    const decayed = computeDecay(farm);
    expect(decayed.foodLevel).toBe(0);
    expect(decayed.waterLevel).toBe(0);
    expect(decayed.cleanliness).toBe(0);
  });

  it('loses health at the critical rate when resources are starved', () => {
    const now = Date.now();
    const twoHoursAgo = now - 2 * 3600000;
    // Fresh resource clocks but low levels, health clock 2h old.
    const farm = makeFarm({
      foodLevel: 10, waterLevel: 10, cleanliness: 10,
      lastFedAt: now, lastWateredAt: now, lastCleanedAt: now,
      lastTickAt: twoHoursAgo, health: 100, population: 10,
    });
    const decayed = computeDecay(farm, now);
    expect(decayed.health).toBe(100 - 12 * 2); // -12/hr for 2h
    expect(decayed.population).toBe(10); // health still >= 30, no decline
  });

  it('gains health slowly when thriving', () => {
    const now = Date.now();
    const farm = makeFarm({
      foodLevel: 90, waterLevel: 90, cleanliness: 90,
      lastFedAt: now, lastWateredAt: now, lastCleanedAt: now,
      lastTickAt: now - 2 * 3600000, health: 80,
    });
    const decayed = computeDecay(farm, now);
    expect(decayed.health).toBe(80 + 3 * 2); // +3/hr for 2h
  });

  it('declines population only when health is critically low, keeping at least 1', () => {
    const now = Date.now();
    const farm = makeFarm({
      foodLevel: 0, waterLevel: 0, cleanliness: 0,
      lastFedAt: now, lastWateredAt: now, lastCleanedAt: now,
      lastTickAt: now - 5 * 3600000, health: 20, population: 10,
    });
    const decayed = computeDecay(farm, now);
    expect(decayed.health).toBe(0);
    expect(decayed.population).toBe(5); // floor(10 * (1 - 0.1*5))
  });

  it('grows population toward the cap when the colony is thriving', () => {
    const now = Date.now();
    const farm = makeFarm({
      foodLevel: 90, waterLevel: 90, cleanliness: 90,
      lastFedAt: now, lastWateredAt: now, lastCleanedAt: now,
      lastTickAt: now - 3 * 3600000, health: 90, population: 10,
    });
    const decayed = computeDecay(farm, now);
    expect(decayed.population).toBeGreaterThan(10);
    expect(decayed.population).toBeLessThanOrEqual(populationCap(farm));
  });

  it('never grows population past the cap', () => {
    const now = Date.now();
    const farm = makeFarm({
      foodLevel: 100, waterLevel: 100, cleanliness: 100,
      lastFedAt: now, lastWateredAt: now, lastCleanedAt: now,
      lastTickAt: now - 1000 * 3600000, health: 100, population: 10,
    });
    const decayed = computeDecay(farm, now);
    expect(decayed.population).toBeLessThanOrEqual(populationCap(farm));
  });

  it('is idempotent when persisted: decaying twice equals decaying once', () => {
    const T = Date.now();
    const start = T - 3 * 3600000; // 3h of accrued decay
    const farm = makeFarm({
      lastFedAt: start, lastWateredAt: start, lastCleanedAt: start, lastTickAt: start,
    });
    const once = computeDecay(farm, T);
    // Persist the result, then run the tick again at the same instant.
    const persisted = { ...farm, ...once };
    const twice = computeDecay(persisted, T);
    expect(twice.foodLevel).toBe(once.foodLevel);
    expect(twice.waterLevel).toBe(once.waterLevel);
    expect(twice.cleanliness).toBe(once.cleanliness);
    expect(twice.health).toBe(once.health);
  });
});

describe('populationCap', () => {
  it('scales with chamber count and installed queen fertility', () => {
    const base = makeFarm(); // 4 chambers, no queen
    expect(populationCap(base)).toBe(4 * 15);
    const withQueen = makeFarm({ queenFertility: 80 });
    expect(populationCap(withQueen)).toBe(4 * 15 + 40);
  });
});

describe('applyCare', () => {
  it('feed restores food and health and stamps lastFedAt', () => {
    const farm = makeFarm({ foodLevel: 50, health: 80, lastFedAt: 0 });
    const updates = applyCare(farm, 'feed');
    expect(updates.foodLevel).toBe(85);
    expect(updates.health).toBe(85);
    expect(updates.lastFedAt).toBeGreaterThan(0);
  });

  it('caps food at 100', () => {
    const farm = makeFarm({ foodLevel: 90 });
    const updates = applyCare(farm, 'feed');
    expect(updates.foodLevel).toBe(100);
  });

  it('water restores water and health', () => {
    const farm = makeFarm({ waterLevel: 50, health: 80 });
    const updates = applyCare(farm, 'water');
    expect(updates.waterLevel).toBe(85);
    expect(updates.health).toBe(83);
  });

  it('clean restores cleanliness and health', () => {
    const farm = makeFarm({ cleanliness: 40, health: 80 });
    const updates = applyCare(farm, 'clean');
    expect(updates.cleanliness).toBe(90);
    expect(updates.health).toBe(82);
  });
});

describe('simulateAnts', () => {
  it('produces a queen, workers, soldiers, larvae and eggs', () => {
    const farm = makeFarm({ population: 10 });
    const ants = simulateAnts(farm);
    expect(ants.filter((a) => a.type === 'queen')).toHaveLength(1);
    expect(ants.filter((a) => a.type === 'worker')).toHaveLength(8);
    expect(ants.filter((a) => a.type === 'soldier')).toHaveLength(1);
    expect(ants.filter((a) => a.type === 'larva')).toHaveLength(1);
    expect(ants.filter((a) => a.type === 'egg')).toHaveLength(1);
  });

  it('keeps ants inside the farm bounds', () => {
    const farm = makeFarm({ size: { width: 300, height: 500 } });
    const ants = simulateAnts(farm);
    for (const ant of ants) {
      expect(ant.x).toBeGreaterThanOrEqual(0);
      expect(ant.x).toBeLessThanOrEqual(300);
      expect(ant.y).toBeGreaterThanOrEqual(0);
      expect(ant.y).toBeLessThanOrEqual(500);
    }
  });

  it('assigns valid states and facing to ants', () => {
    const ants = simulateAnts(makeFarm());
    const states = ['idle', 'moving', 'eating', 'digging', 'carrying'];
    for (const ant of ants) {
      expect(states).toContain(ant.state);
      expect(['left', 'right']).toContain(ant.facing);
      expect(ant.id).toBeTruthy();
    }
  });
});
