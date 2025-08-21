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
  Search,
  FlaskConical,
  MessageSquare,
  Megaphone,
  Flag,
  Eye,
  Building,
  Wrench,
  Archive,
  PartyPopper,
  Handshake,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface ActionPanelProps {
  allowedActions: string[];
  onAction: (actionId: string, target?: string) => void;
  disabled: boolean;
  actionTarget?: { actionId: string, target: string };
}

const actionDetails: { [key: string]: { icon: React.ElementType, description: string, requiresTarget?: boolean, label: string } } = {
    observe: { icon: Eye, description: 'Scan the area for general clues and environmental signs.', label: 'Observe' },
    investigate: { icon: Search, description: 'Focus on a specific point of interest.', requiresTarget: true, label: 'Investigate' },
    sample: { icon: FlaskConical, description: 'Take a sample for analysis.', requiresTarget: true, label: 'Take Sample' },
    talk: { icon: MessageSquare, description: 'Interview a person of interest.', requiresTarget: true, label: 'Talk To' },
    announce: { icon: Megaphone, description: 'Hold a press conference or issue a public statement.', label: 'Announce' },
    declare: { icon: Flag, description: 'Officially declare your strategic approach.', requiresTarget: true, label: 'Declare Strategy' },
    negotiate: { icon: Handshake, description: 'Negotiate with stakeholders.', requiresTarget: true, label: 'Negotiate' },
    build: { icon: Building, description: 'Construct environmental remediation facilities.', label: 'Build' },
    clean: { icon: Wrench, description: 'Perform cleanup operations.', label: 'Clean Up' },
    reflect: { icon: Archive, description: 'Review the case and archive findings.', label: 'Reflect' },
    celebrate: { icon: PartyPopper, description: 'Celebrate the resolution of the crisis.', label: 'Celebrate' },
};

const ActionPanel: React.FC<ActionPanelProps> = ({ allowedActions, onAction, disabled, actionTarget }) => {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [target, setTarget] = useState('');
  
  const currentActionDetails = useMemo(() => {
      if (!selectedAction) return null;
      return actionDetails[selectedAction];
  }, [selectedAction]);

  useEffect(() => {
    if (actionTarget) {
      const details = actionDetails[actionTarget.actionId];
      if (details?.requiresTarget) {
          setSelectedAction(actionTarget.actionId);
          setTarget(actionTarget.target);
      }
    }
  }, [actionTarget]);

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
              const Icon = details.icon;

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
                        <currentActionDetails.icon className="h-6 w-6" />
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
