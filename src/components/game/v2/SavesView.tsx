// src/components/game/v2/SavesView.tsx
'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FolderOpen, Save } from 'lucide-react';

interface SavesViewProps {
    handleSaveGame: () => void;
    handleOpenLoadDialog: () => void;
}

export function SavesView({ handleSaveGame, handleOpenLoadDialog }: SavesViewProps) {
  return (
    <div className="flex-1 overflow-y-auto p-8">
        <Card className="max-w-md mx-auto">
            <div className="p-8 w-full text-center space-y-4">
                <h2 className="text-4xl font-headline">Save & Load</h2>
                <p className="text-muted-foreground">Manage your game progress here.</p>
                <div className="flex justify-center gap-4">
                    <Button onClick={handleSaveGame} size="lg">
                        <Save className="mr-2" /> Quick Save
                    </Button>
                    <Button onClick={handleOpenLoadDialog} size="lg" variant="outline">
                        <FolderOpen className="mr-2" /> Load Game
                    </Button>
                </div>
            </div>
        </Card>
    </div>
  );
}
