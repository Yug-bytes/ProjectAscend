/**
 * Streak Manager — exact port of Modules/streak_manager.py.
 *
 * Implements 1-day grace period logic for active streaks,
 * chronological scanning for longest historical streak,
 * total goal days tracking, and completion rate calculations.
 */

import { addDays, todayISO } from './date-utils';
import { db } from './db';
import type { DailyHistory, StreakData } from './types';

/**
 * Return the active streak ending today, or yesterday if today is not yet completed.
 *
 * 1-Day Grace Period:
 *   If goal completed today -> count consecutive backwards starting today.
 *   Else if goal completed yesterday -> count consecutive backwards starting yesterday.
 *   Else -> 0.
 */
export function getCurrentStreak(
  historyByDate: Map<string, boolean>,
  todayStr: string = todayISO()
): number {
  const yesterdayStr = addDays(todayStr, -1);

  let startDate: string;
  if (historyByDate.get(todayStr) === true) {
    startDate = todayStr;
  } else if (historyByDate.get(yesterdayStr) === true) {
    startDate = yesterdayStr;
  } else {
    return 0;
  }

  let streak = 0;
  let currentDate = startDate;

  while (historyByDate.get(currentDate) === true) {
    streak += 1;
    currentDate = addDays(currentDate, -1);
  }

  return streak;
}

/**
 * Return the longest consecutive goal-completed streak in history.
 * Performs a chronological scan over all recorded dates.
 */
export function getLongestStreak(historyByDate: Map<string, boolean>): number {
  if (historyByDate.size === 0) {
    return 0;
  }

  const sortedDates = Array.from(historyByDate.keys()).sort();
  let longestStreak = 0;
  let currentStreak = 0;
  let previousDate: string | null = null;

  for (const dateStr of sortedDates) {
    const isCompleted = historyByDate.get(dateStr) === true;

    if (!isCompleted) {
      currentStreak = 0;
      previousDate = dateStr;
      continue;
    }

    if (previousDate === null) {
      currentStreak = 1;
    } else if (dateStr === addDays(previousDate, 1)) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }

    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    previousDate = dateStr;
  }

  return longestStreak;
}

/**
 * Return how many history days reached the daily goal.
 */
export function getTotalGoalDays(dailyHistories: DailyHistory[]): number {
  return dailyHistories.reduce(
    (count, row) => count + (row.goal_completed === 1 ? 1 : 0),
    0
  );
}

/**
 * Return the percentage of history days where the goal was achieved.
 * Formula: round((total_goal_days / total_days) * 100, 1)
 */
export function getCompletionRate(dailyHistories: DailyHistory[]): number {
  if (dailyHistories.length === 0) {
    return 0;
  }

  const totalGoalDays = getTotalGoalDays(dailyHistories);
  const completionRate = (totalGoalDays / dailyHistories.length) * 100;
  return Math.round(completionRate * 10) / 10;
}

/**
 * High-level database-integrated query returning comprehensive streak statistics.
 */
export async function getStreakData(todayStr: string = todayISO()): Promise<StreakData> {
  const dailyHistories = await db.getAllDailyHistory();

  const historyByDate = new Map<string, boolean>();
  for (const row of dailyHistories) {
    historyByDate.set(row.date, row.goal_completed === 1);
  }

  const currentStreak = getCurrentStreak(historyByDate, todayStr);
  const longestStreak = getLongestStreak(historyByDate);
  const totalGoalDays = getTotalGoalDays(dailyHistories);
  const completionRate = getCompletionRate(dailyHistories);

  return {
    current_streak: currentStreak,
    longest_streak: longestStreak,
    total_goal_days: totalGoalDays,
    completion_rate: completionRate,
  };
}
