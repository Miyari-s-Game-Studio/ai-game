// src/components/game/InventoryDisplay.tsx
'use client';
import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Item, Equipment } from '@/types/game';
import { getTranslator } from '@/lib/i18n';
import { Trash2, Hand, XCircle, Package, Shirt } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface InventoryDisplayProps {
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

export function InventoryDisplay({
    inventory = [],
    equipment,
    onItemAction,
    language
}: InventoryDisplayProps) {
  const t = useMemo(() => getTranslator(language), [language]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.inventory}</CardTitle>
        <CardDescription>{t.inventoryDescription}</CardDescription>
      </CardHeader>
      <CardContent>
          <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
            {inventory.length > 0 ? (
              inventory.map(item => {
                const Icon = getDynamicIcon(item.icon);
                const isEquipped = item.slot && equipment[item.slot] === item.name;

                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 p-3 border rounded-lg bg-background"
                  >
                    <div className="p-2 bg-muted rounded-md">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold">{item.name}</p>
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
      </CardContent>
    </Card>
  );
}

export default InventoryDisplay;
