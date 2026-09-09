/**
 * Estimate calibration for Project Ascend.
 * Ported from Modules/calibration_service.py.
 *
 * Measures how the user's planned durations compare with what actually happened,
 * both overall and per activity category.
 */

import type {
  Activity,
  BiasClassification,
  CalibrationObservation,
  CalibrationReport,
  CalibrationSummary,
  CategoryCalibration,
  EvidenceLevel,
} from './types';
import { db, type AscendDatabase } from './db';
import {
  BIAS_BAND,
  HIGH_CONFIDENCE_MIN_OBSERVATIONS,
  MIN_OBSERVATIONS_FOR_STATS,
  RECOMMENDATION_MIN_OBSERVATIONS,
  RECOMMENDATION_STEP_MINUTES,
} from './constants';

export {
  BIAS_BAND,
  HIGH_CONFIDENCE_MIN_OBSERVATIONS,
  MIN_OBSERVATIONS_FOR_STATS,
  RECOMMENDATION_MIN_OBSERVATIONS,
  RECOMMENDATION_STEP_MINUTES,
};

/**
 * Robust median calculation.
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[mid];
  }
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Map a sample count to an evidence level.
 */
export function evidenceLevelFor(sampleCount: number): EvidenceLevel {
  if (sampleCount < MIN_OBSERVATIONS_FOR_STATS) {
    return 'insufficient_data';
  }
  if (sampleCount < RECOMMENDATION_MIN_OBSERVATIONS) {
    return 'early_signal';
  }
  if (sampleCount < HIGH_CONFIDENCE_MIN_OBSERVATIONS) {
    return 'moderate_confidence';
  }
  return 'high_confidence';
}

/**
 * Return the bias label for a mean relative error, or 'unknown'.
 */
export function describeBias(meanRelativeError: number | null): BiasClassification {
  if (meanRelativeError === null) {
    return 'unknown';
  }
  if (Math.abs(meanRelativeError) < BIAS_BAND) {
    return 'balanced';
  }
  if (meanRelativeError > 0) {
    return 'underestimate';
  }
  return 'overestimate';
}

/**
 * Convert raw database records into valid calibration observations.
 */
export function makeObservations(records: Activity[]): CalibrationObservation[] {
  const observations: CalibrationObservation[] = [];

  for (const record of records) {
    if (!record.completed) {
      continue;
    }

    const estimated = Math.floor(
      record.original_estimate_minutes || record.estimated_minutes || 0
    );
    const actual = Math.floor(record.actual_minutes || 0);

    if (estimated <= 0 || actual <= 0) {
      continue;
    }

    const relativeError = (actual - estimated) / estimated;
    observations.push({
      activity_id: record.id ?? 0,
      activity_type: record.activity_type || 'Uncategorised',
      name: record.name || '',
      estimated_minutes: estimated,
      actual_minutes: actual,
      relative_error: relativeError,
      absolute_error_minutes: actual - estimated,
      absolute_percentage_error: Math.abs(relativeError),
    });
  }

  return observations;
}

/**
 * Compute the overall calibration summary for a list of observations.
 */
export function summarizeObservations(
  observations: CalibrationObservation[]
): CalibrationSummary {
  const sampleCount = observations.length;

  if (sampleCount === 0) {
    return {
      sample_count: 0,
      excluded_count: 0,
      pending_count: 0,
      mean_relative_error: null,
      median_relative_error: null,
      mean_absolute_percentage_error: null,
      bias: 'unknown',
      evidence_level: evidenceLevelFor(0),
      suggested_multiplier: null,
    };
  }

  const relativeErrors = observations.map((obs) => obs.relative_error);
  const sumRelative = relativeErrors.reduce((a, b) => a + b, 0);
  const meanRelativeError = sumRelative / sampleCount;

  const sumAbsolute = observations.reduce(
    (a, obs) => a + obs.absolute_percentage_error,
    0
  );
  const meanAbsolutePercentageError = sumAbsolute / sampleCount;

  const evidenceLevel = evidenceLevelFor(sampleCount);
  let suggestedMultiplier: number | null = null;

  if (sampleCount >= RECOMMENDATION_MIN_OBSERVATIONS) {
    const ratios = observations.map(
      (obs) => obs.actual_minutes / obs.estimated_minutes
    );
    suggestedMultiplier = Math.round(median(ratios) * 100) / 100;
  }

  return {
    sample_count: sampleCount,
    excluded_count: 0,
    pending_count: 0,
    mean_relative_error: Math.round(meanRelativeError * 10000) / 10000,
    median_relative_error:
      Math.round(median(relativeErrors) * 10000) / 10000,
    mean_absolute_percentage_error:
      Math.round(meanAbsolutePercentageError * 10000) / 10000,
    bias: describeBias(meanRelativeError),
    evidence_level: evidenceLevel,
    suggested_multiplier: suggestedMultiplier,
  };
}

/**
 * Compute isolated per-category calibration statistics.
 */
export function summarizeCategories(
  observations: CalibrationObservation[]
): CategoryCalibration[] {
  const byCategory = new Map<string, CalibrationObservation[]>();
  for (const obs of observations) {
    const list = byCategory.get(obs.activity_type) || [];
    list.push(obs);
    byCategory.set(obs.activity_type, list);
  }

  const categories: CategoryCalibration[] = [];

  for (const [activityType, categoryObservations] of byCategory.entries()) {
    const sampleCount = categoryObservations.length;
    const relativeErrors = categoryObservations.map((obs) => obs.relative_error);
    const sumRelative = relativeErrors.reduce((a, b) => a + b, 0);
    const meanRelativeError = sumRelative / sampleCount;

    const sumAbsolute = categoryObservations.reduce(
      (a, obs) => a + obs.absolute_percentage_error,
      0
    );
    const meanAbsolutePercentageError = sumAbsolute / sampleCount;

    let suggestedMultiplier: number | null = null;
    if (sampleCount >= RECOMMENDATION_MIN_OBSERVATIONS) {
      const ratios = categoryObservations.map(
        (obs) => obs.actual_minutes / obs.estimated_minutes
      );
      suggestedMultiplier = Math.round(median(ratios) * 100) / 100;
    }

    categories.push({
      activity_type: activityType,
      sample_count: sampleCount,
      mean_relative_error: Math.round(meanRelativeError * 10000) / 10000,
      mean_absolute_percentage_error:
        Math.round(meanAbsolutePercentageError * 10000) / 10000,
      bias: describeBias(meanRelativeError),
      evidence_level: evidenceLevelFor(sampleCount),
      suggested_multiplier: suggestedMultiplier,
    });
  }

  // Sort by most observations first, then alphabetically
  categories.sort((a, b) => {
    if (b.sample_count !== a.sample_count) {
      return b.sample_count - a.sample_count;
    }
    return a.activity_type.localeCompare(b.activity_type);
  });

  return categories;
}

/**
 * Return a realistic planning estimate for a planned duration.
 */
export function recommendedEstimate(
  estimatedMinutes: number | null | undefined,
  multiplier: number | null | undefined
): number | null {
  if (multiplier == null || estimatedMinutes == null) {
    return null;
  }

  const estimated = Math.floor(estimatedMinutes);
  if (estimated <= 0) {
    return null;
  }

  const suggested =
    Math.round((estimated * multiplier) / RECOMMENDATION_STEP_MINUTES) *
    RECOMMENDATION_STEP_MINUTES;
  return Math.max(RECOMMENDATION_STEP_MINUTES, suggested);
}

/**
 * Build the complete calibration report from raw database records.
 */
export function buildCalibrationReport(
  records: Activity[],
  generatedAt?: string
): CalibrationReport {
  const observations = makeObservations(records);

  const pendingCount = records.filter((r) => !r.completed).length;
  const excludedCount = records.length - pendingCount - observations.length;

  const summary = summarizeObservations(observations);
  summary.excluded_count = excludedCount;
  summary.pending_count = pendingCount;

  return {
    summary,
    categories: summarizeCategories(observations),
    observations,
    generated_at: generatedAt || new Date().toISOString().slice(0, 10),
  };
}

export class CalibrationService {
  private database: AscendDatabase;

  constructor(database: AscendDatabase = db) {
    this.database = database;
  }

  async buildReport(today?: string): Promise<CalibrationReport> {
    const records = await this.database.getCalibrationRecords();
    return buildCalibrationReport(
      records,
      today || new Date().toISOString().slice(0, 10)
    );
  }
}

// Singleton instance
export const calibrationService = new CalibrationService();
