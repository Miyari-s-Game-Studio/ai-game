
// src/lib/rules-actions.ts
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import type { GameRules } from '@/types/game';

export async function saveRules(rulesId: string, rulesJson: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate that the ID in the JSON matches the filename
    const rulesObject: GameRules = JSON.parse(rulesJson);
    if (rulesObject.id !== rulesId) {
        return { success: false, error: `The 'id' in the JSON ("${rulesObject.id}") does not match the file name ("${rulesId}"). Please correct it.` };
    }

    const filePath = path.join(process.cwd(), 'src', 'lib', 'rulesets', `${rulesId}.json`);
    
    // The content to be written is just the pretty-printed JSON
    const jsonContent = JSON.stringify(rulesObject, null, 2);
    
    await fs.writeFile(filePath, jsonContent, 'utf-8');

    return { success: true };
  } catch (error: any) {
    console.error("Failed to save rules:", error);
    return { success: false, error: error.message || 'An unknown error occurred.' };
  }
}
