
// src/app/play/[rulesId]/start/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, notFound, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getRuleset } from '@/lib/rulesets';
import { getTranslator } from '@/lib/i18n';
import type { GameRules, PlayerStats } from '@/types/game';
import { User, Forward } from 'lucide-react';

const PLAYER_STATS_TO_LOAD_KEY = 'narrativePlayerStatsToLoad';

export default function PlayerCreationPage() {
  const router = useRouter();
  const params = useParams();
  const rulesId = params.rulesId as string;

  const [rules, setRules] = useState<GameRules | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [playerIdentity, setPlayerIdentity] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (rulesId) {
      const loadedRules = getRuleset(rulesId);
      if (loadedRules) {
        setRules(loadedRules);
      }
      setIsLoading(false);
    }
  }, [rulesId]);

  const t = useMemo(() => getTranslator(rules?.language || 'en'), [rules?.language]);

  const handleStartGame = () => {
    if (!playerName.trim() || !playerIdentity.trim()) {
      // Simple validation
      alert('Please enter a name and identity.');
      return;
    }

    const playerStats: PlayerStats = {
      name: playerName,
      identity: playerIdentity,
      attributes: {
        strength: 10,
        dexterity: 12,
        constitution: 11,
        intelligence: 14,
        wisdom: 13,
        charisma: 12,
      },
      equipment: {
        top: 'Sturdy Jacket',
        bottom: 'Cargo Pants',
        shoes: 'Work Boots',
        accessory: 'ID Badge',
      },
    };

    sessionStorage.setItem(PLAYER_STATS_TO_LOAD_KEY, JSON.stringify(playerStats));
    router.push(`/play/${rulesId}`);
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!rules) {
    return notFound();
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 md:p-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">{t.createYourCharacter}</CardTitle>
          <CardDescription>{t.defineYourRoleIn} "{rules.title}"</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="playerName" className="text-lg">{t.characterName}</Label>
            <Input
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder={t.enterNamePlaceholder}
              className="text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="playerIdentity" className="text-lg">{t.characterIdentity}</Label>
            <Input
              id="playerIdentity"
              value={playerIdentity}
              onChange={(e) => setPlayerIdentity(e.target.value)}
              placeholder={t.enterIdentityPlaceholder}
              className="text-base"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleStartGame} className="w-full text-lg py-6" disabled={!playerName.trim() || !playerIdentity.trim()}>
            <User className="mr-2" />
            {t.beginAdventure}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
