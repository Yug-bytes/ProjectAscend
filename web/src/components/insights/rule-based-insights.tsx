"use client";

import React from "react";
import type { InsightItem } from "@/lib/insights-service";

interface RuleBasedInsightsProps {
  insights: InsightItem[];
}

export default function RuleBasedInsights({ insights }: RuleBasedInsightsProps) {
  const getBadge = (kind: string) => {
    switch (kind) {
      case "positive":
        return {
          icon: "↑",
          bg: "bg-[var(--success)]",
          textColor: "text-white",
        };
      case "warning":
        return {
          icon: "!",
          bg: "bg-[var(--error)]",
          textColor: "text-white",
        };
      case "goal":
        return {
          icon: "•",
          bg: "bg-[var(--primary)]",
          textColor: "text-white",
        };
      case "pattern":
        return {
          icon: "◈",
          bg: "bg-[var(--accent)]",
          textColor: "text-white",
        };
      case "streak":
        return {
          icon: "🔥",
          bg: "bg-[var(--warning)]",
          textColor: "text-black",
        };
      case "recommendation":
        return {
          icon: "→",
          bg: "bg-[var(--primary-hover)]",
          textColor: "text-white",
        };
      case "info":
      default:
        return {
          icon: "i",
          bg: "bg-[var(--surface-elevated)]",
          textColor: "text-[var(--text-muted)]",
        };
    }
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] p-5 space-y-4">
      <div className="border-b border-[var(--border)]/50 pb-3">
        <h3 className="text-[15px] font-bold text-[var(--text-primary)]">
          Your Insights
        </h3>
        <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
          Actionable observations generated from your work patterns
        </p>
      </div>

      <div className="space-y-2.5">
        {insights.map((item, idx) => {
          const badge = getBadge(item.kind);

          return (
            <div
              key={idx}
              className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[10px] p-3.5 flex items-start gap-3.5"
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[13px] shrink-0 mt-0.5 ${badge.bg} ${badge.textColor}`}
              >
                {badge.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <h4 className="text-[13.5px] font-bold text-[var(--text-primary)]">
                    {item.title}
                  </h4>
                  {item.metric && (
                    <span className="text-[12px] font-bold text-[var(--primary)] shrink-0">
                      {item.metric}
                    </span>
                  )}
                </div>
                <p className="text-[12.5px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
