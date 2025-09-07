// src/components/game/v2/CharacterView.tsx
'use client';
import React from 'react';
import Image from 'next/image';
import PlayerStatsComponent from '@/components/game/PlayerStats';
import InventoryDisplay from '@/components/game/InventoryDisplay';
import CountersDisplay from '@/components/game/CountersDisplay';
import type { PlayerStats, GameRules, Item, GameState } from '@/types/game';

interface CharacterViewProps {
  player: PlayerStats;
  counters: GameState['counters'];
  rules: GameRules;
  onItemAction: (action: 'use' | 'discard' | 'equip' | 'unequip', item: Item) => void;
  onOpenInventory: () => void;
  t: any;
}

export function CharacterView({ player, counters, rules, onItemAction, onOpenInventory, t }: CharacterViewProps) {
  return (
    <div className="flex-1 flex overflow-hidden">
        <aside className="w-1/2 flex flex-col p-8 border-r bg-muted/30 border-border gap-8">
            <div className="relative w-full h-1/2 rounded-lg overflow-hidden shadow-lg border border-border">
                <Image
                    src="https://placehold.co/600x400/292524/a8a29e?text=Portrait"
                    alt="Character Portrait"
                    fill
                    style={{ objectFit: 'cover' }}
                    data-ai-hint="fantasy character portrait"
                />
            </div>
            <PlayerStatsComponent stats={player} onOpenInventory={onOpenInventory} />
        </aside>
        <main className="w-1/2 flex flex-col p-8 space-y-6 overflow-y-auto">
            <InventoryDisplay
                inventory={player.inventory}
                equipment={player.equipment}
                onItemAction={onItemAction}
                language={rules.language}
            />
            <CountersDisplay
                counters={counters}
                iconMap={rules.ui?.counterIcons}
                title={t.keyItemsAndInfo}
            />
        </main>
    </div>
  );
}
