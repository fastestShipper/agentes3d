"use client";
import { create } from "zustand";
import type { Agent, ChatMessage } from "./types";

type State = {
  agents: Agent[];
  selectedId: string | null;
  messages: Record<string, ChatMessage[]>;
  createOpen: boolean;
  setAgents: (agents: Agent[]) => void;
  upsertAgent: (a: Agent) => void;
  removeAgent: (id: string) => void;
  select: (id: string | null) => void;
  setMessages: (id: string, msgs: ChatMessage[]) => void;
  appendMessage: (m: ChatMessage) => void;
  openCreate: (open: boolean) => void;
};

export const useStore = create<State>((set) => ({
  agents: [],
  selectedId: null,
  messages: {},
  createOpen: false,
  setAgents: (agents) => set({ agents }),
  upsertAgent: (a) =>
    set((s) => {
      const others = s.agents.filter((x) => x.id !== a.id);
      return { agents: [...others, a] };
    }),
  removeAgent: (id) =>
    set((s) => ({
      agents: s.agents.filter((a) => a.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    })),
  select: (id) => set({ selectedId: id }),
  setMessages: (id, msgs) =>
    set((s) => ({ messages: { ...s.messages, [id]: msgs } })),
  appendMessage: (m) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [m.agent_id]: [...(s.messages[m.agent_id] ?? []), m],
      },
    })),
  openCreate: (open) => set({ createOpen: open }),
}));
