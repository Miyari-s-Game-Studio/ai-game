'use server';
/**
 * @fileOverview An AI agent for generating scene descriptions.
 *
 * - generateSceneDescription - A function that creates the scene description for a situation.
 * - GenerateSceneDescriptionInput - The input type for the generateSceneDescription function.
 * - GenerateSceneDescriptionOutput - The return type for the generateSceneDescription function.
 */

import {z} from 'genkit';
import type {GenerateSceneDescriptionInput} from '@/types/game';
import {getTranslator} from '@/lib/i18n';
import {API_IMAGE_GENERATE, API_TEXT_GENERATE} from "@/ai/simple/config";

let GenerateSceneDescriptionOutputSchema = z.object({
  sceneDescription: z.string(),
  sceneImage: z.string(),
});
export type GenerateSceneDescriptionOutput = z.infer<typeof GenerateSceneDescriptionOutputSchema>;

export async function generateSceneDescription(input: GenerateSceneDescriptionInput): Promise<GenerateSceneDescriptionOutput> {
  const t = getTranslator(input.language);

  const promptText = t.ai.generateScene.prompt(input);

  const resp = await (await fetch(API_TEXT_GENERATE, {
    method: 'POST',
    body: JSON.stringify({user_prompt: promptText, preset: "gemini-2.5-flash"}),
    headers: {'Content-Type': 'application/json'}
  })).json()
  const imageResp = (await (await fetch(API_IMAGE_GENERATE, {
    method: 'POST',
    body: JSON.stringify({user_prompt: `Generate an immersive and detailed scene image for the following description: \n\n${resp.content}`}),
    headers: {'Content-Type': 'application/json'}
  })).json())['content'];
  return {
    sceneDescription: resp.content,
    sceneImage: imageResp,
  };
}
