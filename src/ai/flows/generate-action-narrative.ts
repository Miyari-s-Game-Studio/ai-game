
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

const GenerateActionNarrativeInputSchema = z.object({
  situationLabel: z.string().describe("The label of the current situation or chapter."),
  sceneDescription: z.string().describe("The persistent, descriptive text for the current scene."),
  actionTaken: z.string().describe("The specific action the player just performed (e.g., 'investigate outlet')."),
  proceduralLogs: z.array(z.string()).describe("A list of factual, procedural outcomes resulting from the player's action, as determined by the game engine."),
  knownTargets: z.array(z.string()).describe("A list of all keywords or targets the player can interact with next. The generated narrative should subtly include these."),
});
export type GenerateActionNarrativeInput = z.infer<typeof GenerateActionNarrativeInputSchema>;

const GenerateActionNarrativeOutputSchema = z.object({
  narrative: z.string().describe("A compelling, 2-3 sentence narrative describing the result of the player's action. It must be based on the procedural logs and fit the scene description. It must also subtly weave in the known interaction targets."),
});
export type GenerateActionNarrativeOutput = z.infer<typeof GenerateActionNarrativeOutputSchema>;

export async function generateActionNarrative(input: GenerateActionNarrativeInput): Promise<GenerateActionNarrativeOutput> {
  return generateActionNarrativeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateActionNarrativePrompt',
  input: {schema: GenerateActionNarrativeInputSchema},
  output: {schema: GenerateActionNarrativeOutputSchema},
  prompt: `You are a game master for an interactive narrative game. Your task is to describe the outcome of the player's action.

The player is currently in this situation:
Situation: {{{situationLabel}}}
Scene: {{{sceneDescription}}}

The player took this action:
Action: {{{actionTaken}}}

The game engine determined the following concrete results from this action:
{{#each proceduralLogs}}
- {{{this}}}
{{/each}}

Based on these results, write a compelling, 2-3 sentence narrative describing what happens. The tone should be consistent with the scene. It is crucial that your response provides clear hints about what the player can interact with next by subtly weaving in items from the 'Known Interaction Targets' list.

Known Interaction Targets:
{{#each knownTargets}}
- {{{this}}}
{{/each}}

Generate the action-result narrative now.
`,
});

const generateActionNarrativeFlow = ai.defineFlow(
  {
    name: 'generateActionNarrativeFlow',
    inputSchema: GenerateActionNarrativeInputSchema,
    outputSchema: GenerateActionNarrativeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
