
// src/components/game/ActionLogDialog.tsx
'use client';
import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import NarrativeLog from './NarrativeLog';
import type { LogEntry, ActionRule, ActionDetail } from '@/types/game';
import { getTranslator } from '@/lib/i18n';
import { ScrollArea } from '../ui/scroll-area';

interface ActionLogDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  log: LogEntry[];
  knownTargets: string[];
  actionRules: ActionRule[];
  actionDetails: Record<string, ActionDetail>;
  allowedActions: string[];
  onTargetClick: (actionId: string, target: string) => void;
  onLogTargetClick: (target: string) => void;
  selectedAction: string | null;
  language: 'en' | 'zh';
}

export function ActionLogDialog({ 
    isOpen, 
    onOpenChange, 
    log, 
    knownTargets, 
    actionRules,
    actionDetails,
    allowedActions,
    onTargetClick,
    onLogTargetClick,
    selectedAction,
    language,
}: ActionLogDialogProps) {
  const t = useMemo(() => getTranslator(language), [language]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-5/6 flex flex-col">
        <DialogHeader>
          <DialogTitle>{t.fullActionLog}</DialogTitle>
          <DialogDescription>
            {t.actionLogDescription}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-hidden">
             <NarrativeLog
                log={log}
                knownTargets={knownTargets}
                actionRules={actionRules}
                actionDetails={actionDetails}
                allowedActions={allowedActions}
                onTargetClick={onTargetClick}
                onLogTargetClick={onLogTargetClick}
                selectedAction={selectedAction}
                isScrollable={true}
                language={language}
            />
        </div>
      </DialogContent>
    </Dialog>
  );
}
