
// src/ai/flows/generate-conversation.ts
'use server';
/**
 * @fileOverview An AI agent for dynamic conversations with NPCs.
 *
 * - generateCharacter - Creates a new character profile.
 * - continueConversation - Continues a conversation with a character.
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
// 2. Flow for Continuing a Conversation
//-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

const ContinueConversationInputSchema = z.object({
    characterProfile: GenerateCharacterOutputSchema,
    conversationHistory: z.custom<ConversationHistory>(),
    playerInput: z.string().describe("The latest message from the player."),
    objective: z.string().describe("The secret information the player is trying to get the character to reveal OR a negotiation point they want the character to agree to."),
});
export type ContinueConversationInput = z.infer<typeof ContinueConversationInputSchema>;

const ContinueConversationOutputSchema = z.object({
  response: z.string().describe("The character's response to the player."),
  objectiveAchieved: z.boolean().describe("Set to true if the character's response reveals the secret or explicitly agrees to the negotiation objective."),
});
export type ContinueConversationOutput = z.infer<typeof ContinueConversationOutputSchema>;

export async function continueConversation(input: ContinueConversationInput): Promise<ContinueConversationOutput> {
  return continueConversationFlow(input);
}

const continueConversationFlow = ai.defineFlow(
  {
    name: 'continueConversationFlow',
    inputSchema: ContinueConversationInputSchema,
    outputSchema: ContinueConversationOutputSchema,
  },
  async ({ characterProfile, conversationHistory, playerInput, objective }) => {
    
    const model = ai.model('googleai/gemini-2.0-flash');

    const { output } = await ai.generate({
      model: model,
      history: conversationHistory,
      system: `You are an NPC in a role-playing game.
        Your name is: ${characterProfile.name}
        Your personality is: ${characterProfile.personality}
        Your dialogue style is: ${characterProfile.dialogStyle}
        
        You must stay in character at all times. The player is trying to achieve an objective.
        The objective is: "${objective}"

        There are two types of objectives:
        1.  A secret to be revealed (e.g., "The factory has suspicious emissions at night.").
        2.  An agreement to be made (e.g., "Your goal is to get them to agree to this: The factory will stop production for rectification.").

        Do NOT reveal the secret or agree to the proposal unless the player's dialogue skillfully and naturally leads you to do so. Be subtle. 
        If your response substantially reveals the secret, set 'objectiveAchieved' to true.
        If you are agreeing to a proposal, you MUST use the words "I agree to..." in your response, and then set 'objectiveAchieved' to true.
        Otherwise, keep 'objectiveAchieved' false.
        
        Respond to the player's message based on your personality and the conversation so far. Keep your responses concise and natural-sounding.`,
      prompt: playerInput,
      output: {
          schema: ContinueConversationOutputSchema,
      },
    });

    return output!;
  }
);
