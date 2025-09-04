

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
import type { Item, Equipment } from '@/types/game';
import { getTranslator } from '@/lib/i18n';
import { Trash2, Hand, XCircle, Package, Shirt } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Badge } from '../ui/badge';

interface InventoryDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  inventory: Item[];
  equipment: Equipment;
  onItemAction: (action: 'use' | 'discard' | 'equip' | 'unequip', item: Item) => void;
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
    inventory = [],
    equipment,
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
                  const isEquipped = item.slot && equipment[item.slot] === item.name;

                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 p-4 border rounded-lg bg-muted/30"
                    >
                      <div className="p-2 bg-muted rounded-md">
                        <Icon className="w-8 h-8 text-primary" />
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-lg">{item.name}</p>
                          {isEquipped && <Badge variant="secondary">{t.equipped}</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {item.slot ? (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onItemAction(isEquipped ? 'unequip' : 'equip', item)}
                            >
                                <Shirt className="mr-2" />
                                {isEquipped ? t.unequip : t.equip}
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onItemAction('use', item)}
                            >
                                <Hand className="mr-2" />
                                {t.use}
                            </Button>
                        )}
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
