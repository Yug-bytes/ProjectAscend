"use client";

import React, { useState, useMemo } from "react";
import AppShell from "@/components/layout/app-shell";
import CapacityCard from "@/components/planner/capacity-card";
import WhatIfPanel from "@/components/planner/what-if-panel";
import AddActivityDialog from "@/components/planner/add-activity-dialog";
import ActivitySection from "@/components/dashboard/activity-section";
import { dateOffsetISO, formatDisplayDate } from "@/lib/date-utils";
import { formatMinutes } from "@/lib/format";
import { capacityService, buildCapacityPlan } from "@/lib/capacity-service";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import type { Activity } from "@/lib/types";
import { Plus } from "lucide-react";

export default function PlannerPage() {
  const tomorrowDate = useMemo(() => dateOffsetISO(1), []);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  // Live query for tomorrow's activities
  const activities = useLiveQuery(
    () => db.getActivitiesForDate(tomorrowDate),
    [tomorrowDate],
    []
  );

  // Live query for calibration records
  const calibrationRecords = useLiveQuery(
    () => db.getCalibrationRecords(),
    [],
    []
  );

  // Live query for stored available time
  const availableMinutes = useLiveQuery(
    () => capacityService.getAvailableMinutes(tomorrowDate),
    [tomorrowDate],
    null
  );

  // Derive the capacity plan from the live inputs
  const capacityPlan = useMemo(() => {
    return buildCapacityPlan(
      activities,
      availableMinutes,
      calibrationRecords,
      tomorrowDate
    );
  }, [activities, availableMinutes, calibrationRecords, tomorrowDate]);

  const plannedMinutes = activities.reduce(
    (sum, a) => sum + Math.max(0, a.estimated_minutes || 0),
    0
  );

  const handleSetAvailableTime = async (minutes: number) => {
    await capacityService.setAvailableMinutes(tomorrowDate, minutes);
  };

  const handleClearAvailableTime = async () => {
    await capacityService.clearAvailableMinutes(tomorrowDate);
  };

  const handleApplyWhatIfAllocations = async (allocations: Record<number, number>) => {
    for (const [idStr, minutes] of Object.entries(allocations)) {
      const id = Number(idStr);
      const activity = activities.find((a) => a.id === id);
      if (activity && !activity.completed && activity.estimated_minutes !== minutes) {
        await db.updateActivity({
          ...activity,
          estimated_minutes: minutes,
        });
      }
    }
  };

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
      <div className="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6">
        {/* Page Header / Date Card */}
        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-5 lg:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-[22px] font-extrabold text-[var(--text-primary)] tracking-tight">
              Plan Tomorrow
            </h1>
            <p className="text-[12px] text-[var(--text-muted)] font-medium">
              {formatDisplayDate(tomorrowDate, true)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[13px] font-bold text-[var(--text-primary)]">
                {activities.length > 0
                  ? `${formatMinutes(plannedMinutes)} planned`
                  : "Nothing planned"}
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">
                {activities.length} {activities.length === 1 ? "activity" : "activities"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-[13px] font-bold shadow-sm transition-colors cursor-pointer"
            >
              <Plus size={16} />
              Add Activity
            </button>
          </div>
        </div>

        {/* Capacity Intelligence Card */}
        <CapacityCard
          plan={capacityPlan}
          onSetAvailableTime={handleSetAvailableTime}
          onClearAvailableTime={handleClearAvailableTime}
        />

        {/* What-If Simulation Panel */}
        <WhatIfPanel
          basePlan={capacityPlan}
          onApplyAllocations={handleApplyWhatIfAllocations}
        />

        {/* Planned Activities Section */}
        <ActivitySection
          title="Tomorrow's Activities"
          subtitle="Review and organize the tasks you intend to tackle tomorrow."
          activities={activities}
          onAddActivity={handleOpenAdd}
          onEditActivity={handleOpenEdit}
        />

        {/* Add/Edit Activity Modal Dialog */}
        <AddActivityDialog
          isOpen={dialogOpen}
          onClose={() => setDialogOpen(false)}
          selectedDate={tomorrowDate}
          activity={editingActivity}
        />
      </div>
    </AppShell>
  );
}
