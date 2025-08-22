
// src/components/layout/Sidebar.tsx
'use client';
import React, { useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  PanelLeft,
  Wrench,
  FolderOpen,
  Save,
  Leaf,
  Settings,
  Home,
} from 'lucide-react';
import Link from 'next/link';
import { Separator } from '../ui/separator';
import { ThemeSwitcher } from './ThemeSwitcher';
import PlayerStatsComponent from '../game/PlayerStats';
import type { PlayerStats, GameRules } from '@/types/game';
import { getTranslator } from '@/lib/i18n';


interface SidebarProps {
    rules: GameRules;
    playerStats: PlayerStats;
    onSave: () => void;
    onLoad: () => void;
    isPending: boolean;
}

export function Sidebar({ rules, playerStats, onSave, onLoad, isPending }: SidebarProps) {
  const gameTitle = rules.title || 'Interactive Narrative Game';
  const t = useMemo(() => getTranslator(rules.language), [rules.language]);

  return (
    <aside className="h-full flex flex-col items-center w-16 bg-sidebar border-r border-sidebar-border py-4">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-12 w-12 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <PanelLeft className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 bg-sidebar border-r-0 text-sidebar-foreground flex flex-col">
          <SheetHeader className="text-left mb-4">
            <SheetTitle className="text-2xl font-bold flex items-center gap-3 text-sidebar-primary-foreground">
                <Leaf className="w-8 h-8 text-sidebar-primary" />
                {gameTitle}
            </SheetTitle>
          </SheetHeader>

          <PlayerStatsComponent stats={playerStats} />

          <div className="space-y-4 mt-auto">
            <Separator className="bg-sidebar-border"/>
            <div className="space-y-2">
                 <h3 className="font-semibold px-4 text-lg text-sidebar-primary-foreground">{t.gameControls}</h3>
                 <div className="flex flex-col gap-2 px-2">
                    <Button onClick={onLoad} variant="ghost" className="justify-start text-base" disabled={isPending}>
                        <FolderOpen className="mr-3" /> {t.loadGame}
                    </Button>
                    <Button onClick={onSave} variant="ghost" className="justify-start text-base" disabled={isPending}>
                        <Save className="mr-3" /> {t.gameSaved}
                    </Button>
                 </div>
            </div>
            <Separator className="bg-sidebar-border"/>
             <div className="space-y-2">
                 <h3 className="font-semibold px-4 text-lg text-sidebar-primary-foreground">{t.settings}</h3>
                 <div className="flex flex-col gap-2 px-2">
                    <Button asChild variant="ghost" className="justify-start text-base">
                        <Link href="/admin/rules">
                            <Wrench className="mr-3" /> {t.manageRules}
                        </Link>
                    </Button>
                     <Button asChild variant="ghost" className="justify-start text-base">
                        <Link href="/">
                            <Home className="mr-3" /> {t.scenarios}
                        </Link>
                    </Button>
                    <ThemeSwitcher />
                 </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </aside>
  );
}
