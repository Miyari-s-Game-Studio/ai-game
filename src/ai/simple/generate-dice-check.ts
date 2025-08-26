'use server';
/**
 * @fileOverview AI agents for handling dice roll mechanics.
 *
 * - generateRelevantAttributes - Determines which player attributes are relevant for a skill check.
 * - generateDifficultyClass - Determines the difficulty class (DC) for a skill check.
 */

import {z} from 'genkit';
import {getTranslator} from '@/lib/i18n';
import {API_GENERATE} from "@/ai/simple/config";
import type {
    GenerateRelevantAttributesInput,
    GenerateDifficultyClassInput,
    PlayerAttributes
} from "@/types/game";


//-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// 1. Flow for Generating Relevant Attributes
//-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

const GenerateRelevantAttributesOutputSchema = z.object({
  relevantAttributes: z.array(z.enum(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'])),
});
export type GenerateRelevantAttributesOutput = z.infer<typeof GenerateRelevantAttributesOutputSchema>;


export async function generateRelevantAttributes(input: GenerateRelevantAttributesInput): Promise<GenerateRelevantAttributesOutput> {
  const t = getTranslator(input.language);

  const promptText = t.ai.generateRelevantAttributes.prompt(input);
  const outputSchema = {
    relevantAttributes: t.ai.generateRelevantAttributes.schema.relevantAttributes
  }
  const userPrompt = promptText + "\nPlease respond in JSON format with the following fields: " + JSON.stringify(outputSchema);

  let retryCount = 3;
  while (retryCount > 0) {
    try {
      const resp = await (await fetch(API_GENERATE, {
        method: 'POST',
        body: JSON.stringify({user_prompt: userPrompt, preset: "gemini-2.5-flash"}),
        headers: {'Content-Type': 'application/json'}
      })).json();
      const content = resp.content.substring(resp.content.indexOf('{'), resp.content.lastIndexOf('}') + 1);
      const result = JSON.parse(content);
      return {
        relevantAttributes: result.relevantAttributes,
      };
    } catch (e) {
      console.error("Error parsing JSON response for relevant attributes, retrying...", e);
      retryCount--;
    }
  }
  throw new Error("Failed to parse AI response after multiple attempts.");
}


//-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// 2. Flow for Generating Difficulty Class
//-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

const GenerateDifficultyClassOutputSchema = z.object({
  difficultyClass: z.number(),
});
export type GenerateDifficultyClassOutput = z.infer<typeof GenerateDifficultyClassOutputSchema>;


export async function generateDifficultyClass(input: GenerateDifficultyClassInput): Promise<GenerateDifficultyClassOutput> {
  const t = getTranslator(input.language);
  const promptText = t.ai.generateDifficultyClass.prompt(input);
  const outputSchema = {
    difficultyClass: t.ai.generateDifficultyClass.schema.difficultyClass
  }
  const userPrompt = promptText + "\nPlease respond in JSON format with the following fields: " + JSON.stringify(outputSchema);

  let retryCount = 3;
  while (retryCount > 0) {
    try {
      const resp = await (await fetch(API_GENERATE, {
        method: 'POST',
        body: JSON.stringify({user_prompt: userPrompt, preset: "gemini-2.5-flash"}),
        headers: {'Content-Type': 'application/json'}
      })).json();
      const content = resp.content.substring(resp.content.indexOf('{'), resp.content.lastIndexOf('}') + 1);
      const result = JSON.parse(content);
      return {
        difficultyClass: result.difficultyClass,
      };
    } catch (e) {
      console.error("Error parsing JSON response for DC, retrying...", e);
      retryCount--;
    }
  }
  throw new Error("Failed to parse AI response after multiple attempts.");
}
