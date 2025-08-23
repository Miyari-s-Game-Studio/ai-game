// src/components/game/TalkDialog.tsx
'use client';

import React, {useState, useEffect, useRef, useMemo} from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Skeleton} from '@/components/ui/skeleton';
import {Loader2, SendHorizontal, User, Bot, XCircle, CheckCircle, Target} from 'lucide-react';
import type {
  CharacterProfile,
  LogEntry,
  ConversationHistory,
  ExtractSecretInput,
  ReachAgreementInput
} from '@/types/game';
import type {ConversationOutput} from '@/ai/simple/generate-conversation';
import {getTranslator} from '@/lib/i18n';

type ConversationFlow = (input: ExtractSecretInput | ReachAgreementInput) => Promise<ConversationOutput>;
type ConversationType = 'secret' | 'agreement';

interface TalkDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  target: string;
  objective: string;
  sceneDescription: string;
  conversationType: ConversationType;
  characterProfile: CharacterProfile | null;
  isGenerating: boolean;
  onConversationEnd: (log: LogEntry[], objectiveAchieved: boolean) => void;
  conversationFlow: ConversationFlow | null;
  language: 'en' | 'zh';
}

export function TalkDialog({
                             isOpen,
                             onOpenChange,
                             target,
                             objective,
                             sceneDescription,
                             conversationType,
                             characterProfile,
                             isGenerating,
                             onConversationEnd,
                             conversationFlow,
                             language,
                           }: TalkDialogProps) {
  const [conversation, setConversation] = useState<LogEntry[]>([]);
  const [playerInput, setPlayerInput] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [objectiveAchieved, setObjectiveAchieved] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const t = useMemo(() => getTranslator(language), [language]);

  useEffect(() => {
    if (isOpen && characterProfile && conversation.length === 0) {
      setConversation([
        {
          id: Date.now(),
          type: 'npc',
          actor: characterProfile.name,
          message: characterProfile.openingLine,
        },
      ]);
    } else if (!isOpen) {
      // Reset on close
      setTimeout(() => {
        setConversation([]);
        setPlayerInput('');
        setObjectiveAchieved(false);
      }, 300); // Delay to allow dialog to close before state reset
    }
  }, [isOpen, characterProfile, conversation.length]);

  useEffect(() => {
    // Scroll to bottom
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
        language,
        characterProfile,
        conversationHistory: history,
        playerInput: sentInput,
        objective,
        sceneDescription,
      } as ExtractSecretInput | ReachAgreementInput); // Cast to allow either type

      const fullResponse = result.content;

      const newNpcEntry: LogEntry = {
        id: Date.now() + 1,
        type: 'npc',
        actor: characterProfile.name,
        message: fullResponse,
      };
      setConversation(prev => [...prev, newNpcEntry]);

      let achieved = false;
      const responseLower = fullResponse.toLowerCase();
      const agreementPhrase = (language === 'zh' ? '我同意' : 'i agree to ') + objective.toLowerCase();

      if (conversationType === 'agreement') {
        if (responseLower.includes(agreementPhrase)) {
          achieved = true;
        }
      } else if (conversationType === 'secret') {
        if (responseLower.includes(objective.toLowerCase())) {
          achieved = true;
        }
      }

      if (achieved) {
        setObjectiveAchieved(true);
        setTimeout(() => handleClose(true), 2000); // Auto-close after a delay
      }

    } catch (error) {
      console.error("Failed to get NPC reply:", error);
      const errorEntry: LogEntry = {
        id: Date.now() + 1,
        type: 'error',
        message: t.characterLostInThought,
      }
      setConversation(prev => [...prev, errorEntry]);
    } finally {
      setIsReplying(false);
    }
  };

  const handleClose = (achieved: boolean) => {
    onConversationEnd(conversation, achieved);
    onOpenChange(false);
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-2xl">{t.talkingTo} {characterProfile?.name || target}</DialogTitle>
          {characterProfile && <DialogDescription>{characterProfile.personality}</DialogDescription>}
          {characterProfile && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
              <div className="flex items-center font-semibold text-primary">
                <Target className="w-5 h-5 mr-2"/>
                {t.yourObjective}
              </div>
              <div className="text-muted-foreground pl-7">
                {conversationType === 'secret' ? (
                  <p>{t.uncoverSecret}</p>
                ) : (
                  <p>{t.getThemToAgree} <em className="font-medium text-foreground">"{objective}"</em></p>
                )}
              </div>
            </div>
          )}
        </DialogHeader>

        <div className="flex-grow overflow-hidden px-6 pt-4">
          <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
            {isGenerating || !characterProfile ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin"/>
                <p className="ml-4 text-lg">{t.characterApproaching}</p>
              </div>
            ) : (
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
                {isReplying && (
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
            )}
          </ScrollArea>
        </div>

        <DialogFooter className="p-6 pt-4 border-t">
          <div className="flex w-full items-center gap-4">
            <Input
              placeholder={t.saySomething}
              value={playerInput}
              onChange={(e) => setPlayerInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isGenerating || isReplying || objectiveAchieved}
              className="text-base"
            />
            <Button onClick={handleSend}
                    disabled={isGenerating || isReplying || objectiveAchieved || !playerInput.trim()}>
              <SendHorizontal className="mr-2"/>
              {t.send}
            </Button>
            <Button variant="outline" onClick={() => handleClose(false)} disabled={objectiveAchieved}>
              <XCircle className="mr-2"/>
              {t.endConversation}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
