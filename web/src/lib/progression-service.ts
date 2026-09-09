/**
 * Progression Service — Central progression domain and event evaluation service.
 * Exact port of Modules/progression_service.py.
 */

import {
  ACHIEVEMENT_DEFINITIONS,
  evaluateAchievements,
  evaluateMilestones,
  getUnlockedAchievementIds,
} from './achievement-manager';
import { getEvolutionStage, getSelectedCharacter } from './character-manager';
import { db } from './db';
import { getStreakData } from './streak-manager';
import type { ProgressionEventsResult, ProgressionSummary } from './types';
import { getLevelProgress, getTotalXp, syncTotalXp } from './xp-manager';

/**
 * Return comprehensive progression summary for UI consumption.
 */
export async function getProgressionSummary(): Promise<ProgressionSummary> {
  const totalXp = await getTotalXp();
  const { level, xpIntoLevel, xpForLevel, xpRemaining } = getLevelProgress(totalXp);
  const evolution = getEvolutionStage(level);
  const selectedChar = await getSelectedCharacter();
  const streakData = await getStreakData();
  const unlockedIds = await getUnlockedAchievementIds();
  const milestoneHistory = await db.milestoneHistory.toArray();

  return {
    total_xp: totalXp,
    level,
    xp_into_level: xpIntoLevel,
    xp_for_level: xpForLevel,
    xp_remaining: xpRemaining,
    evolution_stage: evolution.stage,
    evolution_name: evolution.name,
    evolution_info: evolution,
    character: selectedChar,
    current_streak: streakData.current_streak,
    longest_streak: streakData.longest_streak,
    total_goal_days: streakData.total_goal_days,
    completion_rate: streakData.completion_rate,
    unlocked_achievements_count: unlockedIds.size,
    total_achievements_count: Object.keys(ACHIEVEMENT_DEFINITIONS).length,
    milestones_reached_count: milestoneHistory.length,
  };
}

/**
 * Run full progression check: syncs total XP, records newly reached levels,
 * evaluates achievements and milestones, and returns progression updates.
 */
export async function checkProgressionEvents(
  triggerEvent: string = 'manual'
): Promise<ProgressionEventsResult> {
  // 1. Sync & reconcile XP cache
  const totalXp = await syncTotalXp();

  // 2. Check and record level reaches
  const nowIso = new Date().toISOString();
  const newLevelsRecorded = await db.checkAndRecordLevelReaches(totalXp, nowIso);

  // 3. Evaluate achievements and milestones
  const newAchievements = await evaluateAchievements(triggerEvent);
  const newMilestones = await evaluateMilestones(triggerEvent);

  const { level } = getLevelProgress(totalXp);
  const evolution = getEvolutionStage(level);

  return {
    total_xp: totalXp,
    current_level: level,
    evolution_stage: evolution.stage,
    new_levels_recorded: newLevelsRecorded,
    new_achievements: newAchievements,
    new_milestones: newMilestones,
    trigger_event: triggerEvent,
  };
}
