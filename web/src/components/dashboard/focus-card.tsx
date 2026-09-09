"use client";

import React, { useState, useEffect } from "react";
import { sessionEngine, type SessionState } from "@/lib/session-engine";
import { formatTime } from "@/lib/format";
import type { Activity } from "@/lib/types";
import { Play, Pause, Check, Maximize2 } from "lucide-react";
import FocusMode from "@/components/focus/focus-mode";
import CompletionScreen from "@/components/focus/completion-screen";
import { db } from "@/lib/db";
import { todayISO } from "@/lib/date-utils";

interface FocusCardProps {
  activities?: Activity[];
  onSessionComplete?: () => void;
}

export default function FocusCard({
  activities = [],
  onSessionComplete,
}: FocusCardProps) {
  const [sessionState, setSessionState] = useState<SessionState>(sessionEngine.getState());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [completionStats, setCompletionStats] = useState<{
    studyMinutes: number;
    completedTasks: number;
    totalTasks: number;
    dailyGoal: number;
    totalXp: number;
    level: number;
  }>({
    studyMinutes: 0,
    completedTasks: 0,
    totalTasks: 0,
    dailyGoal: 360,
    totalXp: 0,
    level: 1,
  });

  // Subscribe to SessionEngine updates
  useEffect(() => {
    const unsubscribe = sessionEngine.subscribe((state) => {
      setSessionState(state);
    });
    return unsubscribe;
  }, []);

  // Set default selected activity if none selected and not running
  useEffect(() => {
    if (!sessionState.currentActivity && activities.length > 0) {
      const firstIncomplete = activities.find((a) => !a.completed);
      if (firstIncomplete && firstIncomplete.id != null) {
        setSelectedActivityId(firstIncomplete.id);
      }
    }
  }, [activities, sessionState.currentActivity]);

  const activeActivity = sessionState.currentActivity;
  const currentActivityName = activeActivity
    ? activeActivity.name
    : selectedActivityId != null
    ? activities.find((a) => a.id === selectedActivityId)?.name ?? "Select Activity"
    : "Ready";

  const handleStart = () => {
    if (selectedActivityId == null) return;
    const activityToStart = activities.find((a) => a.id === selectedActivityId);
    if (activityToStart) {
      sessionEngine.start(activityToStart);
    }
  };

  const handlePause = () => {
    sessionEngine.pause();
  };

  const handleResume = () => {
    sessionEngine.resume();
  };

  const handleComplete = async () => {
    const result = await sessionEngine.complete();
    if (result) {
      if (onSessionComplete) {
        onSessionComplete();
      }

      // Check if all today's activities are completed
      const today = todayISO();
      const todayActivities = await db.getActivitiesForDate(today);
      const allCompleted =
        todayActivities.length > 0 && todayActivities.every((a) => a.completed === 1);

      if (allCompleted) {
        const dailyGoal = await db.getDailyGoal();
        const totalXp = await db.getTotalXp();
        const { getLevelForXp } = await import("@/lib/xp-manager");
        const level = getLevelForXp(totalXp);
        const studyMins = todayActivities.reduce(
          (sum, a) => sum + (a.actual_minutes || 0),
          0
        );

        setCompletionStats({
          studyMinutes: studyMins,
          completedTasks: todayActivities.length,
          totalTasks: todayActivities.length,
          dailyGoal,
          totalXp,
          level,
        });
        setShowCompletionModal(true);
      }
    }
  };

  // Keyboard shortcut listeners (Space for Pause/Resume, Ctrl+Enter for Complete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      ) {
        return;
      }

      if (e.code === "Space") {
        if (sessionState.currentActivity) {
          e.preventDefault();
          if (sessionState.isRunning) {
            handlePause();
          } else {
            handleResume();
          }
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (sessionState.currentActivity) {
          e.preventDefault();
          handleComplete();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sessionState]);

  return (
    <>
      <div className="focus-card-gradient border border-[var(--primary-muted)] rounded-[14px] p-5 md:p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left Section: Context & Activity Selector */}
        <div className="flex flex-col space-y-2 w-full md:w-1/3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase">
              Focus Session
            </span>
            {sessionState.isRunning && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--primary)]"></span>
              </span>
            )}
          </div>

          {sessionState.currentActivity ? (
            <div className="space-y-0.5">
              <h3 className="text-[17px] font-bold text-[var(--text-primary)] truncate">
                {sessionState.currentActivity.name}
              </h3>
              <p className="text-[12px] text-[var(--text-muted)]">
                {sessionState.currentActivity.activity_type} • Planned:{" "}
                {sessionState.currentActivity.estimated_minutes} min
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label
                htmlFor="activity-select"
                className="text-[13px] font-medium text-[var(--text-secondary)]"
              >
                Current Activity:
              </label>
              {activities.length > 0 ? (
                <select
                  id="activity-select"
                  value={selectedActivityId ?? ""}
                  onChange={(e) => setSelectedActivityId(Number(e.target.value))}
                  className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[8px] px-3 py-1.5 text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] cursor-pointer"
                >
                  {activities.map((act) => (
                    <option key={act.id} value={act.id} disabled={act.completed === 1}>
                      {act.name} ({act.estimated_minutes}m)
                      {act.completed === 1 ? " ✓" : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-[13px] text-[var(--text-muted)]">
                  Ready — No planned activities today
                </p>
              )}
            </div>
          )}
        </div>

        {/* Center Section: Primary 52px Timer Display */}
        <div className="flex flex-col items-center justify-center">
          <span className="text-[44px] sm:text-[52px] font-extrabold text-[var(--primary)] font-mono tabular-nums leading-none tracking-tight">
            {formatTime(sessionState.elapsedSeconds)}
          </span>
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mt-1.5">
            {sessionState.currentActivity
              ? sessionState.isRunning
                ? "Active Focus"
                : "Paused"
              : "Elapsed Time"}
          </span>
        </div>

        {/* Right Section: Action Controls */}
        <div className="flex items-center gap-2.5 justify-end w-full md:w-1/3">
          {!sessionState.currentActivity ? (
            <button
              onClick={handleStart}
              disabled={selectedActivityId == null || activities.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-50 text-white font-semibold text-[13px] transition-colors shadow-sm cursor-pointer disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Focus</span>
            </button>
          ) : (
            <>
              {sessionState.isRunning ? (
                <button
                  onClick={handlePause}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)] font-semibold text-[13px] transition-colors cursor-pointer"
                >
                  <Pause className="w-4 h-4 text-[var(--primary)]" />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  onClick={handleResume}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)] font-semibold text-[13px] transition-colors cursor-pointer"
                >
                  <Play className="w-4 h-4 text-[var(--primary)] fill-current" />
                  <span>Resume</span>
                </button>
              )}

              <button
                onClick={handleComplete}
                className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold text-[13px] transition-colors shadow-sm cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Complete</span>
              </button>

              <button
                onClick={() => setIsFullscreen(true)}
                className="p-2.5 rounded-[10px] bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] transition-colors cursor-pointer"
                title="Fullscreen Focus Mode"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Distraction-Free Fullscreen Focus Mode Overlay */}
      {isFullscreen && sessionState.currentActivity && (
        <FocusMode
          activity={sessionState.currentActivity}
          elapsedSeconds={sessionState.elapsedSeconds}
          isRunning={sessionState.isRunning}
          onPause={handlePause}
          onResume={handleResume}
          onComplete={async () => {
            await handleComplete();
            setIsFullscreen(false);
          }}
          onExit={() => setIsFullscreen(false)}
        />
      )}

      {/* Completion Modal */}
      <CompletionScreen
        studyMinutes={completionStats.studyMinutes}
        completedTasks={completionStats.completedTasks}
        totalTasks={completionStats.totalTasks}
        dailyGoal={completionStats.dailyGoal}
        totalXp={completionStats.totalXp}
        level={completionStats.level}
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
      />
    </>
  );
}
