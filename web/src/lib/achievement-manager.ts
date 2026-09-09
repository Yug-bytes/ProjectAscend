/**
 * Achievement & Milestone Manager.
 * Exact port of Modules/achievement_manager.py.
 *
 * Evaluates 11 catalog achievements and 20 milestone tiers across 4 categories.
 */

import { todayISO } from './date-utils';
import { db } from './db';
import { getStreakData } from './streak-manager';
import type {
  AchievementCategory,
  AchievementDefinition,
  MilestoneDefinition,
} from './types';
import { getLevelForXp, getTotalXp } from './xp-manager';

export const ACHIEVEMENT_DEFINITIONS: Record<string, AchievementDefinition> = {
  consistency_first_step: {
    id: 'consistency_first_step',
    name: 'First Ascend',
    description: 'Complete your first daily focus goal.',
    category: 'Consistency',
    icon: '🎯',
  },
  consistency_streak_3: {
    id: 'consistency_streak_3',
    name: 'Three-Fold Focus',
    description: 'Maintain a 3-day focus goal streak.',
    category: 'Consistency',
    icon: '🔥',
  },
  consistency_streak_7: {
    id: 'consistency_streak_7',
    name: 'Week of Power',
    description: 'Maintain a 7-day focus goal streak.',
    category: 'Consistency',
    icon: '⚡',
  },
  consistency_streak_30: {
    id: 'consistency_streak_30',
    name: 'Iron Will',
    description: 'Maintain a 30-day focus goal streak.',
    category: 'Consistency',
    icon: '👑',
  },
  deepwork_10h: {
    id: 'deepwork_10h',
    name: 'Deep Dive',
    description: 'Log 10 total hours of focus sessions.',
    category: 'Deep Work',
    icon: '⏱',
  },
  deepwork_50h: {
    id: 'deepwork_50h',
    name: 'Flow Master',
    description: 'Log 50 total hours of focus sessions.',
    category: 'Deep Work',
    icon: '🌊',
  },
  deepwork_100h: {
    id: 'deepwork_100h',
    name: 'Ascended Focus',
    description: 'Log 100 total hours of focus sessions.',
    category: 'Deep Work',
    icon: '🌌',
  },
  planning_perfect_day: {
    id: 'planning_perfect_day',
    name: 'Master Planner',
    description: 'Complete 100% of planned tasks in a day.',
    category: 'Planning',
    icon: '📋',
  },
  mastery_level_10: {
    id: 'mastery_level_10',
    name: 'Horizon Reached',
    description: 'Reach Level 10.',
    category: 'Mastery',
    icon: '🏛',
  },
  mastery_level_25: {
    id: 'mastery_level_25',
    name: 'Vanguard Status',
    description: 'Reach Level 25.',
    category: 'Mastery',
    icon: '🛡',
  },
  mastery_level_50: {
    id: 'mastery_level_50',
    name: 'Sovereign Ascent',
    description: 'Reach Level 50.',
    category: 'Mastery',
    icon: '✨',
  },
};

export interface MilestoneCatalogCategory extends MilestoneDefinition {
  name: string;
}

export const MILESTONE_CATALOG: Record<string, MilestoneCatalogCategory> = {
  focus_duration: {
    id: 'focus_duration',
    name: 'Focus Duration',
    unit: 'hours',
    icon: '⏱',
    tiers: [
      { tier: 1, threshold: 600, label: '10h Focus' },
      { tier: 2, threshold: 3000, label: '50h Focus' },
      { tier: 3, threshold: 6000, label: '100h Focus' },
      { tier: 4, threshold: 15000, label: '250h Focus' },
      { tier: 5, threshold: 30000, label: '500h Focus' },
    ],
  },
  completed_activities: {
    id: 'completed_activities',
    name: 'Completed Activities',
    unit: 'tasks',
    icon: '✅',
    tiers: [
      { tier: 1, threshold: 10, label: '10 Tasks' },
      { tier: 2, threshold: 50, label: '50 Tasks' },
      { tier: 3, threshold: 100, label: '100 Tasks' },
      { tier: 4, threshold: 250, label: '250 Tasks' },
      { tier: 5, threshold: 500, label: '500 Tasks' },
    ],
  },
  daily_goal_days: {
    id: 'daily_goal_days',
    name: 'Daily Goal Days',
    unit: 'days',
    icon: '🎯',
    tiers: [
      { tier: 1, threshold: 1, label: '1 Goal Day' },
      { tier: 2, threshold: 7, label: '7 Goal Days' },
      { tier: 3, threshold: 30, label: '30 Goal Days' },
      { tier: 4, threshold: 90, label: '90 Goal Days' },
      { tier: 5, threshold: 180, label: '180 Goal Days' },
    ],
  },
  longest_streak: {
    id: 'longest_streak',
    name: 'Longest Streak',
    unit: 'days',
    icon: '🔥',
    tiers: [
      { tier: 1, threshold: 3, label: '3-Day Streak' },
      { tier: 2, threshold: 7, label: '7-Day Streak' },
      { tier: 3, threshold: 14, label: '14-Day Streak' },
      { tier: 4, threshold: 30, label: '30-Day Streak' },
      { tier: 5, threshold: 60, label: '60-Day Streak' },
    ],
  },
};

export const ACHIEVEMENT_CATEGORIES: AchievementCategory[] = [
  'Consistency',
  'Deep Work',
  'Planning',
  'Mastery',
];

/**
 * Return set of already unlocked achievement IDs.
 */
export async function getUnlockedAchievementIds(): Promise<Set<string>> {
  return db.getUnlockedAchievementIds();
}

/**
 * Deterministically check all achievement criteria and persist new unlocks.
 */
export async function evaluateAchievements(
  triggerEvent: string = 'manual'
): Promise<AchievementDefinition[]> {
  const alreadyUnlocked = await db.getUnlockedAchievementIds();

  const totalXp = await getTotalXp();
  const currentLevel = getLevelForXp(totalXp);
  const streakData = await getStreakData();
  const totalFocusMinutes = await db.getTotalFocusMinutes();

  const todayStr = todayISO();
  const todayActivities = await db.getActivitiesForDate(todayStr);
  const totalTasks = todayActivities.length;
  const completedTasks = todayActivities.filter(a => a.completed === 1).length;

  const toUnlock: string[] = [];

  if (streakData.total_goal_days >= 1 && !alreadyUnlocked.has('consistency_first_step')) {
    toUnlock.push('consistency_first_step');
  }

  if (streakData.current_streak >= 3 && !alreadyUnlocked.has('consistency_streak_3')) {
    toUnlock.push('consistency_streak_3');
  }

  if (streakData.current_streak >= 7 && !alreadyUnlocked.has('consistency_streak_7')) {
    toUnlock.push('consistency_streak_7');
  }

  if (streakData.current_streak >= 30 && !alreadyUnlocked.has('consistency_streak_30')) {
    toUnlock.push('consistency_streak_30');
  }

  if (totalFocusMinutes >= 600 && !alreadyUnlocked.has('deepwork_10h')) {
    toUnlock.push('deepwork_10h');
  }

  if (totalFocusMinutes >= 3000 && !alreadyUnlocked.has('deepwork_50h')) {
    toUnlock.push('deepwork_50h');
  }

  if (totalFocusMinutes >= 6000 && !alreadyUnlocked.has('deepwork_100h')) {
    toUnlock.push('deepwork_100h');
  }

  if (totalTasks >= 3 && completedTasks === totalTasks && !alreadyUnlocked.has('planning_perfect_day')) {
    toUnlock.push('planning_perfect_day');
  }

  if (currentLevel >= 10 && !alreadyUnlocked.has('mastery_level_10')) {
    toUnlock.push('mastery_level_10');
  }

  if (currentLevel >= 25 && !alreadyUnlocked.has('mastery_level_25')) {
    toUnlock.push('mastery_level_25');
  }

  if (currentLevel >= 50 && !alreadyUnlocked.has('mastery_level_50')) {
    toUnlock.push('mastery_level_50');
  }

  const newlyUnlockedDefs: AchievementDefinition[] = [];
  for (const aid of toUnlock) {
    const success = await db.unlockAchievement(aid, triggerEvent);
    if (success && aid in ACHIEVEMENT_DEFINITIONS) {
      newlyUnlockedDefs.push(ACHIEVEMENT_DEFINITIONS[aid]);
    }
  }

  return newlyUnlockedDefs;
}

export interface ReachedMilestoneEvent {
  milestone_id: string;
  milestone_name: string;
  tier: number;
  label: string;
  threshold: number;
  reached_at: string;
}

/**
 * Deterministically check all milestone criteria and persist new reached tiers.
 */
export async function evaluateMilestones(
  _triggerEvent: string = 'manual'
): Promise<ReachedMilestoneEvent[]> {
  const reachedMap = await db.getReachedMilestones();

  const totalFocusMinutes = await db.getTotalFocusMinutes();
  const totalCompletedActivities = await db.getTotalCompletedActivities();
  const streakData = await getStreakData();

  const currentMetrics: Record<string, number> = {
    focus_duration: totalFocusMinutes,
    completed_activities: totalCompletedActivities,
    daily_goal_days: streakData.total_goal_days,
    longest_streak: streakData.longest_streak,
  };

  const newlyReachedTiers: ReachedMilestoneEvent[] = [];
  const nowStr = new Date().toISOString();

  for (const [milestoneId, catInfo] of Object.entries(MILESTONE_CATALOG)) {
    const val = currentMetrics[milestoneId] ?? 0;
    const reachedTiers = new Set(reachedMap.get(milestoneId) ?? []);

    for (const tierInfo of catInfo.tiers) {
      const t = tierInfo.tier;
      const thresh = tierInfo.threshold;

      if (val >= thresh && !reachedTiers.has(t)) {
        const success = await db.reachMilestone(milestoneId, t);
        if (success) {
          newlyReachedTiers.push({
            milestone_id: milestoneId,
            milestone_name: catInfo.name,
            tier: t,
            label: tierInfo.label,
            threshold: thresh,
            reached_at: nowStr,
          });
        }
      }
    }
  }

  return newlyReachedTiers;
}
