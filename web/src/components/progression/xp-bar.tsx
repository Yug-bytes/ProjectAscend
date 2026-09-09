"use client";

import React from "react";

interface XpBarProps {
  currentXp: number;
  xpForLevel: number;
  xpRemaining?: number;
  nextLevel?: number;
  height?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function XpBar({
  currentXp,
  xpForLevel,
  xpRemaining,
  nextLevel,
  height = "md",
  showText = true,
  className = "",
}: XpBarProps) {
  const safeTotal = Math.max(1, xpForLevel);
  const safeCurrent = Math.max(0, Math.min(currentXp, safeTotal));
  const percent = Math.min(100, Math.round((safeCurrent / safeTotal) * 100));

  const heightClass =
    height === "sm" ? "h-2" : height === "lg" ? "h-[14px]" : "h-[10px]";

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      <div
        className={`w-full rounded-full bg-[var(--surface-secondary)] border border-[var(--border)] overflow-hidden ${heightClass}`}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-[var(--accent)] transition-all duration-300 ease-out rounded-full"
          style={{ width: `${percent}%` }}
        />
      </div>

      {showText && (
        <div className="flex items-center justify-between text-[12px] text-[var(--text-muted)] font-medium">
          <span>
            {currentXp} / {xpForLevel} XP
          </span>
          {xpRemaining !== undefined && nextLevel !== undefined && (
            <span>
              {xpRemaining} XP to Level {nextLevel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
