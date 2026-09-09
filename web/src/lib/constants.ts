/**
 * All numeric constants from the desktop app's Python modules.
 * Centralized here so business logic modules reference a single source of truth.
 */

// ─── Capacity Service ────────────────────────────────────────────────────────

export const ESTIMATE_MIN_MINUTES = 5;
export const ESTIMATE_MAX_MINUTES = 600;
export const NEAR_CAPACITY_MINUTES = 15;

export const STATE_NO_CAPACITY_DATA = 'no_capacity_data' as const;
export const STATE_NO_TASKS = 'no_tasks' as const;
export const STATE_UNDER_CAPACITY = 'under_capacity' as const;
export const STATE_NEAR_CAPACITY = 'near_capacity' as const;
export const STATE_OVER_CAPACITY = 'over_capacity' as const;

export const BASIS_LEARNED = 'learned' as const;
export const BASIS_USER_ESTIMATE = 'your_estimate' as const;

// ─── Smart Estimates ─────────────────────────────────────────────────────────

export const EXACT_MIN_OBSERVATIONS = 5;
export const CATEGORY_MIN_OBSERVATIONS = 10;
export const OVERALL_MIN_OBSERVATIONS = 10;
export const RELEVANCE_MARGIN_MINUTES = 5;
export const RECOMMENDATION_STEP_MINUTES = 5;

// ─── Calibration ─────────────────────────────────────────────────────────────

export const MIN_OBSERVATIONS_FOR_STATS = 3;
export const RECOMMENDATION_MIN_OBSERVATIONS = 10;
export const HIGH_CONFIDENCE_MIN_OBSERVATIONS = 25;
export const BIAS_BAND = 0.05;

// ─── Available Time Store ────────────────────────────────────────────────────

export const MIN_AVAILABLE_MINUTES = 0;
export const MAX_AVAILABLE_MINUTES = 1440;
export const RETENTION_DAYS_PAST = 7;
export const RETENTION_DAYS_FUTURE = 30;
export const AVAILABLE_TIME_SETTING_KEY = 'planner_available_minutes';

// ─── XP & Levels ─────────────────────────────────────────────────────────────

export const XP_PER_ACTIVITY_COMPLETION = 10;
export const XP_PER_DAILY_GOAL = 50;
export const XP_VOID_AMOUNT = -10;

// Three-tier XP progression
export const TIER_1_XP_PER_LEVEL = 100;    // Levels 1–10
export const TIER_1_MAX_LEVEL = 10;
export const TIER_1_TOTAL_XP = 900;         // 9 × 100

export const TIER_2_XP_PER_LEVEL = 250;    // Levels 11–50
export const TIER_2_MAX_LEVEL = 50;
export const TIER_2_TOTAL_XP = 10_900;      // 900 + 40 × 250

export const TIER_3_XP_PER_LEVEL = 500;    // Levels 51+

// ─── Evolution Stages ────────────────────────────────────────────────────────

export const EVOLUTION_STAGES = [
  { stage: 1 as const, name: 'Initiated', minLevel: 1 },
  { stage: 2 as const, name: 'Established', minLevel: 10 },
  { stage: 3 as const, name: 'Ascended', minLevel: 25 },
  { stage: 4 as const, name: 'Sovereign', minLevel: 50 },
];

// ─── Daily Goal ──────────────────────────────────────────────────────────────

export const DAILY_GOAL_DEFAULT = 360;      // 6 hours
export const DAILY_GOAL_MIN = 30;
export const DAILY_GOAL_MAX = 1440;
export const DAILY_GOAL_STEP = 15;

// ─── Insights ────────────────────────────────────────────────────────────────

export const RANGE_DAYS: Record<string, number | null> = {
  today: 1,
  '7_days': 7,
  '30_days': 30,
  '90_days': 90,
  all_time: null,
};

export const RANGE_LABELS: Record<string, string> = {
  today: 'Today',
  '7_days': '7 Days',
  '30_days': '30 Days',
  '90_days': '3 Months',
  all_time: 'All Time',
};

export const COMPARISON_LABELS: Record<string, string> = {
  today: 'previous day',
  '7_days': 'previous week',
  '30_days': 'previous 30 days',
  '90_days': 'previous 3 months',
  all_time: 'previous period',
};

export const TIME_BLOCKS = [
  { start: 5, end: 12, label: 'Morning' },
  { start: 12, end: 17, label: 'Afternoon' },
  { start: 17, end: 22, label: 'Evening' },
  { start: 22, end: 29, label: 'Night' },
] as const;

export const RHYTHM_MIN_SESSIONS = 8;
export const WINDOW_MIN_SESSIONS = 3;
export const RHYTHM_HIGH_SHARE = 0.4;
export const CATEGORY_INSIGHT_MIN_SAMPLES = 5;
export const CATEGORY_INSIGHT_MIN_ERROR = 0.10;
export const DAY_INSIGHT_MIN_ACTIVE_DAYS = 3;
export const DAY_INSIGHT_MIN_MINUTES = 60;
export const CONSISTENCY_IMPROVEMENT_MIN_ACTIVE_HALF = 3;
export const CONSISTENCY_IMPROVEMENT_RATIO = 0.8;
export const PLANNING_TREND_MIN_SAMPLES = 8;
export const PLANNING_TREND_IMPROVEMENT_RATIO = 0.85;
export const DISTRIBUTION_MAX_ITEMS = 6;

// ─── Evidence & Bias Labels ──────────────────────────────────────────────────

export const EVIDENCE_LABELS: Record<string, string> = {
  insufficient_data: 'Insufficient data',
  early_signal: 'Early signal',
  moderate_confidence: 'Moderate confidence',
  high_confidence: 'High confidence',
};

export const BIAS_LABELS: Record<string, string> = {
  underestimate: 'underestimating',
  overestimate: 'overestimating',
  balanced: 'on target',
  unknown: 'unknown',
};

// ─── Telemetry (not ported — kept as reference) ──────────────────────────────

export const ALLOWED_EVENTS = [
  'first_launch',
  'app_launched',
  'session_started',
  'session_completed',
  'task_created',
  'task_completed',
  'daily_goal_completed',
  'planner_used',
  'insights_viewed',
  'xp_changed',
  'app_version_updated',
] as const;
