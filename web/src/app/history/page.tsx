"use client";

import React, { useState, useEffect, useMemo } from "react";
import AppShell from "@/components/layout/app-shell";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { formatMinutes } from "@/lib/format";
import { parseIsoDate, formatDisplayDate, formatDuration } from "@/lib/date-utils";
import type { DailyHistory, Activity, FocusSession, XpEvent } from "@/lib/types";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Trophy,
  Moon,
  AlertCircle,
  Star,
  Timer,
  ArrowLeft,
} from "lucide-react";

interface DayDetails {
  history: DailyHistory | null;
  activities: Activity[];
  sessions: FocusSession[];
  xpEvents: XpEvent[];
  dailyGoal: number;
  totalXp: number;
}

export default function HistoryPage() {
  const allHistory = useLiveQuery(() => db.getAllDailyHistory(), [], []);
  const dailyGoal = useLiveQuery(() => db.getDailyGoal(), [], 360);

  // Sort history descending by date
  const sortedHistory = useMemo(() => {
    return [...allHistory].sort((a, b) => b.date.localeCompare(a.date));
  }, [allHistory]);

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [dayDetails, setDayDetails] = useState<DayDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [showMobileInspector, setShowMobileInspector] = useState<boolean>(false);

  // Set initial selected date to most recent history date or today
  useEffect(() => {
    if (!selectedDate) {
      if (sortedHistory.length > 0) {
        setSelectedDate(sortedHistory[0].date);
      } else {
        setSelectedDate(new Date().toISOString().slice(0, 10));
      }
    }
  }, [sortedHistory, selectedDate]);

  // Load details for selected date
  useEffect(() => {
    if (!selectedDate) return;
    let mounted = true;
    setLoadingDetails(true);

    db.getDayDetails(selectedDate).then((details) => {
      if (mounted) {
        setDayDetails(details);
        setLoadingDetails(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [selectedDate]);

  // Group history items by recency
  const groupedHistory = useMemo(() => {
    const groups: { label: string; items: DailyHistory[] }[] = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayOfWeek = (today.getDay() + 6) % 7; // Mon=0
    const thisMonday = new Date(today);
    thisMonday.setDate(today.getDate() - dayOfWeek);
    const lastMonday = new Date(thisMonday);
    lastMonday.setDate(thisMonday.getDate() - 7);

    const thisWeek: DailyHistory[] = [];
    const lastWeek: DailyHistory[] = [];
    const earlierMonth: DailyHistory[] = [];
    const older: Record<string, DailyHistory[]> = {};

    sortedHistory.forEach((h) => {
      const d = parseIsoDate(h.date);
      if (!d) return;

      if (d >= thisMonday) {
        thisWeek.push(h);
      } else if (d >= lastMonday) {
        lastWeek.push(h);
      } else if (d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()) {
        earlierMonth.push(h);
      } else {
        const monthKey = d.toLocaleDateString("en-GB", { month: "long", year: "numeric" }).toUpperCase();
        if (!older[monthKey]) older[monthKey] = [];
        older[monthKey].push(h);
      }
    });

    if (thisWeek.length > 0) groups.push({ label: "THIS WEEK", items: thisWeek });
    if (lastWeek.length > 0) groups.push({ label: "LAST WEEK", items: lastWeek });
    if (earlierMonth.length > 0) groups.push({ label: "EARLIER THIS MONTH", items: earlierMonth });
    Object.keys(older).forEach((key) => {
      groups.push({ label: key, items: older[key] });
    });

    return groups;
  }, [sortedHistory]);

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setShowMobileInspector(true);
  };

  const handlePrevDay = () => {
    const d = parseIsoDate(selectedDate);
    if (!d) return;
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleNextDay = () => {
    const d = parseIsoDate(selectedDate);
    if (!d) return;
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  // Generate reflection text
  const reflectionText = useMemo(() => {
    if (!dayDetails) return "";
    const { history, activities, sessions } = dayDetails;
    const studyMins = history?.study_minutes || 0;
    const completedTasks = activities.filter((a) => a.completed === 1).length;
    const totalTasks = activities.length;

    if (studyMins === 0 && totalTasks === 0) {
      return "Rest day with no recorded focus sessions or tasks planned.";
    }

    const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    if (pct === 100 && totalTasks > 0) {
      return `Completed 100% of planned activities (${completedTasks}/${totalTasks}) with ${formatMinutes(studyMins)} focus across ${sessions.length} sessions. Excellent execution!`;
    }

    if (studyMins >= dayDetails.dailyGoal) {
      return `Hit your daily focus goal with ${formatMinutes(studyMins)} of deep work. Completed ${completedTasks} of ${totalTasks} planned tasks.`;
    }

    return `Logged ${formatMinutes(studyMins)} of focus and completed ${completedTasks} of ${totalTasks} tasks (${pct}%). Keep building your baseline.`;
  }, [dayDetails]);

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
        {/* Page header */}
        <div className="border-b border-[var(--border)] pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-extrabold text-[var(--text-primary)]">
              Activity History
            </h1>
            <p className="text-[12px] text-[var(--text-muted)] mt-1">
              Review your past days, daily snapshots, and recorded focus sessions
            </p>
          </div>
          <span className="text-[11px] font-bold px-3 py-1.5 rounded-[8px] bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-secondary)]">
            {sortedHistory.length} Days Recorded
          </span>
        </div>

        {/* Dual-pane layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Rail: Chronological Stream (5 cols) */}
          <div
            className={`
              lg:col-span-5 space-y-5
              ${showMobileInspector ? "hidden lg:block" : "block"}
            `}
          >
            {sortedHistory.length === 0 ? (
              <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
                <Calendar size={32} className="mx-auto text-[var(--text-muted)] mb-2" />
                <p className="text-[13px] font-bold text-[var(--text-secondary)]">
                  No history recorded yet
                </p>
                <p className="text-[12px] text-[var(--text-muted)] mt-1">
                  Complete focus sessions or activities to start your history journal.
                </p>
              </div>
            ) : (
              groupedHistory.map((group) => (
                <div key={group.label} className="space-y-2">
                  <h3 className="text-[11px] font-bold tracking-[1px] text-[var(--text-muted)] uppercase px-1">
                    {group.label}
                  </h3>
                  <div className="space-y-1.5">
                    {group.items.map((item) => {
                      const isSelected = item.date === selectedDate;
                      const dateObj = parseIsoDate(item.date);
                      const weekday = dateObj
                        ? dateObj.toLocaleDateString("en-GB", { weekday: "short" })
                        : "";
                      const formattedDate = dateObj
                        ? `${dateObj.getDate()} ${dateObj.toLocaleDateString("en-GB", { month: "short" })}`
                        : item.date;

                      let statusBadge = (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-[6px] bg-[var(--surface-elevated)] text-[var(--text-muted)] border border-[var(--border)]">
                          Rest
                        </span>
                      );
                      if (item.goal_completed === 1) {
                        statusBadge = (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-[6px] bg-[var(--success-soft)] text-[var(--success)] border border-[#B7E3CB]">
                            Goal met
                          </span>
                        );
                      } else if (item.study_minutes > 0 || item.total_activities > 0) {
                        statusBadge = (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-[6px] bg-[var(--warning-soft)] text-[var(--warning)] border border-[#EED9A8]">
                            Missed
                          </span>
                        );
                      }

                      return (
                        <div
                          key={item.date}
                          onClick={() => handleSelectDate(item.date)}
                          className={`
                            flex items-center justify-between p-3.5 rounded-[12px] cursor-pointer
                            transition-colors duration-150 border
                            ${
                              isSelected
                                ? "bg-[var(--surface-elevated)] border-[var(--primary)] shadow-sm"
                                : "bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-hover)]"
                            }
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`
                                w-2 h-9 rounded-full
                                ${isSelected ? "bg-[var(--primary)]" : "bg-transparent"}
                              `}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[14px] font-bold text-[var(--text-primary)]">
                                  {formattedDate}
                                </span>
                                <span className="text-[12px] text-[var(--text-muted)]">
                                  {weekday}
                                </span>
                              </div>
                              <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
                                {formatDuration(item.study_minutes)} focus • {item.completed_activities}/{item.total_activities} tasks
                              </p>
                            </div>
                          </div>
                          <div>{statusBadge}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right Inspector: Day Snapshot (7 cols) */}
          <div
            className={`
              lg:col-span-7
              ${showMobileInspector ? "block" : "hidden lg:block"}
            `}
          >
            {/* Mobile Back Button */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setShowMobileInspector(false)}
                className="flex items-center gap-2 text-[13px] font-bold text-[var(--primary)]"
              >
                <ArrowLeft size={16} /> Back to Day Stream
              </button>
            </div>

            <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-6 space-y-6">
              {/* Snapshot Navigation Header */}
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <button
                  onClick={handlePrevDay}
                  className="p-2 rounded-[8px] border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)]"
                  title="Previous Day"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="text-center">
                  <h2 className="text-[16px] font-extrabold text-[var(--text-primary)]">
                    {formatDisplayDate(selectedDate, true)}
                  </h2>
                  <p className="text-[11px] font-bold text-[var(--text-muted)] tracking-wider uppercase mt-0.5">
                    Day Snapshot
                  </p>
                </div>
                <button
                  onClick={handleNextDay}
                  className="p-2 rounded-[8px] border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)]"
                  title="Next Day"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {loadingDetails || !dayDetails ? (
                <div className="py-12 text-center text-[var(--text-muted)] text-[13px]">
                  Loading day details...
                </div>
              ) : (
                <>
                  {/* Status Banner */}
                  {dayDetails.history?.goal_completed === 1 ? (
                    <div className="flex items-center gap-3 p-4 rounded-[12px] bg-[var(--success-soft)] border border-[#B7E3CB]">
                      <Trophy size={22} className="text-[var(--success)] shrink-0" />
                      <div>
                        <p className="text-[13px] font-bold text-[var(--success)]">
                          Goal Achieved
                        </p>
                        <p className="text-[12px] text-[var(--text-secondary)]">
                          Completed {formatMinutes(dayDetails.history.study_minutes)} out of {formatMinutes(dayDetails.dailyGoal)} daily goal.
                        </p>
                      </div>
                    </div>
                  ) : dayDetails.history?.study_minutes ? (
                    <div className="flex items-center gap-3 p-4 rounded-[12px] bg-[var(--warning-soft)] border border-[#EED9A8]">
                      <AlertCircle size={22} className="text-[var(--warning)] shrink-0" />
                      <div>
                        <p className="text-[13px] font-bold text-[var(--warning)]">
                          Goal Missed
                        </p>
                        <p className="text-[12px] text-[var(--text-secondary)]">
                          Logged {formatMinutes(dayDetails.history.study_minutes)} out of {formatMinutes(dayDetails.dailyGoal)} daily goal.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 rounded-[12px] bg-[var(--surface-secondary)] border border-[var(--border)]">
                      <Moon size={22} className="text-[var(--text-muted)] shrink-0" />
                      <div>
                        <p className="text-[13px] font-bold text-[var(--text-primary)]">
                          Rest Day
                        </p>
                        <p className="text-[12px] text-[var(--text-muted)]">
                          No focus sessions or activities logged for this date.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 2x2 Metric Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-[12px] bg-[var(--surface-secondary)] border border-[var(--border)]">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-muted)] uppercase">
                        <Clock size={14} className="text-[var(--primary)]" />
                        <span>Focus</span>
                      </div>
                      <p className="text-[18px] font-extrabold text-[var(--text-primary)] mt-1.5 font-mono">
                        {formatMinutes(dayDetails.history?.study_minutes || 0)}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-[12px] bg-[var(--surface-secondary)] border border-[var(--border)]">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-muted)] uppercase">
                        <CheckCircle2 size={14} className="text-[var(--success)]" />
                        <span>Tasks</span>
                      </div>
                      <p className="text-[18px] font-extrabold text-[var(--text-primary)] mt-1.5">
                        {dayDetails.activities.filter((a) => a.completed === 1).length} / {dayDetails.activities.length}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-[12px] bg-[var(--surface-secondary)] border border-[var(--border)]">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-muted)] uppercase">
                        <Timer size={14} className="text-[var(--accent)]" />
                        <span>Sessions</span>
                      </div>
                      <p className="text-[18px] font-extrabold text-[var(--text-primary)] mt-1.5 font-mono">
                        {dayDetails.sessions.length}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-[12px] bg-[var(--surface-secondary)] border border-[var(--border)]">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-muted)] uppercase">
                        <Star size={14} className="text-amber-400" />
                        <span>XP Earned</span>
                      </div>
                      <p className="text-[18px] font-extrabold text-[var(--accent)] mt-1.5 font-mono">
                        +{dayDetails.xpEvents.reduce((s, e) => s + Math.max(0, e.amount), 0)}
                      </p>
                    </div>
                  </div>

                  {/* Factual Reflection Box */}
                  <div className="p-4 rounded-[12px] bg-[var(--primary-soft)] border border-[var(--primary-muted)]">
                    <p className="text-[11px] font-bold text-[var(--primary)] uppercase tracking-wider mb-1">
                      Day Reflection
                    </p>
                    <p className="text-[13px] text-[var(--text-primary)] leading-relaxed">
                      {reflectionText}
                    </p>
                  </div>

                  {/* Completed Activities List */}
                  <div className="space-y-3">
                    <h3 className="text-[13px] font-bold text-[var(--text-primary)]">
                      Activities ({dayDetails.activities.length})
                    </h3>
                    {dayDetails.activities.length === 0 ? (
                      <p className="text-[12px] text-[var(--text-muted)] italic">
                        No activities were scheduled on this date.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {dayDetails.activities.map((act) => (
                          <div
                            key={act.id}
                            className="flex items-center justify-between p-3 rounded-[10px] bg-[var(--surface-secondary)] border border-[var(--border)]"
                          >
                            <div className="flex items-center gap-2.5">
                              <CheckCircle2
                                size={16}
                                className={act.completed ? "text-[var(--success)]" : "text-[var(--text-muted)]"}
                              />
                              <div>
                                <span className="text-[13px] font-semibold text-[var(--text-primary)]">
                                  {act.name}
                                </span>
                                <span className="ml-2 text-[11px] text-[var(--text-muted)]">
                                  {act.activity_type}
                                </span>
                              </div>
                            </div>
                            <div className="text-[12px] text-[var(--text-secondary)] font-mono">
                              {act.actual_minutes ? `${act.actual_minutes}m` : `${act.estimated_minutes}m plan`}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Focus Sessions Timeline */}
                  <div className="space-y-3">
                    <h3 className="text-[13px] font-bold text-[var(--text-primary)]">
                      Focus Sessions ({dayDetails.sessions.length})
                    </h3>
                    {dayDetails.sessions.length === 0 ? (
                      <p className="text-[12px] text-[var(--text-muted)] italic">
                        No focus timer sessions recorded for this day.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {dayDetails.sessions.map((session, idx) => {
                          const startTime = session.started_at
                            ? session.started_at.slice(11, 16)
                            : `Session ${idx + 1}`;
                          return (
                            <div
                              key={session.id || idx}
                              className="flex items-center justify-between p-3 rounded-[10px] bg-[var(--surface-secondary)] border border-[var(--border)] text-[12px]"
                            >
                              <div className="flex items-center gap-2 text-[var(--text-primary)] font-medium">
                                <Clock size={14} className="text-[var(--primary)]" />
                                <span>Started at {startTime}</span>
                              </div>
                              <span className="font-mono text-[var(--primary)] font-bold">
                                {session.actual_minutes} min ({session.actual_seconds || session.actual_minutes * 60}s)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
