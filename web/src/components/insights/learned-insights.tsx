"use client";

import React from "react";
import type { LearnedInsight } from "@/lib/insights-service";
import { EVIDENCE_LABELS } from "@/lib/constants";

interface LearnedInsightsProps {
  learned: LearnedInsight[];
}

export default function LearnedInsights({ learned }: LearnedInsightsProps) {
  const getBadgeStyle = (confidence: string) => {
    switch (confidence) {
      case "high_confidence":
        return "bg-[var(--success-soft)] text-[var(--success)] border-[var(--success)]/30";
      case "moderate_confidence":
        return "bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/30";
      case "early_signal":
      default:
        return "bg-[var(--warning-soft)] text-[var(--warning)] border-[var(--warning)]/30";
    }
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[var(--border)]/50 pb-3">
        <span className="text-[var(--accent)] text-[16px]">◈</span>
        <div>
          <h3 className="text-[15px] font-bold text-[var(--text-primary)]">
            What Ascend Learned
          </h3>
          <p className="text-[12px] text-[var(--text-muted)]">
            Evidence-backed observations about your focus habits
          </p>
        </div>
      </div>

      {/* Cards or Empty State */}
      {learned.length === 0 ? (
        <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[var(--accent)] text-[14px]">◈</span>
            <h4 className="text-[14px] font-bold text-[var(--text-primary)]">
              Ascend hasn't learned this yet.
            </h4>
          </div>
          <p className="text-[12px] text-[var(--text-secondary)] pl-5">
            More activity is needed to identify reliable patterns. Keep completing sessions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {learned.map((item, idx) => (
            <div
              key={idx}
              className="rounded-[10px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4 space-y-2 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--accent)] text-[14px] font-bold">◈</span>
                    <h4 className="text-[14px] font-bold text-[var(--text-primary)]">
                      {item.title}
                    </h4>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-[6px] text-[10px] font-bold border ${getBadgeStyle(
                      item.confidence
                    )}`}
                  >
                    {EVIDENCE_LABELS[item.confidence] || item.confidence}
                  </span>
                </div>
                <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed pl-5">
                  {item.description}
                </p>
              </div>

              <p className="text-[11px] text-[var(--text-muted)] pl-5 pt-1 border-t border-[var(--border)]/40 mt-2">
                {item.evidence}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
