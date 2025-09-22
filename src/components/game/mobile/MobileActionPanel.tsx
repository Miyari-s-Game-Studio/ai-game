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
  allowedActions,
  actionDetails,
  actionRules,
  onAction,
  disabled,
  t,
}) => {

  const flattenedActions = useMemo(() => {
    const actions: { actionId: string, target?: string, label: string, icon: string }[] = [];
    
    allowedActions.forEach(actionId => {
        const details = actionDetails[actionId];
        if (!details) return;

        // Find all rules for this action to get targets
        const rulesForAction = actionRules.filter(rule => rule.when.actionId === actionId);
        const hasTargetlessRule = rulesForAction.some(rule => !rule.when.targets);
        const allTargets = new Set<string>();
        rulesForAction.forEach(rule => {
            if (rule.when.targets) {
                rule.when.targets.split('|').forEach(target => allTargets.add(target.trim()));
            }
        });

        if (allTargets.size > 0) {
            allTargets.forEach(target => {
                actions.push({
                    actionId: actionId,
                    target: target,
                    label: `${details.label} ${target}`,
                    icon: details.icon,
                });
            });
        } else if (hasTargetlessRule || actionId === '__end_scenario__') {
             // Add action if it's target-less or the special end action
            actions.push({
                actionId: actionId,
                label: details.label,
                icon: details.icon,
            });
        }
    });

    return actions;
  }, [actionRules, actionDetails, allowedActions]);


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
