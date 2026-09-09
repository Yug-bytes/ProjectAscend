"use client";

import AppShell from "@/components/layout/app-shell";

export default function InsightsPage() {
  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
        <div className="border-b border-[var(--border)] pb-4">
          <h1 className="text-[22px] font-extrabold text-[var(--text-primary)]">
            Insights
          </h1>
          <p className="text-[12px] text-[var(--text-muted)] mt-1">
            Understand your productivity patterns
          </p>
        </div>
        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
          <p className="text-[var(--text-muted)]">Insights will be built in Phase 2</p>
        </div>
      </div>
    </AppShell>
  );
}
