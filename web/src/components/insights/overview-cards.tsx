"use client";

import React from "react";
import type { OverviewData, RangeDefinition } from "@/lib/insights-service";
import {
  formatMinutes,
  formatPercentDelta,
  formatCountDelta,
  formatPointsDelta,
  deltaDirection,
} from "@/lib/format";
import { formatDayCount } from "@/lib/insights-service";
import { Clock, CheckCircle2, TrendingUp, Calendar, Flame, Star } from "lucide-react";

interface OverviewCardsProps {
  overview: OverviewData;
  rangeDefinition: RangeDefinition;
}

export default function OverviewCards({
  overview,
  rangeDefinition,
}: OverviewCardsProps) {
  const focusDelta = formatPercentDelta(overview.focusChangePercent);
  const focusDir = deltaDirection(overview.focusChangePercent);

  const taskDelta = formatCountDelta(overview.activityChange);
  const taskDir = deltaDirection(overview.activityChange);

  const completionDelta = formatPointsDelta(overview.completionChangePoints);
  const completionDir = deltaDirection(overview.completionChangePoints);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {/* 1. Focus Time */}
      <div className="tint-blue border rounded-[10px] p-3.5 flex flex-col justify-between min-h-[96px]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase">
            Focus Time
          </span>
          <Clock className="w-3.5 h-3.5 text-[var(--primary)]" />
        </div>
        <div className="my-1">
          <span className="text-[24px] font-extrabold text-[var(--text-primary)] leading-tight">
            {formatMinutes(overview.focusMinutes)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          {focusDelta ? (
            <span
              className={`font-semibold ${
                focusDir === "up" ? "text-[var(--success)]" : "text-[var(--warning)]"
              }`}
            >
              {focusDelta}
            </span>
          ) : null}
          <span className="text-[var(--text-muted)] truncate">
            {rangeDefinition.label}
          </span>
        </div>
      </div>

      {/* 2. Completed Activities */}
      <div className="tint-green border rounded-[10px] p-3.5 flex flex-col justify-between min-h-[96px]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase">
            Tasks Done
          </span>
          <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />
        </div>
        <div className="my-1">
          <span className="text-[24px] font-extrabold text-[var(--text-primary)] leading-tight">
            {overview.completedTasks}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          {taskDelta ? (
            <span
              className={`font-semibold ${
                taskDir === "up" ? "text-[var(--success)]" : "text-[var(--warning)]"
              }`}
            >
              {taskDelta}
            </span>
          ) : null}
          <span className="text-[var(--text-muted)] truncate">
            of {overview.totalTasks} planned
          </span>
        </div>
      </div>

      {/* 3. Completion Rate */}
      <div className="tint-purple border rounded-[10px] p-3.5 flex flex-col justify-between min-h-[96px]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase">
            Completion
          </span>
          <TrendingUp className="w-3.5 h-3.5 text-[var(--accent)]" />
        </div>
        <div className="my-1">
          <span className="text-[24px] font-extrabold text-[var(--text-primary)] leading-tight">
            {overview.completionRate}%
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          {completionDelta ? (
            <span
              className={`font-semibold ${
                completionDir === "up" ? "text-[var(--success)]" : "text-[var(--warning)]"
              }`}
            >
              {completionDelta}
            </span>
          ) : null}
          <span className="text-[var(--text-muted)] truncate">
            {overview.totalTasks === 0 ? "No tasks" : `${overview.completedTasks} completed`}
          </span>
        </div>
      </div>

      {/* 4. Active Days */}
      <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[10px] p-3.5 flex flex-col justify-between min-h-[96px]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase">
            Active Days
          </span>
          <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        </div>
        <div className="my-1">
          <span className="text-[24px] font-extrabold text-[var(--text-primary)] leading-tight">
            {overview.activeDays}
          </span>
        </div>
        <div className="text-[11px] text-[var(--text-muted)] truncate">
          days in period
        </div>
      </div>

      {/* 5. Current Streak */}
      <div className="tint-amber border rounded-[10px] p-3.5 flex flex-col justify-between min-h-[96px]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase">
            Streak
          </span>
          <Flame className="w-3.5 h-3.5 text-[var(--warning)]" />
        </div>
        <div className="my-1">
          <span className="text-[24px] font-extrabold text-[var(--text-primary)] leading-tight">
            {formatDayCount(overview.currentStreak)}
          </span>
        </div>
        <div className="text-[11px] text-[var(--text-muted)] truncate">
          Daily goal streak
        </div>
      </div>

      {/* 6. XP Earned */}
      <div className="tint-purple border rounded-[10px] p-3.5 flex flex-col justify-between min-h-[96px]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase">
            XP Earned
          </span>
          <Star className="w-3.5 h-3.5 text-[var(--accent)]" />
        </div>
        <div className="my-1">
          <span className="text-[24px] font-extrabold text-[var(--text-primary)] leading-tight">
            +{overview.xpEarned ?? 0}
          </span>
        </div>
        <div className="text-[11px] text-[var(--text-muted)] truncate">
          {rangeDefinition.label}
        </div>
      </div>
    </div>
  );
}
