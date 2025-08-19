import React from 'react';
import type { Track } from '@/types/game';
import { Progress } from '@/components/ui/progress';
import * as LucideIcons from 'lucide-react';

interface TrackDisplayProps {
  trackId: string;
  track: Track;
  style?: { icon: string; color: string; progressColor: string; };
}

const genericIcons = ['TrendingUp', 'Zap', 'Shield', 'Megaphone', 'AlertTriangle', 'Leaf'];
const genericColors = [
    'text-sky-500',
    'text-amber-500',
    'text-emerald-500',
    'text-rose-500',
    'text-violet-500',
    'text-blue-500',
];
const genericProgressColors = [
    '[&>div]:bg-sky-500',
    '[&>div]:bg-amber-500',
    '[&>div]:bg-emerald-500',
    '[&>div]:bg-rose-500',
    '[&>div]:bg-violet-500',
    '[&>div]:bg-blue-500',
];

// Simple hash function to get a consistent index for a given string
const simpleHash = (s: string) => {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
        const char = s.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
};

const getDynamicIcon = (iconName?: string) => {
    if (iconName && LucideIcons[iconName as keyof typeof LucideIcons]) {
        return LucideIcons[iconName as keyof typeof LucideIcons];
    }
    return LucideIcons.TrendingUp;
};


const TrackDisplay: React.FC<TrackDisplayProps> = ({ trackId, track, style }) => {
  const hash = simpleHash(trackId);
  
  const Icon = getDynamicIcon(style?.icon || genericIcons[hash % genericIcons.length]);
  const colorClass = style?.color || genericColors[hash % genericColors.length];
  const progressColorClass = style?.progressColor || genericProgressColors[hash % genericProgressColors.length];
  
  const progressValue = (track.value / track.max) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${colorClass}`} />
            <span className="font-medium">{track.name}</span>
        </div>
        <span className={`font-semibold text-sm ${colorClass}`}>
          {track.value} / {track.max}
        </span>
      </div>
      <Progress value={progressValue} className={`h-3 ${progressColorClass}`} />
    </div>
  );
};

export default TrackDisplay;
