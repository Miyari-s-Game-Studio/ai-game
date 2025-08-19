// src/lib/rules-actions.ts
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import type { GameRules } from '@/types/game';

export async function saveRules(rulesJson: string): Promise<{ success: boolean; error?: string }> {
  try {
    const rulesObject: GameRules = JSON.parse(rulesJson);
    
    // Construct the TypeScript file content
    const tsContent = `
import type { GameRules } from '@/types/game';

export const defaultGameRules: GameRules = ${JSON.stringify(rulesObject, null, 2)};
`.trim();

    const filePath = path.join(process.cwd(), 'src', 'lib', 'game-rules.ts');
    await fs.writeFile(filePath, tsContent, 'utf-8');

    return { success: true };
  } catch (error: any) {
    console.error("Failed to save rules:", error);
    return { success: false, error: error.message || 'An unknown error occurred.' };
  }
}
