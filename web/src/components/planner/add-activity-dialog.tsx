"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { X, Check, Undo, Sparkles } from "lucide-react";
import type { Activity, ActivityType, EstimateSuggestion } from "@/lib/types";
import { ACTIVITY_TYPES } from "@/lib/types";
import { suggestEstimate } from "@/lib/estimate-suggestion";
import { formatDisplayDate } from "@/lib/date-utils";
import { db } from "@/lib/db";

interface AddActivityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  activity?: Activity | null;
  onSaved?: (activityId: number) => void;
}

export default function AddActivityDialog({
  isOpen,
  onClose,
  selectedDate,
  activity,
  onSaved,
}: AddActivityDialogProps) {
  const isEditing = Boolean(activity && activity.id != null);

  const [activityType, setActivityType] = useState<string>("Coding");
  const [name, setName] = useState<string>("");
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(30);

  const [suggestion, setSuggestion] = useState<EstimateSuggestion | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [calibrationRecords, setCalibrationRecords] = useState<Activity[]>([]);

  const applyingSuggestionRef = useRef(false);
  const [, startTransition] = useTransition();

  // Load calibration records once when modal opens
  useEffect(() => {
    if (!isOpen) return;

    db.getCalibrationRecords()
      .then((records) => setCalibrationRecords(records))
      .catch(() => setCalibrationRecords([]));

    if (activity) {
      setActivityType(activity.activity_type || "Coding");
      setName(activity.name || "");
      setEstimatedMinutes(activity.estimated_minutes || 30);
    } else {
      setActivityType("Coding");
      setName("");
      setEstimatedMinutes(30);
    }
    setIsDismissed(false);
  }, [isOpen, activity]);

  // Recalculate smart estimate whenever inputs change
  useEffect(() => {
    if (!isOpen || isDismissed) {
      setSuggestion(null);
      return;
    }

    if (applyingSuggestionRef.current) {
      applyingSuggestionRef.current = false;
      return;
    }

    const nextSuggestion = suggestEstimate(
      calibrationRecords,
      activityType,
      name,
      estimatedMinutes,
      5,
      600
    );

    startTransition(() => {
      setSuggestion(nextSuggestion);
    });
  }, [isOpen, activityType, name, estimatedMinutes, calibrationRecords, isDismissed]);

  if (!isOpen) return null;

  const handleKeep = () => {
    setIsDismissed(true);
    setSuggestion(null);
  };

  const handleUse = () => {
    if (!suggestion) return;
    applyingSuggestionRef.current = true;
    setEstimatedMinutes(suggestion.suggested_minutes);
    setIsDismissed(true);
    setSuggestion(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim();
    if (!finalName) return;

    if (isEditing && activity?.id != null) {
      const updatedActivity: Activity = {
        ...activity,
        activity_type: activityType,
        name: finalName,
        estimated_minutes: estimatedMinutes,
      };
      await db.updateActivity(updatedActivity);
      onSaved?.(activity.id);
    } else {
      const newId = await db.addActivity({
        date: selectedDate,
        activity_type: activityType,
        name: finalName,
        estimated_minutes: estimatedMinutes,
        original_estimate_minutes: estimatedMinutes,
        completed: 0,
        actual_minutes: 0,
        xp_awarded: 0,
      });
      onSaved?.(newId);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div
        className="w-full max-w-[440px] rounded-[18px] border border-[var(--border-strong)] bg-[var(--surface)] p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[18px] font-extrabold text-[var(--text-primary)]">
              {isEditing ? "Edit Activity" : "New Activity"}
            </h2>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
              {formatDisplayDate(selectedDate, true)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category */}
          <div className="space-y-1.5">
            <label
              htmlFor="activity-category"
              className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]"
            >
              Activity Type
            </label>
            <select
              id="activity-category"
              value={activityType}
              onChange={(e) => {
                setActivityType(e.target.value as ActivityType);
                setIsDismissed(false);
              }}
              className="w-full px-3 py-2 rounded-[10px] border border-[var(--border)] bg-[var(--surface-elevated)] text-[13px] text-[var(--text-primary)] font-medium focus:outline-none focus:border-[var(--primary)] transition-colors cursor-pointer"
            >
              {ACTIVITY_TYPES.map((type) => (
                <option key={type} value={type} className="bg-[var(--surface)] text-[var(--text-primary)]">
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="activity-name"
              className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]"
            >
              Activity Name
            </label>
            <input
              id="activity-name"
              type="text"
              required
              placeholder="What will you work on?"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setIsDismissed(false);
              }}
              className="w-full px-3 py-2 rounded-[10px] border border-[var(--border)] bg-[var(--surface-elevated)] text-[13px] text-[var(--text-primary)] font-medium placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
            />
          </div>

          {/* Estimated Time */}
          <div className="space-y-1.5">
            <label
              htmlFor="estimated-time"
              className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]"
            >
              Estimated Time
            </label>
            <div className="relative flex items-center">
              <input
                id="estimated-time"
                type="number"
                min={5}
                max={600}
                step={5}
                value={estimatedMinutes}
                onChange={(e) => {
                  setEstimatedMinutes(Math.max(5, Math.min(600, Number(e.target.value) || 5)));
                  setIsDismissed(false);
                }}
                className="w-full px-3 py-2 rounded-[10px] border border-[var(--border)] bg-[var(--surface-elevated)] text-[13px] text-[var(--text-primary)] font-bold focus:outline-none focus:border-[var(--primary)] transition-colors pr-12"
              />
              <span className="absolute right-3 text-[12px] font-medium text-[var(--text-muted)] pointer-events-none">
                min
              </span>
            </div>
          </div>

          {/* Smart Activity Estimate Suggestion Card */}
          {suggestion && (
            <div className="rounded-[12px] border border-[var(--accent-muted)] bg-[var(--accent-soft)]/40 p-3.5 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <span className="text-[var(--accent)] font-extrabold text-[15px] select-none">
                  ✦
                </span>
                <p className="text-[13px] font-bold text-[var(--text-primary)]">
                  {suggestion.headline}
                </p>
              </div>

              <p className="text-[12px] text-[var(--text-secondary)]">
                {suggestion.difference_text}
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">
                {suggestion.evidence_text}
              </p>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleKeep}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] text-[11px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                >
                  <Undo size={12} />
                  {suggestion.keep_label}
                </button>

                <button
                  type="button"
                  onClick={handleUse}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[8px] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[11px] font-bold text-white transition-colors cursor-pointer shadow-xs"
                >
                  <Sparkles size={12} />
                  {suggestion.use_label}
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[10px] border border-[var(--border)] bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] text-[13px] font-semibold text-[var(--text-secondary)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[13px] font-bold text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Check size={15} />
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
