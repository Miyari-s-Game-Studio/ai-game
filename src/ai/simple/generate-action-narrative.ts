'use server';
/**
 * @fileOverview An AI agent for generating action narratives.
 *
 * - generateActionNarrative - A function that creates a narrative for a player's action.
 * - GenerateActionNarrativeInput - The input type for the generateActionNarrative function.
 * - GenerateActionNarrativeOutput - The return type for the generateActionNarrative function.
 */

import {z} from 'genkit';
import type {GenerateActionNarrativeInput} from '@/types/game';
import {getTranslator} from '@/lib/i18n';
import {API_GENERATE} from "@/ai/simple/config";


let GenerateActionNarrativeOutputSchema = z.object({
  narrative: z.string(),
});
export type GenerateActionNarrativeOutput = z.infer<typeof GenerateActionNarrativeOutputSchema>;

export async function generateActionNarrative(input: GenerateActionNarrativeInput): Promise<GenerateActionNarrativeOutput> {
  const t = getTranslator(input.language);

  const promptText = t.ai.generateActionNarrative.prompt(input);

  const resp = await (await fetch(API_GENERATE, {
    method: 'POST',
    body: JSON.stringify({user_prompt: promptText, preset: "gemini-2.5-flash"}),
    headers: {'Content-Type': 'application/json'}
  })).json()
  return {
    narrative: resp.content
  };
}
