// src/lib/game-engine.ts
'use server';
import type {GameState, GameRules, LogEntry} from '@/types/game';
import {produce} from 'immer';

function evaluateCondition(condition: string, state: GameState): boolean {
  try {
    const context = {...state};
    const func = new Function('counters', 'tracks', 'route', 'player', `return ${condition}`);
    return func(context.counters, context.tracks, context.route, context.player);
  } catch (e) {
    console.error(`Error evaluating condition: "${condition}"`, e);
    return false;
  }
}

export async function processAction(
  rules: GameRules,
  currentState: GameState,
  actionId: string,
  target: string | undefined,
  isSuccess: boolean, // <-- New parameter
  actionRulesOverride?: Record<string, any>[]
): Promise<{ newState: GameState; proceduralLogs: LogEntry[] }> {

  const proceduralLogs: LogEntry[] = [];

  let newState = produce(currentState, (draft) => {
    const situation = rules.situations[draft.situation];
    if (!situation && !actionRulesOverride) return;

    // Use override if provided, otherwise use rules from the current situation
    const actionRules = actionRulesOverride || situation.on_action;

    for (const rule of actionRules) {
      // If we are using the standard rules, we need to match actionId and target.
      // If we are using an override, we assume the rules are meant to be executed directly.
      if (!actionRulesOverride) {
        const {when} = rule;
        if (when.actionId !== actionId) {
          continue;
        }

        if (when.targetPattern) {
          if (!target) continue;
          const pattern = `^(${when.targetPattern})$`;
          if (!new RegExp(pattern, 'i').test(target)) {
            continue;
          }
        }

        if (when.textRegex && (!target || !new RegExp(when.textRegex, 'i').test(target))) {
          continue;
        }

        if (when.require && !evaluateCondition(when.require, draft)) {
          continue;
        }
      }

      // Rule matches (or is an override), execute actions
      const actions = isSuccess ? rule.do : rule.fail;

      // If there's no 'fail' block on failure, do nothing.
      if (!actions) continue;

      for (const action of actions) {
        const actionDef = action as any;

        if (actionDef.if && !evaluateCondition(actionDef.if, draft)) {
          continue;
        }

        let type: string | null = null;
        let params: any = null;
        let cap: number | undefined = undefined;

        for (const key in actionDef) {
          if (key !== 'if' && key !== 'cap') {
            type = key;
            params = actionDef[key];
          }
          if (key === 'cap') {
            cap = actionDef[key];
          }
        }

        if (!type) continue;

        switch (type) {
          case 'add': {
            const [path, valStr] = (params as string).split(',');
            const val = parseInt(valStr, 10);
            const [obj, key] = path.split('.');
            if (obj === 'counters' && typeof draft.counters[key] === 'number') {
              (draft.counters[key] as number) += val;
              if (cap !== undefined && (draft.counters[key] as number) > cap) {
                draft.counters[key] = cap;
              }
            }
            break;
          }
          case 'set': {
            const [path, valStr] = (params as string).split(',');
            const parts = path.split('.');
            if (path === 'next_situation') {
              draft.next_situation = valStr;
            } else if (parts.length === 2) {
              const [obj, key] = parts;
              if (obj === 'counters') {
                const boolVal = valStr.toLowerCase();
                if (boolVal === 'true') {
                  draft.counters[key] = true;
                } else if (boolVal === 'false') {
                  draft.counters[key] = false;
                } else {
                  draft.counters[key] = Number(valStr);
                }
              } else if (obj === 'route') {
                draft.route = valStr;
              }
            }
            break;
          }
          case 'track': {
            const [trackId, valStr] = (params as string).split(',');
            const val = parseInt(valStr, 10);
            if (draft.tracks[trackId]) {
              draft.tracks[trackId].value += val;
              if (draft.tracks[trackId].value > draft.tracks[trackId].max) {
                draft.tracks[trackId].value = draft.tracks[trackId].max;
              }
              if (draft.tracks[trackId].value < 0) {
                draft.tracks[trackId].value = 0;
              }
            }
            break;
          }
          case 'log':
          case 'secret':
          case 'agreement':
            // Don't process these actions in this special override mode
            if (!actionRulesOverride) {
              proceduralLogs.push({
                id: Date.now() + proceduralLogs.length,
                type: 'procedural',
                message: params as string
              });
            }
            break;
        }
      }

      // If we are in standard mode, break after the first matching rule is processed.
      if (!actionRulesOverride) {
        break;
      }
    }
  });

  // After processing actions, check for automatic situation transitions
  let autoTransitioned = false;
  for (const situationId in rules.situations) {
    const situation = rules.situations[situationId];
    if (situation.auto_enter_if && evaluateCondition(situation.auto_enter_if, newState)) {
      newState = produce(newState, draft => {
        draft.situation = situationId;
        // Clear any pending 'next_situation' since this auto-transition takes precedence
        if (draft.next_situation) {
          delete draft.next_situation;
        }
      });
      autoTransitioned = true;
      break; // Stop after the first one matches
    }
  }

  // If no auto-transition happened, check for a pending manual transition.
  if (!autoTransitioned && newState.next_situation && rules.situations[newState.next_situation]) {
    newState = produce(newState, draft => {
      draft.situation = draft.next_situation!;
      delete draft.next_situation;
    });
  }

  return {newState, proceduralLogs};
}
