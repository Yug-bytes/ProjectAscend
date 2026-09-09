/**
 * Persisted-data analytics and insight generation for Project Ascend Web.
 * Port of Modules/insights_service.py.
 *
 * Provides aggregated metrics, trend comparisons, activity distribution with 100% reconciliation,
 * weekly day-hour rhythm analysis, consistency levels, highlights, learned insights,
 * and rule-based insights.
 */

import { db } from './db';
import {
  parseIsoDate,
  formatDisplayDate,
  todayISO,
  addDays,
} from './date-utils';
import {
  formatMinutes,
  formatPlainPercent,
  formatErrorPercent,
} from './format';
import {
  calibrationService,
  BIAS_BAND,
  RECOMMENDATION_MIN_OBSERVATIONS,
} from './calibration-service';
import {
  getCurrentStreak,
  getLongestStreak,
} from './streak-manager';
import type {
  Activity,
  FocusSession,
  CalibrationReport,
} from './types';
import {
  RANGE_DAYS,
  RANGE_LABELS,
  COMPARISON_LABELS,
  RHYTHM_MIN_SESSIONS,
  WINDOW_MIN_SESSIONS,
  RHYTHM_HIGH_SHARE,
  CATEGORY_INSIGHT_MIN_SAMPLES,
  CATEGORY_INSIGHT_MIN_ERROR,
  DAY_INSIGHT_MIN_ACTIVE_DAYS,
  DAY_INSIGHT_MIN_MINUTES,
  CONSISTENCY_IMPROVEMENT_MIN_ACTIVE_HALF,
  CONSISTENCY_IMPROVEMENT_RATIO,
  PLANNING_TREND_MIN_SAMPLES,
  PLANNING_TREND_IMPROVEMENT_RATIO,
  DISTRIBUTION_MAX_ITEMS,
} from './constants';

export interface RangeDefinition {
  key: string;
  label: string;
  startDate: string; // ISO 'YYYY-MM-DD'
  endDate: string;
  previousStartDate: string | null;
  previousEndDate: string | null;
}

export interface DailyFocus {
  day: string; // ISO 'YYYY-MM-DD'
  focusMinutes: number;
  completedTasks: number;
  totalTasks: number;
}

export interface OverviewData {
  focusMinutes: number;
  completedTasks: number;
  totalTasks: number;
  completionRate: number;
  currentStreak: number;
  xpEarned: number | null;
  xpStatus: string | null;
  previousFocusMinutes: number;
  focusChangePercent: number | null;
  previousCompletionRate: number | null;
  completionChangePoints: number | null;
  previousCompletedTasks: number;
  activityChange: number | null;
  activeDays: number;
}

export interface TrendComparison {
  text: string;
  direction: 'positive' | 'negative' | 'neutral';
  percentage: number | null;
  previousFocusMinutes: number;
}

export interface FocusTrendData {
  points: DailyFocus[];
  totalFocusMinutes: number;
  dailyAverageMinutes: number;
  comparison: TrendComparison;
  granularity: 'daily' | 'weekly' | 'monthly';
}

export interface ProductivityPatterns {
  bestDayName: string | null;
  bestDayFocusMinutes: number;
  bestTimeLabel: string | null;
  bestTimeFocusMinutes: number;
  bestCategoryName: string | null;
  bestCategoryFocusMinutes: number;
  activeDays: number;
  periodDays: number;
}

export interface HeatmapDay {
  day: string;
  focusMinutes: number;
  level: 'inactive' | 'light' | 'moderate' | 'high';
}

export interface ConsistencyData {
  heatmapDays: HeatmapDay[];
  currentStreak: number;
  bestStreak: number;
  activeDays: number;
  periodDays: number;
  goalSuccessDays: number;
  dailyGoalMinutes: number;
  goalSuccessRate: number;
}

export interface ActivityShare {
  category: string;
  focusMinutes: number;
  percent: number;
}

export interface ActivityDistribution {
  items: ActivityShare[];
  totalMinutes: number;
}

export interface DayHourCell {
  dayIndex: number; // 0 = Monday ... 6 = Sunday
  blockIndex: number; // 0 = Morning, 1 = Afternoon, 2 = Evening, 3 = Night
  focusMinutes: number;
  sessionCount: number;
}

export interface DayHourPattern {
  cells: DayHourCell[];
  totalSessions: number;
  totalMinutes: number;
  strongestWindowLabel: string | null;
  strongestWindowMinutes: number;
  windowSessionCount: number;
  status: 'empty' | 'learning' | 'ready';
}

export interface Highlight {
  title: string;
  value: string;
  note: string;
}

export interface HighlightsData {
  bestDay: Highlight | null;
  longestSession: Highlight | null;
  improvement: Highlight | null;
}

export interface LearnedInsight {
  title: string;
  description: string;
  evidence: string;
  confidence: 'early_signal' | 'moderate_confidence' | 'high_confidence';
}

export interface InsightItem {
  kind: 'positive' | 'warning' | 'goal' | 'pattern' | 'streak' | 'recommendation' | 'info';
  title: string;
  description: string;
  metric?: string;
}

export interface InsightsDashboardData {
  rangeDefinition: RangeDefinition;
  overview: OverviewData;
  trend: FocusTrendData;
  patterns: ProductivityPatterns;
  consistency: ConsistencyData;
  calibration: CalibrationReport;
  distribution: ActivityDistribution;
  dayHour: DayHourPattern;
  highlights: HighlightsData;
  learned: LearnedInsight[];
  insights: InsightItem[];
}

export class InsightsService {
  /**
   * Build complete dashboard analytics bundle for a selected range.
   */
  public async buildDashboard(
    rangeKey: string = '7_days',
    todayStr: string = todayISO()
  ): Promise<InsightsDashboardData> {
    const rangeDefinition = await this.getRangeDefinition(rangeKey, todayStr);
    const fetchStart = rangeDefinition.previousStartDate || rangeDefinition.startDate;
    const fetchEnd = rangeDefinition.endDate;

    const [activities, focusSessions, xpEvents, dailyGoal, calibration, allDailyHistory] =
      await Promise.all([
        db.getActivitiesForDateRange(fetchStart, fetchEnd),
        db.getFocusSessionsForDateRange(fetchStart, fetchEnd),
        db.getXpEventsForDateRange(fetchStart, fetchEnd),
        db.getDailyGoal(),
        calibrationService.buildReport(todayStr),
        db.getAllDailyHistory(),
      ]);

    const [currentActivities, previousActivities] = this.partitionRecords(
      activities,
      'date',
      rangeDefinition
    );
    const [currentSessions] = this.partitionRecords(
      focusSessions,
      'session_date',
      rangeDefinition
    );
    const [currentXpEvents] = this.partitionRecords(
      xpEvents,
      'earned_date',
      rangeDefinition
    );

    const currentDays = this.buildDailyFocus(
      currentActivities,
      rangeDefinition.startDate,
      rangeDefinition.endDate
    );
    const previousDays = rangeDefinition.previousStartDate
      ? this.buildDailyFocus(
          previousActivities,
          rangeDefinition.previousStartDate,
          rangeDefinition.previousEndDate!
        )
      : [];

    const currentFocus = currentDays.reduce((sum, d) => sum + d.focusMinutes, 0);
    const previousFocus = previousDays.reduce((sum, d) => sum + d.focusMinutes, 0);
    const completedTasks = currentDays.reduce((sum, d) => sum + d.completedTasks, 0);
    const totalTasks = currentDays.reduce((sum, d) => sum + d.totalTasks, 0);
    const previousCompletedTasks = previousDays.reduce((sum, d) => sum + d.completedTasks, 0);
    const previousTotalTasks = previousDays.reduce((sum, d) => sum + d.totalTasks, 0);

    // Streaks from daily history
    const historyMap = new Map<string, boolean>();
    for (const h of allDailyHistory) {
      historyMap.set(h.date, h.goal_completed === 1);
    }
    const currentStreak = getCurrentStreak(historyMap, todayStr);
    const bestStreak = getLongestStreak(historyMap);

    const xpEarned = currentXpEvents.reduce((sum, e) => sum + (e.amount || 0), 0);

    const patterns = this.buildPatterns(currentDays, currentActivities, currentSessions);
    const comparison = this.buildComparison(currentFocus, previousFocus, rangeDefinition);

    const hasPreviousData = previousTotalTasks > 0 || previousFocus > 0;
    const previousCompletionRate = hasPreviousData
      ? this.calculatePercentage(previousCompletedTasks, previousTotalTasks)
      : null;
    const completionRate = this.calculatePercentage(completedTasks, totalTasks);

    const overview: OverviewData = {
      focusMinutes: currentFocus,
      completedTasks,
      totalTasks,
      completionRate,
      currentStreak,
      xpEarned,
      xpStatus: null,
      previousFocusMinutes: previousFocus,
      focusChangePercent: comparison.percentage,
      previousCompletionRate,
      completionChangePoints:
        previousCompletionRate !== null ? completionRate - previousCompletionRate : null,
      previousCompletedTasks,
      activityChange: hasPreviousData ? completedTasks - previousCompletedTasks : null,
      activeDays: patterns.activeDays,
    };

    const [trendPoints, granularity] = this.buildTrendPoints(currentDays, rangeKey);
    const trend: FocusTrendData = {
      points: trendPoints,
      totalFocusMinutes: currentFocus,
      dailyAverageMinutes: currentDays.length > 0 ? Math.round(currentFocus / currentDays.length) : 0,
      comparison,
      granularity,
    };

    const consistency = this.buildConsistency(
      currentDays,
      dailyGoal,
      currentStreak,
      bestStreak
    );

    const distribution = this.buildDistribution(currentActivities);
    const dayHour = this.buildDayHourPattern(currentSessions);
    const highlights = this.buildHighlights(patterns, comparison, currentSessions, rangeDefinition);
    const learned = await this.buildLearnedInsights(
      dayHour,
      patterns,
      consistency,
      calibration,
      currentDays
    );
    const insights = this.generateInsights(
      overview,
      trend,
      patterns,
      consistency,
      calibration
    );

    return {
      rangeDefinition,
      overview,
      trend,
      patterns,
      consistency,
      calibration,
      distribution,
      dayHour,
      highlights,
      learned,
      insights,
    };
  }

  public async getRangeDefinition(rangeKey: string, todayStr: string = todayISO()): Promise<RangeDefinition> {
    const validKey = rangeKey in RANGE_DAYS ? rangeKey : '7_days';
    const periodDays = RANGE_DAYS[validKey];
    const label = RANGE_LABELS[validKey] || '7 Days';

    if (validKey === 'all_time' || periodDays === null) {
      const earliest = await db.getEarliestActivityDate();
      const startDate = earliest || todayStr;
      return {
        key: 'all_time',
        label: RANGE_LABELS.all_time,
        startDate,
        endDate: todayStr,
        previousStartDate: null,
        previousEndDate: null,
      };
    }

    const startDate = addDays(todayStr, -(periodDays - 1));
    const previousEndDate = addDays(startDate, -1);
    const previousStartDate = addDays(previousEndDate, -(periodDays - 1));

    return {
      key: validKey,
      label,
      startDate,
      endDate: todayStr,
      previousStartDate,
      previousEndDate,
    };
  }

  private partitionRecords<T, K extends keyof T>(
    records: T[],
    dateKey: K,
    rangeDef: RangeDefinition
  ): [T[], T[]] {
    const current: T[] = [];
    const previous: T[] = [];

    for (const record of records) {
      const val = record[dateKey];
      if (typeof val !== 'string' || !val) continue;

      if (val >= rangeDef.startDate && val <= rangeDef.endDate) {
        current.push(record);
      } else if (
        rangeDef.previousStartDate &&
        rangeDef.previousEndDate &&
        val >= rangeDef.previousStartDate &&
        val <= rangeDef.previousEndDate
      ) {
        previous.push(record);
      }
    }

    return [current, previous];
  }

  public buildDailyFocus(activities: Activity[], startDate: string, endDate: string): DailyFocus[] {
    const totals = new Map<
      string,
      { focusMinutes: number; completedTasks: number; totalTasks: number }
    >();

    let cur = startDate;
    while (cur <= endDate) {
      totals.set(cur, { focusMinutes: 0, completedTasks: 0, totalTasks: 0 });
      cur = addDays(cur, 1);
    }

    for (const act of activities) {
      const dayTotals = totals.get(act.date);
      if (!dayTotals) continue;

      dayTotals.totalTasks += 1;
      if (act.completed) {
        dayTotals.completedTasks += 1;
        dayTotals.focusMinutes += Math.max(0, act.actual_minutes || 0);
      }
    }

    const result: DailyFocus[] = [];
    for (const [day, values] of totals.entries()) {
      result.push({
        day,
        focusMinutes: values.focusMinutes,
        completedTasks: values.completedTasks,
        totalTasks: values.totalTasks,
      });
    }

    return result.sort((a, b) => a.day.localeCompare(b.day));
  }

  public buildComparison(
    currentMinutes: number,
    previousMinutes: number,
    rangeDef: RangeDefinition
  ): TrendComparison {
    const periodLabel = COMPARISON_LABELS[rangeDef.key] || 'previous period';

    if (previousMinutes === 0) {
      if (currentMinutes === 0) {
        return {
          text: 'No previous data',
          direction: 'neutral',
          percentage: null,
          previousFocusMinutes: 0,
        };
      }
      return {
        text: 'New baseline',
        direction: 'positive',
        percentage: null,
        previousFocusMinutes: 0,
      };
    }

    const change = Math.round(((currentMinutes - previousMinutes) / previousMinutes) * 100);
    if (change > 0) {
      return {
        text: `${change}% more than ${periodLabel}`,
        direction: 'positive',
        percentage: change,
        previousFocusMinutes: previousMinutes,
      };
    } else if (change < 0) {
      return {
        text: `${Math.abs(change)}% less than ${periodLabel}`,
        direction: 'negative',
        percentage: change,
        previousFocusMinutes: previousMinutes,
      };
    } else {
      return {
        text: `Same as ${periodLabel}`,
        direction: 'neutral',
        percentage: 0,
        previousFocusMinutes: previousMinutes,
      };
    }
  }

  public buildPatterns(
    dailyFocus: DailyFocus[],
    activities: Activity[],
    sessions: FocusSession[]
  ): ProductivityPatterns {
    const focusByWeekday: Record<string, number> = {};
    const weekdayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    for (const d of dailyFocus) {
      if (d.focusMinutes <= 0) continue;
      const parsed = parseIsoDate(d.day);
      if (!parsed) continue;
      const dayIdx = (parsed.getDay() + 6) % 7;
      const weekday = weekdayNames[dayIdx];
      focusByWeekday[weekday] = (focusByWeekday[weekday] || 0) + d.focusMinutes;
    }

    let bestDayName: string | null = null;
    let bestDayMinutes = 0;
    for (const [day, mins] of Object.entries(focusByWeekday)) {
      if (mins > bestDayMinutes) {
        bestDayMinutes = mins;
        bestDayName = day;
      }
    }

    const focusByHourBlock: Record<number, number> = {};
    for (const session of sessions) {
      const mins = Math.max(0, session.actual_minutes || 0);
      if (mins <= 0 || !session.started_at) continue;
      const hour = new Date(session.started_at).getHours();
      const blockStart = Math.floor(hour / 2) * 2;
      focusByHourBlock[blockStart] = (focusByHourBlock[blockStart] || 0) + mins;
    }

    let bestTimeLabel: string | null = null;
    let bestTimeMinutes = 0;
    for (const [block, mins] of Object.entries(focusByHourBlock)) {
      const b = Number(block);
      if (mins > bestTimeMinutes) {
        bestTimeMinutes = mins;
        bestTimeLabel = formatHourBlock(b);
      }
    }

    const focusByCategory: Record<string, number> = {};
    for (const act of activities) {
      if (!act.completed) continue;
      const mins = Math.max(0, act.actual_minutes || 0);
      if (mins <= 0) continue;
      const cat = act.activity_type || 'Uncategorised';
      focusByCategory[cat] = (focusByCategory[cat] || 0) + mins;
    }

    let bestCategoryName: string | null = null;
    let bestCategoryMinutes = 0;
    for (const [cat, mins] of Object.entries(focusByCategory)) {
      if (mins > bestCategoryMinutes) {
        bestCategoryMinutes = mins;
        bestCategoryName = cat;
      }
    }

    const activeDays = dailyFocus.filter(
      (d) => d.focusMinutes > 0 || d.completedTasks > 0
    ).length;

    return {
      bestDayName,
      bestDayFocusMinutes: bestDayMinutes,
      bestTimeLabel,
      bestTimeFocusMinutes: bestTimeMinutes,
      bestCategoryName,
      bestCategoryFocusMinutes: bestCategoryMinutes,
      activeDays,
      periodDays: dailyFocus.length,
    };
  }

  public buildTrendPoints(
    dailyFocus: DailyFocus[],
    rangeKey: string
  ): [DailyFocus[], 'daily' | 'weekly' | 'monthly'] {
    if (dailyFocus.length === 0) {
      return [[], 'daily'];
    }

    const spanDays = dailyFocus.length;
    if (['today', '7_days', '30_days'].includes(rangeKey) || spanDays <= 31) {
      return [dailyFocus, 'daily'];
    }
    if (spanDays <= 180) {
      return [this.bucketDays(dailyFocus, 7), 'weekly'];
    }
    return [this.bucketDays(dailyFocus, 30), 'monthly'];
  }

  private bucketDays(dailyFocus: DailyFocus[], bucketSize: number): DailyFocus[] {
    const buckets: DailyFocus[] = [];
    for (let i = 0; i < dailyFocus.length; i += bucketSize) {
      const chunk = dailyFocus.slice(i, i + bucketSize);
      const first = chunk[0];
      buckets.push({
        day: first.day,
        focusMinutes: chunk.reduce((sum, p) => sum + p.focusMinutes, 0),
        completedTasks: chunk.reduce((sum, p) => sum + p.completedTasks, 0),
        totalTasks: chunk.reduce((sum, p) => sum + p.totalTasks, 0),
      });
    }
    return buckets;
  }

  public buildDistribution(
    activities: Activity[],
    maxItems: number = DISTRIBUTION_MAX_ITEMS
  ): ActivityDistribution {
    const focusByCategory: Record<string, number> = {};
    for (const act of activities) {
      if (!act.completed) continue;
      const mins = Math.max(0, act.actual_minutes || 0);
      if (mins <= 0) continue;
      const cat = act.activity_type || 'Uncategorised';
      focusByCategory[cat] = (focusByCategory[cat] || 0) + mins;
    }

    const total = Object.values(focusByCategory).reduce((a, b) => a + b, 0);
    if (total === 0) {
      return { items: [], totalMinutes: 0 };
    }

    const ordered = Object.entries(focusByCategory).sort((a, b) => b[1] - a[1]);
    const visible = ordered.slice(0, maxItems);
    const items: ActivityShare[] = visible.map(([category, focusMinutes]) => ({
      category,
      focusMinutes,
      percent: Math.round((focusMinutes / total) * 100),
    }));

    if (ordered.length > maxItems) {
      const otherMinutes = ordered
        .slice(maxItems)
        .reduce((sum, [, mins]) => sum + mins, 0);
      items.push({
        category: 'Other',
        focusMinutes: otherMinutes,
        percent: 0,
      });
    }

    // Exact 100% reconciliation by adjusting the last bar
    if (items.length > 0) {
      const sumBeforeLast = items
        .slice(0, -1)
        .reduce((sum, item) => sum + item.percent, 0);
      items[items.length - 1].percent = Math.max(0, 100 - sumBeforeLast);
    }

    return { items, totalMinutes: total };
  }

  public blockIndexForHour(hour: number): number {
    if (hour >= 5 && hour < 12) return 0;
    if (hour >= 12 && hour < 17) return 1;
    if (hour >= 17 && hour < 22) return 2;
    return 3;
  }

  public buildDayHourPattern(sessions: FocusSession[]): DayHourPattern {
    const cells = new Map<string, { minutes: number; count: number }>();
    let totalMinutes = 0;
    let totalSessions = 0;
    const windowMinutes: Record<number, number> = {};
    const windowCounts: Record<number, number> = {};

    for (const session of sessions) {
      const mins = Math.max(0, session.actual_minutes || 0);
      if (!session.started_at || mins <= 0) continue;

      const started = new Date(session.started_at);
      if (isNaN(started.getTime())) continue;

      totalSessions += 1;
      totalMinutes += mins;

      const dayIndex = (started.getDay() + 6) % 7; // 0=Mon..6=Sun
      const hour = started.getHours();
      const blockIndex = this.blockIndexForHour(hour);

      const cellKey = `${dayIndex}-${blockIndex}`;
      const cell = cells.get(cellKey) || { minutes: 0, count: 0 };
      cell.minutes += mins;
      cell.count += 1;
      cells.set(cellKey, cell);

      // 2-hour sliding window
      for (let winStart = 0; winStart < 24; winStart++) {
        if ((hour - winStart + 24) % 24 < 2) {
          windowMinutes[winStart] = (windowMinutes[winStart] || 0) + mins;
          windowCounts[winStart] = (windowCounts[winStart] || 0) + 1;
        }
      }
    }

    const cellList: DayHourCell[] = [];
    for (let day = 0; day < 7; day++) {
      for (let block = 0; block < 4; block++) {
        const cell = cells.get(`${day}-${block}`);
        cellList.push({
          dayIndex: day,
          blockIndex: block,
          focusMinutes: cell?.minutes || 0,
          sessionCount: cell?.count || 0,
        });
      }
    }

    let strongestWindowLabel: string | null = null;
    let strongestWindowMinutes = 0;
    let windowSessionCount = 0;

    for (let h = 0; h < 24; h++) {
      const mins = windowMinutes[h] || 0;
      if (mins > strongestWindowMinutes) {
        strongestWindowMinutes = mins;
        strongestWindowLabel = formatHourBlock(h);
        windowSessionCount = windowCounts[h] || 0;
      }
    }

    let status: 'empty' | 'learning' | 'ready' = 'empty';
    if (totalSessions === 0) {
      status = 'empty';
    } else if (
      totalSessions >= RHYTHM_MIN_SESSIONS &&
      windowSessionCount >= WINDOW_MIN_SESSIONS
    ) {
      status = 'ready';
    } else {
      status = 'learning';
    }

    return {
      cells: cellList,
      totalSessions,
      totalMinutes,
      strongestWindowLabel,
      strongestWindowMinutes,
      windowSessionCount,
      status,
    };
  }

  public buildHighlights(
    patterns: ProductivityPatterns,
    comparison: TrendComparison,
    sessions: FocusSession[],
    rangeDef: RangeDefinition
  ): HighlightsData {
    let bestDay: Highlight | null = null;
    if (patterns.bestDayName) {
      bestDay = {
        title: 'Best Day',
        value: patterns.bestDayName,
        note: `${formatMinutes(patterns.bestDayFocusMinutes)} focused work`,
      };
    }

    let longestSession: Highlight | null = null;
    let maxMins = 0;
    let maxDate = '';

    for (const session of sessions) {
      const mins = Math.max(0, session.actual_minutes || 0);
      if (mins > maxMins) {
        maxMins = mins;
        maxDate = session.session_date;
      }
    }

    if (maxMins > 0) {
      longestSession = {
        title: 'Longest Focus Session',
        value: formatMinutes(maxMins),
        note: maxDate ? formatDisplayDate(maxDate) : 'This period',
      };
    }

    let improvement: Highlight | null = null;
    if (comparison.percentage !== null && comparison.percentage > 0) {
      improvement = {
        title: 'Biggest Improvement',
        value: `+${comparison.percentage}%`,
        note: `More focus than ${COMPARISON_LABELS[rangeDef.key] || 'the previous period'}`,
      };
    }

    return {
      bestDay,
      longestSession,
      improvement,
    };
  }

  public buildConsistency(
    dailyFocus: DailyFocus[],
    dailyGoalMinutes: number,
    currentStreak: number,
    bestStreak: number
  ): ConsistencyData {
    const goalMinutes = Math.max(1, Math.floor(dailyGoalMinutes || 0));
    const heatmapDays: HeatmapDay[] = [];
    let goalSuccessDays = 0;
    let activeDays = 0;

    for (const d of dailyFocus) {
      let level: 'inactive' | 'light' | 'moderate' | 'high' = 'inactive';
      if (d.focusMinutes >= goalMinutes) {
        level = 'high';
        goalSuccessDays += 1;
      } else if (d.focusMinutes >= Math.round(goalMinutes * 0.5)) {
        level = 'moderate';
      } else if (d.focusMinutes > 0 || d.completedTasks > 0) {
        level = 'light';
      } else {
        level = 'inactive';
      }

      if (level !== 'inactive') {
        activeDays += 1;
      }

      heatmapDays.push({
        day: d.day,
        focusMinutes: d.focusMinutes,
        level,
      });
    }

    const periodDays = dailyFocus.length;
    const goalSuccessRate = periodDays > 0 ? Math.round((goalSuccessDays / periodDays) * 100) : 0;

    return {
      heatmapDays,
      currentStreak,
      bestStreak,
      activeDays,
      periodDays,
      goalSuccessDays,
      dailyGoalMinutes: goalMinutes,
      goalSuccessRate,
    };
  }

  public async buildLearnedInsights(
    dayHour: DayHourPattern,
    patterns: ProductivityPatterns,
    consistency: ConsistencyData,
    calibration: CalibrationReport,
    dailyFocus: DailyFocus[]
  ): Promise<LearnedInsight[]> {
    const learned: LearnedInsight[] = [];

    // 1. Rhythm
    if (dayHour.status === 'ready' && dayHour.strongestWindowLabel) {
      const share = dayHour.totalMinutes > 0 ? dayHour.strongestWindowMinutes / dayHour.totalMinutes : 0;
      const confidence = share >= RHYTHM_HIGH_SHARE ? 'high_confidence' : 'moderate_confidence';
      learned.push({
        title: 'Focus Window',
        description: `You do your strongest focused work between ${dayHour.strongestWindowLabel}.`,
        evidence: `Based on ${dayHour.windowSessionCount} sessions`,
        confidence,
      });
    }

    // 2. Estimate Pattern
    const candidates = calibration.categories.filter(
      (cat) =>
        cat.sample_count >= CATEGORY_INSIGHT_MIN_SAMPLES &&
        cat.mean_relative_error !== null &&
        Math.abs(cat.mean_relative_error) >= CATEGORY_INSIGHT_MIN_ERROR
    );

    if (candidates.length > 0) {
      const strongest = candidates.reduce((prev, curr) =>
        Math.abs(curr.mean_relative_error!) > Math.abs(prev.mean_relative_error!) ? curr : prev
      );
      const desc =
        strongest.bias === 'underestimate'
          ? `You consistently underestimate ${strongest.activity_type} time.`
          : `You consistently overestimate ${strongest.activity_type} time.`;
      const confidence =
        strongest.sample_count >= RECOMMENDATION_MIN_OBSERVATIONS
          ? 'moderate_confidence'
          : 'early_signal';
      learned.push({
        title: 'Estimate Pattern',
        description: desc,
        evidence: `Based on ${strongest.sample_count} completed activities`,
        confidence,
      });
    }

    // 3. Best Day
    if (
      patterns.bestDayName &&
      patterns.activeDays >= DAY_INSIGHT_MIN_ACTIVE_DAYS &&
      patterns.bestDayFocusMinutes >= DAY_INSIGHT_MIN_MINUTES
    ) {
      learned.push({
        title: 'Best Day',
        description: `${patterns.bestDayName} is currently your strongest productivity day.`,
        evidence: `${formatMinutes(patterns.bestDayFocusMinutes)} focused in this period`,
        confidence: patterns.activeDays >= 7 ? 'moderate_confidence' : 'early_signal',
      });
    }

    // 4. Growing Consistency
    const halves = this.splitDailyFocusHalves(dailyFocus);
    if (halves.length === 2) {
      const [olderCV, olderActive] = this.focusVariability(halves[0]);
      const [newerCV, newerActive] = this.focusVariability(halves[1]);
      if (
        olderCV !== null &&
        newerCV !== null &&
        olderActive >= CONSISTENCY_IMPROVEMENT_MIN_ACTIVE_HALF &&
        newerActive >= CONSISTENCY_IMPROVEMENT_MIN_ACTIVE_HALF &&
        newerCV < olderCV * CONSISTENCY_IMPROVEMENT_RATIO
      ) {
        learned.push({
          title: 'Growing Consistency',
          description: 'Your focus is becoming more consistent.',
          evidence: `Day-to-day variability fell from ${Math.round(olderCV * 100)}% to ${Math.round(newerCV * 100)}%`,
          confidence: 'moderate_confidence',
        });
      }
    }

    // 5. Sharper Estimates
    const planningInsight = await this.buildPlanningTrendInsight();
    if (planningInsight) {
      learned.push(planningInsight);
    }

    return learned.slice(0, 4);
  }

  private splitDailyFocusHalves(dailyFocus: DailyFocus[]): [DailyFocus[], DailyFocus[]] | [] {
    if (dailyFocus.length === 0) return [];
    const mid = Math.floor(dailyFocus.length / 2);
    if (mid === 0) return [];
    return [dailyFocus.slice(0, mid), dailyFocus.slice(mid)];
  }

  private focusVariability(days: DailyFocus[]): [number | null, number] {
    const minutes = days.map((d) => d.focusMinutes);
    const active = minutes.filter((m) => m > 0).length;
    const sum = minutes.reduce((a, b) => a + b, 0);
    if (minutes.length === 0 || sum <= 0) {
      return [null, active];
    }
    const mean = sum / minutes.length;
    const variance =
      minutes.reduce((acc, m) => acc + Math.pow(m - mean, 2), 0) / minutes.length;
    const stdDev = Math.sqrt(variance);
    return [stdDev / mean, active];
  }

  private async buildPlanningTrendInsight(): Promise<LearnedInsight | null> {
    const activities = await db.getCalibrationRecords();
    const pairs: { date: string; error: number }[] = [];

    for (const act of activities) {
      if (!act.completed) continue;
      const estimated = Math.floor(
        act.original_estimate_minutes || act.estimated_minutes || 0
      );
      const actual = Math.floor(act.actual_minutes || 0);
      if (estimated <= 0 || actual <= 0 || !act.date) continue;

      pairs.push({
        date: act.date,
        error: Math.abs(actual - estimated) / estimated,
      });
    }

    if (pairs.length < PLANNING_TREND_MIN_SAMPLES) return null;

    pairs.sort((a, b) => a.date.localeCompare(b.date));
    const mid = Math.floor(pairs.length / 2);
    const older = pairs.slice(0, mid);
    const newer = pairs.slice(mid);

    const olderMean = older.reduce((s, p) => s + p.error, 0) / older.length;
    const newerMean = newer.reduce((s, p) => s + p.error, 0) / newer.length;

    if (olderMean <= 0) return null;
    if (newerMean >= olderMean * PLANNING_TREND_IMPROVEMENT_RATIO) return null;

    return {
      title: 'Sharper Estimates',
      description: 'Your estimates are becoming more accurate.',
      evidence: `Typical error dropped from ${formatPlainPercent(olderMean)} to ${formatPlainPercent(newerMean)}`,
      confidence: 'moderate_confidence',
    };
  }

  public generateInsights(
    overview: OverviewData,
    trend: FocusTrendData,
    patterns: ProductivityPatterns,
    consistency: ConsistencyData,
    calibration: CalibrationReport
  ): InsightItem[] {
    const insights: InsightItem[] = [];
    const comparison = trend.comparison;
    const hasCurrentWork = overview.completedTasks > 0 || overview.focusMinutes > 0;
    const hasPreviousWork = comparison.previousFocusMinutes > 0;

    if (!hasCurrentWork && !hasPreviousWork) {
      return [
        {
          kind: 'info',
          title: 'Personal insights unlock with activity',
          description:
            'Keep using Project Ascend. More activity will unlock personalized insights.',
        },
      ];
    }

    if (comparison.percentage !== null && comparison.percentage >= 10) {
      insights.push({
        kind: 'positive',
        title: 'Focus time is improving',
        description: `You focused ${comparison.percentage}% more than the previous equivalent period.`,
        metric: `+${comparison.percentage}%`,
      });
    } else if (comparison.percentage !== null && comparison.percentage <= -10) {
      insights.push({
        kind: 'warning',
        title: 'Focus time has dropped',
        description: `You focused ${Math.abs(comparison.percentage)}% less than the previous equivalent period.`,
        metric: `-${Math.abs(comparison.percentage)}%`,
      });
    }

    const summary = calibration.summary;
    if (
      summary.sample_count >= RECOMMENDATION_MIN_OBSERVATIONS &&
      summary.mean_relative_error !== null &&
      Math.abs(summary.mean_relative_error) >= BIAS_BAND
    ) {
      const biasPercent = formatErrorPercent(summary.mean_relative_error);
      if (summary.bias === 'underestimate') {
        insights.push({
          kind: 'recommendation',
          title: 'Your estimates tend to run short',
          description: `Across ${summary.sample_count} completed activities you took ${biasPercent} longer than planned on average. Adding a buffer when planning makes your day more realistic.`,
          metric: biasPercent,
        });
      } else if (summary.bias === 'overestimate') {
        insights.push({
          kind: 'recommendation',
          title: 'Your estimates tend to run long',
          description: `Across ${summary.sample_count} completed activities you finished ${biasPercent} sooner than planned on average. The freed-up time can be planned for.`,
          metric: biasPercent,
        });
      }
    }

    if (overview.totalTasks >= 3 && overview.completionRate < 60) {
      const remaining = overview.totalTasks - overview.completedTasks;
      insights.push({
        kind: 'warning',
        title: 'Completion rate needs attention',
        description: `${remaining} planned activities remain unfinished in this period.`,
        metric: `${overview.completionRate}%`,
      });
    }

    if (consistency.goalSuccessDays > 0) {
      insights.push({
        kind: 'goal',
        title: "You're hitting your daily focus goal.",
        description: `You met your ${formatMinutes(consistency.dailyGoalMinutes)} daily goal on ${consistency.goalSuccessDays} of ${formatDayCount(consistency.periodDays)}.`,
        metric: `${consistency.goalSuccessDays}/${formatDayCount(consistency.periodDays)}`,
      });
    }

    if (patterns.bestTimeLabel) {
      insights.push({
        kind: 'pattern',
        title: 'A strong focus window is emerging',
        description: `Your timestamped sessions are strongest between ${patterns.bestTimeLabel}.`,
        metric: formatMinutes(patterns.bestTimeFocusMinutes),
      });
    } else if (patterns.bestDayName) {
      insights.push({
        kind: 'pattern',
        title: 'Your strongest day is clear',
        description: `${patterns.bestDayName} has your highest focus time in this period.`,
        metric: formatMinutes(patterns.bestDayFocusMinutes),
      });
    }

    if (consistency.currentStreak >= 3) {
      insights.push({
        kind: 'streak',
        title: 'Your streak is holding',
        description: `You have maintained a ${consistency.currentStreak}-day daily-goal streak.`,
        metric: formatDayCount(consistency.currentStreak),
      });
    }

    if (
      consistency.activeDays > 0 &&
      consistency.activeDays < consistency.periodDays &&
      insights.length < 4
    ) {
      const missed = consistency.periodDays - consistency.activeDays;
      const verb = missed === 1 ? 'was' : 'were';
      insights.push({
        kind: 'recommendation',
        title: 'Protect your next focus block',
        description: `${formatDayCount(missed)} ${verb} inactive. A short planned session can make the routine easier to sustain.`,
      });
    }

    if (insights.length === 0) {
      insights.push({
        kind: 'info',
        title: 'Keep building your baseline',
        description:
          'Complete a few more focus sessions to unlock stronger comparisons and patterns.',
      });
    }

    return insights.slice(0, 4);
  }

  private calculatePercentage(numerator: number, denominator: number): number {
    if (denominator <= 0) return 0;
    return Math.round((numerator / denominator) * 100);
  }
}

export function comparisonCaption(rangeDef: RangeDefinition): string {
  if (!rangeDef.previousStartDate) {
    return 'All recorded activity';
  }
  const prev = COMPARISON_LABELS[rangeDef.key] || 'previous period';
  return `${rangeDef.label} vs ${prev}`;
}

export function formatDayCount(count: number): string {
  const c = Math.max(0, Math.floor(count || 0));
  return c === 1 ? '1 day' : `${c} days`;
}

export function formatClockHour(hour: number): string {
  const h = hour % 24;
  const suffix = h < 12 ? 'AM' : 'PM';
  const display = h % 12 || 12;
  return `${display} ${suffix}`;
}

export function formatHourBlock(hour: number): string {
  return `${formatClockHour(hour)} - ${formatClockHour((hour + 2) % 24)}`;
}

export const insightsService = new InsightsService();
