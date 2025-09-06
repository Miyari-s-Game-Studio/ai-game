

// src/lib/game-engine.ts
'use server';
import type {GameState, GameRules, LogEntry, PlayerStats, CompletedScenario, AttributeChange, PlayerAttributes} from '@/types/game';
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

async function handleEnding(rules: GameRules, state: GameState): Promise<GameState> {
    const endingSituation = rules.situations[state.situation];
    if (!endingSituation || !endingSituation.ending) {
        return state;
    }

    // Check if this specific ending has already been added to history
    const hasHistoryEntry = state.player.history?.some(h => h.rulesId === rules.id);
    if (hasHistoryEntry) {
        return state; // Avoid duplicating history on re-enter/reload
    }

    return produce(state, draft => {
        const oldAttributes = { ...initialPlayerStats.attributes }; // Assuming you can get the pre-scenario stats
        const attributeChanges: AttributeChange[] = [];

        (Object.keys(draft.player.attributes) as Array<keyof PlayerAttributes>).forEach(attr => {
            const oldValue = oldAttributes[attr] || 0;
            const newValue = draft.player.attributes[attr];
            if (newValue !== oldValue) {
                attributeChanges.push({
                    attribute: attr,
                    change: newValue - oldValue,
                    oldValue: oldValue,
                    newValue: newValue,
                });
            }
        });

        const historyEntry: CompletedScenario = {
            rulesId: rules.id,
            title: rules.title,
            completionDate: new Date().toISOString(),
            endingSituationId: draft.situation,
            endingSituationLabel: endingSituation.label,
            attributeChanges: attributeChanges,
            finalAttributes: { ...draft.player.attributes },
        };

        if (!draft.player.history) {
            draft.player.history = [];
        }
        draft.player.history.push(historyEntry);
    });
}
// This is a placeholder for where you might get the player's stats before the scenario began.
// In a real implementation, you'd fetch this from a more persistent source when the game starts.
const initialPlayerStats: PlayerStats = {
    name: "Player",
    identity: "An adventurer",
    language: 'en',
    attributes: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
    equipment: {},
    inventory: [],
    history: [],
};


export async function processAction(
  rules: GameRules,
  currentState: GameState,
  actionId: string,
  target: string | undefined,
  isSuccess: boolean,
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

        if (when.targets) {
          if (!target) continue;
          const pattern = `^(${when.targets})$`;
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
            }else if(obj === 'tracks'){
              if (draft.tracks[key]) {
                draft.tracks[key].value += val;
                if (draft.tracks[key].value > draft.tracks[key].max) {
                  draft.tracks[key].value = draft.tracks[key].max;
                }
                if (draft.tracks[key].value < 0) {
                  draft.tracks[key].value = 0;
                }
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
          case 'give_item': {
            if (params && params.id && !draft.player.inventory.find(i => i.id === params.id)) {
                draft.player.inventory.push(params);
            }
            break;
          }
          case 'remove_item': {
             draft.player.inventory = draft.player.inventory.filter(i => i.id !== params);
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
  let situationChanged = false;
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
      situationChanged = true;
      break; // Stop after the first one matches
    }
  }

  // If no auto-transition happened, check for a pending manual transition.
  if (!situationChanged && newState.next_situation && rules.situations[newState.next_situation]) {
    newState = produce(newState, draft => {
      draft.situation = draft.next_situation!;
      delete draft.next_situation;
    });
    situationChanged = true;
  }

  // If the situation has changed, check if the new situation is an ending.
  if (situationChanged) {
      newState = await handleEnding(rules, newState);
  }


  return {newState, proceduralLogs};
}
