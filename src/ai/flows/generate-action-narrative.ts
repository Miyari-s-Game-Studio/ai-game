
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
  language: z.enum(['en', 'zh']).describe("The language for the narrative."),
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

const generateActionNarrativeFlow = ai.defineFlow(
  {
    name: 'generateActionNarrativeFlow',
    inputSchema: GenerateActionNarrativeInputSchema,
    outputSchema: GenerateActionNarrativeOutputSchema,
  },
  async (input) => {
    const isZh = input.language === 'zh';

    const promptText = isZh ? `
你是一个互动叙事游戏的地下城主。你的任务是描述玩家行动的结果。

玩家目前处于这种情况：
情境：${input.situationLabel}
场景：${input.sceneDescription}

玩家采取了此行动：
行动：${input.actionTaken}

游戏引擎确定了此行动的具体结果如下：
${input.proceduralLogs.map(log => `- ${log}`).join('\n')}

根据这些结果，写一个引人入胜的、2-3句话的叙述，描述发生了什么。基调应与场景一致。至关重要的是，你的回应必须通过巧妙地编织“已知互动目标”列表中的项目，为玩家下一步可以与什么互动提供清晰的提示。

已知互动目标：
${input.knownTargets.map(target => `- ${target}`).join('\n')}

现在生成行动结果的叙述。
` : `
You are a game master for an interactive narrative game. Your task is to describe the outcome of the player's action.

The player is currently in this situation:
Situation: ${input.situationLabel}
Scene: ${input.sceneDescription}

The player took this action:
Action: ${input.actionTaken}

The game engine determined the following concrete results from this action:
${input.proceduralLogs.map(log => `- ${log}`).join('\n')}

Based on these results, write a compelling, 2-3 sentence narrative describing what happens. The tone should be consistent with the scene. It is crucial that your response provides clear hints about what the player can interact with next by subtly weaving in items from the 'Known Interaction Targets' list.

Known Interaction Targets:
${input.knownTargets.map(target => `- ${target}`).join('\n')}

Generate the action-result narrative now.
`;
    const { output } = await ai.generate({
        prompt: promptText,
        output: { schema: GenerateActionNarrativeOutputSchema },
    });
    return output!;
  }
);
