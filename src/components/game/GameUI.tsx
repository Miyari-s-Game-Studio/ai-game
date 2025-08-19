'use client';
import React, { useState, useEffect, useTransition } from 'react';
import type { GameState, LogEntry, Situation, GameRules, ActionRule } from '@/types/game';
import { defaultGameRules } from '@/lib/game-rules';
import { processAction } from '@/lib/game-engine';
import { generateNarrative } from '@/ai/flows/narrative-generation';
import { generateIntroduction } from '@/ai/flows/generate-introduction';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import TrackDisplay from './TrackDisplay';
import CountersDisplay from './CountersDisplay';
import ActionPanel from './ActionPanel';
import NarrativeLog from './NarrativeLog';
import { Skeleton } from '../ui/skeleton';

const getInitialState = (rules: GameRules): GameState => {
  return {
    situation: rules.initial.situation,
    counters: { ...rules.initial.counters },
    tracks: JSON.parse(JSON.stringify(rules.tracks)),
    knownTargets: [],
    log: [], // Log starts empty, will be populated by AI
  };
};

export function GameUI() {
  const [rules, setRules] = useState<GameRules>(defaultGameRules);
  const [gameState, setGameState] = useState<GameState>(() => getInitialState(rules));
  const [isGeneratingIntro, setIsGeneratingIntro] = useState(true);
  const [actionTarget, setActionTarget] = useState<{actionId: string, target: string}>();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    const fetchIntroduction = async () => {
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
    fetchIntroduction();
  }, [rules, toast]);

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
  );
}
