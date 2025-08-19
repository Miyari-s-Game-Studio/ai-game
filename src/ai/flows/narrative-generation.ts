// src/ai/flows/narrative-generation.ts
'use server';
/**
 * @fileOverview A narrative generation AI agent.
 *
 * - generateNarrative - A function that handles the narrative generation process.
 * - GenerateNarrativeInput - The input type for the generateNarrative function.
 * - GenerateNarrativeOutput - The return type for the generateNarrative function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateNarrativeInputSchema = z.object({
  situation: z.string().describe('The current game situation.'),
  allowedActions: z.array(z.string()).describe('The list of allowed actions in the current situation.'),
  actionTaken: z.string().describe('The action the player took.'),
  environmentalTracks: z.record(z.number()).describe('The current state of the environmental tracks (e.g. pollution, governance, media). The keys can be arbitrary and are defined by the game rules.'),
  counters: z.record(z.boolean().or(z.number())).describe('The current state of the counters.'),
  knownTargets: z.array(z.string()).describe('A list of specific items, locations, or people the player can interact with.'),
  gameLog: z.array(z.string()).describe('Array of previous game log entries'),
});
export type GenerateNarrativeInput = z.infer<typeof GenerateNarrativeInputSchema>;

const GenerateNarrativeOutputSchema = z.object({
  narrative: z.string().describe('The generated narrative text. This text should subtly weave in the known interaction targets to guide the player.'),
});
export type GenerateNarrativeOutput = z.infer<typeof GenerateNarrativeOutputSchema>;

export async function generateNarrative(input: GenerateNarrativeInput): Promise<GenerateNarrativeOutput> {
  return generateNarrativeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateNarrativePrompt',
  input: {schema: GenerateNarrativeInputSchema},
  output: {schema: GenerateNarrativeOutputSchema},
  prompt: `You are a game master for an interactive narrative game. Generate a compelling narrative based on the player's action and the current game state. The narrative should naturally guide the player by mentioning things they can interact with.

Current Situation: {{{situation}}}
Allowed Actions: {{#each allowedActions}}{{{this}}}, {{/each}}
Action Taken: {{{actionTaken}}}
Game State Tracks: {{#each environmentalTracks}}{{@key}}: {{{this}}}, {{/each}}
Counters: {{#each counters}}{{{@key}}}: {{{this}}}, {{/each}}
Known Interaction Targets: {{#each knownTargets}}{{{this}}}, {{/each}}
Game Log: {{#each gameLog}}{{{this}}}\n{{/each}}

Narrative:`,
});

const generateNarrativeFlow = ai.defineFlow(
  {
    name: 'generateNarrativeFlow',
    inputSchema: GenerateNarrativeInputSchema,
    outputSchema: GenerateNarrativeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
