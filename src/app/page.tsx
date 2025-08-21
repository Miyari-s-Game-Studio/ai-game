// src/app/page.tsx
'use client';
import { GameUI } from '@/components/game/GameUI';
import { Sidebar } from '@/components/layout/Sidebar';
import { defaultGameRules } from '@/lib/game-rules';
import { useState } from 'react';
import type { PlayerStats } from '@/types/game';

export default function Home() {
  const gameTitle = defaultGameRules.title || 'Interactive Narrative Game';
  
  const [gameControlHandlers, setGameControlHandlers] = useState({
    handleSave: () => {},
    handleLoad: () => {},
    isPending: false,
    isGenerating: false,
  });

  const [playerStats, setPlayerStats] = useState<PlayerStats>(defaultGameRules.initial.player);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        playerStats={playerStats}
        onSave={gameControlHandlers.handleSave}
        onLoad={gameControlHandlers.handleLoad}
        isPending={gameControlHandlers.isPending || gameControlHandlers.isGenerating}
      />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <GameUI 
            setGameControlHandlers={setGameControlHandlers}
            setPlayerStats={setPlayerStats} 
          />
      </main>
    </div>
  );
}
