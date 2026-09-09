/**
 * Date utilities ported from Modules/date_utils.py.
 */

/**
 * Parse a date value to a Date object.
 * Accepts Date, ISO string 'YYYY-MM-DD', or ISO datetime string.
 * Returns null if invalid.
 */
export function parseIsoDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  // Handle ISO date string 'YYYY-MM-DD'
  const dateStr = String(value).slice(0, 10);
  const match = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  if (!match) return null;

  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);

  // Validate the date components match (catches invalid dates like Feb 30)
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return null;
  }

  return d;
}

/**
 * Format a date for display: "1 January 2026" or "Thursday, 1 January 2026".
 * No zero-padding on the day.
 */
export function formatDisplayDate(
  value: string | Date,
  includeWeekday: boolean = false
): string {
  const date = parseIsoDate(value);
  if (!date) return String(value);

  const day = date.getDate();
  const month = date.toLocaleDateString('en-GB', { month: 'long' });
  const year = date.getFullYear();

  if (includeWeekday) {
    const weekday = date.toLocaleDateString('en-GB', { weekday: 'long' });
    return `${weekday}, ${day} ${month} ${year}`;
  }

  return `${day} ${month} ${year}`;
}

/**
 * Format minutes as duration: "1h 30m", "45m", "2h", "0m".
 */
export function formatDuration(minutes: number): string {
  const m = Math.max(0, Math.floor(minutes));
  const hours = Math.floor(m / 60);
  const rem = m % 60;

  if (hours === 0) return `${rem}m`;
  if (rem === 0) return `${hours}h`;
  return `${hours}h ${rem}m`;
}

/**
 * Get today's date as ISO string 'YYYY-MM-DD'.
 */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Get a date N days offset from today as ISO string.
 */
export function dateOffsetISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Get the weekday index (0=Mon ... 6=Sun) for a date.
 */
export function weekdayIndex(date: Date): number {
  // JS Date.getDay(): 0=Sun, 1=Mon, ..., 6=Sat
  // We want: 0=Mon, ..., 6=Sun
  return (date.getDay() + 6) % 7;
}

/**
 * Format ISO date to a relative label: "Today", "Yesterday", or weekday name.
 */
export function relativeDay(dateStr: string): string {
  const today = todayISO();
  const yesterday = dateOffsetISO(-1);

  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';

  const date = parseIsoDate(dateStr);
  if (!date) return dateStr;

  return date.toLocaleDateString('en-GB', { weekday: 'long' });
}

/**
 * Get the Monday of the week containing a given date.
 */
export function getWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return d;
}

/**
 * Add days to an ISO date string.
 */
export function addDays(dateStr: string, days: number): string {
  const d = parseIsoDate(dateStr);
  if (!d) return dateStr;
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Get difference in days between two ISO date strings (end - start).
 */
export function daysBetween(startStr: string, endStr: string): number {
  const start = parseIsoDate(startStr);
  const end = parseIsoDate(endStr);
  if (!start || !end) return 0;
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}
