import React from 'react';
import type { Track } from '@/types/game';
import { Progress } from '@/components/ui/progress';
import { Leaf, Shield, Megaphone, AlertTriangle } from 'lucide-react';

interface TrackDisplayProps {
  trackId: string;
  track: Track;
}

const icons: { [key: string]: React.ElementType } = {
  'eco.pollution': AlertTriangle,
  'eco.governance': Shield,
  'eco.media': Megaphone,
};

const colors: { [key: string]: string } = {
    'eco.pollution': 'text-destructive',
    'eco.governance': 'text-blue-500',
    'eco.media': 'text-yellow-500',
};

const progressColors: { [key: string]: string } = {
    'eco.pollution': '[&>div]:bg-destructive',
    'eco.governance': '[&>div]:bg-blue-500',
    'eco.media': '[&>div]:bg-yellow-500',
}

const TrackDisplay: React.FC<TrackDisplayProps> = ({ trackId, track }) => {
  const Icon = icons[trackId] || Leaf;
  const colorClass = colors[trackId] || 'text-primary';
  const progressColorClass = progressColors[trackId] || '';
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
