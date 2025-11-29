'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ChatMessage, ChatSession, EnergyState } from '@/types/chat';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

interface ChatStore {
  sessions: ChatSession[];
  currentSessionId: string | null;
  currentEnergyLevel: EnergyState;

  // Actions
  createSession: () => string;
  addMessage: (sessionId: string, message: Omit<ChatMessage, 'id' | 'createdAt'>) => void;
  updateMessage: (sessionId: string, messageId: string, updates: Partial<ChatMessage>) => void;
  setCurrentSession: (sessionId: string | null) => void;
  setEnergyLevel: (level: EnergyState) => void;
  clearSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;

  // Getters
  getCurrentSession: () => ChatSession | undefined;
  getRecentMessages: (limit?: number) => ChatMessage[];
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSessionId: null,
      currentEnergyLevel: 'normal',

      createSession: () => {
        const newSession: ChatSession = {
          id: uuidv4(),
          messages: [],
          context: {
            todayDate: format(new Date(), 'yyyy-MM-dd'),
            currentEnergyLevel: get().currentEnergyLevel,
          },
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          sessions: [...state.sessions, newSession],
          currentSessionId: newSession.id,
        }));

        return newSession.id;
      },

      addMessage: (sessionId, messageData) => {
        const newMessage: ChatMessage = {
          ...messageData,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, messages: [...s.messages, newMessage] }
              : s
          ),
        }));
      },

      updateMessage: (sessionId, messageId, updates) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === messageId ? { ...m, ...updates } : m
                  ),
                }
              : s
          ),
        }));
      },

      setCurrentSession: (sessionId) => {
        set({ currentSessionId: sessionId });
      },

      setEnergyLevel: (level) => {
        set({ currentEnergyLevel: level });

        // Update current session context
        const currentId = get().currentSessionId;
        if (currentId) {
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === currentId
                ? { ...s, context: { ...s.context, currentEnergyLevel: level } }
                : s
            ),
          }));
        }
      },

      clearSession: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, messages: [] } : s
          ),
        }));
      },

      deleteSession: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
          currentSessionId:
            state.currentSessionId === sessionId ? null : state.currentSessionId,
        }));
      },

      getCurrentSession: () => {
        const state = get();
        return state.sessions.find((s) => s.id === state.currentSessionId);
      },

      getRecentMessages: (limit = 10) => {
        const session = get().getCurrentSession();
        if (!session) return [];
        return session.messages.slice(-limit);
      },
    }),
    {
      name: 'ripple_chat_history',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
