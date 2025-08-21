// src/components/game/TalkDialog.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, SendHorizontal, User, Bot, XCircle } from 'lucide-react';
import type { CharacterProfile, LogEntry, ConversationHistory } from '@/types/game';
import { ContinueConversationOutput } from '@/ai/flows/generate-conversation';

interface TalkDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  target: string;
  characterProfile: CharacterProfile | null;
  isGenerating: boolean;
  onConversationEnd: (log: LogEntry[], finalSummary: string) => void;
  continueConversation: (input: {
    characterProfile: CharacterProfile;
    conversationHistory: ConversationHistory;
    playerInput: string;
  }) => Promise<ContinueConversationOutput>;
}

export function TalkDialog({
  isOpen,
  onOpenChange,
  target,
  characterProfile,
  isGenerating,
  onConversationEnd,
  continueConversation,
}: TalkDialogProps) {
  const [conversation, setConversation] = useState<LogEntry[]>([]);
  const [playerInput, setPlayerInput] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

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
      setConversation([]);
      setPlayerInput('');
    }
  }, [isOpen, characterProfile]);

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
    if (!playerInput.trim() || !characterProfile) return;

    const newPlayerEntry: LogEntry = {
      id: Date.now(),
      type: 'player',
      actor: 'You',
      message: playerInput,
    };

    setConversation(prev => [...prev, newPlayerEntry]);
    setIsReplying(true);
    setPlayerInput('');

    try {
        const history: ConversationHistory = conversation.map(entry => ({
            role: entry.type === 'player' ? 'user' : 'model',
            parts: [{ text: entry.message }]
        }));

        const result = await continueConversation({
            characterProfile,
            conversationHistory: history,
            playerInput,
        });

        const newNpcEntry: LogEntry = {
            id: Date.now() + 1,
            type: 'npc',
            actor: characterProfile.name,
            message: result.response,
        };
        setConversation(prev => [...prev, newNpcEntry]);

    } catch (error) {
        console.error("Failed to get NPC reply:", error);
        const errorEntry: LogEntry = {
            id: Date.now() + 1,
            type: 'error',
            message: 'The character seems lost in thought and does not reply.'
        }
        setConversation(prev => [...prev, errorEntry]);
    } finally {
        setIsReplying(false);
    }
  };

  const handleClose = () => {
    const summary = `Finished a conversation with ${characterProfile?.name || target}.`;
    onConversationEnd(conversation, summary);
    onOpenChange(false);
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl">Talking to {characterProfile?.name || target}</DialogTitle>
          {characterProfile && <DialogDescription>{characterProfile.personality}</DialogDescription>}
        </DialogHeader>
        
        <div className="flex-grow overflow-hidden px-6">
            <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
                {isGenerating ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <p className="ml-4 text-lg">Character is approaching...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {conversation.map(entry => (
                            <div key={entry.id} className={`flex items-start gap-3 ${entry.type === 'player' ? 'justify-end' : ''}`}>
                                {entry.type !== 'player' && (
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                        <Bot className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                )}
                                <div className={`max-w-md rounded-xl px-4 py-3 ${entry.type === 'player' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                    <p className="font-bold text-sm mb-1">{entry.actor}</p>
                                    <p className="whitespace-pre-wrap">{entry.message}</p>
                                </div>
                                {entry.type === 'player' && (
                                     <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                        <User className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                        ))}
                         {isReplying && (
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                    <Bot className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <div className="max-w-md rounded-xl px-4 py-3 bg-muted">
                                   <Skeleton className="h-4 w-24 mb-2" />
                                   <Skeleton className="h-4 w-32" />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </ScrollArea>
        </div>

        <DialogFooter className="p-6 pt-4 border-t">
          <div className="flex w-full items-center gap-4">
            <Input
              placeholder="Say something..."
              value={playerInput}
              onChange={(e) => setPlayerInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isGenerating || isReplying}
              className="text-base"
            />
            <Button onClick={handleSend} disabled={isGenerating || isReplying || !playerInput.trim()}>
              <SendHorizontal className="mr-2" />
              Send
            </Button>
            <Button variant="outline" onClick={handleClose}>
                <XCircle className="mr-2" />
                End Conversation
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
