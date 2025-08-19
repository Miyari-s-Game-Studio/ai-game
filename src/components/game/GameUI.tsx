'use client';
import React, { useState, useEffect, useTransition } from 'react';
import type { GameState, LogEntry, Situation, Track, GameRules } from '@/types/game';
import { defaultGameRules } from '@/lib/game-rules';
import { processAction } from '@/lib/game-engine';
import { generateNarrative } from '@/ai/flows/narrative-generation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import TrackDisplay from './TrackDisplay';
import CountersDisplay from './CountersDisplay';
import ActionPanel from './ActionPanel';
import NarrativeLog from './NarrativeLog';

const getInitialState = (rules: GameRules): GameState => {
  return {
    situation: rules.initial.situation,
    counters: { ...rules.initial.counters },
    tracks: JSON.parse(JSON.stringify(rules.tracks)),
    knownTargets: [],
    log: [
      {
        id: 0,
        type: 'narrative',
        message: 'A new environmental case has been opened. Your mission is to investigate the pollution, manage the crisis, and restore ecological balance.',
      },
      {
        id: 1,
        type: 'procedural',
        message: 'You are at the initial stage: 场域摸底 (Field Investigation). Assess the area to begin.',
      }
    ],
  };
};

export function GameUI() {
  const [rules, setRules] = useState<GameRules>(defaultGameRules);
  const [gameState, setGameState] = useState<GameState>(() => getInitialState(rules));
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

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
    )
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
             <NarrativeLog log={gameState.log} />
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl font-headline">Take Action</CardTitle>
            </CardHeader>
            <CardContent>
                {isPending ? (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="ml-4 text-lg">AI is crafting the next part of your story...</p>
                    </div>
                ) : (
                    <ActionPanel
                        allowedActions={currentSituation.allowed_actions}
                        onAction={handleAction}
                        disabled={isPending}
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
