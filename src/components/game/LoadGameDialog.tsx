// src/components/game/LoadGameDialog.tsx
'use client';
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { GameState } from '@/types/game';
import { Trash2 } from 'lucide-react';

export interface SaveFile {
  key: string;
  title: string;
  timestamp: string;
  state: GameState;
}

interface LoadGameDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  saveFiles: SaveFile[];
  onLoad: (saveFile: SaveFile) => void;
  onDelete: (key: string) => void;
}

export function LoadGameDialog({ isOpen, onOpenChange, saveFiles, onLoad, onDelete }: LoadGameDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Load Game</DialogTitle>
          <DialogDescription>
            Select a saved game to continue your progress.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <ScrollArea className="h-72 w-full pr-4">
            <div className="space-y-2">
              {saveFiles.length > 0 ? (
                saveFiles.map(file => (
                  <div
                    key={file.key}
                    className="flex justify-between items-center p-2 border rounded-lg hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-semibold">{file.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(file.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="destructive"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(file.key);
                            }}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => onLoad(file)}>Load</Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground">No saved games found.</p>
              )}
            </div>
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
