// src/app/play_v2/[rulesId]/page.tsx
'use client';
import React, {useEffect, useMemo, useState, useTransition} from 'react';
import {getRuleset} from '@/lib/rulesets';
import type {
  PlayerStats,
  GameRules,
  GameState,
  ActionCheckState,
  CharacterProfile,
  ExtractSecretInput,
  Item,
  LogEntry,
  LogEntryChange,
  ReachAgreementInput,
  Situation,
  ActionDetail
} from '@/types/game';
import {useTheme} from '@/components/layout/ThemeProvider';
import {notFound, redirect, useParams, useRouter} from 'next/navigation';
import {v4 as uuidv4} from 'uuid';
import {produce} from 'immer';
import {useToast} from '@/hooks/use-toast';
import {getTranslator} from '@/lib/i18n';
import {processAction} from '@/lib/game-engine';
import {generateSceneDescription} from "@/ai/simple/generate-scene-description";
import {generateActionNarrative} from "@/ai/simple/generate-action-narrative";
import {generateCharacter, extractSecret, reachAgreement, type ConversationOutput} from '@/ai/simple/generate-conversation';
import {generateDifficultyClass, generateRelevantAttributes} from "@/ai/simple/generate-dice-check";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Gamepad2, Home, Save, User, Wrench } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadGameDialog, type SaveFile } from '@/components/game/LoadGameDialog';
import { DiceRollDialog } from '@/components/game/DiceRollDialog';
import { InventoryDialog } from '@/components/game/InventoryDialog';
import { LatestResultModal } from '@/components/game/LatestResultModal';
import { FightDialog } from '@/components/game/FightDialog';
import { TalkScreen } from '@/components/game/TalkScreen';
import { GameView } from '@/components/game/v2/GameView';
import { CharacterView } from '@/components/game/v2/CharacterView';
import { SavesView } from '@/components/game/v2/SavesView';
import { cn } from '@/lib/utils';


const STATE_TO_LOAD_KEY = 'narrativeGameStateToLoad';
const PLAYERS_KEY = 'narrativeGame_players';
const ACTIVE_PLAYER_ID_KEY = 'narrativeGame_activePlayerId';
const PLAYER_STATS_TO_LOAD_KEY = 'narrativePlayerStatsToLoad';

const SAVE_PREFIX = 'narrativeGameSave_';
type ConversationFlow = (input: ExtractSecretInput | ReachAgreementInput) => Promise<ConversationOutput>;
type ConversationType = 'secret' | 'agreement';

export default function PlayPageV2() {
  const router = useRouter();
  const params = useParams();
  const rulesId = Array.isArray(params.rulesId) ? params.rulesId[0] : params.rulesId;

  const {initializeTheme} = useTheme();
  const {toast} = useToast();

  const [rules, setRules] = useState<GameRules | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialStateOverride, setInitialStateOverride] = useState<GameState | null>(null);
  const [initialPlayerStats, setInitialPlayerStats] = useState<PlayerStats | null>(null);

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [sceneDescription, setSceneDescription] = useState('');
  const [isGeneratingScene, setIsGeneratingScene] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [activeView, setActiveView] = useState<'game' | 'character' | 'saves' | 'talk'>('game');
  
  // Dialogs and Modals state
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [isDiceRollDialogOpen, setIsDiceRollDialogOpen] = useState(false);
  const [isFightDialogOpen, setIsFightDialogOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isLatestResultModalOpen, setIsLatestResultModalOpen] = useState(false);
  const [latestNarrative, setLatestNarrative] = useState<LogEntry[]>([]);

  // Action Panel State
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [targetForAction, setTargetForAction] = useState('');

  // Talk Screen State
  const [talkTarget, setTalkTarget] = useState('');
  const [talkObjective, setTalkObjective] = useState('');
  const [conversationFlow, setConversationFlow] = useState<ConversationFlow | null>(null);
  const [conversationType, setConversationType] = useState<ConversationType>('secret');
  const [talkFollowUpActions, setTalkFollowUpActions] = useState<Record<string, any>[]>([]);
  const [characterProfile, setCharacterProfile] = useState<CharacterProfile | null>(null);
  const [isGeneratingCharacter, setIsGeneratingCharacter] = useState(false);

  // Dice Roll State
  const [diceRollActionId, setDiceRollActionId] = useState<string | null>(null);
  const [diceRollTarget, setDiceRollTarget] = useState<string | undefined>(undefined);
  const [diceRollActionCheck, setDiceRollActionCheck] = useState<ActionCheckState | null>(null);
  const [isGeneratingDiceCheck, setIsGeneratingDiceCheck] = useState(false);

  // Fight State
  const [fightTarget, setFightTarget] = useState<PlayerStats | null>(null);

  // Save/Load State
  const [saveFiles, setSaveFiles] = useState<SaveFile[]>([]);
  
  // Derived State
  const t = useMemo(() => getTranslator(rules?.language || 'en'), [rules]);
  const currentSituation: Situation | undefined = useMemo(() => rules && gameState ? rules.situations[gameState.situation] : undefined, [rules, gameState]);
  const isEnding = currentSituation?.ending === true;

  const { allowedActions, actionDetails } = useMemo(() => {
    if (!currentSituation || !rules) return { allowedActions: [], actionDetails: {} };
    
    let actionIds = currentSituation.on_action.map(rule => rule.when.actionId);
    const newActionDetails: Record<string, ActionDetail> = { ...rules.actions };

    if (isEnding) {
      actionIds = ['__end_scenario__'];
      newActionDetails['__end_scenario__'] = {
        icon: "LogOut",
        label: t.endScenario,
        description: t.endScenarioDescription
      };
    }
    return { 
      allowedActions: [...new Set(actionIds)], 
      actionDetails: newActionDetails 
    };
  }, [currentSituation, rules, isEnding, t]);

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


  // Initial load effect
  useEffect(() => {
    if (!rulesId) return;

    const loadedRules = getRuleset(rulesId);
    if (!loadedRules) {
      notFound();
      return;
    }

    setRules(loadedRules);
    initializeTheme(loadedRules);

    const stateToLoadJson = sessionStorage.getItem(STATE_TO_LOAD_KEY);
    if (stateToLoadJson) {
      try {
        const stateToLoad: GameState = JSON.parse(stateToLoadJson);
        setInitialStateOverride(stateToLoad);
        setInitialPlayerStats(stateToLoad.player);
        sessionStorage.removeItem(STATE_TO_LOAD_KEY);
        setIsLoading(false);
        return;
      } catch (e) {
        console.error("Failed to parse game state from session storage", e);
        sessionStorage.removeItem(STATE_TO_LOAD_KEY);
      }
    }

    const playerStatsToLoadJson = sessionStorage.getItem(PLAYER_STATS_TO_LOAD_KEY);
    if (playerStatsToLoadJson) {
        try {
            const playerStatsToLoad: PlayerStats = JSON.parse(playerStatsToLoadJson);
            setInitialPlayerStats(playerStatsToLoad);
            sessionStorage.removeItem(PLAYER_STATS_TO_LOAD_KEY);
        } catch (e) {
            console.error("Failed to parse player stats from session storage", e);
            sessionStorage.removeItem(PLAYER_STATS_TO_LOAD_KEY);
            redirect('/');
            return;
        }
    } else {
        const activePlayerId = localStorage.getItem(ACTIVE_PLAYER_ID_KEY);
        const allPlayersJson = localStorage.getItem(PLAYERS_KEY);
        if (activePlayerId && allPlayersJson) {
            try {
                const allPlayers = JSON.parse(allPlayersJson);
                const activePlayer = allPlayers.find((p: PlayerStats) => p.id === activePlayerId);
                if (activePlayer) {
                    setInitialPlayerStats(activePlayer);
                } else {
                    redirect('/');
                    return;
                }
            } catch (e) {
                console.error("Failed to parse player stats from local storage", e);
                redirect('/');
                return;
            }
        } else {
            redirect('/');
            return;
        }
    }
    setIsLoading(false);
  }, [rulesId, initializeTheme]);

  // Game state initialization effect
  useEffect(() => {
    if (rules && initialPlayerStats && !gameState) {
      const getInitialState = (rules: GameRules, playerStats: PlayerStats): GameState => {
          const finalPlayerStats = produce(playerStats, draft => {
            if (rules.initial.identity) draft.identity = rules.initial.identity;
            if (rules.initial.inventory) draft.inventory = rules.initial.inventory;
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
      const initialState = initialStateOverride || getInitialState(rules, initialPlayerStats);
      setGameState(initialState);
    }
  }, [rules, initialPlayerStats, initialStateOverride, gameState]);


  // Scene generation effect
  useEffect(() => {
    if (gameState && currentSituation) {
      generateNewScene(gameState.situation, currentSituation);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.situation]);


  const generateNewScene = async (situationId: string, situation: Situation) => {
    if (!rules || !gameState) return;
    const cachedDescription = gameState.sceneDescriptions[situationId];
    if (cachedDescription) {
      setSceneDescription(cachedDescription);
      setIsGeneratingScene(false);
      return;
    }
    setIsGeneratingScene(true);
    setSceneDescription('');
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
      setGameState(produce(draft => {
        if (draft) draft.sceneDescriptions[situationId] = newDescription;
      }));
    } catch (error) {
      console.error('Failed to generate scene description:', error);
      toast({variant: 'destructive', title: t.error, description: t.failedToGenerateScene});
      setSceneDescription(`${t.error}: ${t.failedToGenerateScene}`);
    } finally {
      setIsGeneratingScene(false);
    }
  };

  const handleSaveGame = () => {
    if (!rules || !gameState) return;
    try {
      const saveKey = `${SAVE_PREFIX}${rules.id}_${new Date().toISOString()}`;
      localStorage.setItem(saveKey, JSON.stringify(gameState));
      toast({title: t.gameSaved, description: `${rules.title} - ${new Date().toLocaleString()}`});
    } catch (error) {
      toast({variant: 'destructive', title: t.saveFailed, description: 'Could not save your game.'});
    }
  };

  const findSaveFiles = () => {
    if (!rules || !gameState) return;
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
          if (ruleId !== rules.id || state.player.id !== gameState.player.id) continue;
          saves.push({key, title: rules.title, timestamp, state});
        } catch {}
      }
    }
    setSaveFiles(saves.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  };

  const handleOpenLoadDialog = () => {
    findSaveFiles();
    setIsLoadDialogOpen(true);
  };

  const handleLoadGame = (saveFile: SaveFile) => {
    setGameState(saveFile.state);
    setIsLoadDialogOpen(false);
    toast({title: t.gameLoaded, description: 'Your progress has been restored.'});
  };

  const handleDeleteSave = (key: string) => {
    localStorage.removeItem(key);
    findSaveFiles();
    toast({title: t.saveDeleted, description: 'The selected save file has been removed.'});
  };

  const handleItemAction = (action: 'use' | 'discard' | 'equip' | 'unequip', item: Item) => {
    if (!gameState) return;
    const newStats = produce(gameState.player, draft => {
        if (action === 'discard') {
            draft.inventory = draft.inventory.filter(i => i.id !== item.id);
        } else if (action === 'equip') {
            if (item.slot) {
                draft.equipment[item.slot] = item.name;
            }
        } else if (action === 'unequip') {
            if (item.slot && draft.equipment[item.slot] === item.name) {
                delete draft.equipment[item.slot];
            }
        } else if (action === 'use') {
            console.log(`Attempted to use item: ${item.name}`);
            alert(`Using '${item.name}' is not yet implemented.`);
            return;
        }
    });
    setGameState(produce(draft => {
        if (draft) draft.player = newStats;
    }));
    try {
      const allPlayersJson = localStorage.getItem(PLAYERS_KEY);
      if (allPlayersJson) {
          const allPlayers = JSON.parse(allPlayersJson);
          const updatedPlayers = allPlayers.map((p: PlayerStats) => p.id === newStats.id ? newStats : p);
          localStorage.setItem(PLAYERS_KEY, JSON.stringify(updatedPlayers));
      }
    } catch (e) {
      console.error("Failed to update player stats in storage.", e);
    }
  };

  const executeAction = async (actionId: string, target: string | undefined, isSuccess: boolean, actionRulesOverride?: any[]) => {
    if (!rules || !gameState) return;
    startTransition(async () => {
      try {
        const oldState = gameState;
        const oldLogLength = oldState.log.length;
        const actionLog: LogEntry = {
          id: Date.now(),
          type: 'action',
          message: `Action: ${actionId}` + (target ? ` - Target: ${target}` : '') + ` - Success: ${isSuccess}`,
        };

        const {newState, proceduralLogs: engineLogs} = await processAction(rules, oldState, actionId, target, isSuccess, actionRulesOverride);

        const changes: LogEntryChange[] = [];
        Object.entries(newState.tracks).forEach(([trackId, newTrack]) => {
          const oldTrack = oldState.tracks[trackId];
          if (oldTrack && oldTrack.value !== newTrack.value) {
            const diff = newTrack.value - oldTrack.value;
            const style = rules.ui?.trackStyles?.[trackId];
            changes.push({ id: trackId, name: newTrack.name, delta: diff, icon: style?.icon || 'TrendingUp', color: style?.color || 'text-primary' });
          }
        });
        Object.entries(newState.counters).forEach(([counterId, newValue]) => {
          const oldValue = oldState.counters[counterId];
          if (oldValue !== undefined && oldValue !== newValue) {
            const formattedId = counterId.replace(/_/g, ' ');
            if (typeof newValue === 'number' && typeof oldValue === 'number') {
              const diff = newValue - oldValue;
              if (diff !== 0) changes.push({ id: counterId, name: formattedId, delta: diff, icon: rules.ui?.counterIcons?.[counterId] || 'Star', color: 'text-primary' });
            } else if (typeof newValue === 'boolean' && newValue !== oldValue) {
              changes.push({ id: counterId, name: formattedId, delta: newValue ? 1 : -1, icon: rules.ui?.counterIcons?.[counterId] || 'Star', color: 'text-primary' });
            }
          }
        });
        if (newState.next_situation) {
          changes.push({ id: 'next_situation', name: 'Next Situation', delta: 1, icon: 'ChevronsRight', color: 'text-primary' });
        }

        const newSituation = rules.situations[newState.situation];
        const narrativeInput = {
          language: rules.language,
          situationLabel: newSituation.label,
          sceneDescription: newSituation.description || newSituation.label,
          actionTaken: `${actionId} ${target || ''}`.trim(),
          proceduralLogs: engineLogs.map(l => l.message),
          knownTargets: newSituation.on_action.flatMap(rule => rule.when.targets?.split('|') || []),
        };

        const narrativeOutput = await generateActionNarrative(narrativeInput);
        const narrativeLog: LogEntry = {
          id: Date.now() + 1,
          type: 'narrative',
          message: narrativeOutput.narrative,
          changes: changes.length > 0 ? changes : undefined,
        };
        
        setGameState({ ...newState, log: [...oldState.log, actionLog, ...engineLogs, narrativeLog] });
        setLatestNarrative([actionLog, ...engineLogs, narrativeLog].slice(oldLogLength));
        setIsLatestResultModalOpen(true);
      } catch (error) {
        console.error('Error processing action:', error);
        toast({variant: 'destructive', title: t.error, description: t.failedToProcessAction});
      }
    });
  };

  const handleAction = async (actionId: string, target?: string) => {
    if (!currentSituation || !rules || !gameState) return;
    setSelectedAction(null);
    setTargetForAction('');

    if (actionId === '__end_scenario__') {
        const allPlayersJson = localStorage.getItem(PLAYERS_KEY);
        if (allPlayersJson) {
            const allPlayers = JSON.parse(allPlayersJson);
            const updatedPlayers = allPlayers.map((p: PlayerStats) => p.id === gameState.player.id ? gameState.player : p);
            localStorage.setItem(PLAYERS_KEY, JSON.stringify(updatedPlayers));
        }
        router.push('/');
        return;
    }

    if (actionId === 'talk') {
      if (target) handleTalk(target);
      return;
    }
    if (actionId === 'fight') {
      const enemy: PlayerStats = { id: 'enemy', name: target || "Guard", identity: "A tough-looking guard", language: 'en', attributes: {strength: 11, dexterity: 11, constitution: 12, intelligence: 9, wisdom: 10, charisma: 9}, equipment: {}, inventory: [], history: [] };
      setFightTarget(enemy);
      setIsFightDialogOpen(true);
      return;
    }

    const actionRule = currentSituation.on_action.find(r => r.when.actionId === actionId && (!r.when.targets || (target && new RegExp(`^(${r.when.targets})$`, 'i').test(target))));
    const requiresDiceRoll = actionRule && actionRule.fail && actionRule.fail.length > 0;

    if (!requiresDiceRoll) {
      executeAction(actionId, target, true);
      return;
    }

    const checkId = `${actionId}${target ? `_${target}` : ''}`;
    const existingCheck = gameState.actionChecks[checkId];

    if (!existingCheck || !existingCheck.hasPassed) {
      setIsGeneratingDiceCheck(true);
      setDiceRollActionId(actionId);
      setDiceRollTarget(target);
      try {
        let checkToUse = existingCheck;
        if (!checkToUse) {
          const {relevantAttributes} = await generateRelevantAttributes({ language: rules.language, player: gameState.player, action: rules.actions[actionId], situation: currentSituation });
          const {difficultyClass} = await generateDifficultyClass({ language: rules.language, action: rules.actions[actionId], situation: currentSituation, relevantAttributes });
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

  const handleTalk = async (target: string) => {
    if (!currentSituation || !sceneDescription || !rules || !gameState) return;

    const talkRule = currentSituation.on_action.find(rule => rule.when.actionId === 'talk' && rule.when.targets && new RegExp(`^(${rule.when.targets})$`, 'i').test(target));
    if (!talkRule) return toast({variant: 'destructive', title: 'Action Error', description: `No talk rule found for target: ${target}`});

    const secretAction = talkRule.do.find(action => action.secret);
    const agreementAction = talkRule.do.find(action => action.agreement);
    let objective = "", flow: ConversationFlow | null = null, type: ConversationType = 'secret';

    if (secretAction) { objective = secretAction.secret as string; flow = extractSecret as ConversationFlow; type = 'secret'; }
    else if (agreementAction) { objective = agreementAction.agreement as string; flow = reachAgreement as ConversationFlow; type = 'agreement'; }
    else return toast({variant: 'destructive', title: 'Action Error', description: `Talk action for ${target} has no objective.`});

    setTalkTarget(target);
    setTalkObjective(objective);
    setConversationFlow(() => flow);
    setConversationType(type);
    setTalkFollowUpActions(talkRule.do.filter(action => !action.secret && !action.agreement));

    const existingProfile = gameState.characters?.[target];
    if (existingProfile) { setCharacterProfile(existingProfile); setActiveView('talk'); return; }

    setIsGeneratingCharacter(true);
    try {
      const profile = await generateCharacter({ language: rules.language, situationLabel: currentSituation.label, target: target });
      setGameState(produce(draft => { if(draft) draft.characters[target] = profile; }));
      setCharacterProfile(profile);
      setActiveView('talk');
    } catch (error) {
      console.error('Failed to generate character:', error);
      toast({variant: 'destructive', title: 'AI Error', description: 'Could not create a character to talk to.'});
    } finally {
      setIsGeneratingCharacter(false);
    }
  };

  const handleDiceRollComplete = (passed: boolean) => {
    if (!diceRollActionId || !diceRollActionCheck || !currentSituation) return;
    const checkId = `${diceRollActionId}${diceRollTarget ? `_${diceRollTarget}` : ''}`;
    setGameState(produce(draft => { if(draft) draft.actionChecks[checkId] = {...diceRollActionCheck, hasPassed: passed}; }));
    setIsDiceRollDialogOpen(false);
    const actionRule = currentSituation.on_action.find(r => r.when.actionId === diceRollActionId && (!r.when.targets || (diceRollTarget && new RegExp(r.when.targets).test(diceRollTarget))));
    if (passed || (!passed && actionRule?.fail)) {
      executeAction(diceRollActionId, diceRollTarget, passed);
    } else if (!passed) {
      toast({variant: 'destructive', title: "Check Failed", description: "You failed the skill check."});
    }
    setDiceRollActionId(null);
    setDiceRollTarget(undefined);
    setDiceRollActionCheck(null);
  };
  
  const handleFightComplete = (result: 'win' | 'loss') => {
    setIsFightDialogOpen(false);
    const resultLog: LogEntry = { id: Date.now(), type: 'procedural', message: `You ${result} the fight against ${fightTarget?.name || 'the enemy'}.` };
    setGameState(produce(draft => { if(draft) draft.log.push(resultLog); }));
    if (result === 'win') executeAction('fight', fightTarget?.name, true);
    setFightTarget(null);
  }

  const handleEndTalk = (conversationLog: LogEntry[], objectiveAchieved: boolean) => {
    setGameState(produce(draft => { if(draft) draft.log.push(...conversationLog); }));
    if (objectiveAchieved) {
      executeAction('talk-objective-complete', undefined, true, talkFollowUpActions);
    } else {
      startTransition(async () => {
        const finalSummary = `Finished a conversation with ${talkTarget} without achieving the objective.`;
        setGameState(produce(draft => { if(draft) draft.log.push({id: Date.now(), type: 'procedural', message: finalSummary}); }));
      });
    }
    setTalkTarget(''); setCharacterProfile(null); setTalkObjective(''); setConversationFlow(null); setTalkFollowUpActions([]);
    setActiveView('game');
  };

  const handleTargetClick = (actionId: string, target: string) => {
    setSelectedAction(actionId);
    setTargetForAction(target);
  };
  
  const handleLogTargetClick = (target: string) => {
    if (selectedAction) setTargetForAction(target);
  };

  const pageIsLoading = isLoading || !gameState || !rules || !currentSituation;
  const isProcessing = isPending || isGeneratingScene || isGeneratingCharacter || isGeneratingDiceCheck;

  if (pageIsLoading) {
    return <div className="flex h-screen items-center justify-center">Loading Scenario...</div>;
  }

  return (
    <div className="flex h-screen bg-background text-foreground font-body flex-col">
      <LoadGameDialog isOpen={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen} saveFiles={saveFiles} onLoad={handleLoadGame} onDelete={handleDeleteSave} language={rules.language} />
      <DiceRollDialog isOpen={isDiceRollDialogOpen} onOpenChange={setIsDiceRollDialogOpen} rules={rules} situation={currentSituation} actionId={diceRollActionId || ''} target={diceRollTarget} actionCheck={diceRollActionCheck} playerStats={gameState.player} isGenerating={isGeneratingDiceCheck} onRollComplete={handleDiceRollComplete} language={rules.language} />
      <InventoryDialog isOpen={isInventoryOpen} onOpenChange={setIsInventoryOpen} inventory={gameState.player.inventory} equipment={gameState.player.equipment} onItemAction={handleItemAction} language={gameState.player.language} />
      <LatestResultModal isOpen={isLatestResultModalOpen} onOpenChange={setIsLatestResultModalOpen} latestNarrative={latestNarrative} knownTargets={knownTargets} actionRules={currentSituation.on_action} actionDetails={actionDetails} allowedActions={allowedActions} onTargetClick={(actionId, target) => { handleTargetClick(actionId, target); setIsLatestResultModalOpen(false); }} onLogTargetClick={(target) => { handleLogTargetClick(target); setIsLatestResultModalOpen(false); }} selectedAction={selectedAction} language={rules.language} />
      {fightTarget && <FightDialog isOpen={isFightDialogOpen} onOpenChange={setIsFightDialogOpen} player={gameState.player} enemy={fightTarget} onFightComplete={handleFightComplete} language={rules.language} />}
      
      <header className="flex items-center justify-between p-2 border-b shrink-0">
        <h1 className="text-xl font-bold font-headline pl-2">{rules.title}</h1>
        <div className={cn(activeView === 'talk' && 'invisible')}>
          <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)}>
            <TabsList>
              <TabsTrigger value="game"><Gamepad2 className="mr-2" />Game</TabsTrigger>
              <TabsTrigger value="character"><User className="mr-2" />Character</TabsTrigger>
              <TabsTrigger value="saves"><Save className="mr-2" />Saves</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild><Link href="/admin/rules"><Wrench className="h-4 w-4" /></Link></Button>
          <Button variant="ghost" asChild><Link href="/"><Home className="h-4 w-4" /></Link></Button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
          <div className={cn("w-full h-full", activeView !== 'game' && 'hidden')}>
            <GameView rules={rules} gameState={gameState} sceneDescription={sceneDescription} isGeneratingScene={isGeneratingScene} knownTargets={knownTargets} actionDetails={actionDetails} allowedActions={allowedActions} handleTargetClick={handleTargetClick} handleLogTargetClick={handleLogTargetClick} selectedAction={selectedAction} isProcessing={isProcessing} t={t} handleAction={handleAction} setSelectedAction={setSelectedAction} targetForAction={targetForAction} setTargetForAction={setTargetForAction} isEnding={isEnding} />
          </div>
          <div className={cn("w-full h-full", activeView !== 'character' && 'hidden')}>
            <CharacterView player={gameState.player} counters={gameState.counters} rules={rules} onItemAction={handleItemAction} onOpenInventory={() => setIsInventoryOpen(true)} t={t} />
          </div>
           <div className={cn("w-full h-full", activeView !== 'saves' && 'hidden')}>
            <SavesView handleSaveGame={handleSaveGame} handleOpenLoadDialog={handleOpenLoadDialog} />
          </div>
           <div className={cn("w-full h-full", activeView !== 'talk' && 'hidden')}>
            <TalkScreen gameState={gameState} characterProfile={characterProfile} objective={talkObjective} conversationType={conversationType} conversationFlow={conversationFlow} onConversationEnd={handleEndTalk} />
          </div>
      </main>
    </div>
  );
}
