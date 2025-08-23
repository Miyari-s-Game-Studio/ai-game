
// src/ai/flows/generate-conversation.ts
'use server';
/**
 * @fileOverview An AI agent for dynamic conversations with NPCs.
 *
 * - generateCharacter - Creates a new character profile.
 * - extractSecret - Handles a conversation where the player tries to learn a secret.
 * - reachAgreement - Handles a conversation where the player tries to negotiate an agreement.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { CharacterProfile, ConversationHistory, GenerateCharacterInput, ExtractSecretInput, ReachAgreementInput } from '@/types/game';
import { getTranslator } from '@/lib/i18n';

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
  return generateCharacterFlow(input);
}

const generateCharacterFlow = ai.defineFlow(
  {
    name: 'generateCharacterFlow',
    inputSchema: z.custom<GenerateCharacterInput>(), // Use custom to avoid static schema checks
    outputSchema: GenerateCharacterOutputSchema,
  },
  async (input) => {
    const t = getTranslator(input.language);
    
    const inputSchema = z.object({
      language: z.enum(['en', 'zh']).describe(t.ai.generateCharacter.schema.language),
      situationLabel: z.string().describe(t.ai.generateCharacter.schema.situationLabel),
      target: z.string().describe(t.ai.generateCharacter.schema.target),
    });

    const outputSchema = z.object({
        name: z.string().describe(t.ai.generateCharacter.schema.name),
        personality: z.string().describe(t.ai.generateCharacter.schema.personality),
        dialogStyle: z.string().describe(t.ai.generateCharacter.schema.dialogStyle),
        openingLine: z.string().describe(t.ai.generateCharacter.schema.openingLine),
    });

    const promptText = t.ai.generateCharacter.prompt(input);

    const { output } = await ai.generate({
        prompt: promptText,
        output: { schema: outputSchema },
    });
    return output!;
  }
);


//-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// 2. Flow for Extracting a Secret
//-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

const ConversationOutputSchema = z.object({
  dialogue: z.string(),
  expression: z.string(),
  action: z.string(),
});
export type ConversationOutput = z.infer<typeof ConversationOutputSchema>;

export async function extractSecret(input: ExtractSecretInput): Promise<ConversationOutput> {
  return extractSecretFlow(input);
}

const extractSecretFlow = ai.defineFlow(
  {
    name: 'extractSecretFlow',
    inputSchema: z.custom<ExtractSecretInput>(),
    outputSchema: ConversationOutputSchema,
  },
  async (input) => {
    const t = getTranslator(input.language);
    
    const inputSchema = z.object({
      language: z.enum(['en', 'zh']),
      characterProfile: GenerateCharacterOutputSchema,
      conversationHistory: z.custom<ConversationHistory>(),
      playerInput: z.string().describe(t.ai.extractSecret.schema.playerInput),
      objective: z.string().describe(t.ai.extractSecret.schema.objective),
      sceneDescription: z.string().describe(t.ai.extractSecret.schema.sceneDescription),
    });

    const outputSchema = z.object({
        dialogue: z.string().describe(t.ai.extractSecret.schema.dialogue),
        expression: z.string().describe(t.ai.extractSecret.schema.expression),
        action: z.string().describe(t.ai.extractSecret.schema.action),
    });

    const systemPrompt = t.ai.extractSecret.systemPrompt(input);

    const { output } = await ai.generate({
      messages: input.conversationHistory,
      system: systemPrompt,
      prompt: input.playerInput,
      output: {
          schema: outputSchema,
      },
    });
    return output!;
  }
);

//-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// 3. Flow for Reaching an Agreement
//-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

export async function reachAgreement(input: ReachAgreementInput): Promise<ConversationOutput> {
  return reachAgreementFlow(input);
}

const reachAgreementFlow = ai.defineFlow(
  {
    name: 'reachAgreementFlow',
    inputSchema: z.custom<ReachAgreementInput>(),
    outputSchema: ConversationOutputSchema,
  },
  async (input) => {
    const t = getTranslator(input.language);
    
    const inputSchema = z.object({
      language: z.enum(['en', 'zh']),
      characterProfile: GenerateCharacterOutputSchema,
      conversationHistory: z.custom<ConversationHistory>(),
      playerInput: z.string().describe(t.ai.reachAgreement.schema.playerInput),
      objective: z.string().describe(t.ai.reachAgreement.schema.objective),
      sceneDescription: z.string().describe(t.ai.reachAgreement.schema.sceneDescription),
    });
    
    const outputSchema = z.object({
        dialogue: z.string().describe(t.ai.reachAgreement.schema.dialogue),
        expression: z.string().describe(t.ai.reachAgreement.schema.expression),
        action: z.string().describe(t.ai.reachAgreement.schema.action),
    });

    const systemPrompt = t.ai.reachAgreement.systemPrompt(input);
    
    const { output } = await ai.generate({
      messages: input.conversationHistory,
      system: systemPrompt,
      prompt: input.playerInput,
      output: {
          schema: outputSchema,
      },
    });
    return output!;
  }
);
