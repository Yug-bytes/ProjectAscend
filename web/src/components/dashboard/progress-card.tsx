"use client";

import React from "react";
import { Clock, CheckCircle, Target } from "lucide-react";
import { formatMinutes } from "@/lib/format";

interface ProgressCardProps {
  dailyGoal: number;
  studyMinutes: number;
  completedCount: number;
  totalCount: number;
}

export default function ProgressCard({
  dailyGoal,
  studyMinutes,
  completedCount,
  totalCount,
}: ProgressCardProps) {
  const percent = dailyGoal > 0 ? Math.min(100, Math.round((studyMinutes / dailyGoal) * 100)) : 0;
  const remainingMinutes = Math.max(0, dailyGoal - studyMinutes);

  return (
    <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-[15px] font-bold text-[var(--text-primary)]">
            Today&apos;s Progress
          </h3>
          <span className="text-[15px] select-none" aria-label="Goal badge">
            🎯
          </span>
        </div>
        <span className="text-[12px] font-medium text-[var(--text-muted)]">
          Goal: {formatMinutes(dailyGoal)}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="w-full h-2.5 rounded-full bg-[var(--surface-elevated)] border border-[var(--border)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--primary)] transition-all duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[11px] text-[var(--text-muted)] font-medium">
          <span>{percent}% achieved</span>
          <span>{studyMinutes >= dailyGoal ? "Goal Met!" : `${formatMinutes(remainingMinutes)} to go`}</span>
        </div>
      </div>

      {/* 3 Semantic Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        {/* Focus Time - Blue tone */}
        <div className="rounded-[10px] border border-[var(--border)] p-3.5 bg-[var(--surface-elevated)] tint-blue space-y-1">
          <div className="flex items-center gap-2">
            <Clock size={16} className="tone-blue" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Focus Time
            </span>
          </div>
          <p className="text-[20px] font-extrabold text-[var(--text-primary)] tone-blue">
            {formatMinutes(studyMinutes)}
          </p>
        </div>

        {/* Completed Tasks - Green tone */}
        <div className="rounded-[10px] border border-[var(--border)] p-3.5 bg-[var(--surface-elevated)] tint-green space-y-1">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="tone-green" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Completed
            </span>
          </div>
          <p className="text-[20px] font-extrabold text-[var(--text-primary)] tone-green">
            {completedCount} / {totalCount}
          </p>
        </div>

        {/* Remaining - Purple tone */}
        <div className="rounded-[10px] border border-[var(--border)] p-3.5 bg-[var(--surface-elevated)] tint-purple space-y-1">
          <div className="flex items-center gap-2">
            <Target size={16} className="tone-purple" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Remaining
            </span>
          </div>
          <p className="text-[20px] font-extrabold text-[var(--text-primary)] tone-purple">
            {formatMinutes(remainingMinutes)}
          </p>
        </div>
      </div>
    </div>
  );
}
