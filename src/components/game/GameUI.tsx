
'use client';
import React, {useEffect, useMemo, useState, useTransition} from 'react';
import type {
  ActionCheckState,
  CharacterProfile,
  ExtractSecretInput,
  GameRules,
  GameState,
  Item,
  LogEntry,
  LogEntryChange,
  PlayerStats,
  ReachAgreementInput,
  Situation
} from '@/types/game';
import {processAction} from '@/lib/game-engine';
import {
  type ConversationOutput,
  extractSecret,
  generateCharacter,
  reachAgreement
} from '@/ai/simple/generate-conversation';

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {useToast} from '@/hooks/use-toast';
import {BookOpen, ChevronsRight, Loader2} from 'lucide-react';
import ActionPanel from './ActionPanel';
import NarrativeLog from './NarrativeLog';
import {Skeleton} from '../ui/skeleton';
import {Button} from '../ui/button';
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {LoadGameDialog, type SaveFile} from './LoadGameDialog';
import {TalkDialog} from './TalkDialog';
import {produce} from 'immer';
import {getTranslator} from '@/lib/i18n';
import {Sidebar} from '../layout/Sidebar';
import {generateSceneDescription} from "@/ai/simple/generate-scene-description";
import {generateActionNarrative} from "@/ai/simple/generate-action-narrative";
import {generateDifficultyClass, generateRelevantAttributes} from "@/ai/simple/generate-dice-check";
import {DiceRollDialog} from "@/components/game/DiceRollDialog";
import {useRouter} from 'next/navigation';
import {FightDialog} from './FightDialog';
import { InventoryDialog } from './InventoryDialog';
import HeaderStatus from './HeaderStatus';
import CountersDisplay from "./CountersDisplay";
import TrackDisplay from "./TrackDisplay";


const PLAYER_STATS_KEY = 'narrativeGamePlayer';


interface GameUIProps {
  rules: GameRules;
  initialStateOverride?: GameState | null;
  initialPlayerStats: PlayerStats;
}

const getInitialState = (rules: GameRules, playerStats: PlayerStats): GameState => {
  const finalPlayerStats = produce(playerStats, draft => {
    // Override identity and inventory if specified in rules
    if (rules.initial.identity) {
      draft.identity = rules.initial.identity;
    }
    if (rules.initial.inventory) {
      draft.inventory = rules.initial.inventory;
    }
  });

  return {
    situation: rules.initial.situation,
    counters: {...rules.initial.counters},
    tracks: JSON.parse(JSON.stringify(rules.tracks)),
    log: [],
    player: finalPlayerStats,
    characters: {},
    sceneDescriptions: {},
    actionChecks: {},
  };
};

const SAVE_PREFIX = 'narrativeGameSave_';
type ConversationFlow = (input: ExtractSecretInput | ReachAgreementInput) => Promise<ConversationOutput>;
type ConversationType = 'secret' | 'agreement';

export function GameUI({rules, initialStateOverride, initialPlayerStats}: GameUIProps) {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState>(() => {
    if (initialStateOverride) {
      return initialStateOverride;
    }
    return getInitialState(rules, initialPlayerStats);
  });
  const [sceneDescription, setSceneDescription] = useState('');
  const [isGeneratingScene, setIsGeneratingScene] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [isTalkDialogOpen, setIsTalkDialogOpen] = useState(false);
  const [isDiceRollDialogOpen, setIsDiceRollDialogOpen] = useState(false);
  const [isFightDialogOpen, setIsFightDialogOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isEnding, setIsEnding] = useState(false);


  // State for ActionPanel that is now managed here
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [targetForAction, setTargetForAction] = useState('');


  // State for the talk dialog
  const [talkTarget, setTalkTarget] = useState('');
  const [talkObjective, setTalkObjective] = useState('');
  const [conversationFlow, setConversationFlow] = useState<ConversationFlow | null>(null);
  const [conversationType, setConversationType] = useState<ConversationType>('secret');
  const [talkFollowUpActions, setTalkFollowUpActions] = useState<Record<string, any>[]>([]);
  const [characterProfile, setCharacterProfile] = useState<CharacterProfile | null>(null);
  const [isGeneratingCharacter, setIsGeneratingCharacter] = useState(false);

  // State for Dice Roll
  const [diceRollActionId, setDiceRollActionId] = useState<string | null>(null);
  const [diceRollTarget, setDiceRollTarget] = useState<string | undefined>(undefined);
  const [diceRollActionCheck, setDiceRollActionCheck] = useState<ActionCheckState | null>(null);
  const [isGeneratingDiceCheck, setIsGeneratingDiceCheck] = useState(false);

  // State for Fight
  const [fightTarget, setFightTarget] = useState<PlayerStats | null>(null);


  const [saveFiles, setSaveFiles] = useState<SaveFile[]>([]);
  const {toast} = useToast();

  const t = useMemo(() => getTranslator(rules.language), [rules.language]);

  const currentSituation: Situation | undefined = rules.situations[gameState.situation];

  const allowedActions = useMemo(() => {
    if (!currentSituation) return [];
    let actionIds = currentSituation.on_action.map(rule => rule.when.actionId);
    if (currentSituation.ending) {
      // Automatically add "reflect" or "celebrate" to endings
      if (currentSituation.label.toLowerCase().includes('success') || currentSituation.label.toLowerCase().includes('restored') || currentSituation.label.toLowerCase().includes('celebrate')) {
        actionIds.push('celebrate');
      } else {
        actionIds.push('reflect');
      }
    }
    return [...new Set(actionIds)];
  }, [currentSituation]);

  const knownTargets = useMemo(() => {
    if (!currentSituation) return [];
    const targets = new Set<string>();
    currentSituation.on_action.forEach(rule => {
      if (rule.when.targets) {
        rule.when.targets.split('|').forEach(target => targets.add(target.trim()));
      }
    });
    return Array.from(targets);
  }, [currentSituation]);

  useEffect(() => {
    if (currentSituation) {
      if (currentSituation.ending) {
        setIsEnding(true);
        // Save the final player state to local storage when an ending is reached.
        localStorage.setItem(PLAYER_STATS_KEY, JSON.stringify(gameState.player));
      } else {
        setIsEnding(false);
      }
      generateNewScene(gameState.situation, currentSituation);
    }
  }, [gameState.situation]);

  const generateNewScene = async (situationId: string, situation: Situation) => {
    // Check cache first
    const cachedDescription = gameState.sceneDescriptions[situationId];
    if (cachedDescription) {
      setSceneDescription(cachedDescription);
      setIsGeneratingScene(false);
      return;
    }

    // If not in cache, generate it
    setIsGeneratingScene(true);
    setSceneDescription('');

    // For situations without a description (like endings), use the label.
    if (!situation.description) {
      setSceneDescription(situation.label);
      setIsGeneratingScene(false);
      return;
    }

    try {
      const result = await generateSceneDescription({
        language: rules.language,
        background: rules.description,
        situation: situation.description,
        knownTargets: knownTargets,
      });
      const newDescription = result.sceneDescription;
      setSceneDescription(newDescription);

      // Save to cache in game state
      setGameState(produce(draft => {
        draft.sceneDescriptions[situationId] = newDescription;
      }));

    } catch (error) {
      console.error('Failed to generate scene description:', error);
      toast({
        variant: 'destructive',
        title: t.error,
        description: t.failedToGenerateScene,
      });
      setSceneDescription(`${t.error}: ${t.failedToGenerateScene}`);
    } finally {
      setIsGeneratingScene(false);
    }
  };

  const handleSaveGame = () => {
    try {
      const saveKey = `${SAVE_PREFIX}${rules.id}_${new Date().toISOString()}`;
      localStorage.setItem(saveKey, JSON.stringify(gameState));
      toast({
        title: t.gameSaved,
        description: `${rules.title} - ${new Date().toLocaleString()}`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t.saveFailed,
        description: 'Could not save your game. The browser may be out of space.',
      });
    }
  }

  const findSaveFiles = () => {
    const saves: SaveFile[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(SAVE_PREFIX)) {
        try {
          const state: GameState = JSON.parse(localStorage.getItem(key) || '{}');

          const keyWithoutPrefix = key.substring(SAVE_PREFIX.length);

          const lastUnderscoreIndex = keyWithoutPrefix.lastIndexOf('_');

          if (lastUnderscoreIndex === -1) continue;

          const ruleId = keyWithoutPrefix.substring(0, lastUnderscoreIndex);
          const timestamp = keyWithoutPrefix.substring(lastUnderscoreIndex + 1);

          // Only show saves for the current game
          if (ruleId !== rules.id) continue;

          const title = rules.title;

          saves.push({key, title, timestamp, state});
        } catch {
        }
      }
    }
    setSaveFiles(saves.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  }

  const handleOpenLoadDialog = () => {
    findSaveFiles();
    setIsLoadDialogOpen(true);
  }

  const handleLoadGame = (saveFile: SaveFile) => {
    setGameState(saveFile.state);
    setIsLoadDialogOpen(false);
    toast({
      title: t.gameLoaded,
      description: 'Your progress has been restored.',
    });
  }

  const handleDeleteSave = (key: string) => {
    localStorage.removeItem(key);
    findSaveFiles(); // Refresh the list
    toast({
      title: t.saveDeleted,
      description: 'The selected save file has been removed.',
    });
  }

  const handleTalk = async (target: string) => {
    if (!currentSituation || !sceneDescription) return;

    const talkRule = currentSituation.on_action.find(rule =>
      rule.when.actionId === 'talk' &&
      rule.when.targets &&
      new RegExp(`^(${rule.when.targets})$`, 'i').test(target)
    );

    if (!talkRule) {
      toast({variant: 'destructive', title: 'Action Error', description: `No talk rule found for target: ${target}`});
      return;
    }

    const secretAction = talkRule.do.find(action => action.secret);
    const agreementAction = talkRule.do.find(action => action.agreement);
    let objective = "No specific objective.";
    let flow: ConversationFlow | null = null;
    let type: ConversationType = 'secret';

    if (secretAction) {
      objective = secretAction.secret as string;
      flow = extractSecret as ConversationFlow;
      type = 'secret';
    } else if (agreementAction) {
      objective = agreementAction.agreement as string;
      flow = reachAgreement as ConversationFlow;
      type = 'agreement';
    } else {
      toast({
        variant: 'destructive',
        title: 'Action Error',
        description: `Talk action for ${target} has no secret or agreement objective.`
      });
      return;
    }

    setTalkTarget(target);
    setTalkObjective(objective);
    setConversationFlow(() => flow);
    setConversationType(type);
    setTalkFollowUpActions(talkRule.do.filter(action => !action.secret && !action.agreement));

    // Check for existing character profile
    const existingProfile = gameState.characters?.[target];
    if (existingProfile) {
      setCharacterProfile(existingProfile);
      setIsTalkDialogOpen(true);
      return;
    }

    // If no profile, generate one
    setIsGeneratingCharacter(true);
    try {
      const profile = await generateCharacter({
        language: rules.language,
        situationLabel: currentSituation?.label || 'An unknown location',
        target: target,
      });

      // Save the new profile to the game state
      setGameState(produce(draft => {
        if (!draft.characters) {
          draft.characters = {};
        }
        draft.characters[target] = profile;
      }));

      setCharacterProfile(profile);
      setIsTalkDialogOpen(true);

    } catch (error) {
      console.error('Failed to generate character:', error);
      toast({
        variant: 'destructive',
        title: 'AI Error',
        description: 'Could not create a character to talk to. Please try again.',
      });
    } finally {
      setIsGeneratingCharacter(false);
    }
  };

  const handleEndTalk = (conversationLog: LogEntry[], objectiveAchieved: boolean) => {
    setGameState(prevState => ({
      ...prevState,
      log: [...prevState.log, ...conversationLog],
    }));

    if (objectiveAchieved) {
      executeAction('talk-objective-complete', undefined, true, talkFollowUpActions);
    } else {
      startTransition(async () => {
        const finalSummary = `Finished a conversation with ${talkTarget} without achieving the objective.`;
        const summaryLog: LogEntry = {id: Date.now(), type: 'procedural', message: finalSummary};
        setGameState(prevState => ({
          ...prevState,
          log: [...prevState.log, summaryLog],
        }));
      });
    }

    setTalkTarget('');
    setCharacterProfile(null);
    setTalkObjective('');
    setConversationFlow(null);
    setTalkFollowUpActions([]);
  };

  const handleItemAction = (action: 'use' | 'discard' | 'equip' | 'unequip', item: Item) => {
      if (!gameState.player) return;

      const newStats = produce(gameState.player, draft => {
          if (action === 'discard') {
              draft.inventory = draft.inventory.filter(i => i.id !== item.id);
          } else if (action === 'equip') {
              if (item.slot) {
                  // Unequip any existing item in the same slot
                  const currentItemInSlot = draft.inventory.find(i => i.slot === item.slot && draft.equipment[item.slot!] === i.name);
                  if (currentItemInSlot) {
                      // No action needed on item itself, just update equipment
                  }
                  draft.equipment[item.slot] = item.name;
              }
          } else if (action === 'unequip') {
              if (item.slot && draft.equipment[item.slot] === item.name) {
                  delete draft.equipment[item.slot];
              }
          } else if (action === 'use') {
              // Placeholder for using items.
              console.log(`Attempted to use item: ${item.name}`);
              alert(`Using '${item.name}' is not yet implemented.`);
              return; // Don't update state if action is not implemented
          }
      });

      // This is a complex state update. We need to update player stats inside gameState
      // AND persist the new player stats to local storage.
      setGameState(produce(draft => {
          draft.player = newStats;
      }));
      try {
        // Also save the updated player stats to the master record.
        localStorage.setItem(PLAYER_STATS_KEY, JSON.stringify(newStats));
      } catch (e) {
        console.error("Failed to update player stats in storage.", e);
      }
  };


  if (!currentSituation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.error}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{t.invalidSituation} `({gameState.situation})`</p>
          <p>{t.pleaseCheckRules}</p>
        </CardContent>
      </Card>
    );
  }

  const handleAction = async (actionId: string, target?: string) => {
    // Reset selection after execution
    setSelectedAction(null);
    setTargetForAction('');

    // Talk has its own handler
    if (actionId === 'talk') {
      if (target) handleTalk(target);
      return;
    }

    if (actionId === 'fight') {
      // For now, create a default enemy. This can be expanded later.
      const enemy: PlayerStats = {
        name: target || "Guard",
        identity: "A tough-looking guard",
        language: 'en',
        attributes: {strength: 11, dexterity: 11, constitution: 12, intelligence: 9, wisdom: 10, charisma: 9},
        equipment: {},
        inventory: [],
        history: [],
      };
      setFightTarget(enemy);
      setIsFightDialogOpen(true);
      return;
    }

    if (isEnding) {
      if (actionId === 'reflect' || actionId === 'celebrate') {
        router.push('/');
      }
      return;
    }

    // Find the relevant action rule to see if a dice roll is needed.
    const actionRule = currentSituation?.on_action.find(r => {
      if (r.when.actionId !== actionId) return false;
      if (!r.when.targets && target) return false; // Rule needs no target, but one was provided
      if (r.when.targets && !target) return false; // Rule needs a target, but none provided
      if (r.when.targets && target && !new RegExp(`^(${r.when.targets})$`, 'i').test(target)) return false; // Target doesn't match pattern
      return true;
    });

    const requiresDiceRoll = actionRule && actionRule.fail && actionRule.fail.length > 0;

    if (!requiresDiceRoll) {
      // No dice roll needed, execute action directly as success.
      executeAction(actionId, target, true);
      return;
    }


    // 1. Check if a dice roll is needed
    const checkId = `${actionId}${target ? `_${target}` : ''}`;
    const existingCheck = gameState.actionChecks[checkId];

    if (!existingCheck || !existingCheck.hasPassed) {
      // 2. If no check exists, or it hasn't been passed, initiate dice roll
      setIsGeneratingDiceCheck(true);
      setDiceRollActionId(actionId);
      setDiceRollTarget(target);


      try {
        let checkToUse = existingCheck;
        // If check doesn't exist at all, generate it
        if (!checkToUse) {
          const actionDetail = rules.actions[actionId];
          const {relevantAttributes} = await generateRelevantAttributes({
            language: rules.language,
            player: gameState.player,
            action: actionDetail,
            situation: currentSituation
          });
          const {difficultyClass} = await generateDifficultyClass({
            language: rules.language,
            action: actionDetail,
            situation: currentSituation,
            relevantAttributes,
          });
          checkToUse = {relevantAttributes, difficultyClass, hasPassed: false};
        }

        setDiceRollActionCheck(checkToUse);
        setIsDiceRollDialogOpen(true);

      } catch (error) {
        console.error("Failed to generate dice check parameters:", error);
        toast({variant: 'destructive', title: 'AI Error', description: 'Could not prepare the action check.'});
      } finally {
        setIsGeneratingDiceCheck(false);
      }
    } else {
      executeAction(actionId, target, true);
    }
  };


  const handleDiceRollComplete = (passed: boolean) => {
    if (!diceRollActionId || !diceRollActionCheck) return;

    const checkId = `${diceRollActionId}${diceRollTarget ? `_${diceRollTarget}` : ''}`;
    const newCheckState = {...diceRollActionCheck, hasPassed: passed};

    // Update game state with the result
    setGameState(produce(draft => {
      draft.actionChecks[checkId] = newCheckState;
    }));

    setIsDiceRollDialogOpen(false);

    const actionRule = currentSituation?.on_action.find(r => r.when.actionId === diceRollActionId && (!r.when.targets || (diceRollTarget && new RegExp(r.when.targets).test(diceRollTarget))));

    // If passed, or if failed but there's a `fail` block, execute the action
    if (passed || (!passed && actionRule?.fail)) {
      executeAction(diceRollActionId, diceRollTarget, passed);
    } else if (!passed) {
      toast({
        variant: 'destructive',
        title: "Check Failed",
        description: "You failed the skill check for this action.",
      });
    }

    setDiceRollActionId(null);
    setDiceRollTarget(undefined);
    setDiceRollActionCheck(null);
  };

  const handleFightComplete = (result: 'win' | 'loss') => {
    setIsFightDialogOpen(false);

    // For now, just log the result. This can be expanded to trigger a `do` or `fail` block.
    const resultLog: LogEntry = {
      id: Date.now(),
      type: 'procedural',
      message: `You ${result} the fight against ${fightTarget?.name || 'the enemy'}.`,
    };
    setGameState(produce(draft => {
      draft.log.push(resultLog);
    }));
    if (result === 'win') {
      executeAction('fight', fightTarget?.name, true);
    }
    setFightTarget(null);

  }


  const executeAction = async (actionId: string, target: string | undefined, isSuccess: boolean, actionRulesOverride?: any[]) => {
    startTransition(async () => {
      try {
        const oldState = gameState;

        const actionLog: LogEntry = {
          id: Date.now(),
          type: 'action',
          message: `Action: ${actionId}` + (target ? ` - Target: ${target}` : '') + ` - Success: ${isSuccess}`,
        };

        const {newState, proceduralLogs: engineLogs} = await processAction(
          rules,
          oldState,
          actionId,
          target,
          isSuccess,
          actionRulesOverride
        );

        localStorage.setItem(PLAYER_STATS_KEY, JSON.stringify(newState.player));

        const changes: LogEntryChange[] = [];

        // Compare tracks for changes
        Object.entries(newState.tracks).forEach(([trackId, newTrack]) => {
          const oldTrack = oldState.tracks[trackId];
          if (oldTrack && oldTrack.value !== newTrack.value) {
            const diff = newTrack.value - oldTrack.value;
            const style = rules.ui?.trackStyles?.[trackId];
            changes.push({
              id: trackId,
              name: newTrack.name,
              delta: diff,
              icon: style?.icon || 'TrendingUp',
              color: style?.color || 'text-primary',
            });
          }
        });

        // Compare counters for changes
        Object.entries(newState.counters).forEach(([counterId, newValue]) => {
          const oldValue = oldState.counters[counterId];
          if (oldValue !== undefined && oldValue !== newValue) {
            const formattedId = counterId.replace(/_/g, ' ');
            if (typeof newValue === 'number' && typeof oldValue === 'number') {
              const diff = newValue - oldValue;
              if (diff !== 0) {
                const icon = rules.ui?.counterIcons?.[counterId] || rules.ui?.counterIcons?.default || 'Star';
                changes.push({
                  id: counterId,
                  name: formattedId,
                  delta: diff,
                  icon: icon,
                  color: 'text-primary'
                });
              }
            } else if (typeof newValue === 'boolean' && newValue !== oldValue) {
              const icon = rules.ui?.counterIcons?.[counterId] || rules.ui?.counterIcons?.default || 'Star';
              changes.push({
                id: counterId,
                name: formattedId,
                delta: newValue ? 1 : -1, // Represent boolean change as +/- 1
                icon: icon,
                color: 'text-primary'
              });
            }
          }
        });

        // Check for situation change
        if (newState.next_situation) {
          changes.push({
            id: 'next_situation',
            name: 'Next Situation',
            delta: 1, // Represents a positive change
            icon: 'ChevronsRight',
            color: 'text-primary'
          });
        }


        const newSituation = rules.situations[newState.situation];
        const newActionRules = newSituation.on_action;
        const newTargets = newActionRules.flatMap(rule => rule.when.targets?.split('|') || []);

        const sceneDesc = newSituation.description || newSituation.label;

        const narrativeInput = {
          language: rules.language,
          situationLabel: newSituation.label,
          sceneDescription: sceneDesc,
          actionTaken: `${actionId} ${target || ''}`.trim(),
          proceduralLogs: engineLogs.map(l => l.message),
          knownTargets: [...new Set(newTargets)],
        };

        const narrativeOutput = await generateActionNarrative(narrativeInput);

        const narrativeLog: LogEntry = {
          id: Date.now() + 1,
          type: 'narrative',
          message: narrativeOutput.narrative,
          changes: changes.length > 0 ? changes : undefined,
        };

        setGameState(prevState => ({
          ...newState,
          log: [...prevState.log, actionLog, ...engineLogs, narrativeLog],
        }));

      } catch (error) {
        console.error('Error processing action:', error);
        toast({
          variant: 'destructive',
          title: t.error,
          description: t.failedToProcessAction,
        });
      }
    });
  };


  const handleTargetClick = (actionId: string, target: string) => {
    setSelectedAction(actionId);
    setTargetForAction(target);
  };
  
  const handleLogTargetClick = (target: string) => {
    if (selectedAction) {
        setTargetForAction(target);
    }
  };

  const isLoading = isPending || isGeneratingScene || isGeneratingCharacter || isGeneratingDiceCheck;


  return (
    <>
      <Sidebar
        rules={rules}
        playerStats={gameState.player}
        onSave={handleSaveGame}
        onLoad={handleOpenLoadDialog}
        isPending={isLoading}
        onOpenInventory={() => setIsInventoryOpen(true)}
      />
      <main className="flex-1 flex flex-col overflow-hidden p-4 md:p-8 space-y-4">
        <LoadGameDialog
          isOpen={isLoadDialogOpen}
          onOpenChange={setIsLoadDialogOpen}
          saveFiles={saveFiles}
          onLoad={handleLoadGame}
          onDelete={handleDeleteSave}
          language={rules.language}
        />
        <TalkDialog
          isOpen={isTalkDialogOpen}
          onOpenChange={setIsTalkDialogOpen}
          target={talkTarget}
          objective={talkObjective}
          sceneDescription={currentSituation.description || currentSituation.label}
          conversationType={conversationType}
          characterProfile={characterProfile}
          playerIdentity={gameState.player.identity}
          isGenerating={isGeneratingCharacter}
          onConversationEnd={handleEndTalk}
          conversationFlow={conversationFlow}
          language={rules.language}
        />
        <DiceRollDialog
          isOpen={isDiceRollDialogOpen}
          onOpenChange={setIsDiceRollDialogOpen}
          rules={rules}
          situation={currentSituation}
          actionId={diceRollActionId || ''}
          target={diceRollTarget}
          actionCheck={diceRollActionCheck}
          playerStats={gameState.player}
          isGenerating={isGeneratingDiceCheck}
          onRollComplete={handleDiceRollComplete}
          language={rules.language}
        />
        <InventoryDialog
            isOpen={isInventoryOpen}
            onOpenChange={setIsInventoryOpen}
            inventory={gameState.player.inventory}
            equipment={gameState.player.equipment}
            onItemAction={handleItemAction}
            language={gameState.player.language}
        />
        {fightTarget && (
          <FightDialog
            isOpen={isFightDialogOpen}
            onOpenChange={setIsFightDialogOpen}
            player={gameState.player}
            enemy={fightTarget}
            onFightComplete={handleFightComplete}
            language={rules.language}
          />
        )}

        <HeaderStatus
          tracks={gameState.tracks}
          counters={gameState.counters}
          rules={rules}
          language={rules.language}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 overflow-hidden">
          <div className="lg:col-span-2 space-y-6 flex flex-col">
            <Card className="flex flex-col flex-grow">
              <CardHeader>
                <CardTitle className="text-2xl font-headline">
                  {isEnding ? "Scenario Complete" : t.currentSituation}: {currentSituation.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow overflow-y-auto pr-4">
                {isGeneratingScene ? (
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-full"/>
                    <Skeleton className="h-6 w-full"/>
                    <Skeleton className="h-6 w-5/6"/>
                  </div>
                ) : (
                  <div className="text-foreground/90 whitespace-pre-wrap">
                    <NarrativeLog
                      log={[{id: 0, type: 'narrative', message: sceneDescription}]}
                      knownTargets={knownTargets}
                      actionRules={currentSituation.on_action}
                      actionDetails={rules.actions}
                      allowedActions={allowedActions}
                      onTargetClick={handleTargetClick}
                      onLogTargetClick={handleLogTargetClick}
                      selectedAction={selectedAction}
                      language={rules.language}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <div>
              {isLoading && !isEnding ? (
                <div className="flex items-center justify-center p-8 rounded-lg border bg-background/60">
                  <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                  <p className="ml-4 text-lg">
                    {isGeneratingScene ? t.loadingScene :
                      isGeneratingCharacter ? t.characterApproaching :
                        isGeneratingDiceCheck ? t.aiCalculatingAction :
                          t.aiCraftingStory}
                  </p>
                </div>
              ) : (
                <ActionPanel
                  rules={rules}
                  allowedActions={allowedActions}
                  actionDetails={rules.actions}
                  actionRules={currentSituation.on_action}
                  onAction={handleAction}
                  disabled={isLoading}
                  selectedAction={selectedAction}
                  onSelectedActionChange={setSelectedAction}
                  target={targetForAction}
                  onTargetChange={setTargetForAction}
                />
              )}
            </div>
          </div>

          <Card className="lg:col-span-1 flex flex-col">
            <CardHeader>
              <CardTitle className="text-xl font-headline">{t.fullActionLog}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden">
                <NarrativeLog
                    log={gameState.log}
                    knownTargets={knownTargets}
                    actionRules={currentSituation.on_action}
                    actionDetails={rules.actions}
                    allowedActions={allowedActions}
                    onTargetClick={handleTargetClick}
                    onLogTargetClick={handleLogTargetClick}
                    selectedAction={selectedAction}
                    isScrollable={true}
                    language={rules.language}
                />
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
