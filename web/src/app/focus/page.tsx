"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/app-shell";
import FocusCard from "@/components/dashboard/focus-card";
import { db } from "@/lib/db";
import { todayISO, formatDisplayDate } from "@/lib/date-utils";
import { sessionEngine } from "@/lib/session-engine";
import type { Activity } from "@/lib/types";
import { Play, CheckCircle2, Clock, Calendar } from "lucide-react";
import Link from "next/link";

export default function FocusPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const today = todayISO();

  const loadActivities = async () => {
    try {
      const data = await db.getActivitiesForDate(today);
      setActivities(data);
    } catch (err) {
      console.error("Failed to load today activities:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [today]);

  const handleStartActivity = (activity: Activity) => {
    sessionEngine.start(activity);
  };

  const completedActivities = activities.filter((a) => a.completed === 1);
  const plannedActivities = activities.filter((a) => a.completed !== 1);

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6 animate-in fade-in duration-200">
        {/* Page Header */}
        <div className="border-b border-[var(--border)] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-[22px] font-extrabold text-[var(--text-primary)]">
              Focus Session
            </h1>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
              Deep focus mode and live session timer
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)] font-medium">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDisplayDate(today, true)}</span>
          </div>
        </div>

        {/* Primary Focus Card surface */}
        <FocusCard
          activities={activities}
          onSessionComplete={() => {
            loadActivities();
          }}
        />

        {/* Planned Activities Section */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)]/50 pb-3">
            <div>
              <h2 className="text-[15px] font-bold text-[var(--text-primary)]">
                Today's Planned Activities
              </h2>
              <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                {completedActivities.length} of {activities.length} completed
              </p>
            </div>

            <Link
              href="/planner"
              className="px-3 py-1.5 rounded-[8px] bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)] text-[12px] font-semibold transition-colors"
            >
              Open Planner
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-[13px] text-[var(--text-muted)]">
              Loading activities...
            </div>
          ) : activities.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <p className="text-[14px] font-medium text-[var(--text-primary)]">
                No activities planned for today.
              </p>
              <p className="text-[12px] text-[var(--text-muted)]">
                Add activities in the Planner to launch focus sessions.
              </p>
              <div className="pt-2">
                <Link
                  href="/planner"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-[12px] font-semibold transition-colors"
                >
                  Plan Today's Activities
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Incomplete / Planned activities first */}
              {plannedActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="bg-[var(--surface-elevated)] border border-[var(--border)] hover:border-[var(--primary-muted)] rounded-[10px] p-3.5 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-[14px] font-bold text-[var(--text-primary)] truncate">
                        {activity.name}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] mt-0.5">
                        <span>{activity.activity_type || "Uncategorised"}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Est: {activity.estimated_minutes} min
                        </span>
                        {activity.actual_minutes > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-[var(--text-secondary)]">
                              Actual: {activity.actual_minutes} min
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartActivity(activity)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-[12px] font-semibold transition-colors shrink-0 shadow-sm cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Focus</span>
                  </button>
                </div>
              ))}

              {/* Completed activities */}
              {completedActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="bg-[var(--surface-secondary)]/60 border border-[var(--border)] rounded-[10px] p-3.5 flex items-center justify-between gap-3 opacity-80"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-[var(--success)] shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-[14px] font-semibold text-[var(--text-muted)] line-through truncate">
                        {activity.name}
                      </h4>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        {activity.activity_type} • Actual: {activity.actual_minutes} min
                        (Est: {activity.estimated_minutes} min)
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success)]/20 shrink-0">
                    Completed
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
