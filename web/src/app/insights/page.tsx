"use client";

import React, { useState, useEffect } from "react";
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
import { Calendar } from "lucide-react";

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
  const today = todayISO();

  const loadInsights = async (rangeKey: string) => {
    setLoading(true);
    try {
      const result = await insightsService.buildDashboard(rangeKey, today);
      setData(result);
    } catch (err) {
      console.error("Error building insights dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights(selectedRange);
  }, [selectedRange, today]);

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-200">
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
            <div className="inline-flex rounded-[8px] bg-[var(--surface-elevated)] p-1 border border-[var(--border)]">
              {RANGE_TABS.map((tab) => {
                const isSelected = selectedRange === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setSelectedRange(tab.key)}
                    className={`px-3 py-1 text-[12px] font-semibold rounded-[6px] transition-all cursor-pointer ${
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
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <Calendar className="w-3 h-3" />
                <span>{formatDisplayDate(today)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Flow */}
        {loading || !data ? (
          <div className="py-20 text-center text-[13px] text-[var(--text-muted)]">
            Analyzing productivity records...
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
