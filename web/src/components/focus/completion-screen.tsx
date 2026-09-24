"use client";

import React from "react";
import Link from "next/link";
import { formatMinutes } from "@/lib/format";
import { Sparkles, Trophy, CheckCircle, Target, Clock, Star } from "lucide-react";

interface CompletionScreenProps {
  studyMinutes: number;
  completedTasks: number;
  totalTasks: number;
  dailyGoal: number;
  totalXp?: number;
  level?: number;
  achievements?: string[];
  isOpen: boolean;
  onClose: () => void;
}

export default function CompletionScreen({
  studyMinutes,
  completedTasks,
  totalTasks,
  dailyGoal,
  totalXp = 0,
  level = 1,
  achievements = [],
  isOpen,
  onClose,
}: CompletionScreenProps) {
  if (!isOpen) return null;

  const goalAchieved = studyMinutes >= dailyGoal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-[650px] bg-[var(--surface)] border border-[var(--border)] rounded-[18px] p-4 sm:p-8 md:p-10 shadow-2xl flex flex-col space-y-4 sm:space-y-6 text-center select-none max-h-[90vh] overflow-y-auto">
        {/* Top Section */}
        <div className="flex flex-col items-center space-y-2">
          <span className="text-[52px] leading-none select-none">🎉</span>
          <h2 className="text-[26px] md:text-[30px] font-extrabold text-[var(--text-primary)] tracking-tight">
            Congratulations!
          </h2>
          <p className="text-[14px] md:text-[15px] text-[var(--text-muted)]">
            You completed every activity today.
          </p>
        </div>

        {/* Statistics Card */}
        <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[14px] p-6 text-left space-y-3.5">
          <div className="flex items-center justify-between py-1 border-b border-[var(--border)]/50">
            <span className="flex items-center gap-2 text-[14px] text-[var(--text-secondary)] font-medium">
              <Clock className="w-4 h-4 text-[var(--primary)]" /> Focus Time
            </span>
            <span className="text-[15px] font-bold text-[var(--text-primary)]">
              {formatMinutes(studyMinutes)}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-[var(--border)]/50">
            <span className="flex items-center gap-2 text-[14px] text-[var(--text-secondary)] font-medium">
              <CheckCircle className="w-4 h-4 text-[var(--success)]" /> Completed Tasks
            </span>
            <span className="text-[15px] font-bold text-[var(--text-primary)]">
              {completedTasks} / {totalTasks}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-[var(--border)]/50">
            <span className="flex items-center gap-2 text-[14px] text-[var(--text-secondary)] font-medium">
              <Target className="w-4 h-4 text-[var(--warning)]" /> Daily Goal
            </span>
            <span className="text-[15px] font-bold text-[var(--text-primary)]">
              {dailyGoal} min
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-[var(--border)]/50">
            <span className="flex items-center gap-2 text-[14px] text-[var(--text-secondary)] font-medium">
              <Star className="w-4 h-4 text-[var(--accent)]" /> Total XP
            </span>
            <span className="text-[15px] font-bold text-[var(--text-primary)]">
              {totalXp} XP
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-[var(--border)]/50">
            <span className="flex items-center gap-2 text-[14px] text-[var(--text-secondary)] font-medium">
              <Trophy className="w-4 h-4 text-[var(--accent)]" /> Level
            </span>
            <span className="text-[15px] font-bold text-[var(--text-primary)]">
              Level {level}
            </span>
          </div>

          {/* Achievements section */}
          <div className="pt-2">
            <span className="block text-[13px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              Achievements
            </span>
            <p className="text-[13px] text-[var(--text-muted)]">
              {achievements.length > 0
                ? achievements.join(" • ")
                : "No new achievements unlocked today."}
            </p>
          </div>
        </div>

        {/* Goal Status Badge */}
        <div className="flex items-center justify-center">
          {goalAchieved ? (
            <span className="text-[20px] font-extrabold text-[var(--primary)] flex items-center gap-2">
              🎯 Goal Achieved
            </span>
          ) : (
            <span className="text-[20px] font-extrabold text-[var(--error)] flex items-center gap-2">
              ❌ Goal Missed
            </span>
          )}
        </div>

        {/* Bottom Button Row */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2.5 sm:gap-3 pt-2">
          <Link
            href="/insights"
            onClick={onClose}
            className="flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 rounded-[10px] bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)] font-semibold text-[13px] transition-colors min-h-[44px]"
          >
            <span>📊 View Insights</span>
          </Link>

          <button
            onClick={onClose}
            className="flex items-center justify-center gap-2 px-6 py-3 sm:py-2.5 rounded-[10px] bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold text-[13px] transition-colors shadow-sm cursor-pointer min-h-[44px]"
          >
            <span>🚀 Continue</span>
          </button>
        </div>
      </div>
    </div>
  );
}
