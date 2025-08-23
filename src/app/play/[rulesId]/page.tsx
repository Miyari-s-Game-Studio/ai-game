
// src/app/play/[rulesId]/page.tsx
'use client';
import {GameUI} from '@/components/game/GameUI';
import {Sidebar} from '@/components/layout/Sidebar';
import {getRuleset} from '@/lib/rulesets';
import {useState, useEffect} from 'react';
import type {PlayerStats, GameRules, GameState} from '@/types/game';
import {useTheme} from '@/components/layout/ThemeProvider';
import {notFound, useRouter, redirect} from 'next/navigation';

interface PlayPageProps {
  params: {
    rulesId: string;
  }
}

const STATE_TO_LOAD_KEY = 'narrativeGameStateToLoad';
const PLAYER_STATS_TO_LOAD_KEY = 'narrativePlayerStatsToLoad';

export default function PlayPage({params: {rulesId}}: PlayPageProps) {
  const router = useRouter();
  const [rules, setRules] = useState<GameRules | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialStateOverride, setInitialStateOverride] = useState<GameState | null>(null);
  const [initialPlayerStats, setInitialPlayerStats] = useState<PlayerStats | null>(null);
  const {initializeTheme} = useTheme();
  
  const [gameControlHandlers, setGameControlHandlers] = useState({
    handleSave: () => {},
    handleLoad: () => {},
    isPending: false,
    isGenerating: false,
  });

  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    name: 'Player',
    identity: 'Adventurer',
    language: 'en',
    attributes: {strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10},
    equipment: {}
  });

  useEffect(() => {
    const loadedRules = getRuleset(rulesId);
    if (!loadedRules) {
      notFound();
      return;
    }
    
    setRules(loadedRules);
    initializeTheme(loadedRules);

    // This logic runs on the client after hydration
    // Check for a full game state to load (from a save file)
    const stateToLoadJson = sessionStorage.getItem(STATE_TO_LOAD_KEY);
    if (stateToLoadJson) {
      try {
        const stateToLoad: GameState = JSON.parse(stateToLoadJson);
        setInitialStateOverride(stateToLoad);
        setPlayerStats(stateToLoad.player); // Set player stats from the loaded state
        sessionStorage.removeItem(STATE_TO_LOAD_KEY);
        setIsLoading(false);
        return;
      } catch (e) {
        console.error("Failed to parse game state from session storage", e);
        sessionStorage.removeItem(STATE_TO_LOAD_KEY);
      }
    }

    // If no full state, check for new player stats (from the home page)
    const playerStatsToLoadJson = sessionStorage.getItem(PLAYER_STATS_TO_LOAD_KEY);
    if (playerStatsToLoadJson) {
        try {
            const playerStatsToLoad: PlayerStats = JSON.parse(playerStatsToLoadJson);
            setInitialPlayerStats(playerStatsToLoad);
            setPlayerStats(playerStatsToLoad); // Set player stats for the sidebar
            sessionStorage.removeItem(PLAYER_STATS_TO_LOAD_KEY);
        } catch (e) {
            console.error("Failed to parse player stats from session storage", e);
            sessionStorage.removeItem(PLAYER_STATS_TO_LOAD_KEY);
            // If parsing fails, redirect to home to be safe
            redirect('/');
            return;
        }
    } else {
        // If there's no saved state and no new player info, it's an invalid entry. Redirect to home.
        redirect('/');
        return;
    }

    setIsLoading(false);
  }, [rulesId, initializeTheme]);


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
          initialStateOverride={initialStateOverride}
          initialPlayerStats={initialPlayerStats}
        />
      </main>
    </div>
  );
}
