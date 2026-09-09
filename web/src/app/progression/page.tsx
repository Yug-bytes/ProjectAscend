"use client";

import React, { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/layout/app-shell";
import { CharacterPortrait, StageEvolutionIndicator } from "@/components/progression/character-portrait";
import { CharacterSelectorModal } from "@/components/progression/character-selector";
import { AchievementLibraryModal } from "@/components/progression/achievement-library";
import { MilestoneGrid } from "@/components/progression/milestone-cards";
import { XpBar } from "@/components/progression/xp-bar";
import {
  checkProgressionEvents,
  getProgressionSummary,
} from "@/lib/progression-service";
import { setSelectedCharacterId } from "@/lib/character-manager";
import { db } from "@/lib/db";
import { ACHIEVEMENT_DEFINITIONS } from "@/lib/achievement-manager";
import type {
  CharacterId,
  ProgressionSummary,
  UserAchievement,
} from "@/lib/types";
import { Sparkles, Trophy } from "lucide-react";

export default function ProgressionPage() {
  const [summary, setSummary] = useState<ProgressionSummary | null>(null);
  const [unlockedRecords, setUnlockedRecords] = useState<Map<string, string>>(new Map());
  const [recentAchievements, setRecentAchievements] = useState<UserAchievement[]>([]);
  const [focusMinutes, setFocusMinutes] = useState(0);
  const [completedActivities, setCompletedActivities] = useState(0);

  const [selectorOpen, setSelectorOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [notification, setNotification] = useState<{ title: string; desc: string } | null>(null);

  const loadProgressionData = useCallback(async () => {
    try {
      // Run deterministic evaluation pipeline
      const events = await checkProgressionEvents("page_load");
      if (events.new_achievements.length > 0) {
        const ach = events.new_achievements[0];
        setNotification({
          title: "ACHIEVEMENT UNLOCKED!",
          desc: `${ach.icon} ${ach.name}: ${ach.description}`,
        });
      }

      // Fetch summary and historical records
      const sum = await getProgressionSummary();
      setSummary(sum);

      const allUnlocked = await db.userAchievements.toArray();
      const recMap = new Map<string, string>();
      for (const rec of allUnlocked) {
        recMap.set(rec.achievement_id, rec.unlocked_at);
      }
      setUnlockedRecords(recMap);
      setRecentAchievements(allUnlocked.slice(-3).reverse());

      const focusM = await db.getTotalFocusMinutes();
      const compA = await db.getTotalCompletedActivities();
      setFocusMinutes(focusM);
      setCompletedActivities(compA);
    } catch (err) {
      console.error("Failed to load progression data:", err);
    }
  }, []);

  useEffect(() => {
    loadProgressionData();
  }, [loadProgressionData]);

  const handleSelectCharacter = async (charId: CharacterId) => {
    await setSelectedCharacterId(charId);
    await loadProgressionData();
  };

  if (!summary) {
    return (
      <AppShell>
        <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6 animate-pulse">
          <div className="h-10 w-48 bg-[var(--surface-secondary)] rounded-[10px]" />
          <div className="h-64 bg-[var(--surface)] border border-[var(--border)] rounded-[14px]" />
        </div>
      </AppShell>
    );
  }

  const {
    level,
    total_xp,
    xp_into_level,
    xp_for_level,
    xp_remaining,
    evolution_stage,
    evolution_name,
    character,
    total_goal_days,
    longest_streak,
  } = summary;

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-8">
        {/* Page Header */}
        <div className="border-b border-[var(--border)] pb-4 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-[22px] font-extrabold text-[var(--text-primary)]">
              Player Progress
            </h1>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
              Your journey, milestones, and evolution.
            </p>
          </div>

          <button
            onClick={() => setLibraryOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-semibold text-[var(--text-primary)] bg-[var(--surface)] border border-[var(--border-strong)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            <Trophy size={16} className="text-[var(--accent)]" />
            <span>Achievement Library</span>
          </button>
        </div>

        {/* Level Up / Unlock Toast Notification */}
        {notification && (
          <div className="flex items-center justify-between p-4 rounded-[12px] bg-[var(--accent-soft)] border border-[var(--accent-muted)] text-[var(--text-primary)] animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <Sparkles className="text-[var(--accent)] shrink-0" size={20} />
              <div>
                <p className="text-[13px] font-extrabold">{notification.title}</p>
                <p className="text-[12px] text-[var(--text-secondary)]">{notification.desc}</p>
              </div>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-[12px] font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Hero / Identity Card */}
        <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-6 lg:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Character Portrait with idle breathing */}
            <div className="shrink-0 flex flex-col items-center">
              <CharacterPortrait character={character} stage={evolution_stage} />
            </div>

            {/* Identity & Level Progress Details */}
            <div className="flex-1 min-w-0 w-full space-y-5">
              {/* Top Row: Name, Stage badge, Switch button */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-[24px] font-extrabold text-[var(--text-primary)]">
                    {character.name}
                  </h2>
                  <span className="px-3 py-1 rounded-[8px] text-[12px] font-bold text-[var(--success)] bg-[var(--success-soft)] border border-[var(--border)]">
                    Stage {evolution_stage} — {evolution_name}
                  </span>
                </div>

                <button
                  onClick={() => setSelectorOpen(true)}
                  className="px-4 py-1.5 rounded-[10px] text-[12px] font-semibold text-[var(--text-secondary)] bg-[var(--surface-elevated)] border border-[var(--border)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  Switch Character
                </button>
              </div>

              {/* Archetype Specialization */}
              <p className="text-[13px] font-semibold text-[var(--text-muted)]">
                {character.title || character.specialization}
              </p>

              {/* 4-Stage Evolution Journey Indicator */}
              <div className="pt-1">
                <StageEvolutionIndicator currentStage={evolution_stage} />
              </div>

              {/* Level & Total XP Callout */}
              <div className="flex items-baseline justify-between pt-2">
                <span className="text-[30px] font-extrabold text-[var(--text-primary)] tracking-tight">
                  Level {level}
                </span>
                <span className="text-[13px] font-medium text-[var(--text-muted)]">
                  {total_xp.toLocaleString()} XP earned in total
                </span>
              </div>

              {/* XP Progress Bar */}
              <XpBar
                currentXp={xp_into_level}
                xpForLevel={xp_for_level}
                xpRemaining={xp_remaining}
                nextLevel={level + 1}
                height="lg"
                showText={true}
              />
            </div>
          </div>
        </div>

        {/* Macro Milestones Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-[var(--text-primary)]">
              Macro Milestones
            </h2>
          </div>

          <MilestoneGrid
            focusMinutes={focusMinutes}
            completedActivities={completedActivities}
            goalDays={total_goal_days}
            longestStreak={longest_streak}
          />
        </div>

        {/* Recent Achievements Section */}
        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-[var(--text-primary)]">
              Recent Achievements
            </h2>
            <button
              onClick={() => setLibraryOpen(true)}
              className="text-[12px] font-semibold text-[var(--primary)] hover:underline cursor-pointer"
            >
              View All Achievements ({unlockedRecords.size} / {Object.keys(ACHIEVEMENT_DEFINITIONS).length}) →
            </button>
          </div>

          {recentAchievements.length === 0 ? (
            <div className="p-6 rounded-[10px] bg-[var(--surface-secondary)] border border-[var(--border)] text-center">
              <p className="text-[13px] text-[var(--text-muted)]">
                No achievements unlocked yet. Complete daily goals, focus sessions, and tasks to earn badges.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAchievements.map((rec) => {
                const def = ACHIEVEMENT_DEFINITIONS[rec.achievement_id];
                if (!def) return null;
                const formattedDate = rec.unlocked_at ? rec.unlocked_at.slice(0, 10) : "";

                return (
                  <div
                    key={rec.id ?? rec.achievement_id}
                    className="flex items-center justify-between p-4 rounded-[10px] bg-[var(--surface-secondary)] border border-[var(--border)]"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-[44px] h-[44px] rounded-[10px] bg-[var(--accent-soft)] border border-[var(--accent-muted)] flex items-center justify-center text-[20px] shrink-0">
                        {def.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-[14px] font-bold text-[var(--text-primary)]">
                            {def.name}
                          </h4>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-[4px] bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]">
                            {def.category}
                          </span>
                        </div>
                        <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
                          {def.description}
                        </p>
                      </div>
                    </div>

                    <span className="text-[11px] font-bold text-[var(--success)] px-2.5 py-1 rounded-[6px] bg-[var(--success-soft)] shrink-0">
                      Unlocked: {formattedDate}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Character Selector Modal */}
      <CharacterSelectorModal
        isOpen={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        selectedCharacterId={character.id}
        currentStage={evolution_stage}
        onSelectCharacter={handleSelectCharacter}
      />

      {/* Full Achievement Library Modal */}
      <AchievementLibraryModal
        isOpen={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        unlockedRecords={unlockedRecords}
      />
    </AppShell>
  );
}
