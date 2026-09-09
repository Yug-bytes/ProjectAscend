/**
 * JSON export/import for all IndexedDB data.
 * Critical for local-first app — users need backup/restore since there's no server.
 */

import { db } from './db';

interface ExportData {
  version: 1;
  exported_at: string;
  app: 'ProjectAscend-Web';
  activities: unknown[];
  settings: unknown[];
  focusSessions: unknown[];
  xpEvents: unknown[];
  dailyHistory: unknown[];
  userAchievements: unknown[];
  progressionProfile: unknown[];
  levelHistory: unknown[];
  milestoneHistory: unknown[];
}

/**
 * Export all IndexedDB data as a JSON object.
 */
export async function exportAllData(): Promise<ExportData> {
  const [
    activities,
    settings,
    focusSessions,
    xpEvents,
    dailyHistory,
    userAchievements,
    progressionProfile,
    levelHistory,
    milestoneHistory,
  ] = await Promise.all([
    db.activities.toArray(),
    db.settings.toArray(),
    db.focusSessions.toArray(),
    db.xpEvents.toArray(),
    db.dailyHistory.toArray(),
    db.userAchievements.toArray(),
    db.progressionProfile.toArray(),
    db.levelHistory.toArray(),
    db.milestoneHistory.toArray(),
  ]);

  return {
    version: 1,
    exported_at: new Date().toISOString(),
    app: 'ProjectAscend-Web',
    activities,
    settings,
    focusSessions,
    xpEvents,
    dailyHistory,
    userAchievements,
    progressionProfile,
    levelHistory,
    milestoneHistory,
  };
}

/**
 * Download the export as a JSON file.
 */
export async function downloadExport(): Promise<void> {
  const data = await exportAllData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `project-ascend-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import data from a JSON file, replacing all existing data.
 * Returns the count of records imported per store.
 */
export async function importData(
  file: File
): Promise<{ success: boolean; message: string; counts?: Record<string, number> }> {
  try {
    const text = await file.text();
    const data = JSON.parse(text) as Partial<ExportData>;

    // Validate format
    if (data.app !== 'ProjectAscend-Web' || data.version !== 1) {
      return {
        success: false,
        message: 'Invalid file format. Expected a Project Ascend Web backup file.',
      };
    }

    // Clear all existing data
    await db.transaction(
      'rw',
      [
        db.activities,
        db.settings,
        db.focusSessions,
        db.xpEvents,
        db.dailyHistory,
        db.userAchievements,
        db.progressionProfile,
        db.levelHistory,
        db.milestoneHistory,
      ],
      async () => {
        await Promise.all([
          db.activities.clear(),
          db.settings.clear(),
          db.focusSessions.clear(),
          db.xpEvents.clear(),
          db.dailyHistory.clear(),
          db.userAchievements.clear(),
          db.progressionProfile.clear(),
          db.levelHistory.clear(),
          db.milestoneHistory.clear(),
        ]);

        // Import new data
        const counts: Record<string, number> = {};

        if (data.activities?.length) {
          await db.activities.bulkAdd(data.activities as never[]);
          counts.activities = data.activities.length;
        }
        if (data.settings?.length) {
          await db.settings.bulkAdd(data.settings as never[]);
          counts.settings = data.settings.length;
        }
        if (data.focusSessions?.length) {
          await db.focusSessions.bulkAdd(data.focusSessions as never[]);
          counts.focusSessions = data.focusSessions.length;
        }
        if (data.xpEvents?.length) {
          await db.xpEvents.bulkAdd(data.xpEvents as never[]);
          counts.xpEvents = data.xpEvents.length;
        }
        if (data.dailyHistory?.length) {
          await db.dailyHistory.bulkAdd(data.dailyHistory as never[]);
          counts.dailyHistory = data.dailyHistory.length;
        }
        if (data.userAchievements?.length) {
          await db.userAchievements.bulkAdd(data.userAchievements as never[]);
          counts.userAchievements = data.userAchievements.length;
        }
        if (data.progressionProfile?.length) {
          await db.progressionProfile.bulkAdd(data.progressionProfile as never[]);
          counts.progressionProfile = data.progressionProfile.length;
        }
        if (data.levelHistory?.length) {
          await db.levelHistory.bulkAdd(data.levelHistory as never[]);
          counts.levelHistory = data.levelHistory.length;
        }
        if (data.milestoneHistory?.length) {
          await db.milestoneHistory.bulkAdd(data.milestoneHistory as never[]);
          counts.milestoneHistory = data.milestoneHistory.length;
        }

        return counts;
      }
    );

    return {
      success: true,
      message: 'Data imported successfully. Please refresh the page.',
    };
  } catch (err) {
    return {
      success: false,
      message: `Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }
}

/**
 * Clear all data from IndexedDB.
 */
export async function clearAllData(): Promise<void> {
  await Promise.all([
    db.activities.clear(),
    db.settings.clear(),
    db.focusSessions.clear(),
    db.xpEvents.clear(),
    db.dailyHistory.clear(),
    db.userAchievements.clear(),
    db.progressionProfile.clear(),
    db.levelHistory.clear(),
    db.milestoneHistory.clear(),
  ]);
}
