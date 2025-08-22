
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
import type { CharacterProfile, ConversationHistory } from '@/types/game';

//-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// 1. Flow for Generating a Character Persona
//-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

const GenerateCharacterInputSchema = z.object({
  situationLabel: z.string().describe("The label of the current situation or chapter."),
  target: z.string().describe("The role or type of person the player is talking to (e.g., 'fisherman', 'guard', 'factory manager')."),
});
export type GenerateCharacterInput = z.infer<typeof GenerateCharacterInputSchema>;

const GenerateCharacterOutputSchema = z.object({
  name: z.string().describe("A common, realistic name for the character."),
  personality: z.string().describe("A brief, 1-2 sentence description of the character's personality (e.g., 'grumpy but helpful,' 'nervous and evasive')."),
  dialogStyle: z.string().describe("A description of how the character speaks (e.g., 'uses short, clipped sentences,' 'speaks very formally,' 'has a thick local accent')."),
  openingLine: z.string().describe("The first thing the character says to the player to start the conversation."),
});
export type GenerateCharacterOutput = z.infer<typeof GenerateCharacterOutputSchema>;


export async function generateCharacter(input: GenerateCharacterInput): Promise<GenerateCharacterOutput> {
  return generateCharacterFlow(input);
}

const generateCharacterPrompt = ai.definePrompt({
  name: 'generateCharacterPrompt',
  input: { schema: GenerateCharacterInputSchema },
  output: { schema: GenerateCharacterOutputSchema },
  prompt: `You are a character creator for a narrative game. Your task is to generate a unique, random NPC for the player to interact with.

The player is in the following situation: {{{situationLabel}}}
The player wants to talk to a person described as: {{{target}}}

Generate a character profile for this NPC. Make them feel like a real, unique person. Avoid clichés.
`,
});

const generateCharacterFlow = ai.defineFlow(
  {
    name: 'generateCharacterFlow',
    inputSchema: GenerateCharacterInputSchema,
    outputSchema: GenerateCharacterOutputSchema,
  },
  async (input) => {
    const { output } = await generateCharacterPrompt(input);
    return output!;
  }
);


//-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// 2. Flow for Extracting a Secret
//-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

const ExtractSecretInputSchema = z.object({
    characterProfile: GenerateCharacterOutputSchema,
    conversationHistory: z.custom<ConversationHistory>(),
    playerInput: z.string().describe("The latest message from the player."),
    objective: z.string().describe("The secret information the player is trying to get the character to reveal."),
});
export type ExtractSecretInput = z.infer<typeof ExtractSecretInputSchema>;

const ConversationOutputSchema = z.object({
  response: z.string().describe("The character's response to the player."),
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
  async ({ characterProfile, conversationHistory, playerInput, objective }) => {
    const { output } = await ai.generate({
      history: conversationHistory,
      system: `You are an NPC in a role-playing game.
        Your name is: ${characterProfile.name}
        Your personality is: ${characterProfile.personality}
        Your dialogue style is: ${characterProfile.dialogStyle}
        
        You must stay in character at all times. The player is trying to get you to reveal a secret.
        The secret is: "${objective}"

        Do NOT reveal the secret unless the player's dialogue skillfully and naturally leads you to do so. Be subtle. 
        
        Respond to the player's message based on your personality and the conversation so far. Keep your responses concise and natural-sounding.`,
      prompt: playerInput,
      output: {
          schema: ConversationOutputSchema,
      },
    });
    return output!;
  }
);

//-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// 3. Flow for Reaching an Agreement
//-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

const ReachAgreementInputSchema = z.object({
    characterProfile: GenerateCharacterOutputSchema,
    conversationHistory: z.custom<ConversationHistory>(),
    playerInput: z.string().describe("The latest message from the player."),
    objective: z.string().describe("A negotiation point the player wants the character to agree to."),
});
export type ReachAgreementInput = z.infer<typeof ReachAgreementInputSchema>;

export async function reachAgreement(input: ReachAgreementInput): Promise<ConversationOutput> {
  return reachAgreementFlow(input);
}

const reachAgreementFlow = ai.defineFlow(
  {
    name: 'reachAgreementFlow',
    inputSchema: ReachAgreementInputSchema,
    outputSchema: ConversationOutputSchema,
  },
  async ({ characterProfile, conversationHistory, playerInput, objective }) => {
    const { output } = await ai.generate({
      history: conversationHistory,
      system: `You are an NPC in a role-playing game.
        Your name is: ${characterProfile.name}
        Your personality is: ${characterProfile.personality}
        Your dialogue style is: ${characterProfile.dialogStyle}
        
        You must stay in character at all times. The player is trying to get you to agree to something.
        The objective is: "${objective}"

        Do NOT agree to the proposal unless the player's dialogue skillfully and naturally persuades you.
        If you are agreeing to the proposal, you MUST use the words "I agree to..." in your response.
        
        Respond to the player's message based on your personality and the conversation so far. Keep your responses concise and natural-sounding.`,
      prompt: playerInput,
      output: {
          schema: ConversationOutputSchema,
      },
    });
    return output!;
  }
);
