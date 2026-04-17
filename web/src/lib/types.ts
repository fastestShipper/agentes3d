export type AgentStatus = "active" | "idle" | "error";

export type Agent = {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  model?: string;
  home_dir?: string;
  systemd_unit?: string;
  last_activity?: string;
  avatar_color?: string;
  position?: { x: number; z: number };
};

export type ChatMessage = {
  id: string;
  agent_id: string;
  from: "user" | "agent";
  text: string;
  ts: number;
};

export type CreateAgentInput = {
  name: string;
  role: string;
  instructions: string;
  model?: string;
};
