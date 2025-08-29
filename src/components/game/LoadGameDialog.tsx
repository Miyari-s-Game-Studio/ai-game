
// src/components/game/LoadGameDialog.tsx
'use client';
import React, { useMemo } from 'react';
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
import { getTranslator } from '@/lib/i18n';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

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
  language: 'en' | 'zh';
}

export function LoadGameDialog({ isOpen, onOpenChange, saveFiles, onLoad, onDelete, language }: LoadGameDialogProps) {
  const t = useMemo(() => getTranslator(language), [language]);
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t.loadGame}</DialogTitle>
          <DialogDescription>
            {t.loadGameDescription}
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
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                                variant="destructive"
                                size="icon"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this save file. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDelete(file.key)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <Button onClick={() => onLoad(file)}>{t.load}</Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground">{t.noSavedGames}</p>
              )}
            </div>
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.cancel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
