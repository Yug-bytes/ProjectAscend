/**
 * Formatters ported from the desktop app.
 * Duration/time/percent formatting that matches the exact copy tone.
 */

/**
 * Format minutes as capacity duration: "2h" (not "2h 0m"), "1h 30m", "45m".
 * Used by capacity service headlines and balance lines.
 */
export function formatCapacityDuration(totalMinutes: number): string {
  const m = Math.max(0, Math.floor(totalMinutes));
  const hours = Math.floor(m / 60);
  const rem = m % 60;

  if (hours > 0 && rem === 0) return `${hours}h`;
  if (hours > 0) return `${hours}h ${rem}m`;
  return `${m}m`;
}

/**
 * Format minutes as duration: "Xh Ym" or "Xm".
 * General purpose, used in dashboard and insights.
 */
export function formatMinutes(minutes: number): string {
  const m = Math.max(0, Math.floor(minutes));
  const hours = Math.floor(m / 60);
  const rem = m % 60;

  if (hours === 0) return `${rem}m`;
  if (rem === 0) return `${hours}h`;
  return `${hours}h ${rem}m`;
}

/**
 * Format seconds as HH:MM:SS (zero-padded).
 */
export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(s / 3600);
  const rem = s % 3600;
  const minutes = Math.floor(rem / 60);
  const secs = rem % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Format a signed relative error as "+25%" or "-15%" or "0%".
 */
export function formatErrorPercent(fraction: number): string {
  const percentage = Math.round(fraction * 100);
  if (percentage > 0) return `+${percentage}%`;
  return `${percentage}%`;
}

/**
 * Format an unsigned percentage: "35%".
 */
export function formatPlainPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

/**
 * Format a percent delta: "+12%" or "-5%" or "" if null.
 */
export function formatPercentDelta(value: number | null): string {
  if (value == null) return '';
  if (value > 0) return `+${value}%`;
  return `${value}%`;
}

/**
 * Format a count delta: "+3" or "-2" or "" if null.
 */
export function formatCountDelta(value: number | null): string {
  if (value == null) return '';
  if (value > 0) return `+${value}`;
  return `${value}`;
}

/**
 * Format a points delta: "+5 pts" or "-3 pts" or "" if null.
 */
export function formatPointsDelta(value: number | null): string {
  if (value == null) return '';
  if (value > 0) return `+${value} pts`;
  return `${value} pts`;
}

/**
 * Determine delta direction: "up", "down", or null.
 */
export function deltaDirection(
  value: number | null
): 'up' | 'down' | null {
  if (value == null || value === 0) return null;
  return value > 0 ? 'up' : 'down';
}

/**
 * Activity noun helper: "activity" or "activities".
 */
export function activityNoun(count: number): string {
  return count === 1 ? 'activity' : 'activities';
}

/**
 * Greeting based on time of day.
 */
export function timeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}
