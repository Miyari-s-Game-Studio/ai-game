
'use client';
import React, { useState, useEffect, useTransition } from 'react';
import type { GameState, LogEntry, Situation, GameRules, ActionRule } from '@/types/game';
import { defaultGameRules } from '@/lib/game-rules';
import { processAction } from '@/lib/game-engine';
import { generateNarrative } from '@/ai/flows/narrative-generation';
import { generateIntroduction } from '@/ai/flows/generate-introduction';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, FolderOpen } from 'lucide-react';
import TrackDisplay from './TrackDisplay';
import CountersDisplay from './CountersDisplay';
import ActionPanel from './ActionPanel';
import NarrativeLog from './NarrativeLog';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { LoadGameDialog, type SaveFile } from './LoadGameDialog';

const getInitialState = (rules: GameRules): GameState => {
  return {
    situation: rules.initial.situation,
    counters: { ...rules.initial.counters },
    tracks: JSON.parse(JSON.stringify(rules.tracks)),
    knownTargets: [],
    log: [], // Log starts empty, will be populated by AI
  };
};

const SAVE_PREFIX = 'narrativeGameSave_';

export function GameUI() {
  const [rules, setRules] = useState<GameRules>(defaultGameRules);
  const [gameState, setGameState] = useState<GameState>(() => getInitialState(rules));
  const [isGeneratingIntro, setIsGeneratingIntro] = useState(true);
  const [actionTarget, setActionTarget] = useState<{actionId: string, target: string}>();
  const [isPending, startTransition] = useTransition();
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [saveFiles, setSaveFiles] = useState<SaveFile[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchIntroduction();
  }, [rules]);

  const fetchIntroduction = async () => {
    setIsGeneratingIntro(true);
    setGameState(getInitialState(rules));
      try {
        const intro = await generateIntroduction({
          title: rules.title,
          description: rules.description,
          initialSituation: rules.situations[rules.initial.situation].label,
        });

        const initialLogs: LogEntry[] = [
          {
            id: Date.now(),
            type: 'narrative',
            message: intro.introduction,
          },
          {
            id: Date.now() + 1,
            type: 'procedural',
            message: intro.firstStep,
          },
        ];
        setGameState(prevState => ({...prevState, log: initialLogs}));
      } catch (error) {
         console.error('Failed to generate introduction:', error);
         toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not generate the game introduction.',
         });
         // Fallback to a simple log
         setGameState(prevState => ({
            ...prevState,
            log: [{ id: 0, type: 'error', message: 'Failed to load introduction.'}]
         }));
      } finally {
        setIsGeneratingIntro(false);
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
          
          if (lastUnderscoreIndex === -1) continue; // Invalid format

          const ruleId = keyWithoutPrefix.substring(0, lastUnderscoreIndex);
          const timestamp = keyWithoutPrefix.substring(lastUnderscoreIndex + 1);
          
          // A bit of a hack: find the title from the loaded rules.
          // In a more complex app, the title might be saved in the state itself.
          const title = rules.id === ruleId ? rules.title : ruleId;

          saves.push({ key, title, timestamp, state });
        } catch {
            // Ignore corrupted save files
        }
      }
    }
    setSaveFiles(saves.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  }

  const handleOpenLoadDialog = () => {
      findSaveFiles();
      setIsLoadDialogOpen(true);
  }

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


  const currentSituation: Situation | undefined = rules.situations[gameState.situation];
  
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

        const { newState: proceduralState, proceduralLogs } = await processAction(
          rules,
          gameState,
          actionId,
          target
        );
        
        const environmentalTracks: Record<string, number> = {};
        for(const trackId in proceduralState.tracks) {
          environmentalTracks[trackId.replace(/\./g, '_')] = proceduralState.tracks[trackId].value;
        }

        const narrativeInput = {
          situation: currentSituation.label,
          allowedActions: currentSituation.allowed_actions,
          actionTaken: `${actionId} ${target || ''}`.trim(),
          environmentalTracks: environmentalTracks,
          counters: proceduralState.counters,
          knownTargets: proceduralState.knownTargets,
          gameLog: [...proceduralState.log, actionLog, ...proceduralLogs].map(l => l.message),
        };

        const narrativeOutput = await generateNarrative(narrativeInput);
        const narrativeLog: LogEntry = {
            id: Date.now() + 1,
            type: 'narrative',
            message: narrativeOutput.narrative,
        };
        
        setGameState(prevState => ({
          ...proceduralState,
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
    setActionTarget({ actionId, target });
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-headline">
              Current Situation: {currentSituation.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
             {isGeneratingIntro ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-8 w-1/2" />
                </div>
              ) : (
                <NarrativeLog
                  log={gameState.log}
                  knownTargets={gameState.knownTargets}
                  actionRules={rules.situations[gameState.situation].on_action}
                  onTargetClick={handleTargetClick}
                />
              )}
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl font-headline">Take Action</CardTitle>
            </CardHeader>
            <CardContent>
                {isPending || isGeneratingIntro ? (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="ml-4 text-lg">
                          {isGeneratingIntro ? 'Generating introduction...' : 'AI is crafting the next part of your story...'}
                        </p>
                    </div>
                ) : (
                    <ActionPanel
                        allowedActions={currentSituation.allowed_actions}
                        onAction={handleAction}
                        disabled={isPending}
                        actionTarget={actionTarget}
                    />
                )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button onClick={handleOpenLoadDialog} variant="outline" disabled={isPending || isGeneratingIntro}>
                    <FolderOpen className="mr-2" /> Load Game
                </Button>
                <Button onClick={handleSaveGame} disabled={isPending || isGeneratingIntro}>
                    <Save className="mr-2" /> Save Game
                </Button>
            </CardFooter>
        </Card>
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
