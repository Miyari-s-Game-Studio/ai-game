
// src/lib/game-engine.ts
'use server';
import type { GameState, GameRules, LogEntry } from '@/types/game';
import { defaultGameRules } from './game-rules';
import { produce } from 'immer';

function evaluateCondition(condition: string, state: GameState): boolean {
  try {
    const context = { ...state };
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
  target?: string
): Promise<{ newState: GameState; proceduralLogs: LogEntry[] }> {
  
  const proceduralLogs: LogEntry[] = [];
  
  let newState = produce(currentState, (draft) => {
    const situation = rules.situations[draft.situation];
    if (!situation) return;

    const actionRules = situation.on_action;

    for (const rule of actionRules) {
      const { when, do: actions } = rule;

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

      // Rule matches, execute actions
      for (const action of actions) {
        const actionDef = action as any;
        
        if (actionDef.if && !evaluateCondition(actionDef.if, draft)) {
            continue;
        }

        let type: string | null = null;
        let params: any = null;
        let cap: number | undefined = undefined;

        for(const key in actionDef) {
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
                    draft.counters[key] = valStr === 'true' ? true : valStr === 'false' ? false : valStr;
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
            proceduralLogs.push({ id: Date.now() + proceduralLogs.length, type: 'procedural', message: params as string });
            break;
        }
      }
      // Break after the first matching rule is processed
      break; 
    }
  });

  // After processing, check if a situation transition is pending and apply it.
  if (newState.next_situation && rules.situations[newState.next_situation]) {
    newState = produce(newState, draft => {
        draft.situation = draft.next_situation!;
        delete draft.next_situation;
    });
  }

  return { newState, proceduralLogs };
}
