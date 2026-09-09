"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/app-shell";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { downloadExport, importData, clearAllData } from "@/lib/data-io";
import { formatDuration } from "@/lib/date-utils";
import {
  Settings,
  Target,
  User,
  SunMoon,
  Zap,
  Download,
  Upload,
  Trash2,
  Check,
  AlertTriangle,
  Info,
  ShieldCheck,
} from "lucide-react";

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState<string>("Ascender");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [goalInput, setGoalInput] = useState<number>(360);

  // Live query for daily goal from DB
  const dailyGoal = useLiveQuery(() => db.getDailyGoal(), [], 360);

  // Load client settings from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("ascend_display_name");
      if (storedName) setDisplayName(storedName);

      const storedTheme = (localStorage.getItem("ascend_theme") as "dark" | "light") || "dark";
      setTheme(storedTheme);
      document.documentElement.setAttribute("data-theme", storedTheme);

      const storedMotion = localStorage.getItem("ascend_reduced_motion") === "true";
      setReducedMotion(storedMotion);
    }
  }, []);

  useEffect(() => {
    if (dailyGoal) setGoalInput(dailyGoal);
  }, [dailyGoal]);

  const showToast = (msg: string) => {
    setSavedMessage(msg);
    setTimeout(() => setSavedMessage(null), 3000);
  };

  const handleSaveDisplayName = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = displayName.trim().slice(0, 32) || "Ascender";
    setDisplayName(clean);
    localStorage.setItem("ascend_display_name", clean);
    showToast("Display name updated.");
  };

  const handleGoalChange = async (newGoal: number) => {
    const clamped = Math.max(30, Math.min(1440, newGoal));
    setGoalInput(clamped);
    await db.setDailyGoal(clamped);
    showToast(`Daily goal updated to ${formatDuration(clamped)}.`);
  };

  const handleToggleTheme = (newTheme: "dark" | "light") => {
    setTheme(newTheme);
    localStorage.setItem("ascend_theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    showToast(`Theme switched to ${newTheme === "dark" ? "Deep Focus" : "Clear Thinking"}.`);
  };

  const handleToggleMotion = (enabled: boolean) => {
    setReducedMotion(enabled);
    localStorage.setItem("ascend_reduced_motion", String(enabled));
    showToast(enabled ? "Reduced motion enabled." : "Animations restored.");
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await importData(file);
    alert(res.message);
    if (res.success) window.location.reload();
  };

  const handleClearData = async () => {
    await clearAllData();
    setShowClearConfirm(false);
    alert("All local data cleared. Project Ascend has been reset.");
    window.location.reload();
  };

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-[1000px] mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-[var(--border)] pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-extrabold text-[var(--text-primary)]">
              Settings & Preferences
            </h1>
            <p className="text-[12px] text-[var(--text-muted)] mt-1">
              Configure your daily study target, visual preferences, and local data storage
            </p>
          </div>
          {savedMessage && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[var(--success-soft)] text-[var(--success)] text-[12px] font-bold border border-[#B7E3CB] animate-fade-in">
              <Check size={14} />
              <span>{savedMessage}</span>
            </div>
          )}
        </div>

        {/* 1. Daily Study Target */}
        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[10px] bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary-muted)]">
              <Target size={20} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[var(--text-primary)]">
                Daily Focus Goal
              </h2>
              <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                Target minutes of deep work to complete each day to maintain your streak
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[var(--text-secondary)]">
                Target Duration:
              </span>
              <span className="text-[18px] font-extrabold text-[var(--primary)] font-mono">
                {formatDuration(goalInput)} ({goalInput} min)
              </span>
            </div>

            <input
              type="range"
              min={30}
              max={1440}
              step={15}
              value={goalInput}
              onChange={(e) => handleGoalChange(Number(e.target.value))}
              className="w-full accent-[var(--primary)] h-2 bg-[var(--surface-elevated)] rounded-lg cursor-pointer"
            />

            <div className="flex justify-between text-[11px] text-[var(--text-muted)]">
              <span>30m</span>
              <span>2h</span>
              <span>4h</span>
              <span>6h (Default)</span>
              <span>8h</span>
              <span>12h+</span>
            </div>
          </div>
        </div>

        {/* 2. Identity & Profile */}
        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[10px] bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-muted)]">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[var(--text-primary)]">
                User Identity
              </h2>
              <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                The name displayed in your daily dashboard greeting
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveDisplayName} className="flex gap-3 pt-2">
            <input
              type="text"
              value={displayName}
              maxLength={32}
              onChange={(e) => setDisplayName(e.target.value)}
              className="flex-1 max-w-[320px] px-3.5 py-2 rounded-[10px] bg-[var(--surface-secondary)] border border-[var(--border)] text-[13px] text-[var(--text-primary)] focus:border-[var(--primary)] outline-none"
              placeholder="Ascender"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-[10px] bg-[var(--primary)] text-white text-[13px] font-bold hover:bg-[var(--primary-hover)] transition-colors"
            >
              Save Name
            </button>
          </form>
        </div>

        {/* 3. Appearance & Accessibility */}
        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[10px] bg-[var(--surface-elevated)] text-[var(--text-secondary)] border border-[var(--border)]">
              <SunMoon size={20} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[var(--text-primary)]">
                Appearance & Motion
              </h2>
              <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                Customize visual theme and motion ergonomics
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Theme Options */}
            <div
              onClick={() => handleToggleTheme("dark")}
              className={`
                p-4 rounded-[12px] border cursor-pointer transition-all
                ${
                  theme === "dark"
                    ? "bg-[var(--surface-elevated)] border-[var(--primary)] shadow-sm"
                    : "bg-[var(--surface-secondary)] border-[var(--border)] hover:bg-[var(--surface-hover)]"
                }
              `}
            >
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-bold text-[var(--text-primary)]">
                  Deep Focus (Dark)
                </span>
                {theme === "dark" && <Check size={16} className="text-[var(--primary)]" />}
              </div>
              <p className="text-[12px] text-[var(--text-muted)] mt-1">
                The established premium dark aesthetic (#05070C) designed for late-night concentration.
              </p>
            </div>

            <div
              onClick={() => handleToggleTheme("light")}
              className={`
                p-4 rounded-[12px] border cursor-pointer transition-all
                ${
                  theme === "light"
                    ? "bg-[var(--surface-elevated)] border-[var(--primary)] shadow-sm"
                    : "bg-[var(--surface-secondary)] border-[var(--border)] hover:bg-[var(--surface-hover)]"
                }
              `}
            >
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-bold text-[var(--text-primary)]">
                  Clear Thinking (Light)
                </span>
                {theme === "light" && <Check size={16} className="text-[var(--primary)]" />}
              </div>
              <p className="text-[12px] text-[var(--text-muted)] mt-1">
                An ambient cool-neutral canvas (#EDF1F8) with soft blue-grey cards for daytime focus.
              </p>
            </div>
          </div>

          {/* Reduced Motion Toggle */}
          <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap size={18} className="text-[var(--text-muted)]" />
              <div>
                <p className="text-[13px] font-bold text-[var(--text-primary)]">
                  Reduced Motion
                </p>
                <p className="text-[12px] text-[var(--text-muted)]">
                  Disables sprite breathing loops and simplifies progress animations.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => handleToggleMotion(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[var(--surface-elevated)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)] border border-[var(--border-strong)]"></div>
            </label>
          </div>
        </div>

        {/* 4. Local-First Data Management */}
        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[10px] bg-[var(--success-soft)] text-[var(--success)] border border-[#B7E3CB]">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[var(--text-primary)]">
                Local-First Data Management
              </h2>
              <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                All data is stored purely in your browser via IndexedDB. No cloud server, zero telemetry leaks.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={downloadExport}
              className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-[var(--surface-secondary)] border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] text-[13px] font-bold transition-colors"
            >
              <Download size={16} />
              <span>Export Backup (JSON)</span>
            </button>

            <label className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-[var(--surface-secondary)] border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] text-[13px] font-bold transition-colors cursor-pointer">
              <Upload size={16} />
              <span>Restore Backup (JSON)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>

            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-red-950/30 border border-red-800/40 text-red-400 hover:bg-red-950/60 text-[13px] font-bold transition-colors ml-auto"
            >
              <Trash2 size={16} />
              <span>Clear All Data</span>
            </button>
          </div>
        </div>

        {/* 5. About Ascend */}
        <div className="p-5 rounded-[14px] border border-[var(--border)] bg-[var(--surface-secondary)] flex items-center justify-between text-[12px] text-[var(--text-muted)]">
          <div className="flex items-center gap-2">
            <Info size={16} className="text-[var(--primary)]" />
            <span>Project Ascend Web v1.5.0 — Direct client-side port from PySide6 desktop.</span>
          </div>
          <span className="font-mono">Local-First Architecture</span>
        </div>

        {/* Clear Data Confirmation Modal */}
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="rounded-[18px] border border-red-800/50 bg-[var(--surface)] p-6 max-w-[420px] w-full space-y-4 shadow-2xl">
              <div className="flex items-center gap-3 text-red-400">
                <AlertTriangle size={24} />
                <h3 className="text-[16px] font-extrabold text-[var(--text-primary)]">
                  Reset Project Ascend?
                </h3>
              </div>
              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                This will permanently erase all local activities, focus session logs, streaks, XP, achievements, and custom preferences from this browser. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 rounded-[10px] border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[13px] font-bold text-[var(--text-secondary)]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearData}
                  className="px-4 py-2 rounded-[10px] bg-red-600 hover:bg-red-700 text-white text-[13px] font-bold shadow-sm"
                >
                  Yes, Erase Everything
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
