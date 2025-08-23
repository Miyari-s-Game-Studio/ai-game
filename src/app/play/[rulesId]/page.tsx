
// src/app/play/[rulesId]/page.tsx
'use client';
import {GameUI} from '@/components/game/GameUI';
import {getRuleset} from '@/lib/rulesets';
import {useState, useEffect} from 'react';
import type {PlayerStats, GameRules, GameState} from '@/types/game';
import {useTheme} from '@/components/layout/ThemeProvider';
import {notFound, useRouter, redirect, useParams} from 'next/navigation';

interface PlayPageProps {
  params: {
    rulesId: string;
  }
}

const STATE_TO_LOAD_KEY = 'narrativeGameStateToLoad';
const PLAYER_STATS_TO_LOAD_KEY = 'narrativePlayerStatsToLoad';

export default function PlayPage() {
  const {rulesId} = useParams();
  const [rules, setRules] = useState<GameRules | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialStateOverride, setInitialStateOverride] = useState<GameState | null>(null);
  const [initialPlayerStats, setInitialPlayerStats] = useState<PlayerStats | null>(null);
  const {initializeTheme} = useTheme();

  useEffect(() => {
    const loadedRules = getRuleset(rulesId as string);
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
        setInitialPlayerStats(stateToLoad.player); // Set player stats from the loaded state
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
      <GameUI
        rules={rules}
        initialStateOverride={initialStateOverride}
        initialPlayerStats={initialPlayerStats}
      />
    </div>
  );
}
