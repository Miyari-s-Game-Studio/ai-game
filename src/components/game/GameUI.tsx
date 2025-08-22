
'use client';
import React, { useState, useEffect, useTransition, useMemo } from 'react';
import type { GameState, LogEntry, Situation, GameRules, ActionRule, PlayerStats, ActionDetail, CharacterProfile } from '@/types/game';
import { defaultGameRules } from '@/lib/game-rules';
import { processAction } from '@/lib/game-engine';
import { generateActionNarrative } from '@/ai/flows/generate-action-narrative';
import { generateSceneDescription } from '@/ai/flows/generate-scene-description';
import { generateCharacter, extractSecret, reachAgreement, type ConversationOutput, type ExtractSecretInput, type ReachAgreementInput } from '@/ai/flows/generate-conversation';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, FolderOpen, BookOpen, Gamepad2 } from 'lucide-react';
import TrackDisplay from './TrackDisplay';
import CountersDisplay from './CountersDisplay';
import PlayerStatsComponent from './PlayerStats';
import ActionPanel from './ActionPanel';
import NarrativeLog from './NarrativeLog';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { LoadGameDialog, type SaveFile } from './LoadGameDialog';
import { ActionLogDialog } from './ActionLogDialog';
import { TalkDialog } from './TalkDialog';

interface GameUIProps {
    setGameControlHandlers: (handlers: {
        handleSave: () => void;
        handleLoad: () => void;
        isPending: boolean;
        isGenerating: boolean;
    }) => void;
    setPlayerStats: (stats: PlayerStats) => void;
}

type ConversationFlow = (input: ExtractSecretInput | ReachAgreementInput) => Promise<ConversationOutput>;

const getInitialState = (rules: GameRules): GameState => {
  return {
    situation: rules.initial.situation,
    counters: { ...rules.initial.counters },
    tracks: JSON.parse(JSON.stringify(rules.tracks)),
    log: [],
    player: JSON.parse(JSON.stringify(rules.initial.player)),
  };
};

const SAVE_PREFIX = 'narrativeGameSave_';

export function GameUI({ setGameControlHandlers, setPlayerStats }: GameUIProps) {
  const [rules, setRules] = useState<GameRules>(defaultGameRules);
  const [gameState, setGameState] = useState<GameState>(() => getInitialState(rules));
  const [sceneDescription, setSceneDescription] = useState('');
  const [isGeneratingScene, setIsGeneratingScene] = useState(true);
  const [actionTarget, setActionTarget] = useState<{actionId: string, target: string}>();
  const [isPending, startTransition] = useTransition();
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [isTalkDialogOpen, setIsTalkDialogOpen] = useState(false);
  
  // State for the talk dialog
  const [talkTarget, setTalkTarget] = useState('');
  const [talkObjective, setTalkObjective] = useState('');
  const [conversationFlow, setConversationFlow] = useState<ConversationFlow | null>(null);
  const [talkFollowUpActions, setTalkFollowUpActions] = useState<Record<string, any>[]>([]);
  const [characterProfile, setCharacterProfile] = useState<CharacterProfile | null>(null);
  const [isGeneratingCharacter, setIsGeneratingCharacter] = useState(false);

  const [saveFiles, setSaveFiles] = useState<SaveFile[]>([]);
  const { toast } = useToast();

  const currentSituation: Situation | undefined = rules.situations[gameState.situation];
  
  const allowedActions = useMemo(() => {
    if (!currentSituation) return [];
    const actionIds = currentSituation.on_action.map(rule => rule.when.actionId);
    return [...new Set(actionIds)];
  }, [currentSituation]);

  const knownTargets = useMemo(() => {
    if (!currentSituation) return [];
    const targets = new Set<string>();
    currentSituation.on_action.forEach(rule => {
      if (rule.when.targetPattern) {
        rule.when.targetPattern.split('|').forEach(target => targets.add(target.trim()));
      }
    });
    return Array.from(targets);
  }, [currentSituation]);

  const latestNarrativeLog = gameState.log.filter(entry => entry.type === 'narrative').slice(-1);

  useEffect(() => {
    if (currentSituation) {
      generateNewScene(currentSituation);
    }
    setPlayerStats(gameState.player);
  }, [gameState.situation, rules]);
  
  const generateNewScene = async (situation: Situation) => {
    setIsGeneratingScene(true);
    setSceneDescription('');
    try {
      const targets = knownTargets;
      const result = await generateSceneDescription({
        situationLabel: situation.label,
        knownTargets: targets,
      });
      setSceneDescription(result.sceneDescription);
    } catch (error) {
       console.error('Failed to generate scene description:', error);
       toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not generate the scene description.',
       });
       setSceneDescription('Error: Failed to load scene description.');
    } finally {
      setIsGeneratingScene(false);
    }
  };

  const handleSaveGame = () => {
    try {
        const saveKey = `${SAVE_PREFIX}${rules.id}_${new Date().toISOString()}`;
        localStorage.setItem(saveKey, JSON.stringify(gameState));
        toast({
            title: 'Game Saved',
            description: `Saved as ${rules.title} - ${new Date().toLocaleString()}`,
        });
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Save Failed',
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
          
          const title = rules.id === ruleId ? rules.title : ruleId;

          saves.push({ key, title, timestamp, state });
        } catch {
        }
      }
    }
    setSaveFiles(saves.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  }

  const handleOpenLoadDialog = () => {
      findSaveFiles();
      setIsLoadDialogOpen(true);
  }

  useEffect(() => {
    setGameControlHandlers({
        handleSave: handleSaveGame,
        handleLoad: handleOpenLoadDialog,
        isPending: isPending,
        isGenerating: isGeneratingScene,
    });
    setPlayerStats(gameState.player);
  }, [isPending, isGeneratingScene, gameState, rules]);


  const handleLoadGame = (state: GameState) => {
    setGameState(state);
    setIsLoadDialogOpen(false);
    toast({
        title: 'Game Loaded',
        description: 'Your progress has been restored.',
    });
  }

  const handleDeleteSave = (key: string) => {
    localStorage.removeItem(key);
    findSaveFiles(); // Refresh the list
    toast({
        title: 'Save Deleted',
        description: 'The selected save file has been removed.',
    });
  }

  const handleTalk = async (target: string) => {
    if (!currentSituation) return;

    const talkRule = currentSituation.on_action.find(rule => 
        rule.when.actionId === 'talk' && 
        rule.when.targetPattern && 
        new RegExp(`^(${rule.when.targetPattern})$`, 'i').test(target)
    );
    
    if (!talkRule) {
        toast({ variant: 'destructive', title: 'Action Error', description: `No talk rule found for target: ${target}` });
        return;
    }

    const secretAction = talkRule.do.find(action => action.secret);
    const agreementAction = talkRule.do.find(action => action.agreement);
    let objective = "No specific objective.";
    let flow: ConversationFlow | null = null;

    if (secretAction) {
        objective = secretAction.secret as string;
        flow = extractSecret as ConversationFlow;
    } else if (agreementAction) {
        objective = agreementAction.agreement as string;
        flow = reachAgreement as ConversationFlow;
    } else {
        toast({ variant: 'destructive', title: 'Action Error', description: `Talk action for ${target} has no secret or agreement objective.` });
        return;
    }

    setTalkTarget(target);
    setTalkObjective(objective);
    setConversationFlow(() => flow);
    setTalkFollowUpActions(talkRule.do.filter(action => !action.secret && !action.agreement));
    setIsTalkDialogOpen(true);
    setIsGeneratingCharacter(true);

    try {
        const profile = await generateCharacter({
            situationLabel: currentSituation?.label || 'An unknown location',
            target: target,
        });
        setCharacterProfile(profile);
    } catch (error) {
        console.error('Failed to generate character:', error);
        toast({
            variant: 'destructive',
            title: 'AI Error',
            description: 'Could not create a character to talk to. Please try again.',
        });
        setIsTalkDialogOpen(false);
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
          startTransition(async () => {
              const { newState, proceduralLogs } = await processAction(
                  rules, 
                  gameState, 
                  'talk-objective-complete',
                  undefined,
                  talkFollowUpActions
              );

              const narrativeInput = {
                  situationLabel: currentSituation?.label || '',
                  sceneDescription: sceneDescription,
                  actionTaken: `Succeeded in conversation with ${talkTarget}`,
                  proceduralLogs: proceduralLogs.map(l => l.message),
                  knownTargets: knownTargets,
              };

              const narrativeOutput = await generateActionNarrative(narrativeInput);
              
              const narrativeLog: LogEntry = {
                  id: Date.now() + 1,
                  type: 'narrative',
                  message: narrativeOutput.narrative,
              };
              
              setGameState(prevState => ({
                ...newState,
                log: [...prevState.log, ...proceduralLogs, narrativeLog],
              }));
          });
      } else {
         startTransition(async () => {
             const finalSummary = `Finished a conversation with ${talkTarget} without achieving the objective.`;
             const summaryLog: LogEntry = { id: Date.now(), type: 'procedural', message: finalSummary };
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


  if (!currentSituation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>The current situation `({gameState.situation})` is not defined in the game rules.</p>
          <p>Please check your rules configuration.</p>
        </CardContent>
      </Card>
    );
  }

  const handleAction = (actionId: string, target?: string) => {
    startTransition(async () => {
      try {
        const actionLog: LogEntry = {
          id: Date.now(),
          type: 'action',
          message: `Action: ${actionId}` + (target ? ` - Target: ${target}` : ''),
        };

        const { newState, proceduralLogs } = await processAction(
          rules,
          gameState,
          actionId,
          target
        );
        
        const newSituation = rules.situations[newState.situation];
        const newActionRules = newSituation.on_action;
        const newTargets = newActionRules.flatMap(rule => rule.when.targetPattern?.split('|') || []);
        
        const narrativeInput = {
          situationLabel: newSituation.label,
          sceneDescription: sceneDescription, // Use existing scene description
          actionTaken: `${actionId} ${target || ''}`.trim(),
          proceduralLogs: proceduralLogs.map(l => l.message),
          knownTargets: [...new Set(newTargets)],
        };

        const narrativeOutput = await generateActionNarrative(narrativeInput);
        
        const narrativeLog: LogEntry = {
            id: Date.now() + 1,
            type: 'narrative',
            message: narrativeOutput.narrative,
        };
        
        setGameState(prevState => ({
          ...newState,
          log: [...prevState.log, actionLog, ...proceduralLogs, narrativeLog],
        }));

      } catch (error) {
        console.error('Error processing action:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to process the action. Please try again.',
        });
      }
    });
  };

  const handleTargetClick = (actionId: string, target: string) => {
    if (actionId === 'talk') {
        handleTalk(target);
    } else {
        setActionTarget({ actionId, target });
    }
    setIsLogDialogOpen(false); // Close log if open
  };

  return (
    <>
    <LoadGameDialog 
        isOpen={isLoadDialogOpen} 
        onOpenChange={setIsLoadDialogOpen}
        saveFiles={saveFiles}
        onLoad={handleLoadGame}
        onDelete={handleDeleteSave}
    />
    <ActionLogDialog
        isOpen={isLogDialogOpen}
        onOpenChange={setIsLogDialogOpen}
        log={gameState.log}
        knownTargets={knownTargets}
        actionRules={currentSituation.on_action}
        allowedActions={allowedActions}
        onTargetClick={handleTargetClick}
    />
    <TalkDialog
        isOpen={isTalkDialogOpen}
        onOpenChange={setIsTalkDialogOpen}
        target={talkTarget}
        objective={talkObjective}
        characterProfile={characterProfile}
        isGenerating={isGeneratingCharacter}
        onConversationEnd={handleEndTalk}
        conversationFlow={conversationFlow}
    />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-headline">
              Current Situation: {currentSituation.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
             {isGeneratingScene ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-5/6" />
                </div>
              ) : (
                <div className="text-foreground/90 whitespace-pre-wrap">
                  <NarrativeLog
                      log={[{ id: 0, type: 'narrative', message: sceneDescription }]}
                      knownTargets={knownTargets}
                      actionRules={currentSituation.on_action}
                      allowedActions={allowedActions}
                      onTargetClick={handleTargetClick}
                  />
                </div>
              )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-end py-3 px-4">
            <Button variant="outline" size="sm" onClick={() => setIsLogDialogOpen(true)}>
                <BookOpen className="mr-2 h-4 w-4" />
                View Full Log
            </Button>
          </CardHeader>
          <CardContent className="min-h-[100px] pt-0">
              <NarrativeLog
                  log={latestNarrativeLog}
                  knownTargets={knownTargets}
                  actionRules={currentSituation.on_action}
                  allowedActions={allowedActions}
                  onTargetClick={handleTargetClick}
                />
          </CardContent>
        </Card>
        
        <div>
            {isPending || isGeneratingScene ? (
                <div className="flex items-center justify-center p-8 rounded-lg border bg-background/60">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-4 text-lg">
                      {isGeneratingScene ? 'Generating scene...' : 'AI is crafting the next part of your story...'}
                    </p>
                </div>
            ) : (
                <ActionPanel
                    allowedActions={allowedActions}
                    actionDetails={rules.actions}
                    actionRules={currentSituation.on_action}
                    onAction={handleAction}
                    onTalk={handleTalk}
                    disabled={isPending}
                    actionTarget={actionTarget}
                />
            )}
        </div>
      </div>

      <div className="space-y-6 lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-headline">Environmental Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(gameState.tracks).map(([id, track]) => (
              <TrackDisplay key={id} trackId={id} track={track} style={rules.ui?.trackStyles?.[id]} />
            ))}
          </CardContent>
        </Card>
        <CountersDisplay counters={gameState.counters} iconMap={rules.ui?.counterIcons} />
      </div>
    </div>
    </>
  );
}
