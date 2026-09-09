"use client";

import React, { useState } from "react";
import type { FocusTrendData } from "@/lib/insights-service";
import { formatMinutes } from "@/lib/format";
import { formatDisplayDate } from "@/lib/date-utils";

interface FocusTrendChartProps {
  trend: FocusTrendData;
}

export default function FocusTrendChart({ trend }: FocusTrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const points = trend.points;
  const maxMinutes = points.reduce((max, p) => Math.max(max, p.focusMinutes), 0);
  const strongestIndex =
    points.length > 0
      ? points.reduce((bestIdx, p, idx, arr) => (p.focusMinutes > arr[bestIdx].focusMinutes ? idx : bestIdx), 0)
      : -1;

  const showValueLabels = points.length <= 14;

  const chartHeight = 160;
  const divisions = 4;
  const gridSteps = Array.from({ length: divisions + 1 }, (_, i) => i / divisions);

  const comparisonBadgeColor = {
    positive: "bg-[var(--success-soft)] text-[var(--success)] border-[var(--success)]/20",
    negative: "bg-[var(--warning-soft)] text-[var(--warning)] border-[var(--warning)]/20",
    neutral: "bg-[var(--surface-elevated)] text-[var(--text-muted)] border-[var(--border)]",
  }[trend.comparison.direction];

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] p-5 space-y-4">
      {/* Header: Title, Totals, Comparison Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)]/50 pb-3">
        <div>
          <h3 className="text-[15px] font-bold text-[var(--text-primary)]">
            Focus Time Trend
          </h3>
          <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
            {formatMinutes(trend.totalFocusMinutes)} total • {formatMinutes(trend.dailyAverageMinutes)} daily average
          </p>
        </div>

        <div>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-[6px] text-[11px] font-semibold border ${comparisonBadgeColor}`}
          >
            {trend.comparison.text}
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      {points.length === 0 ? (
        <div className="h-[180px] flex items-center justify-center text-[13px] text-[var(--text-muted)]">
          No focus data yet
        </div>
      ) : (
        <div className="relative pt-4 pb-2">
          {/* Grid lines & axis labels */}
          <div className="absolute inset-x-0 top-4 bottom-8 flex flex-col justify-between pointer-events-none">
            {gridSteps.reverse().map((step, idx) => {
              const val = Math.round(maxMinutes * step);
              return (
                <div key={idx} className="relative flex items-center w-full">
                  <span className="text-[10px] text-[var(--text-muted)] w-10 text-right pr-2 select-none">
                    {val > 0 ? formatMinutes(val) : "0m"}
                  </span>
                  <div className="flex-1 border-b border-[var(--border)]/60" />
                </div>
              );
            })}
          </div>

          {/* Bar Columns Container */}
          <div className="ml-10 h-[150px] flex items-end justify-between gap-1 sm:gap-2 relative z-10">
            {points.map((point, index) => {
              const isStrongest = index === strongestIndex && point.focusMinutes > 0;
              const isHovered = index === hoveredIndex;
              const heightPercent =
                maxMinutes > 0 ? Math.max(3, (point.focusMinutes / maxMinutes) * 100) : 3;

              return (
                <div
                  key={point.day}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                >
                  {/* Hover tooltip */}
                  {isHovered && (
                    <div className="absolute -top-10 px-2.5 py-1 bg-[var(--surface-elevated)] border border-[var(--border-strong)] rounded-[6px] shadow-lg text-[11px] whitespace-nowrap z-30 pointer-events-none">
                      <p className="font-semibold text-[var(--text-primary)]">
                        {formatDisplayDate(point.day)}
                      </p>
                      <p className="text-[var(--text-secondary)]">
                        {formatMinutes(point.focusMinutes)} focused
                        {point.completedTasks > 0 ? ` • ${point.completedTasks} tasks` : ""}
                      </p>
                    </div>
                  )}

                  {/* Value caption above bar if sparse */}
                  {showValueLabels && point.focusMinutes > 0 && (
                    <span
                      className={`text-[10px] font-medium mb-1 truncate select-none ${
                        isStrongest || isHovered
                          ? "text-[var(--text-primary)] font-bold"
                          : "text-[var(--text-muted)]"
                      }`}
                    >
                      {formatMinutes(point.focusMinutes)}
                    </span>
                  )}

                  {/* The Bar */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[36px] rounded-t-[4px] transition-all duration-200 ${
                      point.focusMinutes === 0
                        ? "bg-[var(--border)] hover:bg-[var(--border-strong)]"
                        : isStrongest
                        ? "bg-gradient-to-t from-[var(--primary)] to-[var(--accent)] shadow-sm shadow-[var(--accent)]/20"
                        : "bg-gradient-to-t from-[var(--primary-pressed)] to-[var(--primary)] hover:to-[var(--primary-hover)]"
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* X-axis date labels */}
          <div className="ml-10 flex justify-between gap-1 sm:gap-2 mt-2 pt-1 border-t border-[var(--border)]/40">
            {points.map((point, index) => {
              const count = points.length;
              const isFirst = index === 0;
              const isLast = index === count - 1;
              const shouldShow =
                count <= 7 || isFirst || isLast || (count > 7 && index % Math.ceil(count / 6) === 0);

              return (
                <div key={point.day} className="flex-1 text-center truncate">
                  {shouldShow && (
                    <span className="text-[10px] text-[var(--text-muted)] select-none">
                      {count === 1
                        ? "Today"
                        : point.day.slice(5) /* 'MM-DD' */}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
