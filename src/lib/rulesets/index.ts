
// src/lib/rulesets/index.ts
import type { GameRules } from "@/types/game";
import ecoCrisisRules from './eco_crisis.json';

// Add new ruleset imports here
// import anotherStoryRules from './another_story.json';

// A map of all available rulesets
const rulesetMap: Record<string, GameRules> = {
    'eco_crisis': ecoCrisisRules as GameRules,
    // 'another_story': anotherStoryRules as GameRules,
};

// An array of the IDs of all available rulesets
export const gameRulesets: string[] = Object.keys(rulesetMap);

/**
 * Retrieves a specific game ruleset by its ID.
 * @param id The ID of the ruleset to retrieve.
 * @returns The GameRules object, or null if not found.
 */
export function getRuleset(id: string): GameRules | null {
    return rulesetMap[id] || null;
}
