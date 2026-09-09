"use client";

import React, { useState } from "react";
import type { ActivityDistribution } from "@/lib/insights-service";
import { formatMinutes } from "@/lib/format";

interface ActivityDistributionProps {
  distribution: ActivityDistribution;
}

const BAR_COLORS = [
  "var(--primary)",
  "var(--accent)",
  "var(--success)",
  "var(--warning)",
  "var(--primary-muted)",
  "var(--accent-muted)",
  "#64748B",
];

export default function ActivityDistributionComponent({
  distribution,
}: ActivityDistributionProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const items = distribution.items;
  const maxMinutes = items.length > 0 ? Math.max(...items.map((it) => it.focusMinutes)) : 0;

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] p-5 space-y-4">
      {/* Header */}
      <div className="border-b border-[var(--border)]/50 pb-3">
        <h3 className="text-[15px] font-bold text-[var(--text-primary)]">
          Activity Distribution
        </h3>
        <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
          {distribution.totalMinutes > 0
            ? `${formatMinutes(distribution.totalMinutes)} of focused work recorded in this period.`
            : "Complete a focus session to see where your time goes."}
        </p>
      </div>

      {/* Rows */}
      {items.length === 0 ? (
        <div className="h-[120px] flex items-center justify-center text-[13px] text-[var(--text-muted)]">
          No focus time recorded yet.
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          {items.map((item, index) => {
            const widthRatio = maxMinutes > 0 ? Math.max(4, (item.focusMinutes / maxMinutes) * 100) : 4;
            const barColor = BAR_COLORS[index % BAR_COLORS.length];
            const isHovered = hoveredIdx === index;

            return (
              <div
                key={item.category}
                onMouseEnter={() => setHoveredIdx(index)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="group flex items-center gap-3 text-[13px] cursor-pointer"
              >
                {/* Category label (max-w, truncated) */}
                <div className="w-28 sm:w-36 text-[12px] font-medium text-[var(--text-secondary)] truncate">
                  {item.category}
                </div>

                {/* Bar area */}
                <div className="flex-1 h-3.5 bg-[var(--surface-elevated)] rounded-full overflow-hidden relative">
                  <div
                    style={{
                      width: `${widthRatio}%`,
                      backgroundColor: barColor,
                    }}
                    className="h-full rounded-full transition-all duration-300"
                  />
                </div>

                {/* Share percentage */}
                <div className="w-10 text-right text-[12px] font-semibold text-[var(--text-muted)] group-hover:text-[var(--text-primary)]">
                  {item.percent}%
                </div>

                {/* Formatted duration */}
                <div className="w-16 text-right text-[12px] font-medium text-[var(--text-secondary)]">
                  {formatMinutes(item.focusMinutes)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
