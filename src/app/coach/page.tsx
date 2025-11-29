'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user-store';
import { useMoodStore } from '@/store/mood-store';
import { useSleepStore } from '@/store/sleep-store';
import { useEventStore } from '@/store/event-store';
import { useChatStore } from '@/store/chat-store';
import { useNutritionStore } from '@/store/nutrition-store';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Bot,
  User,
  Battery,
  BatteryLow,
  BatteryFull,
  Loader2,
  Lightbulb,
  Calendar,
  Heart,
  Moon,
} from 'lucide-react';
import { EnergyState } from '@/types/chat';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

function CoachSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex-1 p-4 space-y-4">
        <Skeleton className="h-20 w-3/4 ml-auto" />
        <Skeleton className="h-32 w-3/4" />
        <Skeleton className="h-16 w-1/2 ml-auto" />
      </div>
    </div>
  );
}

const QUICK_PROMPTS = [
  { icon: Calendar, text: "Optimize my schedule", prompt: "Can you help me optimize my schedule for today? Consider my energy levels and tasks." },
  { icon: Heart, text: "I'm feeling stressed", prompt: "I'm feeling really stressed right now. Can you help me?" },
  { icon: Moon, text: "Sleep advice", prompt: "I haven't been sleeping well. Any tips to improve my sleep?" },
  { icon: Lightbulb, text: "Productivity tips", prompt: "What are some quick productivity tips for studying?" },
];

export default function CoachPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const user = useUserStore((state) => state.user);
  const { getTodayEntry } = useMoodStore();
  const { getLastEntry } = useSleepStore();
  const { getTodayEvents } = useEventStore();
  const { currentEnergyLevel, setEnergyLevel } = useChatStore();
  const { getTodayMeals } = useNutritionStore();

  // Build context for AI
  const todayMood = getTodayEntry();
  const lastSleep = getLastEntry();
  const todayEvents = getTodayEvents();
  const todayMeals = getTodayMeals();

  const context = {
    name: user?.name,
    major: user?.major,
    yearInSchool: user?.yearInSchool,
    peakProductivityTime: user?.energyPattern?.peakProductivityTime,
    currentChallenges: user?.currentChallenges,
    todayMood: todayMood?.moodScore,
    lastSleepHours: lastSleep ? Math.round(lastSleep.totalSleepMinutes / 60 * 10) / 10 : null,
    currentEnergy: currentEnergyLevel,
    todayEvents: todayEvents.slice(0, 5).map((e) => ({
      title: e.title,
      time: format(new Date(e.start), 'h:mm a'),
    })),
    mealsLoggedToday: todayMeals.length,
  };

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0 && user?.name) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Hey ${user.name.split(' ')[0]}! 👋 I'm Ripple, your wellbeing coach. How are you feeling today? I can help you optimize your schedule, manage stress, or just chat about how things are going.`,
      }]);
    }
  }, [user?.name, messages.length]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !user?.onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [mounted, user, router]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!mounted) {
    return (
      <AppShell title="AI Coach">
        <CoachSkeleton />
      </AppShell>
    );
  }

  if (!user?.onboardingCompleted) return null;

  const sendChatMessage = async (content: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          context,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to get response');
      }

      const text = await response.text();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: text,
      };

      setMessages([...newMessages, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting right now. Please try again.",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendChatMessage(input.trim());
      setInput('');
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    if (!isLoading) {
      sendChatMessage(prompt);
    }
  };

  const handleEnergyChange = (level: EnergyState) => {
    setEnergyLevel(level);
    const prompt = level === 'tired'
      ? "I'm feeling tired right now. Can you suggest some adjustments to my schedule?"
      : level === 'energized'
      ? "I'm feeling energized! What should I tackle first?"
      : "My energy is back to normal.";
    if (!isLoading) {
      sendChatMessage(prompt);
    }
  };

  return (
    <AppShell title="Coach">
      <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[calc(100vh-8rem)] overflow-hidden rounded-lg border border-border bg-card">
        {/* Header with Energy */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Ripple AI</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-2">Energy:</span>
            <Button
              variant={currentEnergyLevel === 'tired' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => handleEnergyChange('tired')}
              disabled={isLoading}
            >
              <BatteryLow className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={currentEnergyLevel === 'normal' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => handleEnergyChange('normal')}
              disabled={isLoading}
            >
              <Battery className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={currentEnergyLevel === 'energized' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => handleEnergyChange('energized')}
              disabled={isLoading}
            >
              <BatteryFull className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-3 p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2.5 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="bg-muted/50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Quick Prompts */}
        {messages.length <= 2 && (
          <div className="px-4 pb-2">
            <p className="text-xs text-muted-foreground mb-2">Quick prompts:</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt, idx) => {
                const Icon = prompt.icon;
                return (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="h-auto py-1.5 px-3 text-xs"
                    onClick={() => handleQuickPrompt(prompt.prompt)}
                    disabled={isLoading}
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {prompt.text}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-border">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Ripple anything..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>

          {/* Context Indicators */}
          <div className="flex flex-wrap gap-1 mt-2">
            {todayMood && (
              <Badge variant="outline" className="text-[10px]">
                Mood: {todayMood.moodEmoji}
              </Badge>
            )}
            {lastSleep && (
              <Badge variant="outline" className="text-[10px]">
                Sleep: {Math.round(lastSleep.totalSleepMinutes / 60)}h
              </Badge>
            )}
            {todayEvents.length > 0 && (
              <Badge variant="outline" className="text-[10px]">
                {todayEvents.length} events today
              </Badge>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
