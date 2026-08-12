import { UserProfile } from '../types';

export const XP_PER_LEVEL = 100;

export function xpForLevel(level: number): number {
  return level * XP_PER_LEVEL;
}

export function gainXp(profile: Pick<UserProfile, 'xp' | 'level'>, amount: number): { xp: number; level: number } {
  let xp = (profile.xp ?? 0) + amount;
  let level = profile.level ?? 1;
  while (xp >= xpForLevel(level)) {
    xp -= xpForLevel(level);
    level += 1;
  }
  return { xp, level };
}

export function levelProgress(profile: Pick<UserProfile, 'xp' | 'level'>): number {
  const level = profile.level ?? 1;
  const xp = profile.xp ?? 0;
  return Math.min(1, xp / xpForLevel(level));
}
