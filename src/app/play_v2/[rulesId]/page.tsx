// src/app/play_v2/[rulesId]/page.tsx
'use client';
import { GameUI_V2 } from '@/components/game/GameUI_V2';
import {getRuleset} from '@/lib/rulesets';
import {useState, useEffect} from 'react';
import type {PlayerStats, GameRules, GameState} from '@/types/game';
import {useTheme} from '@/components/layout/ThemeProvider';
import {notFound, redirect, useParams} from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

interface PlayPageProps {
  params: {
    rulesId: string;
  }
}

const STATE_TO_LOAD_KEY = 'narrativeGameStateToLoad';
const PLAYERS_KEY = 'narrativeGame_players';
const ACTIVE_PLAYER_ID_KEY = 'narrativeGame_activePlayerId';
const PLAYER_STATS_TO_LOAD_KEY = 'narrativePlayerStatsToLoad';

export default function PlayPageV2() {
  const params = useParams();
  const rulesId = Array.isArray(params.rulesId) ? params.rulesId[0] : params.rulesId;
  
  const [rules, setRules] = useState<GameRules | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialStateOverride, setInitialStateOverride] = useState<GameState | null>(null);
  const [initialPlayerStats, setInitialPlayerStats] = useState<PlayerStats | null>(null);
  const {initializeTheme} = useTheme();

  useEffect(() => {
    if (!rulesId) return;

    const loadedRules = getRuleset(rulesId);
    if (!loadedRules) {
      notFound();
      return;
    }

    setRules(loadedRules);
    initializeTheme(loadedRules);

    const stateToLoadJson = sessionStorage.getItem(STATE_TO_LOAD_KEY);
    if (stateToLoadJson) {
      try {
        const stateToLoad: GameState = JSON.parse(stateToLoadJson);
        setInitialStateOverride(stateToLoad);
        setInitialPlayerStats(stateToLoad.player);
        sessionStorage.removeItem(STATE_TO_LOAD_KEY);
        setIsLoading(false);
        return;
      } catch (e) {
        console.error("Failed to parse game state from session storage", e);
        sessionStorage.removeItem(STATE_TO_LOAD_KEY);
      }
    }

    const playerStatsToLoadJson = sessionStorage.getItem(PLAYER_STATS_TO_LOAD_KEY);
    if (playerStatsToLoadJson) {
        try {
            const playerStatsToLoad: PlayerStats = JSON.parse(playerStatsToLoadJson);
            setInitialPlayerStats(playerStatsToLoad);
            sessionStorage.removeItem(PLAYER_STATS_TO_LOAD_KEY);
        } catch (e) {
            console.error("Failed to parse player stats from session storage", e);
            sessionStorage.removeItem(PLAYER_STATS_TO_LOAD_KEY);
            redirect('/');
            return;
        }
    } else {
        const activePlayerId = localStorage.getItem(ACTIVE_PLAYER_ID_KEY);
        const allPlayersJson = localStorage.getItem(PLAYERS_KEY);
        if (activePlayerId && allPlayersJson) {
            try {
                const allPlayers = JSON.parse(allPlayersJson);
                const activePlayer = allPlayers.find((p: PlayerStats) => p.id === activePlayerId);
                if (activePlayer) {
                    setInitialPlayerStats(activePlayer);
                } else {
                    redirect('/');
                    return;
                }
            } catch (e) {
                console.error("Failed to parse player stats from local storage", e);
                redirect('/');
                return;
            }
        } else {
            redirect('/');
            return;
        }
    }

    setIsLoading(false);
  }, [rulesId, initializeTheme]);


  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading Scenario...</div>;
  }

  if (!rules || !initialPlayerStats) {
    return notFound();
  }

  return (
    <GameUI_V2
        rules={rules}
        initialStateOverride={initialStateOverride}
        initialPlayerStats={initialPlayerStats}
    />
  );
}
