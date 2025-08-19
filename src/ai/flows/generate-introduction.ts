// src/ai/flows/generate-introduction.ts
'use server';
/**
 * @fileOverview An AI agent for generating game introductions.
 *
 * - generateIntroduction - A function that creates the introductory narrative for the game.
 * - GenerateIntroductionInput - The input type for the generateIntroduction function.
 * - GenerateIntroductionOutput - The return type for the generateIntroduction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateIntroductionInputSchema = z.object({
  title: z.string().describe('The title of the game.'),
  description: z.string().describe('A brief description of the game\'s premise.'),
  initialSituation: z.string().describe('The label of the starting situation or chapter.'),
});
export type GenerateIntroductionInput = z.infer<typeof GenerateIntroductionInputSchema>;

const GenerateIntroductionOutputSchema = z.object({
  introduction: z.string().describe('A compelling, multi-paragraph introductory narrative for the game.'),
  firstStep: z.string().describe('A short, procedural-style message stating the first objective or situation.'),
});
export type GenerateIntroductionOutput = z.infer<typeof GenerateIntroductionOutputSchema>;

export async function generateIntroduction(input: GenerateIntroductionInput): Promise<GenerateIntroductionOutput> {
  return generateIntroductionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateIntroductionPrompt',
  input: {schema: GenerateIntroductionInputSchema},
  output: {schema: GenerateIntroductionOutputSchema},
  prompt: `You are a game master for an interactive narrative game. Your task is to craft a compelling introduction to set the scene for the player.

Game Title: {{{title}}}
Game Description: {{{description}}}
Starting Situation: {{{initialSituation}}}

Based on this information, please generate:
1.  A captivating, multi-paragraph narrative that introduces the world, the player's role, and the central conflict or mystery. This should be engaging and draw the player into the story.
2.  A concise, procedural-style message that clearly states the player's first objective or the name of the initial phase.
`,
});

const generateIntroductionFlow = ai.defineFlow(
  {
    name: 'generateIntroductionFlow',
    inputSchema: GenerateIntroductionInputSchema,
    outputSchema: GenerateIntroductionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
