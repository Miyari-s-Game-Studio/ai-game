// src/components/game/DiceRollDialog.tsx
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
import {Loader2, Dices, ArrowRight} from 'lucide-react';
import type {ActionCheckState, GameRules, PlayerStats, Situation} from '@/types/game';
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import {Label} from "@/components/ui/label";
import {Separator} from "@/components/ui/separator";
import {cn} from "@/lib/utils";
import EffectPreview from './EffectPreview';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface DiceRollDialogProps {
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

// Helper to get the modifier from an attribute score
const getAttributeModifier = (score: number) => {
  return Math.floor((score - 10) / 2);
};

export function DiceRollDialog({
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
                               }: DiceRollDialogProps) {
  const t = useMemo(() => getTranslator(language), [language]);

  const [selectedAttribute, setSelectedAttribute] = useState<keyof typeof playerStats.attributes | null>(null);
  const [roll, setRoll] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  useEffect(() => {
    // When the dialog opens with a new check, pre-select the first relevant attribute
    if (isOpen && actionCheck && actionCheck.relevantAttributes.length > 0) {
      setSelectedAttribute(actionCheck.relevantAttributes[0]);
    }
    // Reset state when dialog closes
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
      if (!r.when.targetPattern && target) return false;
      if (r.when.targetPattern && !target) return false;
      if (r.when.targetPattern && target && !new RegExp(`^(${r.when.targetPattern})$`, 'i').test(target)) return false;
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
      setTimeout(() => onRollComplete(passed), 2000); // Wait 2s to show result before closing
    }, 1000); // Animate for 1s
  };

  const modifier = selectedAttribute ? getAttributeModifier(playerStats.attributes[selectedAttribute]) : 0;
  const total = roll !== null ? roll + modifier : null;
  const passed = total !== null && actionCheck ? total >= actionCheck.difficultyClass : null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t.diceRollTitle}: {actionId}</DialogTitle>
          <DialogDescription>{t.diceRollDescription}</DialogDescription>
        </DialogHeader>

        {isGenerating || !actionCheck ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin"/>
          </div>
        ) : (
          <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
                <div className="flex items-center justify-around text-center">
                  <div>
                    <Label className="text-sm font-normal text-muted-foreground">{t.difficultyClass}</Label>
                    <p className="text-5xl font-bold text-destructive">{actionCheck.difficultyClass}</p>
                  </div>
                </div>

                <Separator/>

                <div>
                  <Label className="text-base font-semibold">{t.relevantAttributes}</Label>
                  <RadioGroup
                    value={selectedAttribute || ''}
                    onValueChange={(val) => setSelectedAttribute(val as keyof typeof playerStats.attributes)}
                    className="mt-2 grid grid-cols-2 gap-4"
                  >
                    {actionCheck.relevantAttributes.map(attr => (
                      <div key={attr}>
                        <RadioGroupItem value={attr} id={attr} className="sr-only peer"/>
                        <Label
                          htmlFor={attr}
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          <span className="text-lg font-bold capitalize">{attr}</span>
                          <span
                            className="text-2xl font-mono">{getAttributeModifier(playerStats.attributes[attr]) >= 0 ? '+' : ''}{getAttributeModifier(playerStats.attributes[attr])}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {roll !== null && total !== null && (
                  <div className="text-center p-4 bg-muted rounded-lg animate-in fade-in-50">
                    <div className="flex justify-center items-center gap-4 text-2xl font-bold">
                      <div className="flex items-center gap-2">
                        <Dices className="w-8 h-8 text-primary"/>
                        <span>{roll}</span>
                      </div>
                      <span className="text-muted-foreground">+</span>
                      <span>{modifier}</span>
                      <ArrowRight/>
                      <span
                        className={cn("text-4xl", passed ? 'text-green-500' : 'text-destructive')}>{total}</span>
                    </div>
                    <p className={cn("text-2xl font-bold mt-2", passed ? 'text-green-500' : 'text-destructive')}>
                      {passed ? t.success : t.failure}
                    </p>
                  </div>
                )}
            </div>

            <div className="space-y-4">
              {actionRule?.do && (
                <Card className="bg-emerald-500/10 border-emerald-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-emerald-600 dark:text-emerald-400">On Success</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EffectPreview effects={actionRule.do} rules={rules} />
                  </CardContent>
                </Card>
              )}
               {actionRule?.fail && actionRule.fail.length > 0 && (
                <Card className="bg-rose-500/10 border-rose-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-rose-600 dark:text-rose-400">On Failure</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EffectPreview effects={actionRule.fail} rules={rules} />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
