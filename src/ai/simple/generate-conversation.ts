// src/ai/flows/generate-conversation.ts
'use server';
/**
 * @fileOverview An AI agent for dynamic conversations with NPCs.
 *
 * - generateCharacter - Creates a new character profile.
 * - extractSecret - Handles a conversation where the player tries to learn a secret.
 * - reachAgreement - Handles a conversation where the player tries to negotiate an agreement.
 */

import {z} from 'genkit';
import type {ExtractSecretInput, GenerateCharacterInput, ReachAgreementInput} from '@/types/game';
import {getTranslator} from '@/lib/i18n';
import {API_GENERATE} from "@/ai/simple/config";

//-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// 1. Flow for Generating a Character Persona
//-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

const GenerateCharacterOutputSchema = z.object({
  name: z.string(),
  personality: z.string(),
  dialogStyle: z.string(),
  openingLine: z.string(),
});
export type GenerateCharacterOutput = z.infer<typeof GenerateCharacterOutputSchema>;

export async function generateCharacter(input: GenerateCharacterInput): Promise<GenerateCharacterOutput> {
  const t = getTranslator(input.language);

  const promptText = t.ai.generateCharacter.prompt(input);
  const outputSchema = {
    name: t.ai.generateCharacter.schema.name,
    personality: t.ai.generateCharacter.schema.personality,
    dialogStyle: t.ai.generateCharacter.schema.dialogStyle,
    openingLine: t.ai.generateCharacter.schema.openingLine,
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
        name: result.name,
        personality: result.personality,
        dialogStyle: result.dialogStyle,
        openingLine: result.openingLine,
      };
    } catch (e) {
      console.error("Error parsing JSON response, retrying...", e);
      retryCount--;
    }
  }
  throw new Error("Failed to parse AI response after multiple attempts.");
}

//-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// 2. Flow for Extracting a Secret
//-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

const ConversationOutputSchema = z.object({
  content: z.string(),
});
export type ConversationOutput = z.infer<typeof ConversationOutputSchema>;

export async function extractSecret(input: ExtractSecretInput): Promise<ConversationOutput> {
  const t = getTranslator(input.language);

  const systemPrompt = t.ai.extractSecret.systemPrompt(input);
  const resp = await (await fetch(API_GENERATE, {
    method: 'POST',
    body: JSON.stringify({
      system_prompt: systemPrompt,
      user_prompt: input.playerInput,
      history: input.conversationHistory,
      preset: "gemini-2.5-flash",
    }),
    headers: {'Content-Type': 'application/json'}
  })).json();
  return {content: resp.content}
}


//-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// 3. Flow for Reaching an Agreement
//-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

export async function reachAgreement(input: ReachAgreementInput): Promise<ConversationOutput> {
  const t = getTranslator(input.language);

  const systemPrompt = t.ai.reachAgreement.systemPrompt(input);
  const resp = await (await fetch(API_GENERATE, {
    method: 'POST',
    body: JSON.stringify({
      system_prompt: systemPrompt,
      user_prompt: input.playerInput,
      history: input.conversationHistory,
      preset: "gemini-2.5-flash",
    }),
    headers: {'Content-Type': 'application/json'}
  })).json();
  return {content: resp.content}
}
