
// src/components/game/InventoryDialog.tsx
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
import type { Item } from '@/types/game';
import { getTranslator } from '@/lib/i18n';
import { Trash2, Hand, XCircle, Package } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface InventoryDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  inventory: Item[];
  onItemAction: (action: 'use' | 'discard', item: Item) => void;
  language: 'en' | 'zh';
}

const getDynamicIcon = (iconName?: string): React.ElementType => {
    if (iconName && LucideIcons[iconName as keyof typeof LucideIcons]) {
      return LucideIcons[iconName as keyof typeof LucideIcons] as React.ElementType;
    }
    return LucideIcons.Package; // Default icon
  };

export function InventoryDialog({ 
    isOpen, 
    onOpenChange, 
    inventory, 
    onItemAction, 
    language 
}: InventoryDialogProps) {
  const t = useMemo(() => getTranslator(language), [language]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t.inventory}</DialogTitle>
          <DialogDescription>{t.inventoryDescription}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <ScrollArea className="h-96 w-full pr-4">
            <div className="space-y-4">
              {inventory.length > 0 ? (
                inventory.map(item => {
                  const Icon = getDynamicIcon(item.icon);
                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 p-4 border rounded-lg bg-muted/30"
                    >
                      <div className="p-2 bg-muted rounded-md">
                        <Icon className="w-8 h-8 text-primary" />
                      </div>
                      <div className="flex-grow">
                        <p className="font-bold text-lg">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => onItemAction('use', item)}
                        >
                            <Hand className="mr-2" />
                            {t.use}
                        </Button>
                        <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => onItemAction('discard', item)}
                        >
                            <Trash2 className="mr-2" />
                            {t.discard}
                        </Button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center text-muted-foreground italic py-16">
                  <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p>{t.inventoryEmpty}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <XCircle className="mr-2" />
            {t.close}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
