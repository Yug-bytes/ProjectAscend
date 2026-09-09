/**
 * Smart Activity Estimates: personalized suggestions for Add Activity.
 * Ported from Modules/estimate_suggestion.py.
 *
 * Consumes the same historical records as the calibration engine but learns
 * the user's typical ABSOLUTE time difference:
 *   median(actual_minutes - original_estimate_minutes)
 * per evidence tier, instead of the proportional multiplier.
 */

import type { Activity, CalibrationObservation, EstimateSource, EstimateSuggestion } from './types';
import { makeObservations, median } from './calibration-service';
import {
  EXACT_MIN_OBSERVATIONS,
  CATEGORY_MIN_OBSERVATIONS,
  OVERALL_MIN_OBSERVATIONS,
  RELEVANCE_MARGIN_MINUTES,
  RECOMMENDATION_STEP_MINUTES,
} from './constants';

export {
  EXACT_MIN_OBSERVATIONS,
  CATEGORY_MIN_OBSERVATIONS,
  OVERALL_MIN_OBSERVATIONS,
  RELEVANCE_MARGIN_MINUTES,
  RECOMMENDATION_STEP_MINUTES,
};

/**
 * Conservative activity-name identity: trim, collapse internal whitespace, ignore case.
 */
export function normalizeName(name: string | null | undefined): string {
  return (name || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * The learned time bias for a group: median(actual - estimated).
 */
export function observationBias(observations: CalibrationObservation[]): number {
  return median(observations.map((obs) => obs.actual_minutes - obs.estimated_minutes));
}

/**
 * Relevance window: only apply a tier's bias when the entered estimate is inside
 * the range of that tier's observed ORIGINAL estimates, extended by one planner step.
 */
export function isRelevant(
  observations: CalibrationObservation[],
  enteredMinutes: number
): boolean {
  if (observations.length === 0) return false;
  const observed = observations.map((obs) => obs.estimated_minutes);
  const lower = Math.min(...observed) - RELEVANCE_MARGIN_MINUTES;
  const upper = Math.max(...observed) + RELEVANCE_MARGIN_MINUTES;
  return lower <= enteredMinutes && enteredMinutes <= upper;
}

export interface SelectedEvidence {
  tierObservations: CalibrationObservation[];
  source: EstimateSource;
  activityType: string | null;
  matchedName: string | null;
}

/**
 * Pick the most specific reliable evidence tier for this input.
 * First reliable tier wins; tiers are never blended.
 */
export function selectEvidence(
  observations: CalibrationObservation[],
  activityType: string,
  activityName: string,
  enteredMinutes: number
): SelectedEvidence | null {
  const normalized = normalizeName(activityName);

  // Tier 1 - exact activity: same category AND same normalized name.
  if (normalized) {
    const exact = observations.filter(
      (obs) =>
        obs.activity_type === activityType &&
        normalizeName(obs.name) === normalized
    );
    if (
      exact.length >= EXACT_MIN_OBSERVATIONS &&
      isRelevant(exact, enteredMinutes)
    ) {
      return {
        tierObservations: exact,
        source: 'exact',
        activityType,
        matchedName: activityName.trim(),
      };
    }
  }

  // Tier 2 - category
  const category = observations.filter(
    (obs) => obs.activity_type === activityType
  );
  if (
    category.length >= CATEGORY_MIN_OBSERVATIONS &&
    isRelevant(category, enteredMinutes)
  ) {
    return {
      tierObservations: category,
      source: 'category',
      activityType,
      matchedName: null,
    };
  }

  // Tier 3 - overall personal history
  if (
    observations.length >= OVERALL_MIN_OBSERVATIONS &&
    isRelevant(observations, enteredMinutes)
  ) {
    return {
      tierObservations: observations,
      source: 'overall',
      activityType: null,
      matchedName: null,
    };
  }

  return null;
}

/**
 * Round to the 5-minute planner step used everywhere in the UI.
 */
export function roundToStep(minutes: number): number {
  return Math.round(minutes / RECOMMENDATION_STEP_MINUTES) * RECOMMENDATION_STEP_MINUTES;
}

/**
 * Time-first copy describing the user's learned behaviour.
 */
export function buildDifferenceText(differenceMinutes: number): string {
  if (differenceMinutes > 0) {
    return `You typically take ~${differenceMinutes} min longer.`;
  }
  return `You typically finish ~${-differenceMinutes} min early.`;
}

/**
 * Honest supporting copy naming exactly which evidence was used.
 */
export function buildEvidenceText(
  sampleCount: number,
  source: EstimateSource,
  activityType: string | null,
  activityName: string | null
): string {
  if (source === 'exact') {
    return `Based on ${sampleCount} previous "${activityName}" sessions.`;
  }
  if (source === 'category') {
    return `Based on ${sampleCount} previous ${activityType} activities.`;
  }
  return `Based on ${sampleCount} completed activities.`;
}

/**
 * Return an EstimateSuggestion for the user's entered duration, or null.
 *
 * null means "show nothing": insufficient evidence at every tier, an entered estimate
 * outside every tier's relevance window, a suggestion that rounds back to the entered value,
 * or a recommendation outside the valid input range.
 */
export function suggestEstimate(
  records: Activity[] | null | undefined,
  activityType: string,
  activityName: string,
  enteredMinutes: number,
  minimumMinutes: number = 5,
  maximumMinutes: number = 600
): EstimateSuggestion | null {
  const entered = Math.floor(Number(enteredMinutes) || 0);

  const observations = makeObservations(records || []);

  const evidence = selectEvidence(
    observations,
    activityType,
    activityName,
    entered
  );
  if (!evidence) {
    return null;
  }

  const { tierObservations, source, activityType: evidenceType, matchedName } = evidence;
  const bias = observationBias(tierObservations);

  // The recommendation: user's anchor plus learned typical difference, rounded to planner step
  const suggested = roundToStep(entered + bias);

  // Identity suppression: recommending what user typed is noise
  if (suggested === entered) {
    return null;
  }

  // Range honesty: recommendation outside valid range is hidden, never clamped
  if (suggested < minimumMinutes || suggested > maximumMinutes) {
    return null;
  }

  // Displayed delta derived from final rounded suggestion
  const difference = suggested - entered;

  return {
    entered_minutes: entered,
    suggested_minutes: suggested,
    difference_minutes: difference,
    median_bias_minutes: bias,
    sample_count: tierObservations.length,
    source,
    activity_type: evidenceType,
    activity_name: matchedName,
    headline: `Ascend suggests ~${suggested} min`,
    difference_text: buildDifferenceText(difference),
    evidence_text: buildEvidenceText(
      tierObservations.length,
      source,
      evidenceType,
      matchedName
    ),
    keep_label: `Keep ${entered} min`,
    use_label: `Use ${suggested} min`,
  };
}
