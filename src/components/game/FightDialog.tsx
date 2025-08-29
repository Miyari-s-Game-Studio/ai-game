
// src/components/game/FightDialog.tsx
'use client';
import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getTranslator } from '@/lib/i18n';
import { Swords } from 'lucide-react';

interface FightDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  language: 'en' | 'zh';
}

export function FightDialog({ isOpen, onOpenChange, language }: FightDialogProps) {
  const t = useMemo(() => getTranslator(language), [language]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Swords />
            Combat Engaged!
          </DialogTitle>
          <DialogDescription>
            The full combat system will be implemented here.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 text-center">
            <p>Fight logic coming soon...</p>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
