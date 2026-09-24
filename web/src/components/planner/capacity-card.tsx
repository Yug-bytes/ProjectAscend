"use client";

import React, { useState, useEffect } from "react";
import type { CapacityPlan } from "@/lib/types";
import { buildHeadline, buildSupportLines } from "@/lib/capacity-service";
import { Check, X } from "lucide-react";

interface CapacityCardProps {
  plan: CapacityPlan;
  onSetAvailableTime: (minutes: number) => Promise<void> | void;
  onClearAvailableTime: () => Promise<void> | void;
}

export default function CapacityCard({
  plan,
  onSetAvailableTime,
  onClearAvailableTime,
}: CapacityCardProps) {
  const [inputValue, setInputValue] = useState<number>(plan.available_minutes ?? 0);
  const hasAvailableTime = plan.available_minutes !== null;
  const headline = buildHeadline(plan);
  const supportLines = buildSupportLines(plan);

  useEffect(() => {
    setInputValue(plan.available_minutes ?? 0);
  }, [plan.available_minutes]);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onSetAvailableTime(inputValue);
  };

  return (
    <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-5 transition-all">
      {/* Header with intelligence glyph */}
      <div className="flex items-start gap-2.5">
        <span
          className="text-[var(--accent)] font-extrabold text-[16px] leading-none select-none shrink-0 mt-0.5"
          aria-hidden="true"
        >
          ✦
        </span>
        <div className="space-y-1 flex-1">
          <h3 className="text-[15px] font-bold text-[var(--text-primary)] leading-snug">
            {headline}
          </h3>
          {supportLines.length > 0 && (
            <div className="space-y-0.5 pt-0.5">
              {supportLines.map((line, idx) => (
                <p key={idx} className="text-[12px] text-[var(--text-muted)]">
                  {line}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Available Time Controls */}
      <div className="mt-4 pt-3.5 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <form onSubmit={handleApply} className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <label
            htmlFor="available-time-input"
            className="text-[11px] font-bold text-[var(--text-muted)] tracking-wider uppercase shrink-0"
          >
            Available time
          </label>
          <div className="relative flex items-center">
            <input
              id="available-time-input"
              type="number"
              min={0}
              max={1440}
              step={15}
              value={inputValue}
              onChange={(e) => setInputValue(Math.max(0, Math.min(1440, Number(e.target.value) || 0)))}
              className="w-24 px-2.5 py-2 sm:py-1.5 rounded-[8px] border border-[var(--border-strong)] bg-[var(--surface-elevated)] text-[13px] font-bold text-[var(--text-primary)] text-right pr-9 focus:outline-none focus:border-[var(--primary)] min-h-[38px]"
            />
            <span className="absolute right-2.5 text-[11px] font-medium text-[var(--text-muted)] pointer-events-none">
              min
            </span>
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-[8px] bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] border border-[var(--border-strong)] text-[12px] font-semibold text-[var(--text-primary)] transition-colors cursor-pointer min-h-[38px]"
          >
            <Check size={14} className="text-[var(--primary)]" />
            {hasAvailableTime ? "Change" : "Set"}
          </button>
        </form>

        {hasAvailableTime && (
          <button
            type="button"
            onClick={() => onClearAvailableTime()}
            className="inline-flex items-center justify-center gap-1 px-3 py-2 sm:py-1.5 rounded-[8px] bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[12px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer self-start sm:self-auto min-h-[38px]"
          >
            <X size={13} />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
