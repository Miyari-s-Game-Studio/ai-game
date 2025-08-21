// src/app/page.tsx
'use client';
import { GameUI } from '@/components/game/GameUI';
import { Sidebar } from '@/components/layout/Sidebar';
import { defaultGameRules } from '@/lib/game-rules';
import { useState } from 'react';

export default function Home() {
  const gameTitle = defaultGameRules.title || 'Interactive Narrative Game';
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  
  // These will be placeholders until the GameUI component mounts and provides the real handlers.
  const [gameControlHandlers, setGameControlHandlers] = useState({
    handleSave: () => {},
    handleLoad: () => {},
    isPending: false,
    isGenerating: false,
  });

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        onSave={gameControlHandlers.handleSave}
        onLoad={gameControlHandlers.handleLoad}
        isPending={gameControlHandlers.isPending || gameControlHandlers.isGenerating}
      />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <GameUI setGameControlHandlers={setGameControlHandlers} />
      </main>
    </div>
  );
}
