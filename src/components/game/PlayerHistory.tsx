// src/components/game/PlayerHistory.tsx
import React, {useMemo} from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PlayerStats, CompletedScenario, PlayerAttributes, AttributeChange } from '@/types/game';
import { Swords, PersonStanding, Heart, Brain, BookOpen, Smile, ArrowUp, ArrowDown, ArrowRight, TrendingUp } from 'lucide-react';
import { Separator } from '../ui/separator';
import { getTranslator } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"


interface PlayerHistoryProps {
  player: PlayerStats;
}

const attributeDetails: { [key in keyof PlayerAttributes]: { icon: React.ElementType, label: string } } = {
    strength: { icon: Swords, label: 'STR' },
    dexterity: { icon: PersonStanding, label: 'DEX' },
    constitution: { icon: Heart, label: 'CON' },
    intelligence: { icon: Brain, label: 'INT' },
    wisdom: { icon: BookOpen, label: 'WIS' },
    charisma: { icon: Smile, label: 'CHA' },
};


const AttributeChangeRow: React.FC<{ change: AttributeChange }> = ({ change }) => {
    const details = attributeDetails[change.attribute];
    const Icon = details.icon;
    const isIncrease = change.change > 0;
    const ChangeIcon = isIncrease ? ArrowUp : ArrowDown;

    return (
        <div className="flex items-center text-sm">
            <Icon className="w-4 h-4 mr-2 text-primary" />
            <span className="font-semibold w-24">{details.label}</span>
            <div className="flex items-center gap-2">
                <span className="font-mono">{change.oldValue}</span>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                <span className="font-mono font-bold">{change.newValue}</span>
            </div>
            <div className={cn("flex items-center font-semibold ml-auto", isIncrease ? 'text-emerald-500' : 'text-rose-500')}>
                <ChangeIcon className="w-3 h-3 mr-0.5" />
                <span>{Math.abs(change.change)}</span>
            </div>
        </div>
    )
}

const PlayerHistory: React.FC<PlayerHistoryProps> = ({ player }) => {
  const t = useMemo(() => getTranslator(player.language), [player.language]);

  if (!player.history || player.history.length === 0) {
      return (
        <Card>
            <CardHeader>
                <CardTitle>Character Progression</CardTitle>
                <CardDescription>Complete a scenario to see your character's story unfold.</CardDescription>
            </CardHeader>
        </Card>
      );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp />
          Character Progression
        </CardTitle>
        <CardDescription>Your character's journey and growth across all completed scenarios.</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
        {player.history.map((entry, index) => (
            <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger>
                     <div className="flex flex-col items-start text-left">
                        <h4 className="font-bold">{entry.title}</h4>
                        <p className="text-sm text-muted-foreground">Ended with: <span className="font-semibold text-primary/90">{entry.endingSituationLabel}</span></p>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="space-y-3 pl-2">
                        <h5 className="font-semibold text-muted-foreground">Attribute Changes</h5>
                        {entry.attributeChanges.length > 0 ? (
                             entry.attributeChanges.map(change => (
                                <AttributeChangeRow key={change.attribute} change={change} />
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground italic">No attributes were changed in this chapter.</p>
                        )}
                       
                    </div>
                </AccordionContent>
            </AccordionItem>
        ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default PlayerHistory;
