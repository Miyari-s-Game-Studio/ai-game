// src/components/game/mobile/MobileSavesView.tsx
'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FolderOpen, Save } from 'lucide-react';

interface MobileSavesViewProps {
    handleSaveGame: () => void;
    handleOpenLoadDialog: () => void;
}

export function MobileSavesView({ handleSaveGame, handleOpenLoadDialog }: MobileSavesViewProps) {
  return (
    <div className="p-4">
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Save & Load</CardTitle>
                <CardDescription>Manage your game progress.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <Button onClick={handleSaveGame} size="lg" className="w-full">
                    <Save className="mr-2" /> Quick Save
                </Button>
                <Button onClick={handleOpenLoadDialog} size="lg" variant="outline" className="w-full">
                    <FolderOpen className="mr-2" /> Load Game
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}