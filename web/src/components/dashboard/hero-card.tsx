"use client";

import React from "react";
import Link from "next/link";
import { Plus, Calendar } from "lucide-react";
import { timeOfDayGreeting } from "@/lib/format";
import { formatDisplayDate } from "@/lib/date-utils";

interface HeroCardProps {
  onAddActivity: () => void;
}

export default function HeroCard({ onAddActivity }: HeroCardProps) {
  const today = new Date();
  const greeting = timeOfDayGreeting();
  const dateStr = formatDisplayDate(today, true);

  return (
    <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-5 lg:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Greeting and date */}
      <div className="space-y-1">
        <h1 className="text-[22px] font-extrabold text-[var(--text-primary)] tracking-tight">
          {greeting}, Ascender
        </h1>
        <p className="text-[12px] text-[var(--text-muted)] font-medium">
          {dateStr}
        </p>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onAddActivity}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-[13px] font-bold shadow-sm transition-colors cursor-pointer"
        >
          <Plus size={16} />
          Add Activity
        </button>

        <Link
          href="/planner"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] border border-[var(--border-strong)] text-[var(--text-primary)] text-[13px] font-semibold transition-colors"
        >
          <Calendar size={15} className="text-[var(--accent)]" />
          Plan Tomorrow
        </Link>
      </div>
    </div>
  );
}
