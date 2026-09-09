/**
 * Character Identity & Evolution Manager.
 * Exact port of Modules/character_manager.py and Modules/character_asset_manager.py.
 */

import { db } from './db';
import type {
  CharacterDefinition,
  CharacterId,
  EvolutionStage,
  EvolutionStageInfo,
} from './types';

export const DEFAULT_CHARACTER_ID: CharacterId = 'architect';

export const CHARACTER_DEFINITIONS: Record<CharacterId, CharacterDefinition> = {
  architect: {
    id: 'architect',
    name: 'The Architect',
    title: 'Focus & Planning Mastery',
    specialization: 'Focus & Planning Mastery',
    description: 'Master of structure, vision, and strategic focus.',
    icon: '📐',
    primary_color: '#7C5CFF',
    secondary_color: '#3B82F6',
  },
  catalyst: {
    id: 'catalyst',
    name: 'The Catalyst',
    title: 'Execution & Speed Mastery',
    specialization: 'Execution & Speed Mastery',
    description: 'Spark of momentum, high output, and swift execution.',
    icon: '⚡',
    primary_color: '#3B82F6',
    secondary_color: '#60A5FA',
  },
  sentinel: {
    id: 'sentinel',
    name: 'The Sentinel',
    title: 'Consistency & Habit Mastery',
    specialization: 'Consistency & Habit Mastery',
    description: 'Guardian of daily routines, endurance, and unbroken streaks.',
    icon: '🛡',
    primary_color: '#F59E0B',
    secondary_color: '#D97706',
  },
  vanguard: {
    id: 'vanguard',
    name: 'The Vanguard',
    title: 'Deep Work & Endurance Mastery',
    specialization: 'Deep Work & Endurance Mastery',
    description: 'Pioneer of long flow states and deep cognitive focus.',
    icon: '⚔',
    primary_color: '#22C55E',
    secondary_color: '#10B981',
  },
  scholar: {
    id: 'scholar',
    name: 'The Scholar',
    title: 'Knowledge & Reflection Mastery',
    specialization: 'Knowledge & Reflection Mastery',
    description: 'Seeker of continuous learning, research, and deep insight.',
    icon: '📜',
    primary_color: '#6366F1',
    secondary_color: '#818CF8',
  },
  pathfinder: {
    id: 'pathfinder',
    name: 'The Pathfinder',
    title: 'Goal Exploration & Direction',
    specialization: 'Goal Exploration & Direction',
    description: 'Navigator of milestone pathways and new horizons.',
    icon: '🧭',
    primary_color: '#EC4899',
    secondary_color: '#F472B6',
  },
  artisan: {
    id: 'artisan',
    name: 'The Artisan',
    title: 'Craft & Precision Execution',
    specialization: 'Craft & Precision Execution',
    description: 'Craftsman of meticulous detail and pristine completion quality.',
    icon: '🎨',
    primary_color: '#8B5CF6',
    secondary_color: '#A78BFA',
  },
  paragon: {
    id: 'paragon',
    name: 'The Paragon',
    title: 'Balanced Holistic Mastery',
    specialization: 'Balanced Holistic Mastery',
    description: 'Embodiment of harmony across planning, focus, and consistency.',
    icon: '👑',
    primary_color: '#EAB308',
    secondary_color: '#FACC15',
  },
};

export const STAGE_TITLES: Record<EvolutionStage, string> = {
  1: 'Initiated',
  2: 'Established',
  3: 'Ascended',
  4: 'Sovereign',
};

/**
 * Return the evolution stage derived strictly from current level.
 */
export function getEvolutionStage(level: number): EvolutionStageInfo {
  const lvl = Math.max(1, Math.floor(level));

  if (lvl < 10) {
    return {
      stage: 1,
      name: 'Initiated',
      min_level: 1,
      required_xp: 0,
      next_stage_level: 10,
    };
  }
  if (lvl < 25) {
    return {
      stage: 2,
      name: 'Established',
      min_level: 10,
      required_xp: 900,
      next_stage_level: 25,
    };
  }
  if (lvl < 50) {
    return {
      stage: 3,
      name: 'Ascended',
      min_level: 25,
      required_xp: 4650,
      next_stage_level: 50,
    };
  }
  return {
    stage: 4,
    name: 'Sovereign',
    min_level: 50,
    required_xp: 10900,
    next_stage_level: null,
  };
}

/**
 * Resolve public character asset sprite URL.
 * Stored in public/characters/{characterId}_stage_{stage}.png
 */
export function getCharacterAssetPath(characterId: string, stage: number = 1): string {
  const cid = (characterId in CHARACTER_DEFINITIONS ? characterId : DEFAULT_CHARACTER_ID) as CharacterId;
  const clampedStage = Math.max(1, Math.min(4, Math.floor(stage))) as EvolutionStage;
  return `/characters/${cid}_stage_${clampedStage}.png`;
}

/**
 * Return all 8 character definitions.
 */
export function getAllCharacters(): CharacterDefinition[] {
  return Object.values(CHARACTER_DEFINITIONS);
}

/**
 * Return character definition for given ID, falling back to default.
 */
export function getCharacterDefinition(characterId: string): CharacterDefinition {
  if (characterId in CHARACTER_DEFINITIONS) {
    return CHARACTER_DEFINITIONS[characterId as CharacterId];
  }
  return CHARACTER_DEFINITIONS[DEFAULT_CHARACTER_ID];
}

/**
 * Get the currently selected character ID from IndexedDB progressionProfile store.
 */
export async function getSelectedCharacterId(): Promise<CharacterId> {
  const row = await db.progressionProfile.get('selected_character_id');
  if (row?.value && row.value in CHARACTER_DEFINITIONS) {
    return row.value as CharacterId;
  }
  return DEFAULT_CHARACTER_ID;
}

/**
 * Set the selected character ID in IndexedDB progressionProfile store.
 */
export async function setSelectedCharacterId(characterId: string): Promise<boolean> {
  if (characterId in CHARACTER_DEFINITIONS) {
    await db.progressionProfile.put({
      key: 'selected_character_id',
      value: characterId,
    });
    return true;
  }
  return false;
}

/**
 * Get the full definition of the currently selected character.
 */
export async function getSelectedCharacter(): Promise<CharacterDefinition> {
  const charId = await getSelectedCharacterId();
  return getCharacterDefinition(charId);
}
