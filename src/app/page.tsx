
// src/app/page.tsx
'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, FolderOpen } from 'lucide-react';
import { gameRulesets, getRuleset } from '@/lib/rulesets';
import type { GameRules, GameState } from '@/types/game';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { LoadGameDialog, type SaveFile } from '@/components/game/LoadGameDialog';
import { getTranslator } from '@/lib/i18n';

const SAVE_PREFIX = 'narrativeGameSave_';
const STATE_TO_LOAD_KEY = 'narrativeGameStateToLoad';


export default function GameSelectionPage() {
  const allRules: GameRules[] = gameRulesets.map(id => getRuleset(id)).filter(Boolean) as GameRules[];
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [saveFiles, setSaveFiles] = useState<SaveFile[]>([]);
  const router = useRouter();

  // A bit of a hack for the main page. We'll default to English.
  // The language will be properly set once a scenario is loaded.
  const t = useMemo(() => getTranslator('en'), []);

  const findSaveFiles = () => {
    const saves: SaveFile[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(SAVE_PREFIX)) {
        try {
          const state: GameState = JSON.parse(localStorage.getItem(key) || '{}');
          
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


  return (
    <>
    <LoadGameDialog
        isOpen={isLoadDialogOpen} 
        onOpenChange={setIsLoadDialogOpen}
        saveFiles={saveFiles}
        onLoad={handleLoadGame}
        onDelete={handleDeleteSave}
        language='en' // Hardcoded for this page
    />
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 md:p-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-primary font-headline">
          {t.selectScenario}
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          {t.selectScenarioDescription}
        </p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl w-full">
        {allRules.map(rules => (
          <Card key={rules.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">{rules.title}</CardTitle>
              <CardDescription>{rules.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">{t.version}: {rules.version}</p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href={`/play/${rules.id}/start`}>
                  <BookOpen className="mr-2" />
                  {t.playScenario}
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
         <Card className="flex flex-col items-center justify-center border-dashed">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">{t.yourStory}</CardTitle>
                 <CardDescription>{t.createNew}</CardDescription>
            </CardHeader>
            <CardContent>
                 <Button asChild variant="outline">
                     <Link href="/admin/rules">{t.createNew}</Link>
                </Button>
            </CardContent>
        </Card>
      </div>
       <div className="mt-12 flex gap-4">
            <Button variant="outline" onClick={handleOpenLoadDialog}>
                <FolderOpen className="mr-2"/>
                {t.loadGame}
            </Button>
            <Button asChild variant="outline">
                <Link href="/admin/rules">{t.manageRules}</Link>
            </Button>
        </div>
    </div>
    </>
  );
}
