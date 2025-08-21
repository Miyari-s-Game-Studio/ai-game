
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import type { ActionDetail } from '@/types/game';

interface ActionPanelProps {
  allowedActions: string[];
  actionDetails: Record<string, ActionDetail>;
  onAction: (actionId: string, target?: string) => void;
  disabled: boolean;
  actionTarget?: { actionId: string, target: string };
}

const getDynamicIcon = (iconName: string): React.ElementType => {
    if (LucideIcons[iconName as keyof typeof LucideIcons]) {
        return LucideIcons[iconName as keyof typeof LucideIcons];
    }
    return LucideIcons.HelpCircle; // Default icon
};

const ActionPanel: React.FC<ActionPanelProps> = ({ allowedActions, actionDetails, onAction, disabled, actionTarget }) => {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [target, setTarget] = useState('');
  
  const currentActionDetails = useMemo(() => {
      if (!selectedAction) return null;
      return actionDetails[selectedAction];
  }, [selectedAction, actionDetails]);

  useEffect(() => {
    if (actionTarget) {
      const details = actionDetails[actionTarget.actionId];
      if (details?.requiresTarget) {
          setSelectedAction(actionTarget.actionId);
          setTarget(actionTarget.target);
      }
    }
  }, [actionTarget, actionDetails]);

  const handleActionSelect = (actionId: string) => {
    const details = actionDetails[actionId];
    if (details.requiresTarget) {
        if (selectedAction === actionId) {
            // Deselect if clicking the same action
            setSelectedAction(null);
        } else {
            setSelectedAction(actionId);
            setTarget(''); // Reset target when switching actions
        }
    } else {
        // For actions without targets, execute immediately
        onAction(actionId);
        setSelectedAction(null);
    }
  }

  const handleExecute = () => {
    if (!selectedAction) return;
    onAction(selectedAction, target);
    setTarget('');
    setSelectedAction(null);
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 rounded-lg border bg-background/60 p-2 shadow-sm">
            {allowedActions.map(actionId => {
              const details = actionDetails[actionId];
              if (!details) return null;
              const Icon = getDynamicIcon(details.icon);

              return (
                <Tooltip key={actionId} delayDuration={0}>
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
                    <TooltipContent>
                        <p className="font-semibold">{details.label}</p>
                        <p className="text-muted-foreground">{details.description}</p>
                    </TooltipContent>
                </Tooltip>
              )
            })}
        </div>
        
        {selectedAction && currentActionDetails?.requiresTarget && (
             <div className="rounded-lg border bg-background/60 p-4 shadow-sm animate-in fade-in-50">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                        {React.createElement(getDynamicIcon(currentActionDetails.icon), { className: 'h-6 w-6' })}
                        <span>{currentActionDetails.label}</span>
                    </div>
                     <Input
                        type="text"
                        placeholder="Specify target..."
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        disabled={disabled}
                        className="flex-grow bg-background text-base"
                        onKeyDown={(e) => e.key === 'Enter' && target && handleExecute()}
                    />
                    <Button onClick={handleExecute} disabled={disabled || !target}>
                        <ChevronRight className="mr-2" />
                        Execute
                    </Button>
                </div>
             </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default ActionPanel;
