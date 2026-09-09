/**
 * Planner Capacity Intelligence: planned workload vs realistic capacity.
 * Ported from Modules/capacity_service.py.
 *
 * Four DISTINCT concepts:
 * 1. Daily goal: Achievement target. Never read here.
 * 2. Planned workload: Fact. Sum of user's own estimates for pending activities.
 * 3. Expected workload: Learned estimate. Planned workload after Smart Activity Estimates.
 * 4. Available capacity: User's explicitly entered available time for that date.
 */

import type {
  Activity,
  CapacityPlan,
  CapacityState,
  EstimateBasis,
  TaskLoad,
} from './types';
import { suggestEstimate } from './estimate-suggestion';
import { activityNoun, formatCapacityDuration } from './format';
import {
  availableTimeStore,
  AvailableTimeStore,
} from './available-time-store';
import { db, type AscendDatabase } from './db';
import {
  BASIS_LEARNED,
  BASIS_USER_ESTIMATE,
  ESTIMATE_MAX_MINUTES,
  ESTIMATE_MIN_MINUTES,
  NEAR_CAPACITY_MINUTES,
  STATE_NEAR_CAPACITY,
  STATE_NO_CAPACITY_DATA,
  STATE_NO_TASKS,
  STATE_OVER_CAPACITY,
  STATE_UNDER_CAPACITY,
} from './constants';

export {
  BASIS_LEARNED,
  BASIS_USER_ESTIMATE,
  ESTIMATE_MAX_MINUTES,
  ESTIMATE_MIN_MINUTES,
  NEAR_CAPACITY_MINUTES,
  STATE_NEAR_CAPACITY,
  STATE_NO_CAPACITY_DATA,
  STATE_NO_TASKS,
  STATE_OVER_CAPACITY,
  STATE_UNDER_CAPACITY,
};

/**
 * Return { expected, basis } for one planned activity.
 */
export function expectedMinutesFor(
  activity: Activity,
  records: Activity[] | null | undefined
): { expected: number; basis: EstimateBasis } {
  const estimate = Math.max(0, Math.floor(activity.estimated_minutes || 0));

  const suggestion = suggestEstimate(
    records || [],
    activity.activity_type,
    activity.name,
    estimate,
    ESTIMATE_MIN_MINUTES,
    ESTIMATE_MAX_MINUTES
  );

  if (!suggestion) {
    return { expected: estimate, basis: BASIS_USER_ESTIMATE };
  }

  return { expected: suggestion.suggested_minutes, basis: BASIS_LEARNED };
}

/**
 * Map the calculated numbers onto one capacity state.
 */
export function classifyState(
  availableMinutes: number | null,
  pendingCount: number,
  remainingMinutes: number | null
): CapacityState {
  if (availableMinutes === null) {
    return STATE_NO_CAPACITY_DATA;
  }
  if (pendingCount === 0) {
    return STATE_NO_TASKS;
  }
  if (remainingMinutes !== null && remainingMinutes < 0) {
    return STATE_OVER_CAPACITY;
  }
  if (remainingMinutes !== null && remainingMinutes <= NEAR_CAPACITY_MINUTES) {
    return STATE_NEAR_CAPACITY;
  }
  return STATE_UNDER_CAPACITY;
}

/**
 * Return the smallest trailing group whose removal would bring the plan
 * inside the available time.
 */
export function selectMoveCandidates(
  tasks: TaskLoad[],
  availableMinutes: number | null
): TaskLoad[] {
  if (availableMinutes === null) {
    return [];
  }

  let total = tasks.reduce((sum, task) => sum + task.expected_minutes, 0);
  if (total <= availableMinutes) {
    return [];
  }

  const candidates: TaskLoad[] = [];
  for (let i = tasks.length - 1; i >= 0; i--) {
    candidates.push(tasks[i]);
    total -= tasks[i].expected_minutes;
    if (total <= availableMinutes) {
      break;
    }
  }

  return candidates.reverse();
}

/**
 * Build the complete capacity picture for one date.
 */
export function buildCapacityPlan(
  activities: Activity[] = [],
  availableMinutes: number | null = null,
  records: Activity[] | null | undefined = [],
  planDate: string,
  allocationOverrides?: Record<number, number>
): CapacityPlan {
  const allActivities = [...activities];
  const overrides = allocationOverrides || {};

  const completed = allActivities.filter((a) => a.completed === 1);
  const pending = allActivities.filter((a) => a.completed !== 1);

  const completedMinutes = completed.reduce(
    (sum, a) => sum + Math.max(0, Math.floor(a.actual_minutes || 0)),
    0
  );

  const loads: TaskLoad[] = [];
  for (const activity of pending) {
    const estimate = Math.max(0, Math.floor(activity.estimated_minutes || 0));
    let { expected, basis } = expectedMinutesFor(activity, records);

    if (activity.id != null && activity.id in overrides) {
      const rawOverride = overrides[activity.id];
      const parsedOverride = Number(rawOverride);
      if (!isNaN(parsedOverride)) {
        expected = Math.max(
          ESTIMATE_MIN_MINUTES,
          Math.min(parsedOverride, ESTIMATE_MAX_MINUTES)
        );
      }
    }

    loads.push({
      activity_id: activity.id ?? null,
      name: activity.name,
      activity_type: activity.activity_type,
      estimate_minutes: estimate,
      expected_minutes: expected,
      basis,
      completed: false,
      fits: false,
    });
  }

  const plannedWorkload = loads.reduce((sum, l) => sum + l.estimate_minutes, 0);
  const expectedWorkload = loads.reduce((sum, l) => sum + l.expected_minutes, 0);
  const learnedAdjustment = expectedWorkload - plannedWorkload;
  const learnedTaskCount = loads.filter((l) => l.basis === BASIS_LEARNED).length;

  let tasks: TaskLoad[] = [];
  let fittingCount = 0;
  let remainingCapacity: number | null = null;
  let openCapacity = 0;
  let overCapacity = 0;

  if (availableMinutes === null) {
    tasks = [...loads];
    fittingCount = 0;
    remainingCapacity = null;
    openCapacity = 0;
    overCapacity = 0;
  } else {
    let runningTotal = 0;
    let stillFitting = true;
    tasks = loads.map((load) => {
      runningTotal += load.expected_minutes;
      const fits = stillFitting && runningTotal <= availableMinutes;
      if (!fits) {
        stillFitting = false;
      }
      return {
        ...load,
        fits,
      };
    });
    fittingCount = tasks.filter((t) => t.fits).length;
    remainingCapacity = availableMinutes - expectedWorkload;
    openCapacity = Math.max(0, remainingCapacity);
    overCapacity = Math.max(0, -remainingCapacity);
  }

  const state = classifyState(availableMinutes, tasks.length, remainingCapacity);

  return {
    plan_date: planDate,
    state,
    tasks,
    completed_count: completed.length,
    completed_minutes: completedMinutes,
    planned_workload_minutes: plannedWorkload,
    expected_workload_minutes: expectedWorkload,
    learned_adjustment_minutes: learnedAdjustment,
    learned_task_count: learnedTaskCount,
    available_minutes: availableMinutes,
    remaining_capacity_minutes: remainingCapacity,
    open_capacity_minutes: openCapacity,
    over_capacity_minutes: overCapacity,
    fitting_task_count: fittingCount,
    beyond_task_count: tasks.length - fittingCount,
    move_candidates: selectMoveCandidates(tasks, availableMinutes),
  };
}

/**
 * DECISION: the one line that states the situation.
 */
export function buildHeadline(plan: CapacityPlan): string {
  if (plan.state === STATE_NO_TASKS) {
    if (plan.completed_count > 0) {
      return 'Everything planned is complete.';
    }
    return 'Nothing planned yet.';
  }

  if (plan.state === STATE_NO_CAPACITY_DATA) {
    if (plan.tasks.length === 0) {
      if (plan.completed_count > 0) {
        return 'Everything planned is complete.';
      }
      return 'Nothing planned yet.';
    }
    return `About ${formatCapacityDuration(plan.expected_workload_minutes)} of expected work planned.`;
  }

  if (plan.state === STATE_OVER_CAPACITY) {
    return `This plan is about ${formatCapacityDuration(plan.over_capacity_minutes)} beyond your available time.`;
  }

  if (plan.state === STATE_NEAR_CAPACITY) {
    return 'This plan uses almost all of your available time.';
  }

  return `You have about ${formatCapacityDuration(plan.open_capacity_minutes)} of open capacity.`;
}

/**
 * KEY NUMBERS: the stated time against the expected work.
 */
export function buildBalanceLine(plan: CapacityPlan): string {
  if (plan.state === STATE_NO_CAPACITY_DATA) {
    return 'Add the time you have available to see how it fits.';
  }

  if (plan.available_minutes === null) {
    return '';
  }

  if (plan.state === STATE_NO_TASKS) {
    return `You have ${formatCapacityDuration(plan.available_minutes)} available.`;
  }

  return `Available ${formatCapacityDuration(plan.available_minutes)} · Expected ~${formatCapacityDuration(plan.expected_workload_minutes)}`;
}

/**
 * How the plan splits across the available time.
 */
export function buildFitLine(plan: CapacityPlan): string {
  if (plan.available_minutes === null || plan.tasks.length === 0) {
    return '';
  }

  if (plan.state === STATE_NEAR_CAPACITY) {
    if (plan.open_capacity_minutes === 0) {
      return 'That fills the time you have.';
    }
    return `About ${formatCapacityDuration(plan.open_capacity_minutes)} spare.`;
  }

  if (plan.state !== STATE_OVER_CAPACITY) {
    return '';
  }

  if (plan.tasks.length < 2) {
    return '';
  }

  if (plan.fitting_task_count === 0) {
    return '';
  }

  const fitsNoun = activityNoun(plan.fitting_task_count);
  const fitsVerb = plan.fitting_task_count === 1 ? 'fits' : 'fit';
  const beyondVerb = plan.beyond_task_count === 1 ? 'goes' : 'go';

  return `${plan.fitting_task_count} ${fitsNoun} ${fitsVerb} within your available time; ${plan.beyond_task_count} ${beyondVerb} beyond.`;
}

/**
 * Completed work, reported separately from the planned workload.
 */
export function buildCompletedLine(plan: CapacityPlan): string {
  if (plan.completed_count === 0) {
    return '';
  }

  return `${plan.completed_count} ${activityNoun(plan.completed_count)} already complete (${formatCapacityDuration(plan.completed_minutes)}).`;
}

/**
 * The supporting lines, in the card's information hierarchy.
 */
export function buildSupportLines(plan: CapacityPlan): string[] {
  const lines = [
    buildBalanceLine(plan),
    buildFitLine(plan),
    buildCompletedLine(plan),
  ];
  return lines.filter((line) => line.length > 0);
}

export class CapacityService {
  private database: AscendDatabase;
  private availableTimeStore: AvailableTimeStore;

  constructor(
    database: AscendDatabase = db,
    store: AvailableTimeStore = availableTimeStore
  ) {
    this.database = database;
    this.availableTimeStore = store;
  }

  async buildPlan(
    planDate: string,
    allocationOverrides?: Record<number, number>
  ): Promise<CapacityPlan> {
    const activities = await this.database.getActivitiesForDate(planDate);
    const records = await this.loadCalibrationRecords();
    const availableMinutes = await this.getAvailableMinutes(planDate);

    return buildCapacityPlan(
      activities,
      availableMinutes,
      records,
      planDate,
      allocationOverrides
    );
  }

  async loadCalibrationRecords(): Promise<Activity[]> {
    try {
      return await this.database.getCalibrationRecords();
    } catch {
      return [];
    }
  }

  async getAvailableMinutes(planDate: string): Promise<number | null> {
    return this.availableTimeStore.get(planDate);
  }

  async setAvailableMinutes(planDate: string, minutes: number): Promise<number | null> {
    return this.availableTimeStore.set(planDate, minutes);
  }

  async clearAvailableMinutes(planDate: string): Promise<void> {
    return this.availableTimeStore.clear(planDate);
  }
}

// Singleton instance
export const capacityService = new CapacityService();
