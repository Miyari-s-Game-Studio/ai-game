
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
  language: z.enum(['en', 'zh']).describe("The language for the narrative."),
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
  input: {schema: GenerateSceneDescriptionInputSchema.extend({ isZh: z.boolean() })},
  output: {schema: GenerateSceneDescriptionOutputSchema},
  prompt: `
{{#if isZh}}
你是一个互动叙事游戏的地下城主。你的任务是为玩家制作一个引人入胜的场景描述。这个描述为当前的情境设定了舞台。

当前情境：{{{situationLabel}}}

你必须创造一个引人入胜的、多段落的叙述，描述环境、氛围和关键元素。至关重要的是，你必须将以下所有互动目标自然地编织到你的描述中，以确保玩家知道他们可以与什么互动。

互动目标：
{{#each knownTargets}}
- {{{this}}}
{{/each}}

现在生成场景描述。
{{else}}
You are a game master for an interactive narrative game. Your task is to craft a compelling scene description for the player. This description sets the stage for the current situation.

Current Situation: {{{situationLabel}}}

You must create a captivating, multi-paragraph narrative that describes the environment, atmosphere, and key elements. Crucially, you MUST naturally weave all of the following interaction targets into your description to ensure the player knows what they can interact with.

Interaction Targets:
{{#each knownTargets}}
- {{{this}}}
{{/each}}

Generate the scene description now.
{{/if}}
`,
});

const generateSceneDescriptionFlow = ai.defineFlow(
  {
    name: 'generateSceneDescriptionFlow',
    inputSchema: GenerateSceneDescriptionInputSchema,
    outputSchema: GenerateSceneDescriptionOutputSchema,
  },
  async input => {
    const isZh = input.language === 'zh';
    const {output} = await prompt({...input, isZh});
    return output!;
  }
);
