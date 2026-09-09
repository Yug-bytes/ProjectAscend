/**
 * Dexie.js database for Project Ascend Web.
 * Maps the desktop app's SQLite schema to IndexedDB.
 */

import Dexie, { type Table } from 'dexie';
import type {
  Activity,
  FocusSession,
  XpEvent,
  DailyHistory,
  UserAchievement,
  ProgressionProfile,
  LevelHistory,
  MilestoneHistory,
  Setting,
} from './types';

export class AscendDatabase extends Dexie {
  activities!: Table<Activity, number>;
  settings!: Table<Setting, string>;
  focusSessions!: Table<FocusSession, number>;
  xpEvents!: Table<XpEvent, number>;
  dailyHistory!: Table<DailyHistory, string>;
  userAchievements!: Table<UserAchievement, number>;
  progressionProfile!: Table<ProgressionProfile, string>;
  levelHistory!: Table<LevelHistory, number>;
  milestoneHistory!: Table<MilestoneHistory, number>;

  constructor() {
    super('AscendDB');

    this.version(1).stores({
      // ++id = auto-increment primary key
      // & = unique index
      // [a+b] = compound index
      activities: '++id, date, completed, activity_type',
      settings: 'key',
      focusSessions: '++id, session_date, activity_id',
      xpEvents: '++id, earned_date, [activity_id+event_type]',
      dailyHistory: 'date',
      userAchievements: '++id, &achievement_id',
      progressionProfile: 'key',
      levelHistory: '++id, &level',
      milestoneHistory: '++id, [milestone_id+tier]',
    });
  }

  // ─── Settings helpers ────────────────────────────────────────────────

  async getSetting(key: string): Promise<string | undefined> {
    const row = await this.settings.get(key);
    return row?.value;
  }

  async setSetting(key: string, value: string): Promise<void> {
    await this.settings.put({ key, value });
  }

  async deleteSetting(key: string): Promise<void> {
    await this.settings.delete(key);
  }

  // ─── Daily goal ──────────────────────────────────────────────────────

  async getDailyGoal(): Promise<number> {
    const val = await this.getSetting('daily_goal');
    const parsed = parseInt(val ?? '360', 10);
    return isNaN(parsed) ? 360 : Math.max(30, Math.min(1440, parsed));
  }

  async setDailyGoal(minutes: number): Promise<void> {
    const clamped = Math.max(30, Math.min(1440, minutes));
    await this.setSetting('daily_goal', String(clamped));
  }

  // ─── Activity CRUD ───────────────────────────────────────────────────

  async getActivitiesForDate(date: string): Promise<Activity[]> {
    return this.activities.where('date').equals(date).toArray();
  }

  async addActivity(activity: Omit<Activity, 'id'>): Promise<number> {
    const id = await this.activities.add(activity as Activity);
    await this.updateDailyHistory(activity.date);
    return id;
  }

  async updateActivity(activity: Activity): Promise<void> {
    if (activity.id == null) return;
    await this.activities.put(activity);
    await this.updateDailyHistory(activity.date);
  }

  async deleteActivity(id: number): Promise<void> {
    const activity = await this.activities.get(id);
    if (!activity) return;
    await this.activities.delete(id);
    await this.updateDailyHistory(activity.date);
  }

  // ─── Focus sessions ─────────────────────────────────────────────────

  async recordFocusSession(session: Omit<FocusSession, 'id'>): Promise<number> {
    return this.focusSessions.add(session as FocusSession);
  }

  async getFocusSessionsForDate(date: string): Promise<FocusSession[]> {
    return this.focusSessions.where('session_date').equals(date).toArray();
  }

  async getTotalFocusMinutes(): Promise<number> {
    const sessions = await this.focusSessions.toArray();
    return sessions.reduce((sum, s) => sum + (s.actual_minutes || 0), 0);
  }

  // ─── XP ledger ──────────────────────────────────────────────────────

  async awardActivityCompletionXp(activityId: number, amount: number = 10): Promise<boolean> {
    // Idempotency: check net awarded for this activity
    const events = await this.xpEvents
      .where('[activity_id+event_type]')
      .anyOf([
        [activityId, 'activity_completion'],
        [activityId, 'activity_void'],
      ])
      .toArray();

    const netAwarded = events.reduce((sum, e) => sum + e.amount, 0);
    if (netAwarded > 0) return false; // already awarded

    const today = new Date().toISOString().slice(0, 10);
    await this.xpEvents.add({
      activity_id: activityId,
      earned_date: today,
      amount,
      event_type: 'activity_completion',
    });
    await this.syncTotalXpCache();
    return true;
  }

  async voidActivityCompletionXp(activityId: number): Promise<boolean> {
    const events = await this.xpEvents
      .where('[activity_id+event_type]')
      .anyOf([
        [activityId, 'activity_completion'],
        [activityId, 'activity_void'],
      ])
      .toArray();

    const netAwarded = events.reduce((sum, e) => sum + e.amount, 0);
    if (netAwarded <= 0) return false; // nothing to void

    const today = new Date().toISOString().slice(0, 10);
    await this.xpEvents.add({
      activity_id: activityId,
      earned_date: today,
      amount: -10,
      event_type: 'activity_void',
    });
    await this.syncTotalXpCache();
    return true;
  }

  async awardDailyGoalXp(earnedDate: string, amount: number = 50): Promise<boolean> {
    // Check if already awarded for this date
    const existing = await this.xpEvents
      .where('[activity_id+event_type]')
      .equals([0, 'daily_goal_completion'])
      .filter(e => e.earned_date === earnedDate)
      .first();

    // Also check with null activity_id
    const existingNull = await this.xpEvents
      .where('earned_date')
      .equals(earnedDate)
      .filter(e => e.event_type === 'daily_goal_completion')
      .first();

    if (existing || existingNull) return false;

    await this.xpEvents.add({
      activity_id: null,
      earned_date: earnedDate,
      amount,
      event_type: 'daily_goal_completion',
    });
    await this.syncTotalXpCache();
    return true;
  }

  async getTotalXp(): Promise<number> {
    const events = await this.xpEvents.toArray();
    const total = events.reduce((sum, e) => sum + e.amount, 0);
    return Math.max(0, total);
  }

  async syncTotalXpCache(): Promise<number> {
    const clamped = await this.getTotalXp();
    await this.setSetting('total_xp', String(clamped));
    return clamped;
  }

  async getXpEventsForDateRange(startDate: string, endDate: string): Promise<XpEvent[]> {
    return this.xpEvents
      .where('earned_date')
      .between(startDate, endDate, true, true)
      .toArray();
  }

  // ─── Daily history sync ──────────────────────────────────────────────

  async updateDailyHistory(activityDate: string): Promise<void> {
    const activities = await this.getActivitiesForDate(activityDate);
    const dailyGoal = await this.getDailyGoal();

    const completed = activities.filter(a => a.completed === 1);
    const studyMinutes = completed.reduce(
      (sum, a) => sum + Math.max(0, a.actual_minutes || 0),
      0
    );

    const record: DailyHistory = {
      date: activityDate,
      study_minutes: studyMinutes,
      completed_activities: completed.length,
      total_activities: activities.length,
      goal_completed: studyMinutes >= dailyGoal ? 1 : 0,
    };

    await this.dailyHistory.put(record);
  }

  // ─── Achievement / Milestone persistence ─────────────────────────────

  async getUnlockedAchievementIds(): Promise<Set<string>> {
    const records = await this.userAchievements.toArray();
    return new Set(records.map(r => r.achievement_id));
  }

  async unlockAchievement(
    achievementId: string,
    triggerEvent: string
  ): Promise<boolean> {
    const existing = await this.userAchievements
      .where('achievement_id')
      .equals(achievementId)
      .first();
    if (existing) return false;

    await this.userAchievements.add({
      achievement_id: achievementId,
      unlocked_at: new Date().toISOString(),
      trigger_event: triggerEvent,
    });
    return true;
  }

  async getReachedMilestones(): Promise<Map<string, number[]>> {
    const records = await this.milestoneHistory.toArray();
    const map = new Map<string, number[]>();
    for (const r of records) {
      const tiers = map.get(r.milestone_id) ?? [];
      tiers.push(r.tier);
      map.set(r.milestone_id, tiers);
    }
    return map;
  }

  async reachMilestone(
    milestoneId: string,
    tier: number
  ): Promise<boolean> {
    try {
      await this.milestoneHistory.add({
        milestone_id: milestoneId,
        tier,
        reached_at: new Date().toISOString(),
      });
      return true;
    } catch {
      return false; // unique constraint violation
    }
  }

  // ─── Calibration records ─────────────────────────────────────────────

  async getCalibrationRecords(): Promise<Activity[]> {
    return this.activities
      .filter(a => a.completed === 1)
      .toArray();
  }

  // ─── Insights queries ────────────────────────────────────────────────

  async getActivitiesForDateRange(
    startDate: string,
    endDate: string
  ): Promise<Activity[]> {
    return this.activities
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray();
  }

  async getFocusSessionsForDateRange(
    startDate: string,
    endDate: string
  ): Promise<FocusSession[]> {
    return this.focusSessions
      .where('session_date')
      .between(startDate, endDate, true, true)
      .toArray();
  }

  async getAllDailyHistory(): Promise<DailyHistory[]> {
    return this.dailyHistory.orderBy('date').toArray();
  }

  async getEarliestActivityDate(): Promise<string | null> {
    const first = await this.activities.orderBy('date').first();
    return first?.date ?? null;
  }

  // ─── Level history ───────────────────────────────────────────────────

  async checkAndRecordLevelReaches(
    totalXp: number,
    timestamp: string
  ): Promise<number[]> {
    // Import dynamically to avoid circular dependency
    const { getLevelForXp, getXpThreshold } = await import('./xp-manager');
    const currentLevel = getLevelForXp(totalXp);
    const newLevels: number[] = [];

    for (let level = 1; level <= currentLevel; level++) {
      const existing = await this.levelHistory
        .where('level')
        .equals(level)
        .first();
      if (!existing) {
        await this.levelHistory.add({
          level,
          reached_at: timestamp,
          xp_at_unlock: getXpThreshold(level),
        });
        newLevels.push(level);
      }
    }

    return newLevels;
  }

  // ─── Day details (for history snapshot) ──────────────────────────────

  async getDayDetails(date: string) {
    const [history, activities, sessions, xpEvents, dailyGoal] =
      await Promise.all([
        this.dailyHistory.get(date),
        this.getActivitiesForDate(date),
        this.getFocusSessionsForDate(date),
        this.xpEvents.where('earned_date').equals(date).toArray(),
        this.getDailyGoal(),
      ]);

    const totalXp = await this.getTotalXp();

    return {
      history: history ?? null,
      activities,
      sessions,
      xpEvents,
      dailyGoal,
      totalXp,
    };
  }

  // ─── Completed task counts ───────────────────────────────────────────

  async getTotalCompletedActivities(): Promise<number> {
    return this.activities.where('completed').equals(1).count();
  }
}

// Singleton instance
export const db = new AscendDatabase();
