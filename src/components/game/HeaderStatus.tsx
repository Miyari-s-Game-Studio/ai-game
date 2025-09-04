// src/components/game/HeaderStatus.tsx
'use client';
import React from 'react';
import type { GameRules, GameState, Track } from '@/types/game';
import TrackDisplay from './TrackDisplay';
import * as LucideIcons from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from '@/components/ui/tooltip';

interface HeaderStatusProps {
    tracks: GameState['tracks'];
    counters: GameState['counters'];
    rules: GameRules;
    language: 'en' | 'zh';
}

const getDynamicIcon = (iconName: string): React.ElementType => {
    if (LucideIcons[iconName as keyof typeof LucideIcons]) {
      return LucideIcons[iconName as keyof typeof LucideIcons] as React.ElementType;
    }
    return LucideIcons.Star; // Default icon
};

const getIconForCounter = (label: string, iconMap?: Record<string, string>): React.ElementType => {
    if (!iconMap) return LucideIcons.Star;
    const lowerLabel = label.toLowerCase();
    for (const keyword in iconMap) {
      if (lowerLabel.includes(keyword)) {
        const iconName = iconMap[keyword];
        return getDynamicIcon(iconName);
      }
    }
    return getDynamicIcon(iconMap.default || 'Star');
};


const CounterItem: React.FC<{ label: string; value: number | boolean; iconMap?: Record<string, string> }> = ({
    label,
    value,
    iconMap
}) => {
    const Icon = getIconForCounter(label, iconMap);
    const formattedLabel = label.replace(/_/g, ' ');

    if (typeof value === 'boolean' && !value) {
        return null; // Don't display boolean counters that are false
    }

    return (
        <TooltipProvider>
            <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/60 hover:bg-background">
                        <Icon className="w-5 h-5 text-primary" />
                        {typeof value === 'boolean' ? null : (
                            <span className="font-bold text-lg">{value}</span>
                        )}
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="font-semibold capitalize">{formattedLabel}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>

    );
};


const HeaderStatus: React.FC<HeaderStatusProps> = ({ tracks, counters, rules }) => {
    const numericCounters = Object.entries(counters).filter(([, value]) => typeof value === 'number' && value > 0);
    const booleanCounters = Object.entries(counters).filter(([, value]) => typeof value === 'boolean' && value);
    const allCounters = [...numericCounters, ...booleanCounters];

    return (
        <div className="w-full bg-muted/30 border-b rounded-lg p-2 flex items-center justify-between gap-6 shrink-0">
            {/* Tracks on the left */}
            <div className="flex items-center gap-4 flex-wrap">
                {Object.entries(tracks).map(([id, track]) => (
                    <div key={id} className="w-48">
                         <TrackDisplay trackId={id} track={track} style={rules.ui?.trackStyles?.[id]} isCompact />
                    </div>
                ))}
            </div>

            {/* Counters on the right */}
            {allCounters.length > 0 && (
                <div className="flex items-center gap-2">
                    <Separator orientation="vertical" className="h-8" />
                    {allCounters.map(([key, value]) => (
                        <CounterItem key={key} label={key} value={value} iconMap={rules.ui?.counterIcons}/>
                    ))}
                </div>
            )}
        </div>
    );
}

export default HeaderStatus;
