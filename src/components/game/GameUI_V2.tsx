// src/components/game/GameUI_V2.tsx
'use client';
import React, {useEffect, useMemo, useState, useTransition} from 'react';
import type {
  ActionCheckState,
  ActionDetail,
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
import Image from 'next/image';
import {useToast} from '@/hooks/use-toast';
import {BookOpen, ChevronsRight, Loader2, LogOut, Home, User, Save, Settings, PanelLeft, Wrench, Gamepad2 } from 'lucide-react';
import ActionPanel from './ActionPanel';
import NarrativeLog from './NarrativeLog';
import {Skeleton} from '../ui/skeleton';
import {Button} from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {LoadGameDialog, type SaveFile} from './LoadGameDialog';
import {TalkDialog} from './TalkDialog';
import {produce} from 'immer';
import {getTranslator} from '@/lib/i18n';
import {generateSceneDescription} from "@/ai/simple/generate-scene-description";
import {generateActionNarrative} from "@/ai/simple/generate-action-narrative";
import {generateDifficultyClass, generateRelevantAttributes} from "@/ai/simple/generate-dice-check";
import {DiceRollDialog} from "@/components/game/DiceRollDialog";
import {useRouter} from 'next/navigation';
import {FightDialog} from './FightDialog';
import { InventoryDialog } from './InventoryDialog';
import TrackDisplay from "./TrackDisplay";
import { LatestResultModal } from './LatestResultModal';
import PlayerStatsComponent from './PlayerStats';
import PlayerHistory from './PlayerHistory';
import Link from 'next/link';
import CountersDisplay from './CountersDisplay';
import InventoryDisplay from './InventoryDisplay';


const PLAYERS_KEY = 'narrativeGame_players';


interface GameUIProps {
  rules: GameRules;
  initialStateOverride?: GameState | null;
  initialPlayerStats: PlayerStats;
}

const getInitialState = (rules: GameRules, playerStats: PlayerStats): GameState => {
  const finalPlayerStats = produce(playerStats, draft => {
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

export function GameUI_V2({rules, initialStateOverride, initialPlayerStats}: GameUIProps) {
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
  const [isTalkDialogOpen, setIsTalkDialogOpen] = useState(false);
  const [isDiceRollDialogOpen, setIsDiceRollDialogOpen] = useState(false);
  const [isFightDialogOpen, setIsFightDialogOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isLatestResultModalOpen, setIsLatestResultModalOpen] = useState(false);
  const [latestNarrative, setLatestNarrative] = useState<LogEntry[]>([]);
  const [activeView, setActiveView] = useState<'game' | 'character' | 'saves'>('game');


  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [targetForAction, setTargetForAction] = useState('');


  const [talkTarget, setTalkTarget] = useState('');
  const [talkObjective, setTalkObjective] = useState('');
  const [conversationFlow, setConversationFlow] = useState<ConversationFlow | null>(null);
  const [conversationType, setConversationType] = useState<ConversationType>('secret');
  const [talkFollowUpActions, setTalkFollowUpActions] = useState<Record<string, any>[]>([]);
  const [characterProfile, setCharacterProfile] = useState<CharacterProfile | null>(null);
  const [isGeneratingCharacter, setIsGeneratingCharacter] = useState(false);

  const [diceRollActionId, setDiceRollActionId] = useState<string | null>(null);
  const [diceRollTarget, setDiceRollTarget] = useState<string | undefined>(undefined);
  const [diceRollActionCheck, setDiceRollActionCheck] = useState<ActionCheckState | null>(null);
  const [isGeneratingDiceCheck, setIsGeneratingDiceCheck] = useState(false);

  const [fightTarget, setFightTarget] = useState<PlayerStats | null>(null);

  const {toast} = useToast();

  const t = useMemo(() => getTranslator(rules.language), [rules.language]);

  const currentSituation: Situation | undefined = rules.situations[gameState.situation];
  const isEnding = currentSituation?.ending === true;

  const { allowedActions, actionDetails } = useMemo(() => {
    if (!currentSituation) return { allowedActions: [], actionDetails: {} };
    
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
  }, [currentSituation, rules.actions, isEnding, t]);

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
      generateNewScene(gameState.situation, currentSituation);
    }
  }, [gameState.situation]);

  const generateNewScene = async (situationId: string, situation: Situation) => {
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

    const existingProfile = gameState.characters?.[target];
    if (existingProfile) {
      setCharacterProfile(existingProfile);
      setIsTalkDialogOpen(true);
      return;
    }

    setIsGeneratingCharacter(true);
    try {
      const profile = await generateCharacter({
        language: rules.language,
        situationLabel: currentSituation?.label || 'An unknown location',
        target: target,
      });

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
                  const currentItemInSlot = draft.inventory.find(i => i.slot === item.slot && draft.equipment[item.slot!] === i.name);
                  if (currentItemInSlot) {
                  }
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
          draft.player = newStats;
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


  if (!currentSituation) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-destructive">{t.error}</h2>
        <p>{t.invalidSituation} \`({gameState.situation})\`</p>
        <p>{t.pleaseCheckRules}</p>
      </div>
    );
  }

  const handleAction = async (actionId: string, target?: string) => {
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
      const enemy: PlayerStats = {
        id: 'enemy', 
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

    const actionRule = currentSituation?.on_action.find(r => {
      if (r.when.actionId !== actionId) return false;
      if (!r.when.targets && target) return false;
      if (r.when.targets && !target) return false;
      if (r.when.targets && target && !new RegExp(`^(${r.when.targets})$`, 'i').test(target)) return false;
      return true;
    });

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

    setGameState(produce(draft => {
      draft.actionChecks[checkId] = newCheckState;
    }));

    setIsDiceRollDialogOpen(false);

    const actionRule = currentSituation?.on_action.find(r => r.when.actionId === diceRollActionId && (!r.when.targets || (diceRollTarget && new RegExp(r.when.targets).test(diceRollTarget))));

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
        const oldLogLength = oldState.log.length;

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

        const changes: LogEntryChange[] = [];

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
                delta: newValue ? 1 : -1,
                icon: icon,
                color: 'text-primary'
              });
            }
          }
        });

        if (newState.next_situation) {
          changes.push({
            id: 'next_situation',
            name: 'Next Situation',
            delta: 1,
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
        
        const finalLog = [...oldState.log, actionLog, ...engineLogs, narrativeLog];
        setGameState({ ...newState, log: finalLog });
        setLatestNarrative(finalLog.slice(oldLogLength));
        setIsLatestResultModalOpen(true);


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
    <div className="flex h-screen bg-background text-foreground font-body flex-col">
      {/* Dialogs that can be opened from anywhere */}
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
        <LatestResultModal
          isOpen={isLatestResultModalOpen}
          onOpenChange={setIsLatestResultModalOpen}
          latestNarrative={latestNarrative}
          knownTargets={knownTargets}
          actionRules={currentSituation.on_action}
          actionDetails={actionDetails}
          allowedActions={allowedActions}
          onTargetClick={(actionId, target) => {
              handleTargetClick(actionId, target);
              setIsLatestResultModalOpen(false);
          }}
          onLogTargetClick={(target) => {
              handleLogTargetClick(target);
              setIsLatestResultModalOpen(false);
          }}
          selectedAction={selectedAction}
          language={rules.language}
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
      
      {/* Header */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="flex flex-col h-full">
        <header className="flex items-center justify-between p-2 border-b shrink-0">
            <h1 className="text-xl font-bold font-headline pl-2">{rules.title}</h1>
            <TabsList>
                <TabsTrigger value="game"><Gamepad2 className="mr-2"/>Game</TabsTrigger>
                <TabsTrigger value="character"><User className="mr-2"/>Character</TabsTrigger>
                <TabsTrigger value="saves"><Save className="mr-2"/>Saves</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                    <Link href="/admin/rules"><Wrench className="h-4 w-4" /></Link>
                </Button>
                <Button variant="ghost" asChild>
                    <Link href="/"><Home className="h-4 w-4" /></Link>
                </Button>
            </div>
        </header>

        {/* Main Content Area */}
        <TabsContent value="game" className="flex-1 flex overflow-hidden mt-0">
             {/* Left "Page" */}
            <aside className="w-1/2 flex flex-col p-8 border-r bg-muted/30 border-border gap-8">
                <div className="relative w-full h-2/3 rounded-lg overflow-hidden shadow-lg border border-border">
                <Image
                    src="https://placehold.co/600x800/221e2c/a89fbe?text=Scene"
                    alt="Scene illustration"
                    fill
                    style={{ objectFit: 'cover' }}
                    data-ai-hint="fantasy landscape"
                />
                </div>
                <div className="space-y-4">
                    {Object.entries(gameState.tracks).map(([id, track]) => (
                        <TrackDisplay key={id} trackId={id} track={track} style={rules.ui?.trackStyles?.[id]} />
                    ))}
                </div>
            </aside>

            {/* Right "Page" */}
            <main className="w-1/2 flex flex-col p-8 space-y-6">
                <div className="flex-grow flex flex-col min-h-0">
                <h2 className="text-3xl font-headline font-bold text-primary mb-4 shrink-0">
                    {isEnding ? t.scenarioComplete : currentSituation.label}
                </h2>
                <div className="flex-grow overflow-y-auto pr-4">
                    {isGeneratingScene ? (
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-full"/>
                            <Skeleton className="h-6 w-full"/>
                            <Skeleton className="h-6 w-5/6"/>
                        </div>
                    ) : (
                        <NarrativeLog
                            log={[{id: 0, type: 'narrative', message: sceneDescription}]}
                            knownTargets={knownTargets}
                            actionRules={currentSituation.on_action}
                            actionDetails={actionDetails}
                            allowedActions={allowedActions}
                            onTargetClick={handleTargetClick}
                            onLogTargetClick={handleLogTargetClick}
                            selectedAction={selectedAction}
                            language={rules.language}
                        />
                    )}
                </div>
                </div>

                <div className="shrink-0">
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
                        actionDetails={actionDetails}
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
            </main>
        </TabsContent>

        <TabsContent value="character" className="flex-1 flex overflow-hidden mt-0">
             <aside className="w-1/2 flex flex-col p-8 border-r bg-muted/30 border-border gap-8">
                 <PlayerStatsComponent stats={gameState.player} onOpenInventory={() => setIsInventoryOpen(true)} />
                 <div className="relative w-full flex-grow rounded-lg overflow-hidden shadow-lg border border-border">
                    <Image
                        src="https://placehold.co/600x800/292524/a8a29e?text=Portrait"
                        alt="Character Portrait"
                        fill
                        style={{ objectFit: 'cover' }}
                        data-ai-hint="fantasy character portrait"
                    />
                </div>
            </aside>
            <main className="w-1/2 flex flex-col p-8 space-y-6 overflow-y-auto">
                 <InventoryDisplay
                    inventory={gameState.player.inventory}
                    equipment={gameState.player.equipment}
                    onItemAction={handleItemAction}
                    language={rules.language}
                />
                <CountersDisplay
                    counters={gameState.counters}
                    iconMap={rules.ui?.counterIcons}
                    title={t.keyItemsAndInfo}
                />
            </main>
        </TabsContent>
        
        <TabsContent value="saves" className="flex-1 overflow-y-auto mt-0">
            <div className="p-8 max-w-md mx-auto w-full text-center space-y-4">
                <h2 className="text-4xl font-headline">Save & Load</h2>
                <p className="text-muted-foreground">Manage your game progress here.</p>
                <Button onClick={handleSaveGame} size="lg">
                    <Save className="mr-2" /> Quick Save
                </Button>
                <p className="text-sm text-muted-foreground italic">(Full load functionality would be here)</p>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
