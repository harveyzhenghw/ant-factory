import { xpForLevel, gainXp, levelProgress } from '../src/game/progression';

describe('xpForLevel', () => {
  it('requires level * 100 xp', () => {
    expect(xpForLevel(1)).toBe(100);
    expect(xpForLevel(2)).toBe(200);
    expect(xpForLevel(5)).toBe(500);
  });
});

describe('gainXp', () => {
  it('adds xp without levelling up', () => {
    expect(gainXp({ xp: 0, level: 1 }, 10)).toEqual({ xp: 10, level: 1 });
  });

  it('levels up when crossing the threshold', () => {
    expect(gainXp({ xp: 50, level: 1 }, 100)).toEqual({ xp: 50, level: 2 });
  });

  it('handles multiple level ups in one gain', () => {
    expect(gainXp({ xp: 0, level: 1 }, 250)).toEqual({ xp: 150, level: 2 });
  });

  it('defaults missing fields', () => {
    expect(gainXp({} as any, 25)).toEqual({ xp: 25, level: 1 });
  });
});

describe('levelProgress', () => {
  it('returns the fraction of the way to the next level', () => {
    expect(levelProgress({ xp: 50, level: 1 })).toBe(0.5);
  });

  it('clamps at 1', () => {
    expect(levelProgress({ xp: 999, level: 1 })).toBe(1);
  });

  it('returns 0 for a fresh level', () => {
    expect(levelProgress({ xp: 0, level: 1 })).toBe(0);
  });
});
