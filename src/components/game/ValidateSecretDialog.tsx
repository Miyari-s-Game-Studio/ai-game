// src/components/game/ValidateSecretDialog.tsx
'use client';
import React, { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getTranslator } from '@/lib/i18n';
import { Loader2 } from 'lucide-react';

interface ValidateSecretDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onValidate: (guessedSecret: string) => Promise<void>;
  isSubmitting: boolean;
  language: 'en' | 'zh';
}

export function ValidateSecretDialog({ 
    isOpen, 
    onOpenChange, 
    onValidate,
    isSubmitting,
    language 
}: ValidateSecretDialogProps) {
  const t = useMemo(() => getTranslator(language), [language]);
  const [guess, setGuess] = useState('');

  const handleSubmit = () => {
    if (!guess.trim()) return;
    onValidate(guess);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.validateSecretTitle}</DialogTitle>
          <DialogDescription>
            {t.validateSecretDescription}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder={t.enterSecretPlaceholder}
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            disabled={isSubmitting}
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {t.cancel}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !guess.trim()}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t.submitGuess}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
