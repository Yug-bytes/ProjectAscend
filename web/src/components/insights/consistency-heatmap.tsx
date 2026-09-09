"use client";

import React, { useState } from "react";
import type { ConsistencyData } from "@/lib/insights-service";
import { formatMinutes } from "@/lib/format";
import { formatDisplayDate } from "@/lib/date-utils";
import { formatDayCount } from "@/lib/insights-service";

interface ConsistencyHeatmapProps {
  consistency: ConsistencyData;
}

const LEVEL_BG: Record<string, string> = {
  inactive: "var(--surface-elevated)",
  light: "var(--primary-muted)",
  moderate: "var(--primary)",
  high: "var(--success)",
};

export default function ConsistencyHeatmap({
  consistency,
}: ConsistencyHeatmapProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const days = consistency.heatmapDays;
  const columns = days.length <= 7 ? 7 : 10;

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] p-5 space-y-4">
      {/* Header */}
      <div className="border-b border-[var(--border)]/50 pb-3 flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-bold text-[var(--text-primary)]">
            Focus Consistency
          </h3>
          <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
            Daily focus relative to your {formatMinutes(consistency.dailyGoalMinutes)} daily goal.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-[2px]"
              style={{ backgroundColor: LEVEL_BG.inactive }}
            />
            Off
          </span>
          <span className="flex items-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-[2px]"
              style={{ backgroundColor: LEVEL_BG.light }}
            />
            Light
          </span>
          <span className="flex items-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-[2px]"
              style={{ backgroundColor: LEVEL_BG.moderate }}
            />
            Half
          </span>
          <span className="flex items-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-[2px]"
              style={{ backgroundColor: LEVEL_BG.high }}
            />
            Goal
          </span>
        </div>
      </div>

      {/* Days Grid */}
      <div
        className="grid gap-1.5 pt-1"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {days.map((dayItem, idx) => {
          const isHovered = hoveredIdx === idx;
          const parsed = new Date(dayItem.day);
          const weekdayLetter = !isNaN(parsed.getTime())
            ? parsed.toLocaleDateString("en-US", { weekday: "narrow" })
            : "";

          return (
            <div
              key={dayItem.day}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="relative flex flex-col items-center gap-1 cursor-pointer group"
            >
              {/* Tooltip */}
              {isHovered && (
                <div className="absolute -top-9 px-2 py-0.5 bg-[var(--surface-elevated)] border border-[var(--border-strong)] rounded-[6px] shadow-lg text-[11px] whitespace-nowrap z-30 pointer-events-none">
                  <span className="font-semibold text-[var(--text-primary)]">
                    {formatDisplayDate(dayItem.day)}
                  </span>
                  : {formatMinutes(dayItem.focusMinutes)} focused
                </div>
              )}

              <span className="text-[9px] text-[var(--text-muted)] uppercase">
                {weekdayLetter}
              </span>

              <div
                className="w-full h-5 rounded-[4px] border border-[var(--border)] transition-transform group-hover:scale-105"
                style={{ backgroundColor: LEVEL_BG[dayItem.level] }}
              />
            </div>
          );
        })}
      </div>

      {/* Consistency Statistics Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
        <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[8px] p-2.5 text-center">
          <span className="block text-[11px] text-[var(--text-muted)] font-medium">
            Current Streak
          </span>
          <span className="text-[16px] font-bold text-[var(--text-primary)]">
            {formatDayCount(consistency.currentStreak)}
          </span>
        </div>

        <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[8px] p-2.5 text-center">
          <span className="block text-[11px] text-[var(--text-muted)] font-medium">
            Best Streak
          </span>
          <span className="text-[16px] font-bold text-[var(--text-primary)]">
            {formatDayCount(consistency.bestStreak)}
          </span>
        </div>

        <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[8px] p-2.5 text-center">
          <span className="block text-[11px] text-[var(--text-muted)] font-medium">
            Active Days
          </span>
          <span className="text-[16px] font-bold text-[var(--text-primary)]">
            {consistency.activeDays} / {consistency.periodDays}
          </span>
        </div>

        <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[8px] p-2.5 text-center">
          <span className="block text-[11px] text-[var(--text-muted)] font-medium">
            Goal Rate
          </span>
          <span className="text-[16px] font-bold text-[var(--text-primary)]">
            {consistency.goalSuccessRate}%
          </span>
        </div>
      </div>
    </div>
  );
}
