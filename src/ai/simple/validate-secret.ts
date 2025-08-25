// src/ai/simple/validate-secret.ts
'use server';
/**
 * @fileOverview An AI agent for validating a player's guess for a secret.
 *
 * - validateSecret - A function that checks if a player's guess is correct.
 * - ValidateSecretInput - The input type for the validateSecret function.
 * - ValidateSecretOutput - The return type for the validateSecret function.
 */

import {z} from 'genkit';
import {getTranslator} from '@/lib/i18n';
import {API_GENERATE} from "@/ai/simple/config";
import type {ValidateSecretInput} from "@/types/game";

const ValidateSecretOutputSchema = z.object({
  isCorrect: z.boolean(),
});
export type ValidateSecretOutput = z.infer<typeof ValidateSecretOutputSchema>;

export async function validateSecret(input: ValidateSecretInput): Promise<ValidateSecretOutput> {
  const t = getTranslator(input.language);
  const promptText = t.ai.validateSecret.prompt(input);

  const outputSchema = {
    isCorrect: t.ai.validateSecret.schema.isCorrect,
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
        isCorrect: result.isCorrect,
      };
    } catch (e) {
      console.error("Error parsing JSON response, retrying...", e);
      retryCount--;
    }
  }
  throw new Error("Failed to parse AI response after multiple attempts.");
}
