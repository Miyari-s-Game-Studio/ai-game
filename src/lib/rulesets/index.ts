// src/lib/rulesets/index.ts
'use client';
import type {GameRules} from "@/types/game";
import ecoCrisisZhRules from './eco_crisis_zh.json';
import ecoCrisisEnRules from './eco_crisis_en.json';
import tutorialZhRules from './tutorial_zh.json';

const CUSTOM_RULESET_PREFIX = 'customRuleset_';

// A map of all available built-in rulesets
const builtinRulesetMap: Record<string, GameRules> = {
  [tutorialZhRules.id]: tutorialZhRules as GameRules,
  [ecoCrisisZhRules.id]: ecoCrisisZhRules as GameRules,
  [ecoCrisisEnRules.id]: ecoCrisisEnRules as GameRules,
};

const builtinRulesetIds: string[] = Object.keys(builtinRulesetMap);

/**
 * Retrieves the IDs of all custom rulesets stored in localStorage.
 * This function should only be called on the client-side.
 * @returns An array of custom ruleset IDs.
 */
function getCustomRulesetIds(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }
  const customIds: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CUSTOM_RULESET_PREFIX)) {
      customIds.push(key.substring(CUSTOM_RULESET_PREFIX.length));
    }
  }
  return customIds;
}

/**
 * Retrieves a list of all available ruleset IDs, combining built-in and custom ones.
 * This function is client-side aware.
 * @returns An array of all game ruleset IDs.
 */
export function getAllRulesetIds(): string[] {
  const customIds = getCustomRulesetIds();
  // Use a Set to prevent duplicates, then convert back to an array
  return Array.from(new Set([...builtinRulesetIds, ...customIds]));
}

/**
 * Saves a custom game ruleset to localStorage.
 * This function should only be called on the client-side.
 * @param rules The GameRules object to save.
 */
export function saveCustomRuleset(rules: GameRules): void {
  if (typeof window === 'undefined') {
    console.error("Attempted to save custom ruleset on the server.");
    return;
  }
  const key = `${CUSTOM_RULESET_PREFIX}${rules.id}`;
  localStorage.setItem(key, JSON.stringify(rules));
}

/**
 * Deletes a custom game ruleset from localStorage.
 * @param id The ID of the custom ruleset to delete.
 */
export function deleteCustomRuleset(id: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  const key = `${CUSTOM_RULESET_PREFIX}${id}`;
  localStorage.removeItem(key);
}


/**
 * Retrieves a specific game ruleset by its ID, checking custom storage first.
 * This function is client-side aware.
 * @param id The ID of the ruleset to retrieve.
 * @returns The GameRules object, or null if not found.
 */
export function getRuleset(id: string): GameRules | null {
  if (typeof window !== 'undefined') {
    const customRulesJson = localStorage.getItem(`${CUSTOM_RULESET_PREFIX}${id}`);
    if (customRulesJson) {
      try {
        return JSON.parse(customRulesJson) as GameRules;
      } catch (e) {
        console.error(`Failed to parse custom ruleset ${id}:`, e);
        return null;
      }
    }
  }
  return builtinRulesetMap[id] || null;
}

/**
 * Checks if a given ruleset ID corresponds to a custom ruleset.
 * @param id The ID of the ruleset.
 * @returns True if it's a custom ruleset, false otherwise.
 */
export function isCustomRuleset(id: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return localStorage.getItem(`${CUSTOM_RULESET_PREFIX}${id}`) !== null;
}
