// src/components/game/TalkScreen.tsx
'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, SendHorizontal, User, Bot, XCircle, CheckCircle, Target, KeyRound } from 'lucide-react';
import type {
  CharacterProfile,
  LogEntry,
  ConversationHistory,
  ExtractSecretInput,
  ReachAgreementInput,
  GameState,
} from '@/types/game';
import type { ConversationOutput } from '@/ai/simple/generate-conversation';
import { getTranslator } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { validateSecret } from '@/ai/simple/validate-secret';
import { ValidateSecretDialog } from './ValidateSecretDialog';

type ConversationFlow = (input: ExtractSecretInput | ReachAgreementInput) => Promise<ConversationOutput>;
type ConversationType = 'secret' | 'agreement';

interface TalkScreenProps {
  gameState: GameState;
  characterProfile: CharacterProfile | null;
  objective: string;
  conversationType: ConversationType;
  conversationFlow: ConversationFlow | null;
  onConversationEnd: (log: LogEntry[], objectiveAchieved: boolean) => void;
}

export function TalkScreen({
  gameState,
  characterProfile,
  objective,
  conversationType,
  conversationFlow,
  onConversationEnd,
}: TalkScreenProps) {
  const [conversation, setConversation] = useState<LogEntry[]>([]);
  const [playerInput, setPlayerInput] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [objectiveAchieved, setObjectiveAchieved] = useState(false);
  const [isValidateSecretDialogOpen, setIsValidateSecretDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const t = useMemo(() => getTranslator(gameState.player.language), [gameState.player.language]);

  useEffect(() => {
    if (characterProfile && conversation.length === 0) {
      setConversation([
        {
          id: Date.now(),
          type: 'npc',
          actor: characterProfile.name,
          message: characterProfile.openingLine,
        },
      ]);
    }
  }, [characterProfile, conversation.length]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [conversation]);

  const handleSend = async () => {
    if (!playerInput.trim() || !characterProfile || !conversationFlow) return;

    const newPlayerEntry: LogEntry = {
      id: Date.now(),
      type: 'player',
      actor: 'You',
      message: playerInput,
    };

    const currentHistory = [...conversation, newPlayerEntry];
    setConversation(currentHistory);
    setIsReplying(true);
    const sentInput = playerInput;
    setPlayerInput('');

    try {
      const history: ConversationHistory = currentHistory.map(entry => ({
        role: entry.type === 'player' ? 'user' : 'assistant',
        content: entry.message
      }));

      const result = await conversationFlow({
        language: gameState.player.language,
        characterProfile,
        playerIdentity: gameState.player.identity,
        conversationHistory: history,
        playerInput: sentInput,
        objective,
        sceneDescription: 'A tense conversation.', // Placeholder, might need to pass this in
      } as ExtractSecretInput | ReachAgreementInput);

      const newNpcEntry: LogEntry = {
        id: Date.now() + 1,
        type: 'npc',
        actor: characterProfile.name,
        message: result.content,
      };
      setConversation(prev => [...prev, newNpcEntry]);
      
      let achieved = false;
      if (conversationType === 'agreement' && result.content.toLowerCase().includes(t.ai.reachAgreement.systemPrompt({objective} as any).match(/I agree to (.*)/)![1].toLowerCase())) {
        achieved = true;
      }

      if (achieved) {
        setObjectiveAchieved(true);
        setTimeout(() => onConversationEnd(conversation, true), 2000);
      }
    } catch (error) {
      console.error("Failed to get NPC reply:", error);
      setConversation(prev => [...prev, { id: Date.now() + 1, type: 'error', message: t.characterLostInThought }]);
    } finally {
      setIsReplying(false);
    }
  };
  
  const handleSecretValidation = async (guessedSecret: string) => {
      setIsReplying(true);
      try {
        const result = await validateSecret({
            language: gameState.player.language,
            guessedSecret,
            actualSecret: objective,
        });

        toast({
            title: result.isCorrect ? t.guessCorrectTitle : t.guessIncorrectTitle,
            variant: result.isCorrect ? 'default' : 'destructive',
        });

        if (result.isCorrect) {
            setObjectiveAchieved(true);
            setTimeout(() => onConversationEnd(conversation, true), 2000);
        }
      } catch (error) {
          console.error("Failed to validate secret:", error);
          toast({ title: t.error, description: t.secretValidationFailed, variant: 'destructive' });
      } finally {
          setIsReplying(false);
          setIsValidateSecretDialogOpen(false);
      }
  }


  if (!characterProfile) {
    return (
        <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <>
      <ValidateSecretDialog
        isOpen={isValidateSecretDialogOpen}
        onOpenChange={setIsValidateSecretDialogOpen}
        onValidate={handleSecretValidation}
        isSubmitting={isReplying}
        language={gameState.player.language}
      />
      <div className="flex-1 flex overflow-hidden">
        {/* Left Page */}
        <aside className="w-1/2 flex flex-col p-8 border-r bg-muted/30 border-border gap-8">
            <div className="relative w-full h-1/2 rounded-lg overflow-hidden shadow-lg border border-border">
                <Image
                    src="https://placehold.co/600x800/1f2937/a5b4fc?text=NPC"
                    alt={characterProfile.name}
                    fill
                    style={{ objectFit: 'cover' }}
                    data-ai-hint="fantasy portrait"
                />
            </div>
            <div className="space-y-2">
                <h2 className="text-3xl font-headline font-bold text-primary">{characterProfile.name}</h2>
                <p className="text-muted-foreground italic">"{characterProfile.personality}"</p>
            </div>
             <div className="mt-auto space-y-4">
                 <div className="p-4 bg-background/50 rounded-lg text-sm border">
                    <div className="flex items-center font-semibold text-primary">
                        <Target className="w-5 h-5 mr-2"/>
                        {t.yourObjective}
                    </div>
                    <div className="text-muted-foreground pl-7">
                        {conversationType === 'secret' ? (
                        <>
                            <p>{t.uncoverSecret}</p>
                            <Button
                                variant="link"
                                className="p-0 h-auto mt-1"
                                onClick={() => setIsValidateSecretDialogOpen(true)}
                            >
                                <KeyRound className="mr-2"/>
                                {t.iKnowTheSecret}
                            </Button>
                        </>
                        ) : (
                        <p>{t.getThemToAgree} <em className="font-medium text-foreground">"{objective}"</em></p>
                        )}
                    </div>
                 </div>
            </div>
        </aside>

        {/* Right Page */}
        <main className="w-1/2 flex flex-col">
            <div className="flex-grow overflow-hidden p-6">
                 <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
                     <div className="space-y-6">
                        {conversation.map(entry => (
                        <div key={entry.id}
                            className={`flex items-start gap-3 ${entry.type === 'player' ? 'justify-end' : ''}`}>
                            {entry.type !== 'player' && (
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                <Bot className="w-6 h-6 text-muted-foreground"/>
                            </div>
                            )}
                            <div
                            className={`max-w-md rounded-xl px-4 py-3 ${entry.type === 'player' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            <p className="font-bold text-sm mb-1">{entry.actor}</p>
                            <p className="whitespace-pre-wrap">{entry.message}</p>
                            </div>
                            {entry.type === 'player' && (
                            <div
                                className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/80 flex items-center justify-center">
                                <User className="w-6 h-6 text-primary-foreground"/>
                            </div>
                            )}
                        </div>
                        ))}
                        {isReplying && !isValidateSecretDialogOpen && (
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <Bot className="w-6 h-6 text-muted-foreground"/>
                            </div>
                            <div className="max-w-md rounded-xl px-4 py-3 bg-muted">
                            <Skeleton className="h-4 w-24 mb-2"/>
                            <Skeleton className="h-4 w-32"/>
                            </div>
                        </div>
                        )}
                        {objectiveAchieved && (
                        <div className="flex flex-col items-center justify-center gap-2 p-4 text-green-600">
                            <CheckCircle className="w-10 h-10"/>
                            <p className="font-bold text-lg">{t.objectiveAchieved}</p>
                        </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
            <div className="p-4 border-t bg-background">
                 <div className="flex w-full items-center gap-4">
                    <Input
                        placeholder={t.saySomething}
                        value={playerInput}
                        onChange={(e) => setPlayerInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        disabled={isReplying || objectiveAchieved}
                        className="text-base"
                    />
                    <Button onClick={handleSend}
                            disabled={isReplying || objectiveAchieved || !playerInput.trim()}>
                        <SendHorizontal className="mr-2"/>
                        {t.send}
                    </Button>
                    <Button variant="outline" onClick={() => onConversationEnd(conversation, false)} disabled={objectiveAchieved}>
                        <XCircle className="mr-2"/>
                        {t.endConversation}
                    </Button>
                </div>
            </div>
        </main>
      </div>
    </>
  );
}
