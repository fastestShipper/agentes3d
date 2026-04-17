import type { Agent, ChatMessage, CreateAgentInput } from "./types";

const BASE = "/api/bridge";

async function j<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}

export const api = {
  listAgents: () => j<Agent[]>("/agents"),
  getAgent: (id: string) => j<Agent>(`/agents/${id}`),
  getMessages: (id: string) => j<ChatMessage[]>(`/agents/${id}/messages`),
  sendMessage: (id: string, text: string) =>
    j<ChatMessage>(`/agents/${id}/chat`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
  createAgent: (input: CreateAgentInput) =>
    j<Agent>("/agents", { method: "POST", body: JSON.stringify(input) }),
  deleteAgent: (id: string) =>
    j<{ ok: true }>(`/agents/${id}`, { method: "DELETE" }),
};
