"use client";

import React from "react";

interface CircularTimerProps {
  elapsedSeconds: number;
  estimatedMinutes?: number;
  caption?: string; // "Focus Time" or "Paused"
  size?: number; // default 288
  strokeWidth?: number; // default 12
}

export default function CircularTimer({
  elapsedSeconds,
  estimatedMinutes = 0,
  caption = "Focus Time",
  size = 288,
  strokeWidth = 12,
}: CircularTimerProps) {
  const estimatedSeconds = Math.max(0, estimatedMinutes * 60);
  const progressRatio =
    estimatedSeconds > 0
      ? Math.min(1.0, Math.max(0.0, elapsedSeconds / estimatedSeconds))
      : 0;

  const hours = Math.floor(elapsedSeconds / 3600);
  const remainingSeconds = elapsedSeconds % 3600;
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  const timeText = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const radius = (size - strokeWidth) / 2 - 4;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressRatio * circumference;

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Unfilled track ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--surface-elevated)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Elapsed progress arc */}
        {progressRatio > 0 && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-linear"
          />
        )}
      </svg>

      {/* Center Labels */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <span className="text-[11px] font-semibold tracking-wider text-[var(--text-muted)] uppercase mb-1">
          {caption}
        </span>
        <span className="text-[38px] font-extrabold tracking-tight text-[var(--text-primary)] font-mono tabular-nums leading-none">
          {timeText}
        </span>
      </div>
    </div>
  );
}
