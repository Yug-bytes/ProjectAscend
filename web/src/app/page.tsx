"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/app-shell";
import HeroCard from "@/components/dashboard/hero-card";
import ProgressCard from "@/components/dashboard/progress-card";
import ActivitySection from "@/components/dashboard/activity-section";
import AddActivityDialog from "@/components/planner/add-activity-dialog";
import { PlayerCard } from "@/components/dashboard/player-card";
import FocusCard from "@/components/dashboard/focus-card";
import { todayISO } from "@/lib/date-utils";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import type { Activity } from "@/lib/types";

export default function DashboardPage() {
  const todayDate = useMemo(() => todayISO(), []);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  // Live query for today's activities
  const activities = useLiveQuery(
    () => db.getActivitiesForDate(todayDate),
    [todayDate],
    []
  );

  // Live query for daily goal
  const dailyGoal = useLiveQuery(
    () => db.getDailyGoal(),
    [],
    360
  );

  // Live query for total XP
  const totalXp = useLiveQuery(
    () => db.getTotalXp(),
    [],
    0
  );

  const completedActivities = activities.filter((a) => a.completed === 1);
  const studyMinutes = completedActivities.reduce(
    (sum, a) => sum + Math.max(0, a.actual_minutes || 0),
    0
  );

  const handleOpenAdd = () => {
    setEditingActivity(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setDialogOpen(true);
  };

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
        {/* Hero context bar */}
        <HeroCard onAddActivity={handleOpenAdd} />

        {/* Dashboard Grid: Progress Card + Player Card Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <ProgressCard
              dailyGoal={dailyGoal}
              studyMinutes={studyMinutes}
              completedCount={completedActivities.length}
              totalCount={activities.length}
            />
          </div>

          {/* Player Card */}
          <PlayerCard className="lg:col-span-2" />
        </div>

        {/* Focus Timer Card */}
        <FocusCard activities={activities} />

        {/* Today's Activities Section */}
        <ActivitySection
          activities={activities}
          onAddActivity={handleOpenAdd}
          onEditActivity={handleOpenEdit}
        />

        {/* Add/Edit Activity Modal */}
        <AddActivityDialog
          isOpen={dialogOpen}
          onClose={() => setDialogOpen(false)}
          selectedDate={todayDate}
          activity={editingActivity}
        />
      </div>
    </AppShell>
  );
}
