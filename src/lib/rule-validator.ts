// src/lib/rule-validator.ts
import type { GameRules, Situation, DoAction } from '@/types/game';

export type ValidationError = {
  type: 'error' | 'warning';
  message: string;
  path?: string; // e.g., "situations.start.on_action[0]"
};

const check = (errors: ValidationError[], condition: boolean, type: 'error' | 'warning', message: string, path?: string) => {
    if (!condition) {
        errors.push({ type, message, path });
    }
};

export function validateRules(rules: GameRules): ValidationError[] {
  const errors: ValidationError[] = [];

  // 1. Check for required top-level fields
  const requiredFields: (keyof GameRules)[] = ['id', 'title', 'language', 'actions', 'initial', 'tracks', 'situations'];
  for (const field of requiredFields) {
    check(errors, rules[field] !== undefined && rules[field] !== null, 'error', `Missing required top-level field: "${field}".`);
  }
  if (errors.length > 0) return errors; // Stop if basic structure is wrong

  // 2. Deep validation of all sections
  validateActions(rules, errors);
  validateInitial(rules, errors);
  validateTracks(rules, errors);
  validateSituations(rules, errors);
  
  // 3. Global cross-cutting checks
  // Check for at least one ending situation
  const hasEnding = Object.values(rules.situations).some(s => s.ending === true);
  check(errors, hasEnding, 'warning', 'No ending situation found. The game will not be able to conclude.');

  return errors;
}

function validateActions(rules: GameRules, errors: ValidationError[]) {
    check(errors, typeof rules.actions === 'object' && !Array.isArray(rules.actions), 'error', "'actions' must be an object.", 'actions');
    for (const actionId in rules.actions) {
        const path = `actions.${actionId}`;
        const action = rules.actions[actionId];
        check(errors, typeof action === 'object' && !Array.isArray(action), 'error', 'Each action must be an object.', path);
        check(errors, typeof action.label === 'string', 'error', "Missing required 'label' string.", path);
        check(errors, typeof action.icon === 'string', 'error', "Missing required 'icon' string.", path);
    }
}

function validateInitial(rules: GameRules, errors: ValidationError[]) {
    const path = 'initial';
    check(errors, typeof rules.initial === 'object' && !Array.isArray(rules.initial), 'error', "'initial' must be an object.", path);
    check(errors, typeof rules.initial.situation === 'string', 'error', "initial.situation must be a string.", `${path}.situation`);
    check(errors, rules.situations[rules.initial.situation] !== undefined, 'error', `The initial situation "${rules.initial.situation}" does not exist in 'situations'.`, `${path}.situation`);
    check(errors, typeof rules.initial.counters === 'object' && !Array.isArray(rules.initial.counters), 'error', "'initial.counters' must be an object.", `${path}.counters`);
}

function validateTracks(rules: GameRules, errors: ValidationError[]) {
    check(errors, typeof rules.tracks === 'object' && !Array.isArray(rules.tracks), 'error', "'tracks' must be an object.", 'tracks');
    for (const trackId in rules.tracks) {
        const path = `tracks.${trackId}`;
        const track = rules.tracks[trackId];
        check(errors, typeof track === 'object' && !Array.isArray(track), 'error', 'Each track must be an object.', path);
        check(errors, typeof track.name === 'string', 'error', "Missing required 'name' string.", path);
        check(errors, typeof track.value === 'number', 'error', "Missing required 'value' number.", path);
        check(errors, typeof track.max === 'number', 'error', "Missing required 'max' number.", path);
    }
}

function validateSituations(rules: GameRules, errors: ValidationError[]) {
    const definedActionIds = new Set(Object.keys(rules.actions));
    check(errors, typeof rules.situations === 'object' && !Array.isArray(rules.situations), 'error', "'situations' must be an object.", 'situations');

    for (const sitId in rules.situations) {
        const sitPath = `situations.${sitId}`;
        const situation = rules.situations[sitId];
        check(errors, typeof situation === 'object' && !Array.isArray(situation), 'error', 'Each situation must be an object.', sitPath);
        check(errors, typeof situation.label === 'string', 'error', "Missing required 'label' string.", sitPath);
        check(errors, Array.isArray(situation.on_action), 'error', "Missing required 'on_action' array.", sitPath);

        if (!Array.isArray(situation.on_action)) continue;

        situation.on_action.forEach((actionRule, index) => {
            const rulePath = `${sitPath}.on_action[${index}]`;
            check(errors, typeof actionRule === 'object' && !Array.isArray(actionRule), 'error', 'Each rule in on_action must be an object.', rulePath);
            
            // Validate 'when' block
            check(errors, typeof actionRule.when === 'object' && !Array.isArray(actionRule.when), 'error', "Missing required 'when' object.", `${rulePath}.when`);
            if (actionRule.when) {
                check(errors, typeof actionRule.when.actionId === 'string', 'error', "Missing required 'actionId' string in 'when' block.", `${rulePath}.when`);
                if (actionRule.when.actionId) {
                    check(errors, definedActionIds.has(actionRule.when.actionId), 'error', `Action ID "${actionRule.when.actionId}" is used but not defined in the top-level 'actions' object.`, `${rulePath}.when.actionId`);
                }
            }

            // Validate 'do' block
            check(errors, Array.isArray(actionRule.do), 'error', "Missing required 'do' array.", `${rulePath}.do`);
            if (actionRule.do) {
                validateEffectList(actionRule.do, `${rulePath}.do`, errors);
            }

            // Validate 'fail' block if it exists
            if (actionRule.fail) {
                 check(errors, Array.isArray(actionRule.fail), 'error', "'fail' must be an array if it exists.", `${rulePath}.fail`);
                 validateEffectList(actionRule.fail, `${rulePath}.fail`, errors);
            }
        });
    }
}

function validateEffectList(effects: DoAction[], path: string, errors: ValidationError[]) {
    effects.forEach((effect, index) => {
        const effectPath = `${path}[${index}]`;
        check(errors, typeof effect === 'object' && !Array.isArray(effect), 'error', 'Each effect must be an object.', effectPath);
        const keys = Object.keys(effect).filter(k => k !== 'if' && k !== 'cap');
        check(errors, keys.length === 1, 'error', `Each effect must have exactly one action key (e.g., "add", "set"). Found: ${keys.join(', ')}`, effectPath);

        if ('log' in effect) {
            check(errors, index === effects.length - 1, 'error', "The 'log' effect must be the last item in an effects list.", effectPath);
        }
    });
}
