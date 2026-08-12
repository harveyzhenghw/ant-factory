import { SHOP_ITEMS, calculateQueenPrice } from '../src/game/economy';

describe('SHOP_ITEMS', () => {
  it('contains items across all four categories', () => {
    const types = new Set(SHOP_ITEMS.map((i) => i.type));
    expect(types).toEqual(new Set(['food', 'decoration', 'expansion', 'supplies']));
  });

  it('has unique ids and positive prices', () => {
    const ids = SHOP_ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const item of SHOP_ITEMS) {
      expect(item.price).toBeGreaterThan(0);
      expect(item.name).toBeTruthy();
      expect(item.description).toBeTruthy();
    }
  });
});

describe('calculateQueenPrice', () => {
  it('returns the base price at full stats', () => {
    expect(calculateQueenPrice('lasius_niger', 100, 100)).toBe(50);
    expect(calculateQueenPrice('atta', 100, 100)).toBe(300);
  });

  it('scales with health and fertility', () => {
    expect(calculateQueenPrice('lasius_niger', 50, 50)).toBe(Math.floor(50 * 0.5 * 0.5));
  });

  it('falls back to a base price for unknown species', () => {
    expect(calculateQueenPrice('mystery_species', 100, 100)).toBe(50);
  });
});
