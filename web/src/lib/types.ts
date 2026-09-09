/**
 * Core data types for Project Ascend Web.
 * Mapped from the Python dataclasses and SQLite schema.
 */

// ─── Activity ────────────────────────────────────────────────────────────────

export interface Activity {
  id?: number;
  date: string;              // ISO 'YYYY-MM-DD'
  activity_type: string;
  name: string;
  estimated_minutes: number; // current editable estimate (5–600)
  original_estimate_minutes: number; // frozen at creation
  completed: number;         // 0 or 1 (IndexedDB doesn't have bool)
  actual_minutes: number;
  xp_awarded: number;        // 0 or 1
}

// ─── Focus Session ───────────────────────────────────────────────────────────

export interface FocusSession {
  id?: number;
  activity_id: number;
  session_date: string;      // ISO 'YYYY-MM-DD'
  started_at: string;        // ISO timestamp
  completed_at: string;      // ISO timestamp
  actual_minutes: number;
  actual_seconds: number;
}

// ─── XP Event (append-only ledger) ───────────────────────────────────────────

export type XpEventType =
  | 'activity_completion'
  | 'activity_void'
  | 'daily_goal_completion'
  | 'legacy_xp_import';

export interface XpEvent {
  id?: number;
  activity_id: number | null;
  earned_date: string;       // ISO 'YYYY-MM-DD'
  amount: number;            // positive or negative
  event_type: XpEventType;
}

// ─── Daily History (pre-aggregated) ──────────────────────────────────────────

export interface DailyHistory {
  date: string;              // ISO 'YYYY-MM-DD' (primary key)
  study_minutes: number;
  completed_activities: number;
  total_activities: number;
  goal_completed: number;    // 0 or 1
}

// ─── Achievement ─────────────────────────────────────────────────────────────

export interface UserAchievement {
  id?: number;
  achievement_id: string;
  unlocked_at: string;       // ISO timestamp
  trigger_event: string;
}

// ─── Progression Profile ─────────────────────────────────────────────────────

export interface ProgressionProfile {
  key: string;               // e.g. 'selected_character_id'
  value: string;
}

// ─── Level History ───────────────────────────────────────────────────────────

export interface LevelHistory {
  id?: number;
  level: number;
  reached_at: string;        // ISO date
  xp_at_unlock: number;
}

// ─── Milestone History ───────────────────────────────────────────────────────

export interface MilestoneHistory {
  id?: number;
  milestone_id: string;
  tier: number;
  reached_at: string;        // ISO date
}

// ─── Setting ─────────────────────────────────────────────────────────────────

export interface Setting {
  key: string;
  value: string;
}

// ─── Capacity Service Types ──────────────────────────────────────────────────

export type CapacityState =
  | 'no_capacity_data'
  | 'no_tasks'
  | 'under_capacity'
  | 'near_capacity'
  | 'over_capacity';

export type EstimateBasis = 'learned' | 'your_estimate';

export interface TaskLoad {
  activity_id: number | null;
  name: string;
  activity_type: string;
  estimate_minutes: number;
  expected_minutes: number;
  basis: EstimateBasis;
  completed: boolean;
  fits: boolean;
}

export interface CapacityPlan {
  plan_date: string;
  state: CapacityState;
  tasks: TaskLoad[];
  completed_count: number;
  completed_minutes: number;
  planned_workload_minutes: number;
  expected_workload_minutes: number;
  learned_adjustment_minutes: number;
  learned_task_count: number;
  available_minutes: number | null;
  remaining_capacity_minutes: number | null;
  open_capacity_minutes: number;
  over_capacity_minutes: number;
  fitting_task_count: number;
  beyond_task_count: number;
  move_candidates: TaskLoad[];
}

// ─── Estimate Suggestion Types ───────────────────────────────────────────────

export type EstimateSource = 'exact' | 'category' | 'overall';

export interface EstimateSuggestion {
  entered_minutes: number;
  suggested_minutes: number;
  difference_minutes: number;
  median_bias_minutes: number;
  sample_count: number;
  source: EstimateSource;
  activity_type: string | null;
  activity_name: string | null;
  headline: string;
  difference_text: string;
  evidence_text: string;
  keep_label: string;
  use_label: string;
}

// ─── Calibration Types ───────────────────────────────────────────────────────

export type EvidenceLevel =
  | 'insufficient_data'
  | 'early_signal'
  | 'moderate_confidence'
  | 'high_confidence';

export type BiasClassification =
  | 'unknown'
  | 'balanced'
  | 'underestimate'
  | 'overestimate';

export interface CalibrationObservation {
  activity_id: number;
  activity_type: string;
  name: string;
  estimated_minutes: number;
  actual_minutes: number;
}

export interface CalibrationSummary {
  sample_count: number;
  mean_relative_error: number | null;
  median_relative_error: number | null;
  mean_absolute_percentage_error: number | null;
  suggested_multiplier: number | null;
  evidence_level: EvidenceLevel;
  bias: BiasClassification;
}

export interface CategoryCalibration extends CalibrationSummary {
  activity_type: string;
}

// ─── Character Types ─────────────────────────────────────────────────────────

export type CharacterId =
  | 'architect'
  | 'catalyst'
  | 'sentinel'
  | 'vanguard'
  | 'scholar'
  | 'pathfinder'
  | 'artisan'
  | 'paragon';

export interface CharacterDefinition {
  id: CharacterId;
  name: string;
  specialization: string;
  icon: string;
  primary_color: string;
  secondary_color: string;
}

export type EvolutionStage = 1 | 2 | 3 | 4;

export interface EvolutionInfo {
  stage: EvolutionStage;
  name: string;
  min_level: number;
}

// ─── Achievement Definition Types ────────────────────────────────────────────

export type AchievementCategory = 'Consistency' | 'Deep Work' | 'Planning' | 'Mastery';

export interface AchievementDefinition {
  id: string;
  name: string;
  category: AchievementCategory;
  icon: string;
  description: string;
}

export interface MilestoneTier {
  tier: number;
  threshold: number;
  label: string;
}

export interface MilestoneDefinition {
  id: string;
  icon: string;
  unit: string;
  tiers: MilestoneTier[];
}

// ─── Streak Types ────────────────────────────────────────────────────────────

export interface StreakData {
  current_streak: number;
  longest_streak: number;
  total_goal_days: number;
  completion_rate: number;
}

// ─── Progression Summary ─────────────────────────────────────────────────────

export interface ProgressionSummary {
  total_xp: number;
  level: number;
  xp_into_level: number;
  xp_for_level: number;
  xp_remaining: number;
  evolution_stage: EvolutionStage;
  evolution_name: string;
  evolution_info: EvolutionInfo;
  character: CharacterDefinition;
  current_streak: number;
  longest_streak: number;
  total_goal_days: number;
  completion_rate: number;
  unlocked_achievements_count: number;
  total_achievements_count: number;
  milestones_reached_count: number;
}

// ─── Insights Types ──────────────────────────────────────────────────────────

export type RangeKey = 'today' | '7_days' | '30_days' | '90_days' | 'all_time';

export interface DailyFocus {
  day: string;               // ISO date
  focus_minutes: number;
  completed_tasks: number;
  total_tasks: number;
}

export interface TrendPoint {
  day: string;
  focus_minutes: number;
  completed_tasks: number;
  total_tasks: number;
}

export interface TrendComparison {
  text: string;
  direction: 'positive' | 'negative' | 'neutral';
  percentage: number | null;
}

export interface DistributionItem {
  category: string;
  minutes: number;
  percent: number;
  count: number;
}

export type HeatmapLevel = 'inactive' | 'light' | 'moderate' | 'high';

export interface ConsistencyDay {
  day: string;
  focus_minutes: number;
  level: HeatmapLevel;
}

export interface DayHourCell {
  day_index: number;         // 0=Mon ... 6=Sun
  block_index: number;       // 0=Morning ... 3=Night
  minutes: number;
  sessions: number;
}

export type InsightType =
  | 'positive'
  | 'warning'
  | 'goal'
  | 'pattern'
  | 'streak'
  | 'recommendation'
  | 'info';

export type InsightConfidence =
  | 'high_confidence'
  | 'moderate_confidence'
  | 'early_signal';

export interface InsightItem {
  type: InsightType;
  title: string;
  description: string;
  metric?: string;
}

export interface LearnedInsight {
  title: string;
  description: string;
  confidence: InsightConfidence;
  evidence_note?: string;
}

export interface OverviewMetrics {
  focus_minutes: number;
  completed_tasks: number;
  total_tasks: number;
  completion_rate: number;
  xp_earned: number;
  previous_focus_minutes: number | null;
  completion_change_points: number | null;
  activity_change: number | null;
}

// ─── Activity Types (predefined categories) ──────────────────────────────────

export const ACTIVITY_TYPES = [
  'Tests',
  'Coding',
  'Homework',
  'Question Practice',
  'Lectures',
  'Revision',
  'Reading',
  'Assignments',
  'Project Work',
  'Research',
  'Practice',
  'Writing',
  'Note Making',
  'Skill Learning',
  'Language Learning',
  'Exercise',
  'Sports',
  'Walking',
  'Meditation',
  'Planning',
  'Journaling',
  'Creative Work',
  'Music Practice',
  'Other',
] as const;

export type ActivityType = typeof ACTIVITY_TYPES[number];
