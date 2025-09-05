// src/lib/rule-validator.ts
import type { GameRules, Situation } from '@/types/game';

export type ValidationError = {
  type: 'error' | 'warning';
  message: string;
  path?: string; // e.g., "situations.start.on_action[0]"
};

export function validateRules(rules: GameRules): ValidationError[] {
  const errors: ValidationError[] = [];

  // 1. Check for required top-level fields
  const requiredFields: (keyof GameRules)[] = ['id', 'title', 'language', 'actions', 'initial', 'tracks', 'situations'];
  for (const field of requiredFields) {
    if (rules[field] === undefined || rules[field] === null) {
      errors.push({ type: 'error', message: `Missing required top-level field: "${field}".` });
    }
  }

  // If core fields are missing, don't continue validation as it will cause crashes
  if (errors.length > 0) return errors;

  // 2. Check for at least one ending situation
  const hasEnding = Object.values(rules.situations).some(s => s.ending === true);
  if (!hasEnding) {
    errors.push({ type: 'warning', message: 'No ending situation found. The game will not be able to conclude.' });
  }

  // 3. Check if the initial situation exists
  if (!rules.situations[rules.initial.situation]) {
      errors.push({ type: 'error', message: `The initial situation "${rules.initial.situation}" does not exist in the 'situations' object.` });
  }

  // 4. Check action integrity
  const definedActionIds = new Set(Object.keys(rules.actions));
  Object.entries(rules.situations).forEach(([sitId, situation]) => {
      if (!situation.on_action) return;

      situation.on_action.forEach((actionRule, index) => {
          const actionId = actionRule.when.actionId;
          if (!definedActionIds.has(actionId)) {
              errors.push({
                  type: 'error',
                  message: `Action ID "${actionId}" is used in a situation but not defined in the top-level 'actions' object.`,
                  path: `situations.${sitId}.on_action[${index}]`
              });
          }
      });
  });

  return errors;
}
