import React, {useState, useEffect, useMemo} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ChevronRight,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type {ActionDetail, ActionRule, GameRules} from '@/types/game';
import EffectPreview from './EffectPreview';

interface ActionPanelProps {
  rules: GameRules;
  allowedActions: string[];
  actionDetails: Record<string, ActionDetail>;
  actionRules: ActionRule[];
  onAction: (actionId: string, target?: string) => void;
  onTalk: (target: string) => void;
  disabled: boolean;
  selectedAction: string | null;
  onSelectedActionChange: (actionId: string | null) => void;
  target: string;
  onTargetChange: (target: string) => void;
  actionTarget?: { actionId: string, target: string };
}

const getDynamicIcon = (iconName: string): React.ElementType => {
  if (LucideIcons[iconName as keyof typeof LucideIcons]) {
    return LucideIcons[iconName as keyof typeof LucideIcons] as React.ElementType;
  }
  return LucideIcons.HelpCircle; // Default icon
};

const ActionPanel: React.FC<ActionPanelProps> = ({
                                                   rules,
                                                   allowedActions,
                                                   actionDetails,
                                                   actionRules,
                                                   onAction,
                                                   onTalk,
                                                   disabled,
                                                   selectedAction,
                                                   onSelectedActionChange,
                                                   target,
                                                   onTargetChange,
                                                   actionTarget
                                                 }) => {

  const currentActionDetails = useMemo(() => {
    if (!selectedAction) return null;
    return actionDetails[selectedAction];
  }, [selectedAction, actionDetails]);

  const doesActionRequireTarget = (actionId: string) => {
    return actionRules.some(rule => rule.when.actionId === actionId && rule.when.targets);
  };

  useEffect(() => {
    if (actionTarget) {
      if (doesActionRequireTarget(actionTarget.actionId)) {
        onSelectedActionChange(actionTarget.actionId);
        onTargetChange(actionTarget.target);
      }
    }
  }, [actionTarget]);

  const handleActionSelect = (actionId: string) => {
    const requiresTarget = doesActionRequireTarget(actionId);

    if (requiresTarget) {
      if (selectedAction === actionId) {
        onSelectedActionChange(null);
      } else {
        onSelectedActionChange(actionId);
        onTargetChange('');
      }
    } else {
      onAction(actionId);
      onSelectedActionChange(null);
    }
  }

  const handleExecute = () => {
    if (!selectedAction) return;

    if (selectedAction === 'talk') {
      onTalk(target);
    } else {
      onAction(selectedAction, target);
    }

    onTargetChange('');
    onSelectedActionChange(null);
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {selectedAction && currentActionDetails && doesActionRequireTarget(selectedAction) && (
          <div className="rounded-lg border bg-background/60 p-4 shadow-sm animate-in fade-in-50">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                {React.createElement(getDynamicIcon(currentActionDetails.icon), {className: 'h-6 w-6'})}
                <span>{currentActionDetails.label}</span>
              </div>
              <Input
                type="text"
                placeholder="Specify target..."
                value={target}
                onChange={(e) => onTargetChange(e.target.value)}
                disabled={disabled}
                className="flex-grow bg-background text-base"
                onKeyDown={(e) => e.key === 'Enter' && target && handleExecute()}
              />
              <Button onClick={handleExecute} disabled={disabled || !target}>
                <ChevronRight className="mr-2"/>
                Execute
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 rounded-lg border bg-background/60 p-2 shadow-sm">
          {allowedActions.map(actionId => {
            const details = actionDetails[actionId];
            if (!details) return null;
            const Icon = getDynamicIcon(details.icon);

            const previewRule = actionRules.find(r => r.when.actionId === actionId);

            return (
              <Tooltip key={actionId} delayDuration={100}>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedAction === actionId ? "default" : "outline"}
                    size="icon"
                    onClick={() => handleActionSelect(actionId)}
                    disabled={disabled}
                    className="h-12 w-12"
                  >
                    <Icon className="h-6 w-6"/>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-base">{details.label}</p>
                      {details.description && <p className="text-xs text-muted-foreground">{details.description}</p>}
                    </div>
                    {previewRule && previewRule.do && (
                      <EffectPreview effects={previewRule.do} rules={rules}/>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ActionPanel;
