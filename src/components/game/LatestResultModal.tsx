
// src/components/game/LatestResultModal.tsx
'use client';
import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import NarrativeLog from './NarrativeLog';
import type { LogEntry, ActionRule, ActionDetail } from '@/types/game';
import { getTranslator } from '@/lib/i18n';

interface LatestResultModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  latestNarrative: LogEntry[];
  knownTargets: string[];
  actionRules: ActionRule[];
  actionDetails: Record<string, ActionDetail>;
  allowedActions: string[];
  onTargetClick: (actionId: string, target: string) => void;
  onLogTargetClick: (target: string) => void;
  selectedAction: string | null;
  language: 'en' | 'zh';
}

export function LatestResultModal({ 
    isOpen, 
    onOpenChange, 
    latestNarrative,
    knownTargets, 
    actionRules,
    actionDetails,
    allowedActions,
    onTargetClick,
    onLogTargetClick,
    selectedAction,
    language,
}: LatestResultModalProps) {
  const t = useMemo(() => getTranslator(language), [language]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t.lastActionResult}</DialogTitle>
        </DialogHeader>
        <div className="my-4">
             <NarrativeLog
                log={latestNarrative}
                knownTargets={knownTargets}
                actionRules={actionRules}
                actionDetails={actionDetails}
                allowedActions={allowedActions}
                onTargetClick={onTargetClick}
                onLogTargetClick={onLogTargetClick}
                selectedAction={selectedAction}
                isScrollable={false}
                language={language}
            />
        </div>
        <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
