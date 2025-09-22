// src/components/game/mobile/MobileActionPanel.tsx
'use client';
import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import * as LucideIcons from 'lucide-react';
import type { ActionDetail, ActionRule, GameRules } from '@/types/game';

interface MobileActionPanelProps {
  allowedActions: string[];
  actionDetails: Record<string, ActionDetail>;
  actionRules: ActionRule[];
  onAction: (actionId: string, target?: string) => void;
  disabled: boolean;
  t: any; // Translator function
}

const getDynamicIcon = (iconName: string): React.ElementType => {
  if (LucideIcons[iconName as keyof typeof LucideIcons]) {
    return LucideIcons[iconName as keyof typeof LucideIcons] as React.ElementType;
  }
  return LucideIcons.HelpCircle; // Default icon
};

export const MobileActionPanel: React.FC<MobileActionPanelProps> = ({
  actionRules,
  actionDetails,
  onAction,
  disabled,
  t,
}) => {

  const flattenedActions = useMemo(() => {
    const actions: { actionId: string, target?: string, label: string, icon: string }[] = [];

    actionRules.forEach(rule => {
      const details = actionDetails[rule.when.actionId];
      if (!details) return;

      if (rule.when.targets) {
        rule.when.targets.split('|').forEach(target => {
          actions.push({
            actionId: rule.when.actionId,
            target: target.trim(),
            label: `${details.label} ${target.trim()}`,
            icon: details.icon,
          });
        });
      } else {
        // Add action only if it's not already added as a target-less action.
        if (!actions.some(a => a.actionId === rule.when.actionId && !a.target)) {
           actions.push({
            actionId: rule.when.actionId,
            label: details.label,
            icon: details.icon,
          });
        }
      }
    });

    // Special handling for ending
     const endRule = actionRules.find(r => r.when.actionId === '__end_scenario__');
     if (endRule) {
        const details = actionDetails['__end_scenario__'];
        if (details) {
            actions.push({
                actionId: '__end_scenario__',
                label: details.label,
                icon: details.icon
            });
        }
     }


    return actions;
  }, [actionRules, actionDetails]);


  return (
    <div className="p-4 space-y-3">
        <h3 className="font-semibold text-lg">{t.actions}</h3>
        <div className="grid grid-cols-1 gap-2">
            {flattenedActions.map(({ actionId, target, label, icon }, index) => {
                const Icon = getDynamicIcon(icon);
                return (
                    <Button
                        key={`${actionId}-${target}-${index}`}
                        variant="outline"
                        className="justify-start h-12 text-base"
                        onClick={() => onAction(actionId, target)}
                        disabled={disabled}
                    >
                        <Icon className="mr-3" />
                        <span>{label}</span>
                    </Button>
                );
            })}
        </div>
    </div>
  );
};
