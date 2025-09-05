
// src/components/layout/ThemeSwitcher.tsx
'use client';

import React from 'react';
import { useTheme } from './ThemeProvider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Palette } from 'lucide-react';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex items-center gap-2 text-base text-sidebar-primary-foreground">
        <Palette className="mr-1" />
        <span>Theme</span>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="capitalize">
              {theme.replace('theme-', '')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setTheme('theme-default')}>Default</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('theme-pixel')}>Pixel</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('theme-scifi')}>Sci-fi</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('theme-darksouls')}>Darksouls</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
