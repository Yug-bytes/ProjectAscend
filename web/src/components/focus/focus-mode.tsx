"use client";

import React, { useEffect } from "react";
import CircularTimer from "./circular-timer";
import type { Activity } from "@/lib/types";
import { Play, Pause, Check, X } from "lucide-react";

interface FocusModeProps {
  activity: Activity;
  elapsedSeconds: number;
  isRunning: boolean;
  onPause: () => void;
  onResume: () => void;
  onComplete: () => void;
  onExit: () => void;
}

export default function FocusMode({
  activity,
  elapsedSeconds,
  isRunning,
  onPause,
  onResume,
  onComplete,
  onExit,
}: FocusModeProps) {
  // ESC key exits Focus Mode without stopping the session (matches desktop behaviour)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onExit();
      } else if (e.code === "Space") {
        // Prevent page scroll and toggle pause/resume
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "BUTTON" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
          if (isRunning) onPause();
          else onResume();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        onComplete();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRunning, onPause, onResume, onComplete, onExit]);

  return (
    <div className="fixed inset-0 z-50 bg-[var(--background)] flex flex-col items-center justify-between p-8 md:p-12 select-none animate-in fade-in duration-200">
      {/* Top Brand & Context */}
      <div className="flex flex-col items-center text-center space-y-2 max-w-xl">
        <span className="text-[11px] font-bold tracking-widest text-[var(--text-muted)] uppercase">
          ASCEND • FOCUS MODE
        </span>
        <h1 className="text-[28px] md:text-[32px] font-extrabold text-[var(--text-primary)] tracking-tight line-clamp-2">
          {activity.name}
        </h1>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--surface-elevated)] text-[var(--text-secondary)] border border-[var(--border)]">
            {activity.activity_type || "Uncategorised"}
          </span>
        </div>
      </div>

      {/* Center Circular Timer Ring */}
      <div className="flex flex-col items-center justify-center my-auto space-y-4">
        <CircularTimer
          elapsedSeconds={elapsedSeconds}
          estimatedMinutes={activity.estimated_minutes}
          caption={isRunning ? "Focus Time" : "Paused"}
          size={300}
          strokeWidth={14}
        />
        <p className="text-[13px] text-[var(--text-muted)]">
          Planned: {activity.estimated_minutes} min
        </p>
      </div>

      {/* Bottom Action Controls & Hints */}
      <div className="flex flex-col items-center space-y-4 w-full max-w-md">
        <div className="flex items-center justify-center gap-3 w-full">
          {/* Pause / Resume button */}
          <button
            onClick={isRunning ? onPause : onResume}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-[10px] bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)] font-semibold text-[14px] transition-colors cursor-pointer"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 text-[var(--primary)]" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-[var(--primary)] fill-current" />
                <span>Resume</span>
              </>
            )}
          </button>

          {/* Complete button */}
          <button
            onClick={onComplete}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-[10px] bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold text-[14px] transition-colors shadow-sm cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Complete</span>
          </button>

          {/* Exit button */}
          <button
            onClick={onExit}
            className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-[10px] bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] font-medium text-[13px] transition-colors cursor-pointer"
            title="Exit fullscreen (Esc)"
          >
            <X className="w-4 h-4" />
            <span>Exit</span>
          </button>
        </div>

        <p className="text-[11px] text-[var(--text-muted)] tracking-wide">
          No distractions. Just progress. (Esc to exit • Space to pause • Ctrl+Enter to complete)
        </p>
      </div>
    </div>
  );
}
