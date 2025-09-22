// src/components/game/mobile/MobileGameView.tsx
'use client';
import React from 'react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import NarrativeLog from '@/components/game/NarrativeLog';
import { Loader2 } from 'lucide-react';
import type { GameState, GameRules, ActionDetail } from '@/types/game';
import { MobileActionPanel } from './MobileActionPanel';
import { ScrollArea } from '@/components/ui/scroll-area';


interface MobileGameViewProps {
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

export function MobileGameView({
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
}: MobileGameViewProps) {

  const currentSituation = rules.situations[gameState.situation];
  if (!currentSituation) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="relative w-full h-1/3 shrink-0">
        <Image
            src="https://placehold.co/600x400/221e2c/a89fbe?text=Scene"
            alt="Scene illustration"
            fill
            style={{ objectFit: 'cover' }}
            data-ai-hint="fantasy landscape"
        />
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background to-transparent">
            <h2 className="text-2xl font-headline font-bold text-white shadow-lg">
                {isEnding ? t.scenarioComplete : currentSituation.label}
            </h2>
        </div>
      </div>
      
      <ScrollArea className="flex-grow">
        <div className="p-4">
             {isGeneratingScene ? (
                <div className="space-y-2">
                    <Skeleton className="h-5 w-full"/>
                    <Skeleton className="h-5 w-full"/>
                    <Skeleton className="h-5 w-5/6"/>
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

        {isProcessing && !isEnding ? (
        <div className="flex flex-col items-center justify-center h-full p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary"/>
            <p className="ml-4 text-lg mt-4">
                {isGeneratingScene ? t.loadingScene : t.aiCraftingStory}
            </p>
        </div>
        ) : (
            <MobileActionPanel
                actionRules={currentSituation.on_action}
                actionDetails={actionDetails}
                allowedActions={allowedActions}
                onAction={handleAction}
                disabled={isProcessing}
                t={t}
            />
        )}
      </ScrollArea>
    </div>
  );
}
