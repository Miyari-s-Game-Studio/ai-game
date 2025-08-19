import React, { useRef, useEffect } from 'react';
import type { LogEntry } from '@/types/game';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Terminal, Bot, User, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NarrativeLogProps {
  log: LogEntry[];
}

const logTypeDetails = {
  action: {
    icon: User,
    color: 'text-accent',
    bgColor: 'bg-accent/10',
    label: 'Player Action',
  },
  procedural: {
    icon: Terminal,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/20',
    label: 'System Log',
  },
  narrative: {
    icon: Bot,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    label: 'Narrative',
  },
  error: {
    icon: AlertCircle,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    label: 'Error',
  },
};

const NarrativeLog: React.FC<NarrativeLogProps> = ({ log }) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [log]);


  return (
    <ScrollArea className="h-96 w-full pr-4" ref={scrollAreaRef}>
      <div className="space-y-4">
        {log.map((entry, index) => {
          const details = logTypeDetails[entry.type];
          const Icon = details.icon;
          return (
            <div
              key={entry.id || index}
              className={cn(
                'flex items-start gap-4 p-3 rounded-lg',
                details.bgColor
              )}
            >
              <div className={cn("mt-1 p-1.5 rounded-full", details.bgColor)}>
                <Icon className={cn('w-5 h-5', details.color)} />
              </div>
              <div className="flex-1">
                <p className={cn('font-bold text-sm mb-1', details.color)}>
                  {details.label}
                </p>
                <p className="text-foreground/90 whitespace-pre-wrap">{entry.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default NarrativeLog;
