
// src/ai/flows/generate-action-narrative.ts
'use server';
/**
 * @fileOverview An AI agent for generating action narratives.
 *
 * - generateActionNarrative - A function that creates a narrative for a player's action.
 * - GenerateActionNarrativeInput - The input type for the generateActionNarrative function.
 * - GenerateActionNarrativeOutput - The return type for the generateActionNarrative function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { GenerateActionNarrativeInput } from '@/types/game';
import { getTranslator } from '@/lib/i18n';

const GenerateActionNarrativeInputSchema = z.object({
  language: z.enum(['en', 'zh']).describe("The language for the narrative."),
  situationLabel: z.string().describe("The label of the current situation or chapter."),
  sceneDescription: z.string().describe("The persistent, descriptive text for the current scene."),
  actionTaken: z.string().describe("The specific action the player just performed (e.g., 'investigate outlet')."),
  proceduralLogs: z.array(z.string()).describe("A list of factual, procedural outcomes resulting from the player's action, as determined by the game engine."),
  knownTargets: z.array(z.string()).describe("A list of all keywords or targets the player can interact with next. The generated narrative should subtly include these."),
});

let GenerateActionNarrativeOutputSchema = z.object({
  narrative: z.string(),
});
export type GenerateActionNarrativeOutput = z.infer<typeof GenerateActionNarrativeOutputSchema>;

export async function generateActionNarrative(input: GenerateActionNarrativeInput): Promise<GenerateActionNarrativeOutput> {
  return generateActionNarrativeFlow(input);
}

const generateActionNarrativeFlow = ai.defineFlow(
  {
    name: 'generateActionNarrativeFlow',
    inputSchema: GenerateActionNarrativeInputSchema,
    outputSchema: GenerateActionNarrativeOutputSchema,
  },
  async (input) => {
    const t = getTranslator(input.language);

    const outputSchema = z.object({
        narrative: z.string().describe(t.ai.generateActionNarrative.schema.narrative),
    });

    const promptText = t.ai.generateActionNarrative.prompt(input);

    const { output } = await ai.generate({
        prompt: promptText,
        output: { schema: outputSchema },
    });
    return output!;
  }
);
