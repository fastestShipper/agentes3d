"use client";
import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";

const MODELS = [
  "grok-4-fast-reasoning",
  "grok-4-0709",
  "grok-3",
  "gpt-4o",
  "gpt-4o-mini",
  "claude-3-5-sonnet",
];

export default function CreateAgentModal() {
  const open = useStore((s) => s.createOpen);
  const close = () => useStore.getState().openCreate(false);
  const upsertAgent = useStore((s) => s.upsertAgent);
  const select = useStore((s) => s.select);

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [instructions, setInstructions] = useState("");
  const [model, setModel] = useState(MODELS[0]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  const reset = () => {
    setName("");
    setRole("");
    setInstructions("");
    setModel(MODELS[0]);
    setErr(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      const a = await api.createAgent({ name, role, instructions, model });
      upsertAgent(a);
      select(a.id);
      reset();
      close();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onClick={close}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
        className="panel w-full max-w-md p-5 space-y-4"
      >
        <header className="flex items-center justify-between">
          <h2 className="text-[15px] font-medium">Nuevo agente</h2>
          <button type="button" className="btn !p-1.5" onClick={close} aria-label="Cerrar">
            <X className="w-4 h-4" />
          </button>
        </header>

        <label className="block space-y-1">
          <span className="text-[11px] uppercase tracking-[0.1em] text-[color:var(--color-text-dim)]">
            Nombre
          </span>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ainstein"
            required
            autoFocus
          />
        </label>

        <label className="block space-y-1">
          <span className="text-[11px] uppercase tracking-[0.1em] text-[color:var(--color-text-dim)]">
            Rol
          </span>
          <input
            className="input"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Agencia digital"
            required
          />
        </label>

        <label className="block space-y-1">
          <span className="text-[11px] uppercase tracking-[0.1em] text-[color:var(--color-text-dim)]">
            Modelo
          </span>
          <select
            className="input"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            {MODELS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-[11px] uppercase tracking-[0.1em] text-[color:var(--color-text-dim)]">
            Instrucciones
          </span>
          <textarea
            className="input min-h-[110px] resize-y"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Eres un agente experto en..."
          />
        </label>

        {err && (
          <p className="text-[12px] text-[color:var(--color-danger)]">Error: {err}</p>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button type="button" className="btn" onClick={close} disabled={busy}>
            Cancelar
          </button>
          <button className="btn btn-primary" disabled={busy || !name || !role}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Crear
          </button>
        </div>
      </form>
    </div>
  );
}
