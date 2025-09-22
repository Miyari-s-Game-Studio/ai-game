// src/components/game/mobile/MobileSavesView.tsx
'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FolderOpen, Save } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"

interface MobileSavesViewProps {
    handleSaveGame: () => void;
    handleOpenLoadDialog: () => void;
}

export function MobileSavesView({ handleSaveGame, handleOpenLoadDialog }: MobileSavesViewProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Save className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleSaveGame}>
          <Save className="mr-2 h-4 w-4" />
          <span>Quick Save</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleOpenLoadDialog}>
          <FolderOpen className="mr-2 h-4 w-4" />
          <span>Load Game</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
