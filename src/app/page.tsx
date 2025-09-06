// src/app/page.tsx
'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen, FolderOpen, User, Edit, Trash2, PlusCircle, ArrowLeft } from 'lucide-react';
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
import { v4 as uuidv4 } from 'uuid';


const SAVE_PREFIX = 'narrativeGameSave_';
const STATE_TO_LOAD_KEY = 'narrativeGameStateToLoad';
const PLAYERS_KEY = 'narrativeGame_players';
const ACTIVE_PLAYER_ID_KEY = 'narrativeGame_activePlayerId';
const PLAYER_STATS_TO_LOAD_KEY = 'narrativePlayerStatsToLoad';


export default function GameSelectionPage() {
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [saveFiles, setSaveFiles] = useState<SaveFile[]>([]);
  const router = useRouter();

  const [allPlayers, setAllPlayers] = useState<PlayerStats[]>([]);
  const [activePlayer, setActivePlayer] = useState<PlayerStats | null>(null);
  const [playerToDelete, setPlayerToDelete] = useState<PlayerStats | null>(null);

  const [view, setView] = useState<'character_select' | 'character_creator' | 'character_hub' | 'scenario_select'>('character_select');
  
  // State for character creator/editor
  const [editingPlayer, setEditingPlayer] = useState<PlayerStats | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [playerIdentity, setPlayerIdentity] = useState('');
  const [playerLanguage, setPlayerLanguage] = useState<'en' | 'zh'>('en');

  const t = useMemo(() => getTranslator(activePlayer?.language || playerLanguage), [activePlayer, playerLanguage]);

  const [availableRules, setAvailableRules] = useState<GameRules[]>([]);

  // Load all players from local storage on initial mount
  useEffect(() => {
    try {
        const savedPlayersJson = localStorage.getItem(PLAYERS_KEY);
        const players: PlayerStats[] = savedPlayersJson ? JSON.parse(savedPlayersJson) : [];
        
        // Data migration for old structure
        players.forEach(p => {
            if (!p.id) p.id = uuidv4();
            if (p.history && !Array.isArray(p.history)) p.history = [];
            if (!p.inventory) p.inventory = [];
        });

        setAllPlayers(players);

        const activeId = localStorage.getItem(ACTIVE_PLAYER_ID_KEY);
        if (activeId) {
            const lastActivePlayer = players.find(p => p.id === activeId);
            if (lastActivePlayer) {
                setActivePlayer(lastActivePlayer);
                setView('character_hub');
            }
        }
    } catch (e) {
        console.error("Failed to load player stats.", e);
        localStorage.removeItem(PLAYERS_KEY);
    }
  }, []);

  // Update available scenarios when the active player changes
  useEffect(() => {
    if (activePlayer) {
        const allRulesIds = getAllRulesetIds();
        const loadedRules = allRulesIds.map(id => getRuleset(id)).filter(Boolean) as GameRules[];
        
        const completedRuleIds = new Set(activePlayer.history?.map(h => h.rulesId) || []);
        const filteredRules = loadedRules.filter(rules => {
            if (rules.language !== activePlayer.language) return false;
            if (completedRuleIds.has(rules.id)) return false;
            return true;
        });
        setAvailableRules(filteredRules);
    } else {
        setAvailableRules([]);
    }
  }, [activePlayer]);

  const savePlayers = (players: PlayerStats[]) => {
      try {
          localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
          setAllPlayers(players);
      } catch (e) {
        console.error("Failed to save players list.", e);
      }
  }

  const selectPlayer = (player: PlayerStats) => {
      setActivePlayer(player);
      localStorage.setItem(ACTIVE_PLAYER_ID_KEY, player.id);
      setView('character_hub');
  };

  const findSaveFiles = () => {
    if (!activePlayer) return;
    const saves: SaveFile[] = [];
    const language = activePlayer.language;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(SAVE_PREFIX)) {
        try {
          const state: GameState = JSON.parse(localStorage.getItem(key) || '{}');
          if (state.player.language !== language || state.player.id !== activePlayer.id) continue;

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
        localStorage.setItem(ACTIVE_PLAYER_ID_KEY, saveFile.state.player.id);
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
      if (!activePlayer) return;
      sessionStorage.setItem(PLAYER_STATS_TO_LOAD_KEY, JSON.stringify(activePlayer));
      router.push(`/play/${rulesId}`);
  };

  const handleOpenCreator = (playerToEdit: PlayerStats | null) => {
      setEditingPlayer(playerToEdit);
      if (playerToEdit) {
          setPlayerName(playerToEdit.name);
          setPlayerIdentity(playerToEdit.identity);
          setPlayerLanguage(playerToEdit.language);
      } else {
          setPlayerName('');
          setPlayerIdentity('');
          setPlayerLanguage('en');
      }
      setView('character_creator');
  }

  const handleSaveCharacter = () => {
    if (!playerName.trim() || !playerIdentity.trim()) {
      alert('Please enter a name and identity.');
      return;
    }
    
    let updatedPlayers: PlayerStats[];
    if (editingPlayer) { // Editing existing player
        const updatedPlayer = { 
            ...editingPlayer,
            name: playerName,
            identity: playerIdentity,
            language: playerLanguage,
        };
        updatedPlayers = allPlayers.map(p => p.id === editingPlayer.id ? updatedPlayer : p);
        setActivePlayer(updatedPlayer);
    } else { // Creating new player
        const startingInventory: Item[] = [
            { id: 'jacket_01', name: 'Sturdy Jacket', description: 'A durable jacket suitable for fieldwork.', icon: 'Shirt', slot: 'top' },
            { id: 'pants_01', name: 'Cargo Pants', description: 'Pants with plenty of pockets.', icon: 'User', slot: 'bottom' },
            { id: 'boots_01', name: 'Work Boots', description: 'Protects your feet from harsh environments.', icon: 'Footprints', slot: 'shoes' },
            { id: 'badge_01', name: 'ID Badge', description: 'An official-looking identification badge.', icon: 'Sparkles', slot: 'accessory' }
        ];
        const newPlayer: PlayerStats = {
            id: uuidv4(),
            name: playerName,
            identity: playerIdentity,
            language: playerLanguage,
            attributes: { strength: 10, dexterity: 12, constitution: 11, intelligence: 14, wisdom: 13, charisma: 12 },
            equipment: {},
            inventory: startingInventory,
            history: [],
        };
        updatedPlayers = [...allPlayers, newPlayer];
        setActivePlayer(newPlayer);
        localStorage.setItem(ACTIVE_PLAYER_ID_KEY, newPlayer.id);
    }

    savePlayers(updatedPlayers);
    setView('character_hub');
  };

  const handleOpenDeleteDialog = (player: PlayerStats) => {
      setPlayerToDelete(player);
      setIsDeleteDialogOpen(true);
  };

  const confirmDeleteCharacter = () => {
    if (!playerToDelete) return;

    // Remove all save files associated with this character
    for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith(SAVE_PREFIX)) {
            try {
                const state = JSON.parse(localStorage.getItem(key) || '{}');
                if (state.player.id === playerToDelete.id) {
                    localStorage.removeItem(key);
                }
            } catch {}
        }
    }

    const updatedPlayers = allPlayers.filter(p => p.id !== playerToDelete.id);
    savePlayers(updatedPlayers);
    
    if (activePlayer?.id === playerToDelete.id) {
        setActivePlayer(null);
        localStorage.removeItem(ACTIVE_PLAYER_ID_KEY);
        setView('character_select');
    }
    
    setIsDeleteDialogOpen(false);
    setPlayerToDelete(null);
  }

  const handleItemAction = (action: 'use' | 'discard' | 'equip' | 'unequip', item: Item) => {
      if (!activePlayer) return;

      const newStats = produce(activePlayer, draft => {
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

      setActivePlayer(newStats);
      const updatedPlayers = allPlayers.map(p => p.id === newStats.id ? newStats : p);
      savePlayers(updatedPlayers);
  };


  const renderCharacterSelector = () => (
    <Card className="w-full max-w-2xl animate-in fade-in-50">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Select a Character</CardTitle>
          <CardDescription>Choose a character to continue their story, or create a new one.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {allPlayers.map(player => (
                 <div key={player.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                     <div>
                         <p className="font-bold text-lg">{player.name}</p>
                         <p className="text-sm text-muted-foreground">{player.identity}</p>
                     </div>
                     <div className="flex gap-2">
                        <Button variant="outline" onClick={() => selectPlayer(player)}>Select</Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDeleteDialog(player)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                     </div>
                 </div>
            ))}
             {allPlayers.length === 0 && (
                <div className="text-center text-muted-foreground p-8 border-dashed border-2 rounded-lg">
                    <p>No characters found.</p>
                </div>
             )}
        </CardContent>
        <CardFooter>
            <Button onClick={() => handleOpenCreator(null)}>
                <PlusCircle className="mr-2" />
                Create New Character
            </Button>
        </CardFooter>
      </Card>
  );

  const renderCharacterCreator = () => (
     <Card className="w-full max-w-lg animate-in fade-in-50">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">{editingPlayer ? t.editYourCharacter : t.createYourCharacter}</CardTitle>
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
            {editingPlayer ? t.saveChanges : t.createCharacter}
          </Button>
            <Button variant="ghost" onClick={() => setView(allPlayers.length > 0 ? 'character_select' : 'character_creator')}>{t.cancel}</Button>
        </CardFooter>
      </Card>
  )

  const renderCharacterHub = () => (
        activePlayer && (
             <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-5 gap-8 animate-in fade-in-50">
                <div className="lg:col-span-2">
                    <div className="relative">
                        <PlayerStatsComponent stats={activePlayer} onOpenInventory={() => setIsInventoryOpen(true)} />
                        <div className="absolute top-2 right-2 flex gap-2">
                            <Button variant="outline" size="icon" onClick={() => handleOpenCreator(activePlayer)}><Edit className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-3">
                   <PlayerHistory player={activePlayer} />
                </div>
                <div className="lg:col-span-5 flex flex-col items-center justify-center gap-6 mt-8">
                    <Button size="lg" className="text-xl py-8 px-10" onClick={() => setView('scenario_select')}>
                        <BookOpen className="mr-3" />
                        {t.selectScenario}
                    </Button>
                    <div className="flex gap-4">
                        <Button variant="outline" onClick={handleOpenLoadDialog}>
                            <FolderOpen className="mr-2"/>
                            {t.loadGame}
                        </Button>
                         <Button variant="outline" onClick={() => {
                             setActivePlayer(null);
                             localStorage.removeItem(ACTIVE_PLAYER_ID_KEY);
                             setView('character_select');
                         }}>
                            <ArrowLeft className="mr-2" />
                            Switch Character
                        </Button>
                    </div>
                </div>
             </div>
        )
  );

  const renderScenarioSelector = () => (
     <div className="w-full max-w-6xl animate-in fade-in-50">
          <header className="mb-8 text-center relative">
            <h2 className="text-3xl md:text-4xl font-bold text-primary font-headline mb-4">{t.selectScenario}</h2>
            <p className="text-muted-foreground mt-2 text-lg mb-8">{t.selectScenarioDescription}</p>
             <Button
                variant="outline"
                className="absolute top-0 left-0"
                onClick={() => setView('character_hub')}
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

  const renderView = () => {
      switch(view) {
          case 'character_creator':
              return renderCharacterCreator();
          case 'character_hub':
              return renderCharacterHub();
          case 'scenario_select':
              return renderScenarioSelector();
          case 'character_select':
          default:
              return renderCharacterSelector();
      }
  }


  return (
    <>
    <LoadGameDialog
        isOpen={isLoadDialogOpen}
        onOpenChange={setIsLoadDialogOpen}
        saveFiles={saveFiles}
        onLoad={handleLoadGame}
        onDelete={handleDeleteSave}
        language={activePlayer?.language || 'en'}
    />
     {activePlayer && (
        <InventoryDialog
            isOpen={isInventoryOpen}
            onOpenChange={setIsInventoryOpen}
            inventory={activePlayer.inventory}
            equipment={activePlayer.equipment}
            onItemAction={handleItemAction}
            language={activePlayer.language}
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

    <main className="flex flex-col items-center justify-center min-h-screen bg-background p-4 md:p-8">

      {renderView()}

      <div className="absolute bottom-4 right-4">
          <Button asChild variant="outline">
              <Link href="/admin/rules">{t.manageRules}</Link>
          </Button>
      </div>
    </main>
    </>
  );
}
