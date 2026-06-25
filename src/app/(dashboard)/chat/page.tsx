'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, User, BrainCircuit } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I have access to your notes. What would you like to know or discuss?' }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatMutation = useMutation({
    mutationFn: async (newMessages: Message[]) => {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      return res.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: data.role, content: data.content }]);
    }
  });

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: input.trim() }];
    setMessages(newMessages);
    setInput('');
    chatMutation.mutate(newMessages);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatMutation.isPending]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto w-full gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">AI Chat</h1>
        <p className="text-sm text-muted-foreground">Ask questions grounded in your notes.</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden bg-background">
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={cn(
                "flex gap-4 max-w-[80%]",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className="shrink-0">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border",
                  msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  {msg.role === 'user' ? <User className="h-5 w-5" /> : <BrainCircuit className="h-5 w-5" />}
                </div>
              </div>
              <div className={cn(
                "rounded-lg px-4 py-3 text-sm",
                msg.role === 'user' 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted prose prose-sm dark:prose-invert max-w-none"
              )}>
                {msg.role === 'user' ? (
                  msg.content
                ) : (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                )}
              </div>
            </div>
          ))}
          {chatMutation.isPending && (
             <div className="flex gap-4 max-w-[80%]">
             <div className="shrink-0">
               <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-muted">
                 <BrainCircuit className="h-5 w-5 animate-pulse" />
               </div>
             </div>
             <div className="rounded-lg px-4 py-3 bg-muted">
               <div className="flex space-x-1 items-center h-5">
                 <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce delay-75"></div>
                 <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce delay-150"></div>
               </div>
             </div>
           </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t bg-background">
          <div className="relative flex items-end gap-2">
            <Textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your notes..."
              className="min-h-[60px] resize-none"
              disabled={chatMutation.isPending}
            />
            <Button 
              size="icon" 
              className="h-14 w-14 shrink-0" 
              onClick={handleSend}
              disabled={!input.trim() || chatMutation.isPending}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
