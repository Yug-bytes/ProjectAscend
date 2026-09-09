"use client";

import React, { useState } from "react";
import type { Activity } from "@/lib/types";
import { db } from "@/lib/db";
import { CheckCircle2, Circle, MoreVertical, Edit2, Trash2, Plus, ClipboardList } from "lucide-react";

interface ActivitySectionProps {
  title?: string;
  subtitle?: string;
  activities: Activity[];
  onAddActivity: () => void;
  onEditActivity: (activity: Activity) => void;
}

export default function ActivitySection({
  title = "Today's Activities",
  subtitle = "Select a task to begin a focused session.",
  activities,
  onAddActivity,
  onEditActivity,
}: ActivitySectionProps) {
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  const handleToggleCompleted = async (activity: Activity) => {
    if (activity.id == null) return;
    const isNowCompleted = activity.completed !== 1;

    const updated: Activity = {
      ...activity,
      completed: isNowCompleted ? 1 : 0,
      actual_minutes: isNowCompleted && (!activity.actual_minutes || activity.actual_minutes === 0)
        ? activity.estimated_minutes
        : activity.actual_minutes,
    };

    await db.updateActivity(updated);

    if (isNowCompleted) {
      await db.awardActivityCompletionXp(activity.id);
    } else {
      await db.voidActivityCompletionXp(activity.id);
    }
  };

  const handleDelete = async (activityId: number) => {
    if (confirm("Are you sure you want to delete this activity?")) {
      await db.deleteActivity(activityId);
      setMenuOpenId(null);
    }
  };

  return (
    <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-5 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-bold text-[var(--text-primary)]">
            {title}
          </h3>
          <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
            {subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={onAddActivity}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] border border-[var(--border-strong)] text-[12px] font-semibold text-[var(--text-primary)] transition-colors cursor-pointer"
        >
          <Plus size={14} className="text-[var(--primary)]" />
          Add Activity
        </button>
      </div>

      {/* Activity List or Empty State */}
      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-[12px] border border-dashed border-[var(--border-strong)] bg-[var(--surface-secondary)]/40">
          <div className="w-12 h-12 rounded-full bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)] mb-3">
            <ClipboardList size={22} />
          </div>
          <p className="text-[14px] font-semibold text-[var(--text-primary)]">
            No activities planned
          </p>
          <p className="text-[12px] text-[var(--text-muted)] mt-1 max-w-[320px]">
            Use Add Activity to start building your schedule and tracking progress.
          </p>
          <button
            type="button"
            onClick={onAddActivity}
            className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-[12px] font-bold transition-colors cursor-pointer"
          >
            <Plus size={14} />
            Add Activity
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {activities.map((act) => {
            const isCompleted = act.completed === 1;
            const isMenuOpen = menuOpenId === act.id;

            return (
              <div
                key={act.id}
                className={`relative flex items-center justify-between gap-3.5 p-3.5 rounded-[12px] border transition-all ${
                  isCompleted
                    ? "bg-[var(--surface-secondary)]/50 border-[var(--border)] opacity-75"
                    : "bg-[var(--surface-elevated)] border-[var(--border)] hover:border-[var(--border-strong)]"
                }`}
              >
                {/* Left: Completion Checkmark + Name & Category */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => handleToggleCompleted(act)}
                    className="text-[var(--text-muted)] hover:text-[var(--success)] transition-colors shrink-0 cursor-pointer"
                    title={isCompleted ? "Mark incomplete" : "Mark complete"}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={22} className="text-[var(--success)]" />
                    ) : (
                      <Circle size={22} />
                    )}
                  </button>

                  <div className="min-w-0 flex-1 space-y-1">
                    <p
                      className={`text-[14px] font-semibold text-[var(--text-primary)] truncate ${
                        isCompleted ? "line-through text-[var(--text-muted)]" : ""
                      }`}
                    >
                      {act.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-semibold tracking-wider bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)]">
                        {act.activity_type}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Estimated / Actual times + Status Badge + Menu */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right text-[11px] hidden sm:block">
                    <span className="text-[var(--text-muted)]">Est: </span>
                    <span className="font-bold text-[var(--text-primary)]">{act.estimated_minutes}m</span>
                    {isCompleted && (
                      <span className="ml-2 text-[var(--text-muted)]">
                        Act: <span className="font-bold text-[var(--text-primary)]">{act.actual_minutes}m</span>
                      </span>
                    )}
                  </div>

                  <span
                    className={`px-2 py-1 rounded-[6px] text-[10px] font-bold uppercase tracking-wider ${
                      isCompleted
                        ? "bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success)]/20"
                        : "bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]"
                    }`}
                  >
                    {isCompleted ? "Completed" : "Planned"}
                  </span>

                  {/* Actions Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setMenuOpenId(isMenuOpen ? null : act.id ?? null)}
                      className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                    >
                      <MoreVertical size={15} />
                    </button>

                    {isMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setMenuOpenId(null)}
                        />
                        <div className="absolute right-0 top-8 z-50 w-32 rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface)] p-1 shadow-xl space-y-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpenId(null);
                              onEditActivity(act);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-[12px] font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                          >
                            <Edit2 size={13} />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (act.id != null) handleDelete(act.id);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-[12px] font-medium text-[var(--error)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
