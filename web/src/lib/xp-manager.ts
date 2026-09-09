/**
 * XP Manager — exact port of Modules/xp_manager.py.
 *
 * Three-tier linear XP curve:
 *   Levels 1-10:  100 XP per level
 *   Levels 11-50: 250 XP per level
 *   Levels 51+:   500 XP per level
 */

import {
  TIER_1_XP_PER_LEVEL,
  TIER_1_MAX_LEVEL,
  TIER_1_TOTAL_XP,
  TIER_2_XP_PER_LEVEL,
  TIER_2_MAX_LEVEL,
  TIER_2_TOTAL_XP,
  TIER_3_XP_PER_LEVEL,
} from './constants';

/**
 * Get the XP threshold required to reach a given level.
 */
export function getXpThreshold(level: number): number {
  if (level <= 1) return 0;
  if (level <= TIER_1_MAX_LEVEL) {
    return (level - 1) * TIER_1_XP_PER_LEVEL;
  }
  if (level <= TIER_2_MAX_LEVEL) {
    return TIER_1_TOTAL_XP + (level - TIER_1_MAX_LEVEL) * TIER_2_XP_PER_LEVEL;
  }
  return TIER_2_TOTAL_XP + (level - TIER_2_MAX_LEVEL) * TIER_3_XP_PER_LEVEL;
}

/**
 * Get the current level for a given total XP.
 */
export function getLevelForXp(totalXp: number): number {
  const xp = Math.max(0, Math.floor(totalXp));

  if (xp < TIER_1_TOTAL_XP) {
    return Math.floor(xp / TIER_1_XP_PER_LEVEL) + 1;
  }
  if (xp < TIER_2_TOTAL_XP) {
    return TIER_1_MAX_LEVEL + Math.floor((xp - TIER_1_TOTAL_XP) / TIER_2_XP_PER_LEVEL);
  }
  return TIER_2_MAX_LEVEL + Math.floor((xp - TIER_2_TOTAL_XP) / TIER_3_XP_PER_LEVEL);
}

/**
 * Get level progress: current level, XP into level, XP needed for level, XP remaining.
 */
export function getLevelProgress(totalXp: number): {
  level: number;
  xpIntoLevel: number;
  xpForLevel: number;
  xpRemaining: number;
} {
  const xp = Math.max(0, Math.floor(totalXp));
  const level = getLevelForXp(xp);
  const currentThreshold = getXpThreshold(level);
  const nextThreshold = getXpThreshold(level + 1);
  const xpForLevel = nextThreshold - currentThreshold;
  const xpIntoLevel = xp - currentThreshold;
  const xpRemaining = xpForLevel - xpIntoLevel;

  return { level, xpIntoLevel, xpForLevel, xpRemaining };
}
