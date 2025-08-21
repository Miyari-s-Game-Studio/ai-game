// src/components/game/PlayerStats.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PlayerStats as PlayerStatsType, PlayerAttributes, Equipment } from '@/types/game';
import { Swords, PersonStanding, Heart, Brain, BookOpen, Smile, Shirt, Footprints, Sparkles, User } from 'lucide-react';
import { Separator } from '../ui/separator';


interface PlayerStatsProps {
  stats: PlayerStatsType;
}

const attributeDetails: { [key in keyof PlayerAttributes]: { icon: React.ElementType, label: string } } = {
    strength: { icon: Swords, label: 'STR' },
    dexterity: { icon: PersonStanding, label: 'DEX' },
    constitution: { icon: Heart, label: 'CON' },
    intelligence: { icon: Brain, label: 'INT' },
    wisdom: { icon: BookOpen, label: 'WIS' },
    charisma: { icon: Smile, label: 'CHA' },
};

const equipmentDetails: { [key in keyof Equipment]: { icon: React.ElementType, label: string } } = {
    top: { icon: Shirt, label: 'Top' },
    bottom: { icon: User, label: 'Bottom' },
    underwear: { icon: User, label: 'Underwear' },
    panties: { icon: User, label: 'Panties' },
    shoes: { icon: Footprints, label: 'Shoes' },
    socks: { icon: User, label: 'Socks' },
    accessory: { icon: Sparkles, label: 'Accessory' },
};

const PlayerStats: React.FC<PlayerStatsProps> = ({ stats }) => {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-headline">{stats.name}</CardTitle>
        <CardDescription>{stats.identity}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Attributes</h4>
            <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                {Object.entries(stats.attributes).map(([key, value]) => {
                    const details = attributeDetails[key as keyof PlayerAttributes];
                    if (!details) return null;
                    const Icon = details.icon;
                    return (
                        <div key={key} className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-primary" />
                            <span className="font-semibold">{details.label}:</span>
                            <span className="font-mono">{value}</span>
                        </div>
                    )
                })}
            </div>
        </div>

        <Separator />

        <div>
             <h4 className="text-sm font-medium text-muted-foreground mb-2">Equipment</h4>
             <div className="space-y-1">
                {Object.entries(stats.equipment)
                    .filter(([_, value]) => value) // Filter out empty slots
                    .map(([key, value]) => {
                    const details = equipmentDetails[key as keyof Equipment];
                    if (!details) return null;
                    const Icon = details.icon;
                    return (
                        <div key={key} className="flex items-center gap-2 text-sm">
                            <Icon className="w-4 h-4 text-muted-foreground"/>
                            <span className="font-semibold capitalize">{details.label}:</span>
                            <span>{value}</span>
                        </div>
                    )
                })}
             </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerStats;
