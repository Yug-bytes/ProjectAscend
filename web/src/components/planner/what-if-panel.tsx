"use client";

import React, { useState, useEffect, useMemo } from "react";
import type { CapacityPlan, TaskLoad } from "@/lib/types";
import {
  ESTIMATE_MIN_MINUTES,
  ESTIMATE_MAX_MINUTES,
} from "@/lib/constants";
import { formatCapacityDuration } from "@/lib/format";
import { Minus, Plus, Undo, Check } from "lucide-react";

interface WhatIfPanelProps {
  basePlan: CapacityPlan;
  onApplyAllocations: (allocations: Record<number, number>) => Promise<void> | void;
}

export default function WhatIfPanel({
  basePlan,
  onApplyAllocations,
}: WhatIfPanelProps) {
  // Temporary overrides keyed by activity ID
  const [temporaryAllocations, setTemporaryAllocations] = useState<Record<number, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  const pendingTasks = useMemo(() => {
    return basePlan.tasks.filter((t) => t.activity_id != null);
  }, [basePlan.tasks]);

  // Reset scenario if task list changes
  const taskSignature = useMemo(() => {
    return pendingTasks.map((t) => `${t.activity_id}:${t.expected_minutes}`).join(",");
  }, [pendingTasks]);

  useEffect(() => {
    setTemporaryAllocations({});
  }, [taskSignature]);

  if (pendingTasks.length === 0) {
    return null;
  }

  // Calculate live preview allocation
  const previewTasks: Array<TaskLoad & { currentAllocation: number }> = pendingTasks.map((task) => {
    const override = task.activity_id != null ? temporaryAllocations[task.activity_id] : undefined;
    const currentAllocation = override ?? task.expected_minutes;
    return {
      ...task,
      currentAllocation,
    };
  });

  const totalAllocated = previewTasks.reduce((sum, t) => sum + t.currentAllocation, 0);
  const available = basePlan.available_minutes;
  const remainingCapacity = available != null ? available - totalAllocated : null;
  const hasOverrides = Object.keys(temporaryAllocations).length > 0;

  const handleChangeAllocation = (activityId: number, delta: number) => {
    const task = pendingTasks.find((t) => t.activity_id === activityId);
    if (!task) return;

    const current = temporaryAllocations[activityId] ?? task.expected_minutes;
    const updated = Math.max(
      ESTIMATE_MIN_MINUTES,
      Math.min(ESTIMATE_MAX_MINUTES, current + delta)
    );

    setTemporaryAllocations((prev) => {
      const next = { ...prev };
      if (updated === task.expected_minutes) {
        delete next[activityId];
      } else {
        next[activityId] = updated;
      }
      return next;
    });
  };

  const handleReset = () => {
    setTemporaryAllocations({});
  };

  const handleApply = async () => {
    if (!hasOverrides || isSaving) return;
    setIsSaving(true);
    try {
      await onApplyAllocations(temporaryAllocations);
      setTemporaryAllocations({});
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-[var(--text-primary)]">
          Time Distribution
        </h3>
        <span className="text-[12px] text-[var(--text-muted)]">
          What-if allocation
        </span>
      </div>

      {/* Rows of tasks */}
      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
        {previewTasks.map((task) => {
          const id = task.activity_id!;
          const canDecrease = task.currentAllocation > ESTIMATE_MIN_MINUTES;
          const canIncrease = task.currentAllocation < ESTIMATE_MAX_MINUTES;
          const isOverridden = id in temporaryAllocations;

          return (
            <div
              key={id}
              className="flex items-center justify-between gap-3 px-3 py-2 rounded-[10px] bg-[var(--surface-elevated)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
                  {task.name || task.activity_type}
                </p>
                <p className="text-[11px] text-[var(--text-muted)] truncate">
                  {task.activity_type}
                  {task.basis === "learned" && " · Smart estimate"}
                </p>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleChangeAllocation(id, -5)}
                  disabled={!canDecrease}
                  className="w-9 h-9 sm:w-8 sm:h-8 rounded-[8px] flex items-center justify-center bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border-strong)] text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Decrease by 5 min"
                >
                  <Minus size={15} />
                </button>

                <span
                  className={`w-14 sm:w-16 text-center text-[13px] font-bold ${
                    isOverridden ? "text-[var(--accent)]" : "text-[var(--text-primary)]"
                  }`}
                >
                  {task.currentAllocation} min
                </span>

                <button
                  type="button"
                  onClick={() => handleChangeAllocation(id, 5)}
                  disabled={!canIncrease}
                  className="w-9 h-9 sm:w-8 sm:h-8 rounded-[8px] flex items-center justify-center bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border-strong)] text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Increase by 5 min"
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary / Verdict */}
      <div className="pt-2 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[12px] text-[var(--text-muted)]">
            {available === null
              ? `Allocated ${formatCapacityDuration(totalAllocated)}`
              : `Available ${formatCapacityDuration(available)} · Allocated ${formatCapacityDuration(totalAllocated)}`}
          </p>

          <p className="text-[13px] font-bold mt-0.5">
            {available === null ? (
              <span className="text-[var(--text-muted)]">
                Set available time to see if it fits.
              </span>
            ) : remainingCapacity! < 0 ? (
              <span className="text-[var(--error)]">
                ⚠ {formatCapacityDuration(-remainingCapacity!)} over your available time
              </span>
            ) : remainingCapacity! === 0 ? (
              <span className="text-[var(--success)]">
                ✓ Fits — fills your available time
              </span>
            ) : (
              <span className="text-[var(--success)]">
                ✓ Fits — {formatCapacityDuration(remainingCapacity!)} remaining
              </span>
            )}
          </p>
        </div>

        {/* Actions */}
        {hasOverrides && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[12px] font-semibold text-[var(--text-secondary)] transition-colors cursor-pointer"
            >
              <Undo size={13} />
              Reset
            </button>

            <button
              type="button"
              onClick={handleApply}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[12px] font-bold text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <Check size={14} />
              {isSaving ? "Saving..." : "Apply Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
