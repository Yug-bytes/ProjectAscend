"use client";

import React from "react";
import type { HighlightsData } from "@/lib/insights-service";
import { Trophy, Award, Zap } from "lucide-react";

interface PersonalHighlightsProps {
  highlights: HighlightsData;
}

export default function PersonalHighlights({
  highlights,
}: PersonalHighlightsProps) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[var(--border)]/50 pb-3">
        <Trophy className="w-4 h-4 text-[var(--warning)]" />
        <h3 className="text-[15px] font-bold text-[var(--text-primary)]">
          Personal Highlights
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Best Day */}
        <div className="tint-blue border rounded-[10px] p-4 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Best Day
            </span>
            <Award className="w-3.5 h-3.5 text-[var(--primary)]" />
          </div>
          <div>
            <p className="text-[20px] font-extrabold text-[var(--text-primary)]">
              {highlights.bestDay ? highlights.bestDay.value : "—"}
            </p>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
              {highlights.bestDay
                ? highlights.bestDay.note
                : "Complete a focus session to find your best day."}
            </p>
          </div>
        </div>

        {/* 2. Longest Session */}
        <div className="tint-purple border rounded-[10px] p-4 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Longest Session
            </span>
            <Zap className="w-3.5 h-3.5 text-[var(--accent)]" />
          </div>
          <div>
            <p className="text-[20px] font-extrabold text-[var(--text-primary)]">
              {highlights.longestSession ? highlights.longestSession.value : "—"}
            </p>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
              {highlights.longestSession
                ? highlights.longestSession.note
                : "No focus sessions recorded in this period."}
            </p>
          </div>
        </div>

        {/* 3. Biggest Improvement */}
        <div className="tint-green border rounded-[10px] p-4 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Improvement
            </span>
            <Trophy className="w-3.5 h-3.5 text-[var(--success)]" />
          </div>
          <div>
            <p className="text-[20px] font-extrabold text-[var(--text-primary)]">
              {highlights.improvement ? highlights.improvement.value : "—"}
            </p>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
              {highlights.improvement
                ? highlights.improvement.note
                : "A comparison unlocks with previous-period data."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
