"use client";

import React from "react";
import { MILESTONE_CATALOG } from "@/lib/achievement-manager";

interface MilestoneCardProps {
  milestoneId: "focus_duration" | "completed_activities" | "daily_goal_days" | "longest_streak";
  title: string;
  icon: string;
  currentValue: number;
  tint: "blue" | "purple" | "green" | "amber";
}

export function MilestoneCard({
  milestoneId,
  title,
  icon,
  currentValue,
  tint,
}: MilestoneCardProps) {
  const catInfo = MILESTONE_CATALOG[milestoneId];
  if (!catInfo) return null;

  const unit = catInfo.unit;
  let valDisplay = "";
  if (unit === "hours") {
    valDisplay =
      currentValue >= 60
        ? `${Math.floor(currentValue / 60)}h ${currentValue % 60}m`
        : `${currentValue}m`;
  } else {
    valDisplay = currentValue.toLocaleString();
  }

  const tiers = catInfo.tiers;
  let reachedTier = 0;
  let nextThreshold = tiers[tiers.length - 1].threshold;
  let nextLabel = tiers[tiers.length - 1].label;

  for (const t of tiers) {
    if (currentValue >= t.threshold) {
      reachedTier = t.tier;
    } else {
      nextThreshold = t.threshold;
      nextLabel = t.label;
      break;
    }
  }

  const isMax = reachedTier >= tiers.length;
  const prevThreshold = reachedTier > 0 ? tiers[reachedTier - 1].threshold : 0;
  const span = Math.max(1, nextThreshold - prevThreshold);
  const progInto = Math.max(0, currentValue - prevThreshold);
  const percent = isMax ? 100 : Math.min(100, Math.round((progInto / span) * 100));

  let noteText = "";
  if (isMax) {
    noteText = `Mastery Achieved (${tiers[tiers.length - 1].label})`;
  } else {
    const rem = nextThreshold - currentValue;
    const remStr =
      unit === "hours"
        ? rem >= 60
          ? `${Math.floor(rem / 60)}h`
          : `${rem}m`
        : rem.toLocaleString();
    noteText = `Next: ${nextLabel} (${remStr} remaining)`;
  }

  const tintClasses = {
    blue: "border-[var(--border)] hover:border-[var(--primary)]",
    purple: "border-[var(--border)] hover:border-[var(--accent)]",
    green: "border-[var(--border)] hover:border-[var(--success)]",
    amber: "border-[var(--border)] hover:border-[var(--warning)]",
  };

  const toneClasses = {
    blue: "tone-blue",
    purple: "tone-purple",
    green: "tone-green",
    amber: "tone-amber",
  };

  const barFillClasses = {
    blue: "bg-[var(--primary)]",
    purple: "bg-[var(--accent)]",
    green: "bg-[var(--success)]",
    amber: "bg-[var(--warning)]",
  };

  return (
    <div
      className={`p-5 rounded-[14px] bg-[var(--surface)] border transition-all duration-150 flex flex-col justify-between min-h-[140px] shadow-xs ${tintClasses[tint]}`}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[18px] select-none">{icon}</span>
            <span className="text-[12px] font-semibold text-[var(--text-secondary)]">
              {title}
            </span>
          </div>
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-[6px] border ${
              isMax
                ? "bg-[var(--success-soft)] border-[var(--success)] text-[var(--success)]"
                : "bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--text-muted)]"
            }`}
          >
            {isMax ? "Tier 5 (Max)" : `Tier ${reachedTier} of ${tiers.length}`}
          </span>
        </div>

        {/* Value */}
        <p
          className={`text-[26px] font-extrabold tracking-tight ${toneClasses[tint]}`}
        >
          {valDisplay}
        </p>
      </div>

      {/* Progress & Target note */}
      <div className="mt-3 space-y-1.5">
        <div className="w-full h-2 rounded-full bg-[var(--surface-secondary)] border border-[var(--border)] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barFillClasses[tint]}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-[11px] font-medium text-[var(--text-muted)] truncate">
          {noteText}
        </p>
      </div>
    </div>
  );
}

interface MilestoneGridProps {
  focusMinutes: number;
  completedActivities: number;
  goalDays: number;
  longestStreak: number;
}

export function MilestoneGrid({
  focusMinutes,
  completedActivities,
  goalDays,
  longestStreak,
}: MilestoneGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MilestoneCard
        milestoneId="focus_duration"
        title="Focus Duration"
        icon="⏱"
        currentValue={focusMinutes}
        tint="blue"
      />
      <MilestoneCard
        milestoneId="completed_activities"
        title="Tasks Done"
        icon="✅"
        currentValue={completedActivities}
        tint="purple"
      />
      <MilestoneCard
        milestoneId="daily_goal_days"
        title="Goal Days"
        icon="🎯"
        currentValue={goalDays}
        tint="green"
      />
      <MilestoneCard
        milestoneId="longest_streak"
        title="Longest Streak"
        icon="🔥"
        currentValue={longestStreak}
        tint="amber"
      />
    </div>
  );
}
