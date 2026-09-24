"use client";

import React, { useState } from "react";
import type { DayHourPattern } from "@/lib/insights-service";
import { formatMinutes } from "@/lib/format";

interface DayHourHeatmapProps {
  dayHour: DayHourPattern;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const BLOCK_LABELS = ["Morning", "Afternoon", "Evening", "Night"];

export default function DayHourHeatmap({ dayHour }: DayHourHeatmapProps) {
  const [hoverCell, setHoverCell] = useState<{ day: number; block: number } | null>(null);

  const maxMinutes = dayHour.cells.reduce((max, c) => Math.max(max, c.focusMinutes), 0);

  const cellMap = new Map<string, { minutes: number; count: number }>();
  for (const c of dayHour.cells) {
    cellMap.set(`${c.dayIndex}-${c.blockIndex}`, {
      minutes: c.focusMinutes,
      count: c.sessionCount,
    });
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] p-5 space-y-4">
      {/* Header */}
      <div className="border-b border-[var(--border)]/50 pb-3">
        <h3 className="text-[15px] font-bold text-[var(--text-primary)]">
          When You Work Best
        </h3>
        {dayHour.status === "ready" && dayHour.strongestWindowLabel ? (
          <div className="text-[12px] mt-0.5 space-y-0.5">
            <p className="text-[var(--text-primary)] font-medium">
              Your strongest focus window:{" "}
              <span className="text-[var(--primary)] font-bold">
                {dayHour.strongestWindowLabel}
              </span>
            </p>
            <p className="text-[var(--text-muted)]">
              Based on {dayHour.windowSessionCount}{" "}
              {dayHour.windowSessionCount === 1 ? "session" : "sessions"} •{" "}
              {formatMinutes(dayHour.strongestWindowMinutes)} focused
            </p>
          </div>
        ) : dayHour.status === "empty" ? (
          <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
            We're still learning your rhythm. Complete a few focus sessions to see when you work best.
          </p>
        ) : (
          <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
            We're still learning your rhythm ({dayHour.totalSessions} sessions so far — more will reveal when you focus best).
          </p>
        )}
      </div>

      {/* Grid: 7 days x 4 blocks */}
      <div className="pt-1 overflow-x-auto pb-1">
        <div className="min-w-[340px]">
          {/* Column Headers */}
          <div className="grid grid-cols-[44px_repeat(4,1fr)] gap-2 mb-2">
          <div />
          {BLOCK_LABELS.map((block) => (
            <div
              key={block}
              className="text-center text-[11px] font-semibold text-[var(--text-muted)]"
            >
              {block}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="space-y-1.5">
          {DAY_LABELS.map((dayLabel, dayIdx) => (
            <div
              key={dayLabel}
              className="grid grid-cols-[44px_repeat(4,1fr)] gap-2 items-center"
            >
              {/* Day Label */}
              <div className="text-[11px] font-medium text-[var(--text-muted)] text-right pr-2">
                {dayLabel}
              </div>

              {/* 4 Time Block Cells */}
              {BLOCK_LABELS.map((_, blockIdx) => {
                const cell = cellMap.get(`${dayIdx}-${blockIdx}`);
                const minutes = cell?.minutes || 0;
                const count = cell?.count || 0;
                const isHovered =
                  hoverCell?.day === dayIdx && hoverCell?.block === blockIdx;

                // Opacity formula matching Python: 40 + int(215 * (minutes / max_minutes))
                const alphaPercent =
                  maxMinutes > 0 && minutes > 0
                    ? Math.round(15 + (minutes / maxMinutes) * 85)
                    : 0;

                return (
                  <div
                    key={blockIdx}
                    onMouseEnter={() => setHoverCell({ day: dayIdx, block: blockIdx })}
                    onMouseLeave={() => setHoverCell(null)}
                    className="relative group h-7 rounded-[6px] border border-[var(--border)] transition-all cursor-pointer flex items-center justify-center"
                    style={{
                      backgroundColor:
                        minutes > 0
                          ? `rgba(59, 130, 246, ${alphaPercent / 100})`
                          : "transparent",
                    }}
                  >
                    {/* Hover tooltip */}
                    {isHovered && minutes > 0 && (
                      <div className="absolute -top-10 px-2.5 py-1 bg-[var(--surface-elevated)] border border-[var(--border-strong)] rounded-[6px] shadow-lg text-[11px] whitespace-nowrap z-30 pointer-events-none">
                        <p className="font-semibold text-[var(--text-primary)]">
                          {dayLabel} {BLOCK_LABELS[blockIdx]}
                        </p>
                        <p className="text-[var(--text-secondary)]">
                          {formatMinutes(minutes)} focused • {count}{" "}
                          {count === 1 ? "session" : "sessions"}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        </div>
      </div>
    </div>
  );
}
