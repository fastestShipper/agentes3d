"use client";
import { Plus, Users } from "lucide-react";
import { useStore } from "@/lib/store";

export default function Sidebar() {
  const agents = useStore((s) => s.agents);
  const selectedId = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);
  const openCreate = useStore((s) => s.openCreate);

  return (
    <aside className="panel h-full flex flex-col overflow-hidden">
      <header className="px-4 py-3 border-b border-[color:var(--color-line)] flex items-center gap-2">
        <Users className="w-4 h-4 text-[color:var(--color-text-dim)]" />
        <span className="text-[13px] font-medium flex-1">Equipo</span>
        <span className="text-[11px] text-[color:var(--color-text-mute)]">{agents.length}</span>
      </header>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {agents.length === 0 ? (
          <div className="text-[12px] text-[color:var(--color-text-mute)] px-2 py-6 text-center">
            Sin agentes aún.
          </div>
        ) : (
          <ul className="space-y-1">
            {agents.map((a) => (
              <li key={a.id}>
                <button
                  onClick={() => select(a.id)}
                  className={
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors " +
                    (selectedId === a.id
                      ? "bg-[rgba(224,168,70,0.12)] border border-[rgba(224,168,70,0.4)]"
                      : "border border-transparent hover:bg-[#11141a]")
                  }
                >
                  <span
                    className={
                      "status-dot " +
                      (a.status === "active" ? "active" : a.status === "error" ? "error" : "idle")
                    }
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[13px] font-medium truncate">{a.name}</span>
                    <span className="text-[11px] text-[color:var(--color-text-mute)] truncate">
                      {a.role}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-[color:var(--color-line)] px-3 py-3">
        <button className="btn btn-primary w-full justify-center" onClick={() => openCreate(true)}>
          <Plus className="w-4 h-4" />
          Nuevo agente
        </button>
      </div>
    </aside>
  );
}
