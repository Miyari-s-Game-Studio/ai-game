import React, { useRef, useEffect, useMemo } from 'react';
import type { ActionRule, ActionDetail, LogEntry, LogEntryChange } from '@/types/game';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Terminal, Bot, User, AlertCircle, ChevronRight, ArrowUp, ArrowDown, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import * as LucideIcons from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';


interface NarrativeLogProps {
  log: LogEntry[];
  knownTargets: string[];
  actionRules: ActionRule[];
  actionDetails: Record<string, ActionDetail>;
  allowedActions: string[];
  onTargetClick: (actionId: string, target: string) => void;
  onLogTargetClick: (target: string) => void;
  isScrollable?: boolean;
  language?: 'en' | 'zh';
  selectedAction: string | null;
}

const getDynamicIcon = (iconName: string): React.ElementType => {
  const Icon = LucideIcons[iconName as keyof typeof LucideIcons] as React.ElementType;
  return Icon || LucideIcons.Star;
};

const logTypeDetails = {
  action: { icon: User, color: 'text-accent', bgColor: 'bg-accent/10', label: 'Player Action' },
  procedural: { icon: Terminal, color: 'text-muted-foreground', bgColor: 'bg-muted/20', label: 'System Log' },
  narrative: { icon: Bot, color: 'text-primary', bgColor: 'bg-primary/10', label: 'Narrative' },
  error: { icon: AlertCircle, color: 'text-destructive', bgColor: 'bg-destructive/10', label: 'Error' },
  player: { icon: User, color: 'text-accent', bgColor: 'bg-accent/10', label: 'Player' },
  npc: { icon: Bot, color: 'text-primary', bgColor: 'bg-primary/10', label: 'NPC' },
};

const MarkdownRenderer: React.FC<{
  text: string;
  targets: string[];
  rules: ActionRule[];
  actionDetails: Record<string, ActionDetail>;
  allowedActions: string[];
  onTargetClick: (actionId: string, target: string) => void;
  onLogTargetClick: (target: string) => void;
  selectedAction: string | null;
  language?: 'en' | 'zh';
}> = ({ text, targets, rules, actionDetails, allowedActions, onTargetClick, onLogTargetClick, selectedAction, language }) => {

  const processNode = (node: React.ReactNode, key: number): React.ReactNode => {
    if (typeof node === 'string') {
      if (targets.length === 0) {
        return node;
      }

      const wordBoundary = language === 'zh' ? '' : '\\b';
      const regex = new RegExp(`(${wordBoundary}(?:${targets.join('|')})${wordBoundary})`, 'gi');
      const parts = node.split(regex);

      return parts.map((part, index) => {
        const isTarget = targets.some(t => new RegExp(`^${t}$`, 'i').test(part));

        if (isTarget) {
          const validActions = rules.filter(rule => {
            if (!allowedActions.includes(rule.when.actionId)) return false;
            if (!rule.when.targets) return false;
            const targetPatterns = rule.when.targets.split('|').map(p => p.trim());
            return targetPatterns.some(p => new RegExp(`^${p}$`, 'i').test(part));
          });

          if (validActions.length === 0) {
            return <span key={index}>{part}</span>;
          }

          // If an action is selected, highlight the target if it's valid for that action.
          if (selectedAction && validActions.some(action => action.when.actionId === selectedAction)) {
            return (
              <span
                key={index}
                onClick={() => onLogTargetClick(part)}
                className="text-underline text-accent-foreground font-semibold rounded-md px-1 py-0.5 cursor-pointer hover:opacity-80"
              >
                {part}
              </span>
            );
          }
          
          // If no action is selected, don't highlight.
          return <span key={index}>{part}</span>;
        }
        return part;
      });
    }

    if (React.isValidElement(node) && node.props.children) {
      const children = React.Children.map(node.props.children, (child, index) => processNode(child, index));
      return React.cloneElement(node, { ...node.props, key }, children);
    }

    return node;
  };

  const customRenderers = {
    p: ({node, children, ...props}: any) => (
      <p {...props} className="mb-2 last:mb-0">
        {React.Children.map(children, (child, index) => processNode(child, index))}
      </p>
    ),
  };

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={customRenderers}>
      {text}
    </ReactMarkdown>
  );
};


const NarrativeLog: React.FC<NarrativeLogProps> = ({ log, knownTargets, actionRules, actionDetails, allowedActions, onTargetClick, onLogTargetClick, selectedAction, isScrollable = false, language = 'en' }) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current && isScrollable) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [log, isScrollable]);

  const LogContent = () => (
    <div className="space-y-4">
      {log.length === 0 && !isScrollable && (
        <div className="text-center text-muted-foreground italic py-4">
          The story will unfold here...
        </div>
      )}
      {log.map((entry, index) => {
        const details = logTypeDetails[entry.type];
        const Icon = details.icon;
        const isSingleNarrative = log.length === 1 && entry.type === 'narrative';

        return (
          <div
            key={entry.id || index}
            className={cn(
              'flex items-start gap-4',
              !isSingleNarrative && 'p-3 rounded-lg',
              !isSingleNarrative && details.bgColor
            )}
          >
            {!isSingleNarrative && (
              <div className={cn("mt-1 p-1.5 rounded-full", details.bgColor)}>
                <Icon className={cn('w-5 h-5', details.color)} />
              </div>
            )}
            <div className="flex-1">
              {!isSingleNarrative && (
                <p className={cn('font-bold text-sm mb-1', details.color)}>
                  {details.label}
                </p>
              )}
              <div className="text-foreground/90 whitespace-pre-wrap">
                 {entry.type === 'narrative' || entry.type === 'procedural' ? (
                  <MarkdownRenderer
                    text={entry.message}
                    targets={knownTargets}
                    rules={actionRules}
                    actionDetails={actionDetails}
                    allowedActions={allowedActions}
                    onTargetClick={onTargetClick}
                    onLogTargetClick={onLogTargetClick}
                    selectedAction={selectedAction}
                    language={language}
                  />
                ) : (
                  entry.message
                )}
              </div>
              {entry.changes && entry.changes.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/50">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
                        {entry.changes.map(change => {
                            const ChangeIcon = getDynamicIcon(change.icon);
                            const deltaColor = change.delta > 0 ? 'text-emerald-500' : 'text-rose-500';
                            const DeltaIcon = change.delta > 0 ? ArrowUp : ArrowDown;
                            return (
                                <div key={change.id} className="flex items-center gap-2 text-sm">
                                    <ChangeIcon className={cn("w-4 h-4", change.color)} />
                                    <span className="font-medium capitalize">{change.name}</span>
                                    {change.id !== 'next_situation' ? (
                                      <div className={cn("flex items-center font-semibold ml-auto", deltaColor)}>
                                          <DeltaIcon className="w-4 h-4 mr-0.5" />
                                          <span>{Math.abs(change.delta)}</span>
                                      </div>
                                    ) : (
                                      <div className={cn("flex items-center font-semibold ml-auto", deltaColor)}>
                                        <ChevronsRight className="w-4 h-4 mr-0.5" />
                                      </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  if (isScrollable) {
      return (
        <ScrollArea className="h-full w-full pr-4" ref={scrollAreaRef}>
          <LogContent />
        </ScrollArea>
      );
  }

  return <LogContent />;
};

export default NarrativeLog;
