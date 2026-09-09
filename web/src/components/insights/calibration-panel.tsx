"use client";

import React from "react";
import type { CalibrationReport } from "@/lib/types";
import {
  MIN_OBSERVATIONS_FOR_STATS,
  RECOMMENDATION_MIN_OBSERVATIONS,
  recommendedEstimate,
} from "@/lib/calibration-service";
import { formatErrorPercent, formatPlainPercent } from "@/lib/format";
import { EVIDENCE_LABELS } from "@/lib/constants";
import { median } from "@/lib/calibration-service";

interface CalibrationPanelProps {
  calibration: CalibrationReport;
}

export default function CalibrationPanel({ calibration }: CalibrationPanelProps) {
  const summary = calibration.summary;
  const sampleCount = summary.sample_count;

  // 1. Tier 1: Insufficient data (< 3 observations)
  if (sampleCount < MIN_OBSERVATIONS_FOR_STATS) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] p-5 space-y-4">
        <div className="border-b border-[var(--border)]/50 pb-3">
          <h3 className="text-[15px] font-bold text-[var(--text-primary)]">
            Planning Accuracy
          </h3>
          <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
            Compares planned durations against what actually happened across all completed activities.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[10px] p-3.5 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Estimate Bias
            </span>
            <p className="text-[15px] font-bold text-[var(--text-primary)]">
              Not enough data yet
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">
              Complete at least 3 activities to begin calibration.
            </p>
          </div>

          <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[10px] p-3.5 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Typical Error
            </span>
            <p className="text-[15px] font-bold text-[var(--text-primary)]">
              Not enough data yet
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">
              Calibration needs completed activities with focus time.
            </p>
          </div>

          <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[10px] p-3.5 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Confidence
            </span>
            <p className="text-[15px] font-bold text-[var(--text-primary)]">
              {EVIDENCE_LABELS[summary.evidence_level] || "Insufficient data"}
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">
              No recommendation yet.
            </p>
          </div>
        </div>

        <p className="text-[11px] text-[var(--text-muted)] pt-1">
          Estimate calibration compares the ORIGINAL plan of a completed activity against its actual duration. Incomplete work is never counted.
        </p>
      </div>
    );
  }

  // 2. Tier 2: Early signal (3 to 9 observations)
  if (summary.suggested_multiplier === null || sampleCount < RECOMMENDATION_MIN_OBSERVATIONS) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] p-5 space-y-4">
        <div className="border-b border-[var(--border)]/50 pb-3">
          <h3 className="text-[15px] font-bold text-[var(--text-primary)]">
            Planning Accuracy
          </h3>
          <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
            Early signals from your completed activities. Recommendations unlock at {RECOMMENDATION_MIN_OBSERVATIONS} observations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[10px] p-3.5 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Estimate Bias
            </span>
            <p className="text-[20px] font-extrabold text-[var(--text-primary)]">
              {summary.mean_relative_error !== null
                ? formatErrorPercent(summary.mean_relative_error)
                : "—"}
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">
              Average error across {sampleCount} completed activities
            </p>
          </div>

          <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[10px] p-3.5 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Typical Error
            </span>
            <p className="text-[20px] font-extrabold text-[var(--text-primary)]">
              {summary.mean_absolute_percentage_error !== null
                ? formatPlainPercent(summary.mean_absolute_percentage_error)
                : "—"}
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">
              Typical deviation from your estimate
            </p>
          </div>

          <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[10px] p-3.5 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Confidence
            </span>
            <p className="text-[20px] font-extrabold text-[var(--warning)]">
              {EVIDENCE_LABELS[summary.evidence_level] || "Early signal"}
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">
              {sampleCount} observations • suggestions unlock at {RECOMMENDATION_MIN_OBSERVATIONS}
            </p>
          </div>
        </div>

        <p className="text-[11px] text-[var(--text-muted)] pt-1">
          Realistic time suggestions unlock at {RECOMMENDATION_MIN_OBSERVATIONS} completed activities. Keep logging focus sessions.
        </p>
      </div>
    );
  }

  // 3. Tier 3: Recommendation available (>= 10 observations)
  const multiplier = summary.suggested_multiplier;
  const observations = calibration.observations;
  const typicalEstimate =
    observations.length > 0
      ? Math.round(median(observations.map((obs) => obs.estimated_minutes)))
      : 60;
  const realisticMinutes = recommendedEstimate(typicalEstimate, multiplier) || typicalEstimate;
  const differenceMinutes = realisticMinutes - typicalEstimate;

  const bestCalibrated = calibration.categories.find(
    (c) => c.sample_count >= MIN_OBSERVATIONS_FOR_STATS && c.mean_relative_error !== null
  );

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] p-5 space-y-4">
      <div className="border-b border-[var(--border)]/50 pb-3">
        <h3 className="text-[15px] font-bold text-[var(--text-primary)]">
          Planning Accuracy
        </h3>
        <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
          Based on {sampleCount} completed activities with focus time.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Realistic Estimate */}
        <div className="tint-blue border rounded-[10px] p-3.5 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Realistic Estimate
          </span>
          <p className="text-[22px] font-extrabold text-[var(--text-primary)]">
            ~{realisticMinutes} min
          </p>
          <p className="text-[11px] text-[var(--text-muted)]">
            For a typical {typicalEstimate}-min plan
          </p>
        </div>

        {/* Time Difference */}
        <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[10px] p-3.5 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Time Difference
          </span>
          <p className="text-[22px] font-extrabold text-[var(--text-primary)]">
            {differenceMinutes > 0
              ? `+${differenceMinutes} min`
              : differenceMinutes < 0
              ? `${differenceMinutes} min`
              : "On target"}
          </p>
          <p className="text-[11px] text-[var(--text-muted)]">
            {differenceMinutes > 0
              ? "More than your original estimate"
              : differenceMinutes < 0
              ? "Less than your original estimate"
              : "Your plans usually match reality"}
          </p>
        </div>

        {/* Confidence Level */}
        <div className="tint-purple border rounded-[10px] p-3.5 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Evidence Level
          </span>
          <p className="text-[22px] font-extrabold text-[var(--accent)]">
            {EVIDENCE_LABELS[summary.evidence_level] || "High Confidence"}
          </p>
          <p className="text-[11px] text-[var(--text-muted)]">
            Based on {sampleCount} completed activities
          </p>
        </div>
      </div>

      {/* Supporting note line */}
      <div className="text-[11px] text-[var(--text-muted)] pt-1 space-y-1">
        <p>
          Historical planning factor ×{multiplier.toFixed(2)}
          {bestCalibrated && (
            <span>
              {" "}
              • Best calibrated: {bestCalibrated.activity_type} (
              {formatErrorPercent(bestCalibrated.mean_relative_error!)},{" "}
              {bestCalibrated.sample_count} samples)
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
