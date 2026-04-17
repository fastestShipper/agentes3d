"use client";
import { useEffect, useRef, useState } from "react";
import { Send, Loader2, Trash2, X } from "lucide-react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";

export default function ChatPanel() {
  const selectedId = useStore((s) => s.selectedId);
  const agents = useStore((s) => s.agents);
  const messages = useStore((s) => s.messages);
  const setMessages = useStore((s) => s.setMessages);
  const appendMessage = useStore((s) => s.appendMessage);
  const removeAgent = useStore((s) => s.removeAgent);
  const select = useStore((s) => s.select);

  const agent = agents.find((a) => a.id === selectedId) ?? null;
  const list = (selectedId && messages[selectedId]) || [];

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedId) return;
    api.getMessages(selectedId).then((m) => setMessages(selectedId, m)).catch(() => {});
  }, [selectedId, setMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [list.length]);

  if (!agent) {
    return (
      <div className="panel h-full flex items-center justify-center text-[13px] text-[color:var(--color-text-dim)]">
        Selecciona un agente para conversar
      </div>
    );
  }

  const onSend = async () => {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    const optimistic = {
      id: `local-${Date.now()}`,
      agent_id: agent.id,
      from: "user" as const,
      text: value,
      ts: Date.now(),
    };
    appendMessage(optimistic);
    setText("");
    try {
      const reply = await api.sendMessage(agent.id, value);
      appendMessage(reply);
    } catch (e) {
      appendMessage({
        id: `err-${Date.now()}`,
        agent_id: agent.id,
        from: "agent",
        text: `Error: ${(e as Error).message}`,
        ts: Date.now(),
      });
    } finally {
      setSending(false);
    }
  };

  const onDelete = async () => {
    if (!confirm(`¿Eliminar al agente ${agent.name}?`)) return;
    try {
      await api.deleteAgent(agent.id);
      removeAgent(agent.id);
      select(null);
    } catch {}
  };

  return (
    <div className="panel h-full flex flex-col overflow-hidden">
      <header className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--color-line)]">
        <div className="flex flex-col">
          <span className="text-[14px] font-medium">{agent.name}</span>
          <span className="text-[11px] text-[color:var(--color-text-dim)]">{agent.role}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            aria-label="Eliminar agente"
            className="btn !p-1.5 text-[color:var(--color-text-mute)] hover:text-[color:var(--color-danger)]"
            onClick={onDelete}
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            aria-label="Cerrar"
            className="btn !p-1.5 text-[color:var(--color-text-mute)]"
            onClick={() => select(null)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {list.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[12px] text-[color:var(--color-text-mute)]">
            Dale una orden. Por ejemplo: &quot;resumen de pendientes&quot;.
          </div>
        ) : (
          list.map((m) => (
            <div
              key={m.id}
              className={
                "max-w-[85%] rounded-xl px-3 py-2 text-[13px] leading-relaxed " +
                (m.from === "user"
                  ? "ml-auto bg-[#181c24] border border-[color:var(--color-line)]"
                  : "mr-auto bg-[#0f1217] border border-[color:var(--color-line)]")
              }
            >
              <div className="text-[10px] uppercase tracking-[0.12em] mb-0.5"
                style={{ color: m.from === "user" ? "#a0a4ac" : "#e0a846" }}>
                {m.from === "user" ? "tú" : agent.name}
              </div>
              <div className="whitespace-pre-wrap">{m.text}</div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-[color:var(--color-line)] px-3 py-3 flex gap-2">
        <input
          className="input flex-1"
          placeholder={`Orden para ${agent.name}…`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          disabled={sending}
        />
        <button className="btn btn-primary" onClick={onSend} disabled={sending}>
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
