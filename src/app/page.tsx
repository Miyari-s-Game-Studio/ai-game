// src/app/page.tsx
'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen, FolderOpen, User, Edit, Trash2, ShieldCheck, Forward, ArrowLeft } from 'lucide-react';
import { getAllRulesetIds, getRuleset } from '@/lib/rulesets';
import type { GameRules, GameState, PlayerStats, Item } from '@/types/game';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadGameDialog, type SaveFile } from '@/components/game/LoadGameDialog';
import { getTranslator } from '@/lib/i18n';
import PlayerStatsComponent from '@/components/game/PlayerStats';
import PlayerHistory from '@/components/game/PlayerHistory';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { InventoryDialog } from '@/components/game/InventoryDialog';
import { produce } from 'immer';


const SAVE_PREFIX = 'narrativeGameSave_';
const STATE_TO_LOAD_KEY = 'narrativeGameStateToLoad';
const PLAYER_STATS_KEY = 'narrativeGamePlayer';
const PLAYER_STATS_TO_LOAD_KEY = 'narrativePlayerStatsToLoad';


export default function GameSelectionPage() {
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [saveFiles, setSaveFiles] = useState<SaveFile[]>([]);
  const router = useRouter();

  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [isEditingCharacter, setIsEditingCharacter] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [playerIdentity, setPlayerIdentity] = useState('');
  const [playerLanguage, setPlayerLanguage] = useState<'en' | 'zh'>('en');

  const t = useMemo(() => getTranslator(playerStats?.language || playerLanguage), [playerStats, playerLanguage]);

  const [availableRules, setAvailableRules] = useState<GameRules[]>([]);

  useEffect(() => {
    const allRulesIds = getAllRulesetIds();
    const loadedRules = allRulesIds.map(id => getRuleset(id)).filter(Boolean) as GameRules[];

    if (playerStats) {
        const completedRuleIds = new Set(playerStats.history?.map(h => h.rulesId) || []);
        const filteredRules = loadedRules.filter(rules => {
            if (rules.language !== playerStats.language) return false;
            // Filter out scenarios that have already been completed
            if (completedRuleIds.has(rules.id)) return false;
            return true;
        });
        setAvailableRules(filteredRules);
    } else {
        setAvailableRules([]);
    }
  }, [playerStats]);

  useEffect(() => {
    try {
        const savedPlayerJson = localStorage.getItem(PLAYER_STATS_KEY);
        if (savedPlayerJson) {
            const savedPlayer = JSON.parse(savedPlayerJson);
            // Quick check for new structures
            if (savedPlayer.history && !Array.isArray(savedPlayer.history)) {
              savedPlayer.history = [];
            }
             if (!savedPlayer.inventory) {
                savedPlayer.inventory = [];
            }
            setPlayerStats(savedPlayer);
        }
    } catch (e) {
        console.error("Failed to load player stats.", e);
        localStorage.removeItem(PLAYER_STATS_KEY);
    }
  }, []);


  const findSaveFiles = () => {
    const saves: SaveFile[] = [];
    const language = playerStats?.language || 'en';
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(SAVE_PREFIX)) {
        try {
          const state: GameState = JSON.parse(localStorage.getItem(key) || '{}');
          if (state.player.language !== language) continue;

          const keyWithoutPrefix = key.substring(SAVE_PREFIX.length);
          const lastUnderscoreIndex = keyWithoutPrefix.lastIndexOf('_');
          if (lastUnderscoreIndex === -1) continue;

          const ruleId = keyWithoutPrefix.substring(0, lastUnderscoreIndex);
          const timestamp = keyWithoutPrefix.substring(lastUnderscoreIndex + 1);

          const rules = getRuleset(ruleId);
          const title = rules?.title || ruleId;

          saves.push({ key, title, timestamp, state });
        } catch {}
      }
    }
    setSaveFiles(saves.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  }

  const handleOpenLoadDialog = () => {
      findSaveFiles();
      setIsLoadDialogOpen(true);
  }

  const handleLoadGame = (saveFile: SaveFile) => {
    try {
        const ruleId = saveFile.key.substring(SAVE_PREFIX.length, saveFile.key.lastIndexOf('_'));
        localStorage.setItem(PLAYER_STATS_KEY, JSON.stringify(saveFile.state.player));
        sessionStorage.setItem(STATE_TO_LOAD_KEY, JSON.stringify(saveFile.state));
        router.push(`/play/${ruleId}`);
    } catch (e) {
        console.error("Failed to prepare game state for loading.", e);
    }
  }

  const handleDeleteSave = (key: string) => {
    localStorage.removeItem(key);
    findSaveFiles(); // Refresh the list
  }

  const handleStartGame = (rulesId: string) => {
      if (!playerStats) return;
      sessionStorage.setItem(PLAYER_STATS_TO_LOAD_KEY, JSON.stringify(playerStats));
      router.push(`/play/${rulesId}`);
  };

  const handleSaveCharacter = () => {
    if (!playerName.trim() || !playerIdentity.trim()) {
      alert('Please enter a name and identity.');
      return;
    }
    const startingInventory: Item[] = [
        { id: 'jacket_01', name: 'Sturdy Jacket', description: 'A durable jacket suitable for fieldwork.', icon: 'Shirt', slot: 'top' },
        { id: 'pants_01', name: 'Cargo Pants', description: 'Pants with plenty of pockets.', icon: 'User', slot: 'bottom' },
        { id: 'boots_01', name: 'Work Boots', description: 'Protects your feet from harsh environments.', icon: 'Footprints', slot: 'shoes' },
        { id: 'badge_01', name: 'ID Badge', description: 'An official-looking identification badge.', icon: 'Sparkles', slot: 'accessory' }
    ];
    
    const newPlayerStats: PlayerStats = {
      name: playerName,
      identity: playerIdentity,
      language: playerLanguage,
      attributes: { strength: 10, dexterity: 12, constitution: 11, intelligence: 14, wisdom: 13, charisma: 12 },
      equipment: {}, // Start with nothing equipped
      inventory: isEditingCharacter ? playerStats?.inventory || [] : startingInventory,
      history: isEditingCharacter ? playerStats?.history : [], // Preserve history if editing
    };
    try {
        localStorage.setItem(PLAYER_STATS_KEY, JSON.stringify(newPlayerStats));
        setPlayerStats(newPlayerStats);
        setIsEditingCharacter(false);
    } catch (e) {
        console.error("Failed to save player stats.", e);
        alert("Could not save character. Your browser storage might be full.");
    }
  };

  const handleEditCharacter = () => {
      if (playerStats) {
          setPlayerName(playerStats.name);
          setPlayerIdentity(playerStats.identity);
          setPlayerLanguage(playerStats.language);
          setIsEditingCharacter(true);
      }
  };

  const confirmDeleteCharacter = () => {
    localStorage.removeItem(PLAYER_STATS_KEY);
    // Also remove all save files associated with this character
    for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith(SAVE_PREFIX)) {
            localStorage.removeItem(key);
        }
    }
    setPlayerStats(null);
    setPlayerName('');
    setPlayerIdentity('');
    setIsEditingCharacter(false);
    setIsDeleteDialogOpen(false);
    setIsContinuing(false);
  }

  const handleItemAction = (action: 'use' | 'discard' | 'equip' | 'unequip', item: Item) => {
      if (!playerStats) return;

      const newStats = produce(playerStats, draft => {
          if (action === 'discard') {
              draft.inventory = draft.inventory.filter(i => i.id !== item.id);
          } else if (action === 'equip') {
              if (item.slot) {
                  draft.equipment[item.slot] = item.name;
              }
          } else if (action === 'unequip') {
              if (item.slot && draft.equipment[item.slot] === item.name) {
                  delete draft.equipment[item.slot];
              }
          } else if (action === 'use') {
              // Placeholder for using items.
              console.log(`Attempted to use item: ${item.name}`);
              alert(`Using '${item.name}' is not yet implemented.`);
              return; // Don't update state if action is not implemented
          }
      });

      setPlayerStats(newStats);
      try {
          localStorage.setItem(PLAYER_STATS_KEY, JSON.stringify(newStats));
      } catch (e) {
          console.error("Failed to update player stats in storage.", e);
      }
  };


  const renderCharacterCreator = () => (
     <Card className="w-full max-w-lg animate-in fade-in-50">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">{isEditingCharacter ? t.editYourCharacter : t.createYourCharacter}</CardTitle>
          <CardDescription>{t.defineYourRoleIn} the adventures to come.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
            <Label htmlFor="playerLanguage" className="text-lg">{t.language}</Label>
            <Select value={playerLanguage} onValueChange={(value) => setPlayerLanguage(value as 'en' | 'zh')}>
                <SelectTrigger id="playerLanguage" className="text-base">
                    <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="en">{t.languageEnglish}</SelectItem>
                    <SelectItem value="zh">{t.languageChinese}</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="playerName" className="text-lg">{t.characterName}</Label>
            <Input id="playerName" value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder={t.enterNamePlaceholder} className="text-base" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="playerIdentity" className="text-lg">{t.characterIdentity}</Label>
            <Input id="playerIdentity" value={playerIdentity} onChange={(e) => setPlayerIdentity(e.target.value)} placeholder={t.enterIdentityPlaceholder} className="text-base" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={handleSaveCharacter} className="text-lg py-6" disabled={!playerName.trim() || !playerIdentity.trim()}>
            <User className="mr-2" />
            {isEditingCharacter ? t.saveChanges : t.createCharacter}
          </Button>
          {isEditingCharacter && (
              <Button variant="ghost" onClick={() => setIsEditingCharacter(false)}>{t.cancel}</Button>
          )}
        </CardFooter>
      </Card>
  )

  const renderScenarioSelector = () => (
     <div className="w-full max-w-6xl animate-in fade-in-50">
          <header className="mb-8 text-center relative">
            <h2 className="text-3xl md:text-4xl font-bold text-primary font-headline mb-4">{t.selectScenario}</h2>
            <p className="text-muted-foreground mt-2 text-lg mb-8">{t.selectScenarioDescription}</p>
             <Button
                variant="outline"
                className="absolute top-0 left-0"
                onClick={() => setIsContinuing(false)}
             >
                <ArrowLeft className="mr-2" />
                {t.back}
             </Button>
          </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {availableRules.map(rules => (
          <Card key={rules.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">{rules.title}</CardTitle>
              <CardDescription>{rules.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">{t.version}: {rules.version}</p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleStartGame(rules.id)} className="w-full">
                <BookOpen className="mr-2" />
                {t.playScenario}
              </Button>
            </CardFooter>
          </Card>
        ))}
        {availableRules.length === 0 && (
            <Card className="md:col-span-2 lg:col-span-3 flex flex-col items-center justify-center border-dashed p-8">
                 <CardHeader className="text-center">
                    <CardTitle className="font-headline text-2xl">{t.allAdventuresCompleted}</CardTitle>
                    <CardDescription>{t.allAdventuresCompletedDescription}</CardDescription>
                </CardHeader>
            </Card>
        )}
        </div>
     </div>
  );


  return (
    <>
    <LoadGameDialog
        isOpen={isLoadDialogOpen}
        onOpenChange={setIsLoadDialogOpen}
        saveFiles={saveFiles}
        onLoad={handleLoadGame}
        onDelete={handleDeleteSave}
        language={playerStats?.language || 'en'}
    />
     {playerStats && (
        <InventoryDialog
            isOpen={isInventoryOpen}
            onOpenChange={setIsInventoryOpen}
            inventory={playerStats.inventory}
            equipment={playerStats.equipment}
            onItemAction={handleItemAction}
            language={playerStats.language}
        />
     )}
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.areYouSure}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.deleteCharacterConfirmation}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDeleteCharacter}>
            {t.continue}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 md:p-8">

      {!playerStats ? renderCharacterCreator() : isEditingCharacter ? renderCharacterCreator() : (
        isContinuing ? renderScenarioSelector() : (
            // Main character hub
             <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-5 gap-8 animate-in fade-in-50">
                <div className="lg:col-span-2">
                    <div className="relative">
                        <PlayerStatsComponent stats={playerStats} onOpenInventory={() => setIsInventoryOpen(true)} />
                        <div className="absolute top-2 right-2 flex gap-2">
                            <Button variant="outline" size="icon" onClick={handleEditCharacter}><Edit className="h-4 w-4" /></Button>
                            <Button variant="destructive" size="icon" onClick={() => setIsDeleteDialogOpen(true)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-3">
                   <PlayerHistory player={playerStats} />
                </div>
                <div className="lg:col-span-5 flex flex-col items-center justify-center gap-6 mt-8">
                    <Button size="lg" className="text-xl py-8 px-10" onClick={() => setIsContinuing(true)}>
                        <Forward className="mr-3" />
                        {t.continueAdventure}
                    </Button>
                    <div className="flex gap-4">
                        <Button variant="outline" onClick={handleOpenLoadDialog}>
                            <FolderOpen className="mr-2"/>
                            {t.loadGame}
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/admin/rules">{t.manageRules}</Link>
                        </Button>
                    </div>
                </div>
             </div>
        )
      )}

      {playerStats && !isContinuing && !isEditingCharacter && (
        <div className="absolute bottom-4 right-4">
            <Button asChild variant="outline">
                <Link href="/admin/rules">{t.manageRules}</Link>
            </Button>
        </div>
      )}
    </div>
    </>
  );
}
