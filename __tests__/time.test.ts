import { toEpoch } from '../src/services/time';

describe('toEpoch', () => {
  const NOW = 1_700_000_000_000;

  it('passes through a finite epoch number', () => {
    expect(toEpoch(1234567890, NOW)).toBe(1234567890);
  });

  it('parses an ISO date string to epoch ms', () => {
    expect(toEpoch('2023-11-14T22:13:20.000Z', NOW)).toBe(Date.parse('2023-11-14T22:13:20.000Z'));
  });

  it('falls back to now for missing values', () => {
    expect(toEpoch(undefined, NOW)).toBe(NOW);
    expect(toEpoch(null, NOW)).toBe(NOW);
  });

  it('falls back to now for unparseable strings and non-finite numbers', () => {
    expect(toEpoch('not a date', NOW)).toBe(NOW);
    expect(toEpoch(NaN, NOW)).toBe(NOW);
    expect(toEpoch(Infinity, NOW)).toBe(NOW);
  });
});
