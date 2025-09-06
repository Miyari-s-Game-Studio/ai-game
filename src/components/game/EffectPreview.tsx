
// src/components/game/EffectPreview.tsx
import React from 'react';
import type { GameRules, DoAction } from '@/types/game';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { ArrowUp, ArrowDown, ChevronsRight } from 'lucide-react';

interface EffectPreviewProps {
  effects: DoAction[];
  rules: GameRules;
}

const getDynamicIcon = (iconName?: string): React.ElementType => {
  if (iconName && LucideIcons[iconName as keyof typeof LucideIcons]) {
    return LucideIcons[iconName as keyof typeof LucideIcons] as any;
  }
  return LucideIcons.Star;
};

const EffectPreview: React.FC<EffectPreviewProps> = ({ effects, rules }) => {
  const parsedEffects = effects.map((action, index) => {
    // We only preview direct state changes, not conditional ones or logs
    if (action.if || action.log || action.secret || action.agreement) {
      return null;
    }

    let type: string | null = null;
    let params: any = null;

    for (const key in action) {
      if (key !== 'if' && key !== 'cap') {
        type = key;
        params = (action as any)[key];
      }
    }

    if (!type || !params) return null;

    let icon: React.ElementType = LucideIcons.Star;
    let label = "Effect";
    let value: React.ReactNode = null;

    switch (type) {
      case 'add':
      case 'track': {
        const [path, valStr] = (params as string).split(',');
        const val = parseInt(valStr, 10);
        if (isNaN(val)) return null;

        const [obj, key] = path.split('.');
        if (!key) return null; // Add defensive check here

        let name = key;
        if (type === 'track' && rules.tracks[key]) {
            name = rules.tracks[key].name;
            const style = rules.ui?.trackStyles?.[key];
            icon = getDynamicIcon(style?.icon);
        } else {
            const counterIconName = rules.ui?.counterIcons?.[key] || rules.ui?.counterIcons?.default;
            icon = getDynamicIcon(counterIconName);
        }

        label = name.replace(/_/g, ' ');
        value = (
          <div className={cn("flex items-center font-semibold ml-auto", val > 0 ? 'text-emerald-500' : 'text-rose-500')}>
            {val > 0 ? <ArrowUp className="w-4 h-4 mr-0.5" /> : <ArrowDown className="w-4 h-4 mr-0.5" />}
            <span>{val > 0 ? `+${val}` : val}</span>
          </div>
        );
        break;
      }
      case 'set': {
        const [path, valStr] = (params as string).split(',');
        const parts = path.split('.');
        if (!parts[0]) return null; // Add defensive check here

        if (parts.length === 2) {
            const [obj, key] = parts;
            if (obj === 'counters') {
                const counterIconName = rules.ui?.counterIcons?.[key] || rules.ui?.counterIcons?.default;
                icon = getDynamicIcon(counterIconName);
                label = key.replace(/_/g, ' ');
                value = <span className="font-semibold ml-auto text-primary">{valStr}</span>
            } else {
                 return null; // Don't preview other set types
            }
        } else if (parts[0] === 'next_situation') {
            icon = ChevronsRight;
            label = "Next Situation";
            const situationLabel = rules.situations[valStr]?.label || valStr;
            value = <span className="font-semibold ml-auto text-primary">{situationLabel}</span>
        } else {
            return null; // Don't preview other set types for now
        }
        break;
      }
      default:
        return null;
    }

    const IconComponent = icon;

    return (
        <div key={index} className="flex items-center gap-2 text-sm">
            <IconComponent className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium capitalize">{label}</span>
            {value}
        </div>
    );
  }).filter(Boolean);

  if (parsedEffects.length === 0) {
      return null;
  }

  return (
    <>
        <Separator className="my-2" />
        <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Potential Effects</p>
            {parsedEffects}
        </div>
    </>
  );
};

export default EffectPreview;
