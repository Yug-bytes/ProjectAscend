"use client";

import React, { useState } from "react";
import { X, Lock, Check } from "lucide-react";
import type { AchievementDefinition } from "@/lib/types";
import {
  ACHIEVEMENT_CATEGORIES,
  ACHIEVEMENT_DEFINITIONS,
} from "@/lib/achievement-manager";

export function AchievementCard({
  achievement,
  unlockedAt,
}: {
  achievement: AchievementDefinition;
  unlockedAt?: string;
}) {
  const isUnlocked = Boolean(unlockedAt);
  const formattedDate = unlockedAt ? unlockedAt.slice(0, 10) : "";

  return (
    <div
      className={`flex items-start gap-4 p-4 sm:p-5 rounded-[14px] border transition-all duration-150 ${
        isUnlocked
          ? "border-[var(--accent-muted)] bg-[var(--surface-elevated)]"
          : "border-[var(--border)] bg-[var(--surface-secondary)] opacity-75"
      }`}
    >
      {/* Icon */}
      <div
        className={`w-[52px] h-[52px] rounded-[14px] flex items-center justify-center text-[24px] shrink-0 border select-none ${
          isUnlocked
            ? "border-[var(--accent)] bg-[var(--accent-soft)]"
            : "border-[var(--border)] bg-[var(--surface)] grayscale opacity-50"
        }`}
      >
        {achievement.icon}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h4
            className={`text-[15px] font-bold ${
              isUnlocked
                ? "text-[var(--text-primary)]"
                : "text-[var(--text-muted)]"
            }`}
          >
            {achievement.name}
          </h4>

          <span className="text-[11px] font-bold tracking-wider px-2 py-0.5 rounded-[6px] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)]">
            {achievement.category}
          </span>
        </div>

        <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mb-2">
          {achievement.description}
        </p>

        <div>
          {isUnlocked ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--success)] px-2.5 py-0.5 rounded-[6px] bg-[var(--success-soft)]">
              <Check size={12} strokeWidth={2.5} />
              Unlocked: {formattedDate}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--text-muted)] px-2.5 py-0.5 rounded-[6px] bg-[var(--surface)] border border-[var(--border)]">
              <Lock size={12} />
              Locked
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function AchievementLibraryModal({
  isOpen,
  onClose,
  unlockedRecords,
}: {
  isOpen: boolean;
  onClose: () => void;
  unlockedRecords: Map<string, string>;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  if (!isOpen) return null;

  const allAchievements = Object.values(ACHIEVEMENT_DEFINITIONS);
  const totalCount = allAchievements.length;
  const unlockedCount = unlockedRecords.size;

  const filtered = allAchievements.filter(
    (ach) => selectedCategory === "All" || ach.category === selectedCategory
  );

  const categories = ["All", ...ACHIEVEMENT_CATEGORIES];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[880px] max-h-[90vh] flex flex-col rounded-[18px] border border-[var(--border-strong)] bg-[var(--surface)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-[18px] font-extrabold text-[var(--text-primary)]">
                Achievement Library
              </h2>
              <span className="px-2.5 py-0.5 rounded-[8px] text-[11px] font-bold text-[var(--success)] bg-[var(--success-soft)] border border-[var(--border)]">
                Unlocked: {unlockedCount} / {totalCount}
              </span>
            </div>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
              Milestones of focus, consistency, and planning mastery.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[8px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-[var(--border)] overflow-x-auto">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-[8px] text-[12px] font-bold transition-colors shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-[var(--primary)] text-white"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Achievement Cards List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filtered.map((ach) => (
            <AchievementCard
              key={ach.id}
              achievement={ach}
              unlockedAt={unlockedRecords.get(ach.id)}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-[var(--border)] bg-[var(--surface)]">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-[10px] text-[13px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
