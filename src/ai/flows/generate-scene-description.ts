
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

const GenerateSceneDescriptionInputSchema = z.object({
  situationLabel: z.string().describe("The label of the current situation or chapter."),
  knownTargets: z.array(z.string()).describe("A list of all keywords or targets the player can interact with in this scene."),
});
export type GenerateSceneDescriptionInput = z.infer<typeof GenerateSceneDescriptionInputSchema>;

const GenerateSceneDescriptionOutputSchema = z.object({
  sceneDescription: z.string().describe("A compelling, multi-paragraph narrative that describes the scene. It MUST naturally weave in all of the provided 'knownTargets' to introduce them to the player."),
});
export type GenerateSceneDescriptionOutput = z.infer<typeof GenerateSceneDescriptionOutputSchema>;

export async function generateSceneDescription(input: GenerateSceneDescriptionInput): Promise<GenerateSceneDescriptionOutput> {
  return generateSceneDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSceneDescriptionPrompt',
  input: {schema: GenerateSceneDescriptionInputSchema},
  output: {schema: GenerateSceneDescriptionOutputSchema},
  prompt: `You are a game master for an interactive narrative game. Your task is to craft a compelling scene description for the player. This description sets the stage for the current situation.

Current Situation: {{{situationLabel}}}

You must create a captivating, multi-paragraph narrative that describes the environment, atmosphere, and key elements. Crucially, you MUST naturally weave all of the following interaction targets into your description to ensure the player knows what they can interact with.

Interaction Targets:
{{#each knownTargets}}
- {{{this}}}
{{/each}}

Generate the scene description now.
`,
});

const generateSceneDescriptionFlow = ai.defineFlow(
  {
    name: 'generateSceneDescriptionFlow',
    inputSchema: GenerateSceneDescriptionInputSchema,
    outputSchema: GenerateSceneDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
