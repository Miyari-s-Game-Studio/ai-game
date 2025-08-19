import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Search,
  FlaskConical,
  MessageSquare,
  Megaphone,
  Flag,
  ObserveIcon,
  Eye,
  Building,
  Wrench,
  Archive,
  PartyPopper,
  Handshake,
} from 'lucide-react';

interface ActionPanelProps {
  allowedActions: string[];
  onAction: (actionId: string, target?: string) => void;
  disabled: boolean;
}

const actionDetails: { [key: string]: { icon: React.ElementType, description: string, requiresTarget?: boolean } } = {
    observe: { icon: Eye, description: 'Scan the area for general clues and environmental signs.' },
    investigate: { icon: Search, description: 'Focus on a specific point of interest.', requiresTarget: true },
    sample: { icon: FlaskConical, description: 'Take a sample for analysis.', requiresTarget: true },
    talk: { icon: MessageSquare, description: 'Interview a person of interest.', requiresTarget: true },
    announce: { icon: Megaphone, description: 'Hold a press conference or issue a public statement.' },
    declare: { icon: Flag, description: 'Officially declare your strategic approach.', requiresTarget: true },
    negotiate: { icon: Handshake, description: 'Negotiate with stakeholders.', requiresTarget: true },
    build: { icon: Building, description: 'Construct environmental remediation facilities.' },
    clean: { icon: Wrench, description: 'Perform cleanup operations.' },
    reflect: { icon: Archive, description: 'Review the case and archive findings.' },
    celebrate: { icon: PartyPopper, description: 'Celebrate the resolution of the crisis.' },
};

const ActionPanel: React.FC<ActionPanelProps> = ({ allowedActions, onAction, disabled }) => {
  const [targets, setTargets] = useState<Record<string, string>>({});

  const handleTargetChange = (actionId: string, value: string) => {
    setTargets(prev => ({ ...prev, [actionId]: value }));
  };

  const handleActionClick = (actionId: string) => {
    const details = actionDetails[actionId];
    if (details?.requiresTarget && !targets[actionId]) {
      // Maybe show a toast or an error message
      console.warn(`Action "${actionId}" requires a target.`);
      return;
    }
    onAction(actionId, targets[actionId]);
    // Clear input after action
    handleTargetChange(actionId, '');
  };

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {allowedActions.map(actionId => {
          const details = actionDetails[actionId];
          if (!details) return null;
          const Icon = details.icon;

          return (
            <div key={actionId} className="flex flex-col gap-2 p-3 border rounded-lg bg-background/60 shadow-sm">
                <Tooltip>
                    <TooltipTrigger asChild>
                         <h4 className="font-semibold flex items-center gap-2 text-primary cursor-help">
                            <Icon className="w-5 h-5" />
                            <span className="capitalize">{actionId}</span>
                         </h4>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{details.description}</p>
                    </TooltipContent>
                </Tooltip>

              {details.requiresTarget && (
                <Input
                  type="text"
                  placeholder={'Specify target...'}
                  value={targets[actionId] || ''}
                  onChange={(e) => handleTargetChange(actionId, e.target.value)}
                  disabled={disabled}
                  className="bg-background"
                />
              )}
              <Button
                onClick={() => handleActionClick(actionId)}
                disabled={disabled || (details.requiresTarget && !targets[actionId])}
                variant="default"
                size="sm"
              >
                Execute
              </Button>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default ActionPanel;
