// src/components/game/mobile/MobileDiceRollDialog.tsx
'use client';
import React, {useMemo, useState, useEffect} from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {getTranslator} from '@/lib/i18n';
import {Loader2, Dices, ArrowRight, XCircle} from 'lucide-react';
import type {ActionCheckState, GameRules, PlayerStats, Situation} from '@/types/game';
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import {Label} from "@/components/ui/label";
import {Separator} from "@/components/ui/separator";
import {cn} from "@/lib/utils";
import EffectPreview from '../EffectPreview';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';

interface MobileDiceRollDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  rules: GameRules;
  situation: Situation;
  actionId: string;
  target: string | undefined;
  actionCheck: ActionCheckState | null;
  playerStats: PlayerStats;
  isGenerating: boolean;
  onRollComplete: (passed: boolean) => void;
  language: 'en' | 'zh';
}

const getAttributeModifier = (score: number) => {
  return Math.floor((score - 10) / 2);
};

export function MobileDiceRollDialog({
   isOpen,
   onOpenChange,
   rules,
   situation,
   actionId,
   target,
   actionCheck,
   playerStats,
   isGenerating,
   onRollComplete,
   language,
}: MobileDiceRollDialogProps) {
  const t = useMemo(() => getTranslator(language), [language]);

  const [selectedAttribute, setSelectedAttribute] = useState<keyof typeof playerStats.attributes | null>(null);
  const [roll, setRoll] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  useEffect(() => {
    if (isOpen && actionCheck && actionCheck.relevantAttributes.length > 0) {
      setSelectedAttribute(actionCheck.relevantAttributes[0]);
    }
    if (!isOpen) {
      setRoll(null);
      setIsRolling(false);
      setSelectedAttribute(null);
    }
  }, [isOpen, actionCheck]);

  const actionRule = useMemo(() => {
    if (!situation) return null;
    return situation.on_action.find(r => {
      if (r.when.actionId !== actionId) return false;
      if (!r.when.targets && target) return false;
      if (r.when.targets && !target) return false;
      if (r.when.targets && target && !new RegExp(`^(${r.when.targets})$`, 'i').test(target)) return false;
      return true;
    });
  }, [situation, actionId, target]);


  const handleRoll = () => {
    if (!selectedAttribute || !actionCheck) return;
    setIsRolling(true);
    const dieRoll = Math.floor(Math.random() * 20) + 1;

    setTimeout(() => {
      setRoll(dieRoll);
      setIsRolling(false);
      const modifier = getAttributeModifier(playerStats.attributes[selectedAttribute]);
      const total = dieRoll + modifier;
      const passed = total >= actionCheck.difficultyClass;
      setTimeout(() => onRollComplete(passed), 2000); 
    }, 1000);
  };

  const modifier = selectedAttribute ? getAttributeModifier(playerStats.attributes[selectedAttribute]) : 0;
  const total = roll !== null ? roll + modifier : null;
  const passed = total !== null && actionCheck ? total >= actionCheck.difficultyClass : null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl">{t.diceRollTitle}: {rules.actions[actionId]?.label}</DialogTitle>
          <DialogDescription>{t.diceRollDescription}</DialogDescription>
        </DialogHeader>

        {isGenerating || !actionCheck ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin"/>
          </div>
        ) : (
          <div className="px-6 py-4 space-y-6">
              <div className="flex items-center justify-around text-center p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label className="text-sm font-normal text-muted-foreground">{t.difficultyClass}</Label>
                  <p className="text-5xl font-bold text-destructive">{actionCheck.difficultyClass}</p>
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold">{t.relevantAttributes}</Label>
                <RadioGroup
                  value={selectedAttribute || ''}
                  onValueChange={(val) => setSelectedAttribute(val as keyof typeof playerStats.attributes)}
                  className="mt-2 grid grid-cols-3 gap-2"
                >
                  {actionCheck.relevantAttributes.map(attr => (
                    <div key={attr}>
                      <RadioGroupItem value={attr} id={`mobile-${attr}`} className="sr-only peer"/>
                      <Label
                        htmlFor={`mobile-${attr}`}
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 text-sm h-16 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <span className="font-bold capitalize">{attr}</span>
                        <span
                          className="text-lg font-mono">{getAttributeModifier(playerStats.attributes[attr]) >= 0 ? '+' : ''}{getAttributeModifier(playerStats.attributes[attr])}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {roll !== null && total !== null && (
                <div className="text-center p-4 bg-muted rounded-lg animate-in fade-in-50">
                  <div className="flex justify-center items-center gap-2 text-xl font-bold">
                    <div className="flex items-center gap-1">
                      <Dices className="w-6 h-6 text-primary"/>
                      <span>{roll}</span>
                    </div>
                    <span className="text-muted-foreground">+</span>
                    <span>{modifier}</span>
                    <ArrowRight/>
                    <span
                      className={cn("text-3xl", passed ? 'text-green-500' : 'text-destructive')}>{total}</span>
                  </div>
                  <p className={cn("text-2xl font-bold mt-2", passed ? 'text-green-500' : 'text-destructive')}>
                    {passed ? t.success : t.failure}
                  </p>
                </div>
              )}
          </div>
        )}

        <DialogFooter className="p-4 border-t flex-col gap-2">
          <Button
            onClick={handleRoll}
            disabled={isGenerating || isRolling || roll !== null || !selectedAttribute}
            className="w-full text-lg py-6"
          >
            {(isRolling || roll !== null) ? (
              <Loader2 className="mr-2 h-6 w-6 animate-spin"/>
            ) : (
              <Dices className="mr-2 h-6 w-6"/>
            )}
            {isRolling ? 'Rolling...' : (roll !== null ? (passed ? t.success : t.failure) : t.roll)}
          </Button>
           <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isRolling}>
            <XCircle className="mr-2" />
            {t.cancel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
