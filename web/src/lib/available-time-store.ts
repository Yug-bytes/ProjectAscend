/**
 * Per-date available-time storage for Planner Capacity Intelligence.
 * Ported from Modules/available_time_store.py.
 *
 * Available time is stored in the settings table under 'planner_available_minutes'
 * as a JSON object mapping ISO dates to minutes:
 * {"2026-08-16": 180, "2026-08-17": 240}
 */

import { parseIsoDate } from './date-utils';
import { db, type AscendDatabase } from './db';
import {
  AVAILABLE_TIME_SETTING_KEY,
  MIN_AVAILABLE_MINUTES,
  MAX_AVAILABLE_MINUTES,
  RETENTION_DAYS_PAST,
  RETENTION_DAYS_FUTURE,
} from './constants';

export {
  AVAILABLE_TIME_SETTING_KEY,
  MIN_AVAILABLE_MINUTES,
  MAX_AVAILABLE_MINUTES,
  RETENTION_DAYS_PAST,
  RETENTION_DAYS_FUTURE,
};

/**
 * Return minutes as a whole number inside the accepted bounds (0 to 1440).
 */
export function clampMinutes(minutes: number): number {
  const value = Math.floor(Number(minutes) || 0);
  return Math.min(MAX_AVAILABLE_MINUTES, Math.max(MIN_AVAILABLE_MINUTES, value));
}

/**
 * Return a canonical ISO date string (YYYY-MM-DD), or null when invalid.
 */
export function normalizeDate(planDate: string | Date | null | undefined): string | null {
  const parsed = parseIsoDate(planDate);
  if (!parsed) return null;
  return parsed.toISOString().slice(0, 10);
}

/**
 * Return a usable whole-minute value, or null.
 * Rejects booleans, non-integers, and out-of-range numbers.
 */
export function normalizeMinutes(value: unknown): number | null {
  if (typeof value === 'boolean') return null;
  if (typeof value !== 'number' || !Number.isInteger(value)) return null;
  if (value < MIN_AVAILABLE_MINUTES || value > MAX_AVAILABLE_MINUTES) return null;
  return value;
}

/**
 * Drop entries that are too far in the past (-7 days) or future (+30 days).
 * The `keep` key is never pruned.
 */
export function pruneEntries(
  entries: Record<string, number>,
  keep?: string | null,
  todayDate?: Date
): Record<string, number> {
  const today = todayDate ? new Date(todayDate) : new Date();
  today.setHours(0, 0, 0, 0);

  const earliest = new Date(today);
  earliest.setDate(earliest.getDate() - RETENTION_DAYS_PAST);

  const latest = new Date(today);
  latest.setDate(latest.getDate() + RETENTION_DAYS_FUTURE);

  const pruned: Record<string, number> = {};

  for (const [key, val] of Object.entries(entries)) {
    if (keep && key === keep) {
      pruned[key] = val;
      continue;
    }
    const parsed = parseIsoDate(key);
    if (!parsed) continue;
    parsed.setHours(0, 0, 0, 0);
    if (parsed >= earliest && parsed <= latest) {
      pruned[key] = val;
    }
  }

  return pruned;
}

export class AvailableTimeStore {
  private database: AscendDatabase;

  constructor(database: AscendDatabase = db) {
    this.database = database;
  }

  /**
   * Return the stored minutes for a date, or null.
   * null means the user has not stated their available time.
   */
  async get(planDate: string | Date): Promise<number | null> {
    const key = normalizeDate(planDate);
    if (!key) return null;
    const entries = await this.loadEntries();
    return entries[key] ?? null;
  }

  /**
   * Store the user's explicitly entered available time for a date.
   * Returns the persisted clamped value, or null on invalid date.
   */
  async set(planDate: string | Date, minutes: number): Promise<number | null> {
    const key = normalizeDate(planDate);
    if (!key) return null;

    const value = clampMinutes(minutes);
    const entries = await this.loadEntries();
    entries[key] = value;
    await this.saveEntries(entries, key);
    return value;
  }

  /**
   * Remove a date's available time.
   */
  async clear(planDate: string | Date): Promise<void> {
    const key = normalizeDate(planDate);
    if (!key) return;

    const entries = await this.loadEntries();
    if (!(key in entries)) return;

    delete entries[key];
    await this.saveEntries(entries);
  }

  /**
   * Return the stored date -> minutes mapping, or {}.
   * Defensively collapses corrupt/unexpected data to "no data".
   */
  async loadEntries(): Promise<Record<string, number>> {
    try {
      const raw = await this.database.getSetting(AVAILABLE_TIME_SETTING_KEY);
      if (!raw) return {};

      const decoded = JSON.parse(raw);
      if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) {
        return {};
      }

      const entries: Record<string, number> = {};
      for (const [key, value] of Object.entries(decoded)) {
        const normalizedKey = normalizeDate(key);
        if (!normalizedKey) continue;
        const normalizedMin = normalizeMinutes(value);
        if (normalizedMin === null) continue;
        entries[normalizedKey] = normalizedMin;
      }
      return entries;
    } catch {
      return {};
    }
  }

  /**
   * Persist the mapping, pruning entries outside the retention window.
   */
  async saveEntries(entries: Record<string, number>, keep?: string | null): Promise<void> {
    const pruned = pruneEntries(entries, keep);
    // Sort keys for deterministic storage
    const sorted: Record<string, number> = {};
    for (const k of Object.keys(pruned).sort()) {
      sorted[k] = pruned[k];
    }
    await this.database.setSetting(AVAILABLE_TIME_SETTING_KEY, JSON.stringify(sorted));
  }
}

// Singleton instance
export const availableTimeStore = new AvailableTimeStore();
