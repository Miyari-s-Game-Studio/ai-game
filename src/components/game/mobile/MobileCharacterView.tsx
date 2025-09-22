// src/components/game/mobile/MobileCharacterView.tsx
'use client';
import React from 'react';
import Image from 'next/image';
import PlayerStatsComponent from '@/components/game/PlayerStats';
import InventoryDisplay from '@/components/game/InventoryDisplay';
import PlayerHistory from '@/components/game/PlayerHistory';
import type { PlayerStats, Item } from '@/types/game';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MobileCharacterViewProps {
  player: PlayerStats;
  onOpenInventory: () => void;
  t: any;
}

export function MobileCharacterView({ player, onOpenInventory, t }: MobileCharacterViewProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="relative w-full h-1/4 shrink-0">
        <Image
            src="https://placehold.co/600x400/292524/a8a29e?text=Portrait"
            alt="Character Portrait"
            fill
            style={{ objectFit: 'cover', objectPosition: 'top' }}
            data-ai-hint="fantasy character portrait"
        />
      </div>
      <div className="p-4">
        <PlayerStatsComponent stats={player} onOpenInventory={onOpenInventory} />
      </div>
      <div className="flex-grow p-4 overflow-y-auto">
        <PlayerHistory player={player} />
      </div>
    </div>
  );
}