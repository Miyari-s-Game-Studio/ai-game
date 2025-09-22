// src/components/game/mobile/MobileStatusView.tsx
'use client';
import React from 'react';
import type { GameState, GameRules, ActionDetail, Situation } from '@/types/game';
import TrackDisplay from '@/components/game/TrackDisplay';
import CountersDisplay from '@/components/game/CountersDisplay';
import NarrativeLog from '@/components/game/NarrativeLog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MobileStatusViewProps {
    rules: GameRules;
    gameState: GameState;
    currentSituation: Situation;
    t: any;
    knownTargets: string[];
    actionDetails: Record<string, ActionDetail>;
    allowedActions: string[];
    handleTargetClick: (actionId: string, target: string) => void;
    handleLogTargetClick: (target: string) => void;
    selectedAction: string | null;
}

export function MobileStatusView({
    rules,
    gameState,
    currentSituation,
    t,
    knownTargets,
    actionDetails,
    allowedActions,
    handleTargetClick,
    handleLogTargetClick,
    selectedAction
}: MobileStatusViewProps) {
  return (
    <div className="p-4 space-y-6 h-full flex flex-col">
        <div className="space-y-4">
            {Object.entries(gameState.tracks).map(([id, track]) => (
                <TrackDisplay key={id} trackId={id} track={track} style={rules.ui?.trackStyles?.[id]} />
            ))}
        </div>
        <CountersDisplay
            counters={gameState.counters}
            iconMap={rules.ui?.counterIcons}
            title={t.keyItemsAndInfo}
        />
        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader>
            <CardTitle>{t.fullActionLog}</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow overflow-hidden">
            <NarrativeLog
              log={gameState.log}
              knownTargets={knownTargets}
              actionRules={currentSituation.on_action}
              actionDetails={actionDetails}
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
  );
}
