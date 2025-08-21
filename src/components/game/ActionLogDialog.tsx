
// src/components/game/ActionLogDialog.tsx
'use client';
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import NarrativeLog from './NarrativeLog';
import type { LogEntry, ActionRule } from '@/types/game';

interface ActionLogDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  log: LogEntry[];
  knownTargets: string[];
  actionRules: ActionRule[];
  onTargetClick: (actionId: string, target: string) => void;
}

export function ActionLogDialog({ 
    isOpen, 
    onOpenChange, 
    log, 
    knownTargets, 
    actionRules,
    onTargetClick
}: ActionLogDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-5/6 flex flex-col">
        <DialogHeader>
          <DialogTitle>Full Action Log</DialogTitle>
          <DialogDescription>
            A complete history of your actions and the resulting narrative.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-hidden">
            <NarrativeLog
                log={log}
                knownTargets={knownTargets}
                actionRules={actionRules}
                onTargetClick={onTargetClick}
                isScrollable={true}
            />
        </div>
      </DialogContent>
    </Dialog>
  );
}
