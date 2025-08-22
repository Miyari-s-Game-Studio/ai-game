
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
import type { LogEntry, ActionRule } from '@/types/game';
import { getTranslator } from '@/lib/i18n';

interface ActionLogDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  log: LogEntry[];
  knownTargets: string[];
  actionRules: ActionRule[];
  allowedActions: string[];
  onTargetClick: (actionId: string, target: string) => void;
  language: 'en' | 'zh';
}

export function ActionLogDialog({ 
    isOpen, 
    onOpenChange, 
    log, 
    knownTargets, 
    actionRules,
    allowedActions,
    onTargetClick,
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
                allowedActions={allowedActions}
                onTargetClick={onTargetClick}
                isScrollable={true}
            />
        </div>
      </DialogContent>
    </Dialog>
  );
}
