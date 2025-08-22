
// src/ai/flows/generate-scene-description.ts
'use server';
/**
 * @fileOverview An AI agent for generating scene descriptions.
 *
 * - generateSceneDescription - A function that creates the scene description for a situation.
 * - GenerateSceneDescriptionInput - The input type for the generateSceneDescription function.
 * - GenerateSceneDescriptionOutput - The return type for the generateSceneDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { GenerateSceneDescriptionInput } from '@/types/game';
import { getTranslator } from '@/lib/i18n';

const GenerateSceneDescriptionInputSchema = z.object({
  language: z.enum(['en', 'zh']).describe("The language for the narrative."),
  situationLabel: z.string().describe("The label of the current situation or chapter."),
  knownTargets: z.array(z.string()).describe("A list of all keywords or targets the player can interact with in this scene."),
});

let GenerateSceneDescriptionOutputSchema = z.object({
  sceneDescription: z.string(),
});
export type GenerateSceneDescriptionOutput = z.infer<typeof GenerateSceneDescriptionOutputSchema>;

export async function generateSceneDescription(input: GenerateSceneDescriptionInput): Promise<GenerateSceneDescriptionOutput> {
  return generateSceneDescriptionFlow(input);
}

const generateSceneDescriptionFlow = ai.defineFlow(
  {
    name: 'generateSceneDescriptionFlow',
    inputSchema: GenerateSceneDescriptionInputSchema,
    outputSchema: GenerateSceneDescriptionOutputSchema,
  },
  async (input) => {
    const t = getTranslator(input.language);
    
    const outputSchema = z.object({
        sceneDescription: z.string().describe(t.ai.generateScene.schema.sceneDescription),
    });

    const promptText = t.ai.generateScene.prompt(input);
    
    const { output } = await ai.generate({
        prompt: promptText,
        output: { schema: outputSchema },
    });
    return output!;
  }
);
