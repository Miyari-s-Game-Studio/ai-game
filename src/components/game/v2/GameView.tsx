// src/components/game/v2/GameView.tsx
'use client';
import React from 'react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import TrackDisplay from '@/components/game/TrackDisplay';
import NarrativeLog from '@/components/game/NarrativeLog';
import ActionPanel from '@/components/game/ActionPanel';
import { Loader2 } from 'lucide-react';
import type { GameState, GameRules, ActionDetail } from '@/types/game';

interface GameViewProps {
  rules: GameRules;
  gameState: GameState;
  sceneDescription: string;
  isGeneratingScene: boolean;
  knownTargets: string[];
  actionDetails: Record<string, ActionDetail>;
  allowedActions: string[];
  handleTargetClick: (actionId: string, target: string) => void;
  handleLogTargetClick: (target: string) => void;
  selectedAction: string | null;
  isProcessing: boolean;
  t: any;
  handleAction: (actionId: string, target?: string) => void;
  setSelectedAction: (actionId: string | null) => void;
  targetForAction: string;
  setTargetForAction: (target: string) => void;
  isEnding: boolean;
}

export function GameView({
  rules,
  gameState,
  sceneDescription,
  isGeneratingScene,
  knownTargets,
  actionDetails,
  allowedActions,
  handleTargetClick,
  handleLogTargetClick,
  selectedAction,
  isProcessing,
  t,
  handleAction,
  setSelectedAction,
  targetForAction,
  setTargetForAction,
  isEnding,
}: GameViewProps) {

  const currentSituation = rules.situations[gameState.situation];
  if (!currentSituation) return null;

  return (
    <div className="flex-1 flex h-full overflow-hidden">
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
        <main className="w-1/2 flex flex-col p-8 space-y-6 overflow-hidden">
            <h2 className="text-3xl font-headline font-bold text-primary shrink-0">
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

            <div className="shrink-0">
                {isProcessing && !isEnding ? (
                <div className="flex items-center justify-center p-8 rounded-lg border bg-background/60">
                    <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                    <p className="ml-4 text-lg">
                        {isGeneratingScene ? t.loadingScene : t.aiCraftingStory}
                    </p>
                </div>
                ) : (
                <ActionPanel
                    rules={rules}
                    allowedActions={allowedActions}
                    actionDetails={actionDetails}
                    actionRules={currentSituation.on_action}
                    onAction={handleAction}
                    disabled={isProcessing}
                    selectedAction={selectedAction}
                    onSelectedActionChange={setSelectedAction}
                    target={targetForAction}
                    onTargetChange={setTargetForAction}
                />
                )}
            </div>
        </main>
    </div>
  );
}
