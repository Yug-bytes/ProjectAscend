"use client";

import AppShell from "@/components/layout/app-shell";
import { timeOfDayGreeting } from "@/lib/format";

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
        {/* Page header */}
        <div className="border-b border-[var(--border)] pb-4">
          <h1 className="text-[22px] font-extrabold text-[var(--text-primary)]">
            {timeOfDayGreeting()}
          </h1>
          <p className="text-[12px] text-[var(--text-muted)] mt-1">
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Placeholder content — Phase 1 will add dashboard widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Progress Card placeholder */}
          <div className="lg:col-span-3 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-5 min-h-[120px]">
            <p className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Daily Progress
            </p>
            <p className="text-[26px] font-extrabold text-[var(--text-primary)] mt-2">
              0m
            </p>
            <p className="text-[12px] text-[var(--text-muted)] mt-1">
              Start a focus session to begin tracking
            </p>
          </div>

          {/* Player Card placeholder */}
          <div className="lg:col-span-2 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-5 min-h-[120px]">
            <p className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Level
            </p>
            <p className="text-[20px] font-extrabold text-[var(--accent)] mt-2">
              Level 1
            </p>
            <p className="text-[12px] text-[var(--text-muted)] mt-1">
              0 / 100 XP
            </p>
          </div>
        </div>

        {/* Focus Card placeholder */}
        <div className="rounded-[14px] border border-[var(--primary-muted)] p-6 focus-card-gradient">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Focus Timer
              </p>
              <p className="text-[52px] font-extrabold text-[var(--primary)] mt-1 tracking-tight font-mono">
                00:00:00
              </p>
              <p className="text-[13px] text-[var(--text-secondary)] mt-1">
                Current Activity: Ready
              </p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-[10px] bg-[var(--primary)] text-white font-bold text-[13px] hover:bg-[var(--primary-hover)] transition-colors">
                Start
              </button>
            </div>
          </div>
        </div>

        {/* Activities placeholder */}
        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-bold text-[var(--text-primary)]">
              Today&apos;s Activities
            </h2>
            <button className="px-3 py-1.5 rounded-[10px] bg-[var(--surface-elevated)] border border-[var(--border-strong)] text-[13px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors">
              + Add Activity
            </button>
          </div>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-[54px] h-[54px] rounded-full bg-[var(--surface-elevated)] border border-[var(--primary-muted)] flex items-center justify-center text-[30px] text-[var(--primary)] mb-3">
              📋
            </div>
            <p className="text-[13px] text-[var(--text-muted)]">
              No activities planned for today
            </p>
            <p className="text-[12px] text-[var(--text-muted)] mt-1">
              Add an activity to get started
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
