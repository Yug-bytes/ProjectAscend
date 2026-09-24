"use client";

import React, { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/layout/app-shell";
import {
  insightsService,
  comparisonCaption,
  type InsightsDashboardData,
} from "@/lib/insights-service";
import { formatDisplayDate, todayISO } from "@/lib/date-utils";
import OverviewCards from "@/components/insights/overview-cards";
import FocusTrendChart from "@/components/insights/focus-trend-chart";
import ActivityDistributionComponent from "@/components/insights/activity-distribution";
import DayHourHeatmap from "@/components/insights/day-hour-heatmap";
import ConsistencyHeatmap from "@/components/insights/consistency-heatmap";
import LearnedInsights from "@/components/insights/learned-insights";
import CalibrationPanel from "@/components/insights/calibration-panel";
import PersonalHighlights from "@/components/insights/personal-highlights";
import RuleBasedInsights from "@/components/insights/rule-based-insights";
import { Calendar, BarChart3 } from "lucide-react";

const RANGE_TABS = [
  { key: "today", label: "Today" },
  { key: "7_days", label: "7 Days" },
  { key: "30_days", label: "30 Days" },
  { key: "90_days", label: "3 Months" },
  { key: "all_time", label: "All Time" },
];

export default function InsightsPage() {
  const [selectedRange, setSelectedRange] = useState<string>("7_days");
  const [data, setData] = useState<InsightsDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [today, setToday] = useState<string>("");

  // Set today on client only to avoid hydration mismatch
  useEffect(() => {
    setToday(todayISO());
  }, []);

  const loadInsights = useCallback(async (rangeKey: string, todayStr: string) => {
    if (!todayStr) return; // wait for client-side today
    setLoading(true);
    setError(false);
    try {
      // Timeout guard: if buildDashboard hangs > 8s, bail out gracefully
      const result = await Promise.race([
        insightsService.buildDashboard(rangeKey, todayStr),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Insights timed out")), 8000)
        ),
      ]);
      setData(result);
    } catch (err) {
      console.error("Error building insights dashboard:", err);
      setError(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (today) {
      loadInsights(selectedRange, today);
    }
  }, [selectedRange, today, loadInsights]);

  // Check if data is loaded but everything is empty (no activities yet)
  const isEmptyData = data && data.overview.focusMinutes === 0 &&
    data.overview.completedTasks === 0 && data.overview.totalTasks === 0;

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-4 md:space-y-6 animate-in fade-in duration-200">
        {/* Top Header & Range Filters */}
        <div className="border-b border-[var(--border)] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-extrabold text-[var(--text-primary)]">
              Insights
            </h1>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
              Understand your productivity. Improve it.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Range selection button group */}
            <div className="inline-flex max-w-full overflow-x-auto rounded-[8px] bg-[var(--surface-elevated)] p-1 border border-[var(--border)] scrollbar-none">
              {RANGE_TABS.map((tab) => {
                const isSelected = selectedRange === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setSelectedRange(tab.key)}
                    className={`shrink-0 px-3 py-1.5 text-[12px] font-semibold rounded-[6px] transition-all cursor-pointer min-h-[36px] flex items-center justify-center ${
                      isSelected
                        ? "bg-[var(--primary)] text-white shadow-sm"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Context & current date caption */}
            <div className="text-right text-[11px] text-[var(--text-muted)] hidden sm:block">
              {data && (
                <p className="font-semibold text-[var(--text-secondary)]">
                  {comparisonCaption(data.rangeDefinition)}
                </p>
              )}
              {today && (
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDisplayDate(today)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Flow */}
        {loading ? (
          <div className="py-20 text-center text-[13px] text-[var(--text-muted)]">
            Analyzing productivity records...
          </div>
        ) : error || !data ? (
          <div className="py-20 text-center space-y-3">
            <BarChart3 className="w-10 h-10 mx-auto text-[var(--text-muted)] opacity-40" />
            <p className="text-[15px] font-semibold text-[var(--text-secondary)]">
              No insights available yet
            </p>
            <p className="text-[12px] text-[var(--text-muted)] max-w-sm mx-auto">
              Start adding activities and completing focus sessions. Your personalized insights will appear here as data builds up.
            </p>
          </div>
        ) : isEmptyData ? (
          <div className="space-y-6">
            {/* Still show overview cards (all zeros) and rule-based insights */}
            <OverviewCards
              overview={data.overview}
              rangeDefinition={data.rangeDefinition}
            />
            <div className="py-12 text-center space-y-3">
              <BarChart3 className="w-10 h-10 mx-auto text-[var(--text-muted)] opacity-40" />
              <p className="text-[15px] font-semibold text-[var(--text-secondary)]">
                Your analytics will come alive with activity
              </p>
              <p className="text-[12px] text-[var(--text-muted)] max-w-sm mx-auto">
                Complete a few focus sessions to unlock trend charts, heatmaps, calibration data, and personalized insights.
              </p>
            </div>
            <RuleBasedInsights insights={data.insights} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* 1. Overview Metric Cards */}
            <OverviewCards
              overview={data.overview}
              rangeDefinition={data.rangeDefinition}
            />

            {/* 2. Focus Trend Chart */}
            <FocusTrendChart trend={data.trend} />

            {/* 3. Distribution & Day-Hour Heatmap Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ActivityDistributionComponent distribution={data.distribution} />
              <DayHourHeatmap dayHour={data.dayHour} />
            </div>

            {/* 4. Calibration & Consistency Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CalibrationPanel calibration={data.calibration} />
              <ConsistencyHeatmap consistency={data.consistency} />
            </div>

            {/* 5. What Ascend Learned (Evidence-backed) */}
            <LearnedInsights learned={data.learned} />

            {/* 6. Personal Highlights */}
            <PersonalHighlights highlights={data.highlights} />

            {/* 7. Actionable Rule-Based Insights */}
            <RuleBasedInsights insights={data.insights} />
          </div>
        )}
      </div>
    </AppShell>
  );
}
