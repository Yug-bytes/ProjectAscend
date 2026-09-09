/**
 * Active focus session engine for Project Ascend Web.
 * Port of Modules/session.py.
 *
 * Manages live timer heartbeat, pause/resume, ceiling minute conversion,
 * persistence to Dexie IndexedDB (focusSessions + activities), and XP awards.
 */

import { db } from './db';
import { formatTime } from './format';
import type { Activity, FocusSession } from './types';

export interface SessionState {
  currentActivity: Activity | null;
  elapsedSeconds: number;
  isRunning: boolean;
  sessionStartedAt: string | null;
}

export type SessionEventType =
  | 'timer_updated'
  | 'session_started'
  | 'session_paused'
  | 'session_resumed'
  | 'session_completed';

type SessionListener = (state: SessionState, event?: SessionEventType) => void;

export class SessionEngine {
  private currentActivity: Activity | null = null;
  private elapsedSeconds: number = 0;
  private isRunning: boolean = false;
  private sessionStartedAt: string | null = null;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<SessionListener> = new Set();
  private lastTick: number = 0;

  constructor() {
    // SessionEngine operates client-side only
  }

  public getState(): SessionState {
    return {
      currentActivity: this.currentActivity,
      elapsedSeconds: this.elapsedSeconds,
      isRunning: this.isRunning,
      sessionStartedAt: this.sessionStartedAt,
    };
  }

  public subscribe(listener: SessionListener): () => void {
    this.listeners.add(listener);
    // Emit current state immediately to new subscriber
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(event: SessionEventType): void {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state, event);
      } catch (err) {
        console.error('Error in SessionEngine subscriber:', err);
      }
    });
  }

  /**
   * Start a new focus session for the given activity.
   */
  public start(activity: Activity): void {
    this.stopTimer();
    this.currentActivity = { ...activity };
    this.elapsedSeconds = 0;
    this.sessionStartedAt = new Date().toISOString();
    this.isRunning = true;
    this.lastTick = Date.now();

    this.startTimer();
    this.notify('session_started');
    this.notify('timer_updated');
  }

  /**
   * Pause the active timer without resetting elapsed time or current activity.
   */
  public pause(): void {
    if (!this.currentActivity || !this.isRunning) return;

    this.stopTimer();
    this.isRunning = false;
    this.notify('session_paused');
  }

  /**
   * Resume the active session timer after being paused.
   */
  public resume(): void {
    if (!this.currentActivity || this.isRunning) return;

    this.isRunning = true;
    this.lastTick = Date.now();
    this.startTimer();
    this.notify('session_resumed');
  }

  /**
   * Convert elapsed seconds to whole minutes using ceiling rounding.
   * Formula from desktop app: actual_minutes = (elapsed_seconds + 59) // 60
   */
  public convertSecondsToMinutes(seconds: number): number {
    if (seconds <= 0) return 0;
    return Math.floor((seconds + 59) / 60);
  }

  /**
   * Format seconds as HH:MM:SS text.
   */
  public formatTime(seconds: number): string {
    return formatTime(seconds);
  }

  /**
   * Complete the active session:
   * 1. Calculate ceiling-rounded actual_minutes
   * 2. Persist updated activity to Dexie (completed = 1, actual_minutes)
   * 3. Record focus session log in Dexie
   * 4. Trigger +10 XP award
   * 5. Reset engine state
   */
  public async complete(): Promise<{ activity: Activity; xpAwarded: boolean } | null> {
    if (!this.currentActivity) return null;

    this.stopTimer();
    this.isRunning = false;

    const activity = { ...this.currentActivity };
    const actualMinutes = this.convertSecondsToMinutes(this.elapsedSeconds);
    const completedAt = new Date().toISOString();
    const startedAt = this.sessionStartedAt ?? completedAt;
    const sessionDate = startedAt.slice(0, 10);
    const secondsWorked = this.elapsedSeconds;

    activity.actual_minutes = (activity.actual_minutes || 0) + actualMinutes;
    activity.completed = 1;

    // 1. Update activity in database
    await db.updateActivity(activity);

    // 2. Record focus session
    const sessionData: Omit<FocusSession, 'id'> = {
      activity_id: activity.id!,
      session_date: sessionDate,
      started_at: startedAt,
      completed_at: completedAt,
      actual_minutes: actualMinutes,
      actual_seconds: secondsWorked,
    };
    await db.recordFocusSession(sessionData);

    // 3. Award XP (+10 XP)
    let xpAwarded = false;
    if (activity.id != null) {
      xpAwarded = await db.awardActivityCompletionXp(activity.id, 10);
    }

    // 4. Clean up state
    const completedActivity = { ...activity };
    this.currentActivity = null;
    this.elapsedSeconds = 0;
    this.sessionStartedAt = null;

    this.notify('session_completed');
    this.notify('timer_updated');

    return {
      activity: completedActivity,
      xpAwarded,
    };
  }

  /**
   * Cancel or discard the active session without saving.
   */
  public discard(): void {
    this.stopTimer();
    this.currentActivity = null;
    this.elapsedSeconds = 0;
    this.sessionStartedAt = null;
    this.isRunning = false;
    this.notify('timer_updated');
  }

  private startTimer(): void {
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = setInterval(() => {
      this.tick();
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private tick(): void {
    if (!this.isRunning) return;
    const now = Date.now();
    // Catch-up for background tab sleep if needed, while keeping 1s cadence
    const delta = Math.floor((now - this.lastTick) / 1000);
    if (delta >= 1) {
      this.elapsedSeconds += delta;
      this.lastTick = now;
      this.notify('timer_updated');
    }
  }
}

// Global singleton instance
export const sessionEngine = new SessionEngine();
