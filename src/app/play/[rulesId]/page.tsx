// src/app/play/[rulesId]/page.tsx
'use client';
import {GameUI} from '@/components/game/GameUI';
import {Sidebar} from '@/components/layout/Sidebar';
import {getRuleset} from '@/lib/rulesets';
import {useState, useEffect, use} from 'react';
import type {PlayerStats, GameRules} from '@/types/game';
import {useTheme} from '@/components/layout/ThemeProvider';
import {notFound} from 'next/navigation';

interface PlayPageProps {
  rulesId: string;
}

export default function PlayPage({params}: { params: Promise<PlayPageProps> }) {
  const {rulesId} = use(params);
  const [rules, setRules] = useState<GameRules | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const {initializeTheme} = useTheme();

  useEffect(() => {
    const loadedRules = getRuleset(rulesId);
    if (loadedRules) {
      setRules(loadedRules);
      initializeTheme(loadedRules);
    }
    setIsLoading(false);
  }, [rulesId, initializeTheme]);


  const [gameControlHandlers, setGameControlHandlers] = useState({
    handleSave: () => {
    },
    handleLoad: () => {
    },
    isPending: false,
    isGenerating: false,
  });

  // Initialize player stats with a default or from loaded rules
  const [playerStats, setPlayerStats] = useState<PlayerStats>(rules?.initial.player || {
    name: 'Player',
    identity: 'Adventurer',
    attributes: {strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10},
    equipment: {}
  });

  useEffect(() => {
    if (rules) {
      setPlayerStats(rules.initial.player);
    }
  }, [rules]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading Scenario...</div>;
  }

  if (!rules) {
    return notFound();
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        rules={rules}
        playerStats={playerStats}
        onSave={gameControlHandlers.handleSave}
        onLoad={gameControlHandlers.handleLoad}
        isPending={gameControlHandlers.isPending || gameControlHandlers.isGenerating}
      />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <GameUI
          rules={rules}
          setGameControlHandlers={setGameControlHandlers}
          setPlayerStats={setPlayerStats}
        />
      </main>
    </div>
  );
}
