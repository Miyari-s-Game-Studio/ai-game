
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

const GenerateCharacterInputSchema = z.object({
  language: z.enum(['en', 'zh']).describe("The language for the character profile."),
  situationLabel: z.string().describe("The label of the current situation or chapter."),
  target: z.string().describe("The role or type of person the player is talking to (e.g., 'fisherman', 'guard', 'factory manager')."),
});

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
    inputSchema: GenerateCharacterInputSchema,
    outputSchema: GenerateCharacterOutputSchema,
  },
  async (input) => {
    const t = getTranslator(input.language);
    
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

const ExtractSecretInputSchema = z.object({
    language: z.enum(['en', 'zh']),
    characterProfile: GenerateCharacterOutputSchema,
    conversationHistory: z.custom<ConversationHistory>(),
    playerInput: z.string().describe("The latest message from the player."),
    objective: z.string().describe("The secret information the player is trying to get the character to reveal."),
});

const ConversationOutputSchema = z.object({
  response: z.string(),
});
export type ConversationOutput = z.infer<typeof ConversationOutputSchema>;

export async function extractSecret(input: ExtractSecretInput): Promise<ConversationOutput> {
  return extractSecretFlow(input);
}

const extractSecretFlow = ai.defineFlow(
  {
    name: 'extractSecretFlow',
    inputSchema: ExtractSecretInputSchema,
    outputSchema: ConversationOutputSchema,
  },
  async (input) => {
    const t = getTranslator(input.language);
    
    const outputSchema = z.object({
        response: z.string().describe(t.ai.extractSecret.schema.response),
    });

    const systemPrompt = t.ai.extractSecret.systemPrompt(input);

    const { output } = await ai.generate({
      history: input.conversationHistory,
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

const ReachAgreementInputSchema = z.object({
    language: z.enum(['en', 'zh']),
    characterProfile: GenerateCharacterOutputSchema,
    conversationHistory: z.custom<ConversationHistory>(),
    playerInput: z.string().describe("The latest message from the player."),
    objective: z.string().describe("A negotiation point the player wants the character to agree to."),
});

export async function reachAgreement(input: ReachAgreementInput): Promise<ConversationOutput> {
  return reachAgreementFlow(input);
}

const reachAgreementFlow = ai.defineFlow(
  {
    name: 'reachAgreementFlow',
    inputSchema: ReachAgreementInputSchema,
    outputSchema: ConversationOutputSchema,
  },
  async (input) => {
    const t = getTranslator(input.language);
    
    const outputSchema = z.object({
        response: z.string().describe(t.ai.reachAgreement.schema.response),
    });

    const systemPrompt = t.ai.reachAgreement.systemPrompt(input);
    
    const { output } = await ai.generate({
      history: input.conversationHistory,
      system: systemPrompt,
      prompt: input.playerInput,
      output: {
          schema: outputSchema,
      },
    });
    return output!;
  }
);
