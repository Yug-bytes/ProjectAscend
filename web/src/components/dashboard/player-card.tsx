"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, Trophy } from "lucide-react";
import { getProgressionSummary } from "@/lib/progression-service";
import type { ProgressionSummary } from "@/lib/types";

interface PlayerCardProps {
  summary?: ProgressionSummary;
  className?: string;
}

export function PlayerCard({ summary: propSummary, className = "" }: PlayerCardProps) {
  const [summary, setSummary] = useState<ProgressionSummary | null>(propSummary ?? null);

  useEffect(() => {
    if (propSummary) {
      setSummary(propSummary);
      return;
    }

    let isMounted = true;
    async function load() {
      try {
        const data = await getProgressionSummary();
        if (isMounted) setSummary(data);
      } catch (err) {
        console.error("Failed to load player progression:", err);
      }
    }
    load();

    return () => {
      isMounted = false;
    };
  }, [propSummary]);

  const level = summary?.level ?? 1;
  const currentXp = summary?.total_xp ?? 0;
  const xpInto = summary?.xp_into_level ?? 0;
  const xpFor = summary?.xp_for_level ?? 100;
  const currentStreak = summary?.current_streak ?? 0;
  const longestStreak = summary?.longest_streak ?? 0;

  const percent = Math.min(100, Math.round((xpInto / Math.max(1, xpFor)) * 100));

  return (
    <div
      className={`rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-5 flex flex-col justify-between shadow-xs ${className}`}
    >
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Player Progress
          </span>
          <Link
            href="/progression"
            className="text-[12px] font-semibold text-[var(--primary)] hover:underline"
          >
            View Details →
          </Link>
        </div>

        {/* Level & XP row */}
        <div className="flex items-baseline justify-between mb-2">
          <h3 className="text-[22px] font-extrabold text-[var(--text-primary)]">
            Level {level}
          </h3>
          <span className="text-[13px] font-bold text-[var(--accent)]">
            {currentXp.toLocaleString()} XP
          </span>
        </div>

        {/* XP Progress Bar */}
        <div className="space-y-1 mb-4">
          <div className="w-full h-2.5 rounded-full bg-[var(--surface-secondary)] border border-[var(--border)] overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] rounded-full transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-medium text-[var(--text-muted)]">
            <span>
              {xpInto} / {xpFor} XP
            </span>
            <span>{percent}%</span>
          </div>
        </div>
      </div>

      {/* Streak rows */}
      <div className="space-y-2 pt-2 border-t border-[var(--border)]">
        {/* Current Streak */}
        <div className="flex items-center justify-between px-3 py-2 rounded-[8px] bg-[var(--surface-secondary)] border border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Flame size={16} className="tone-amber" />
            <span className="text-[12px] font-semibold text-[var(--text-secondary)]">
              Current Streak
            </span>
          </div>
          <span className="text-[13px] font-extrabold tone-amber">
            {currentStreak} {currentStreak === 1 ? "day" : "days"}
          </span>
        </div>

        {/* Best Streak */}
        <div className="flex items-center justify-between px-3 py-2 rounded-[8px] bg-[var(--surface-secondary)] border border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="tone-blue" />
            <span className="text-[12px] font-semibold text-[var(--text-secondary)]">
              Best Streak
            </span>
          </div>
          <span className="text-[13px] font-extrabold tone-blue">
            {longestStreak} {longestStreak === 1 ? "day" : "days"}
          </span>
        </div>
      </div>
    </div>
  );
}
