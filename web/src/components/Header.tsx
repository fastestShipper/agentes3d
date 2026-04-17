"use client";
import { useEffect, useState } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";

export default function Header() {
  const agents = useStore((s) => s.agents);
  const setAgents = useStore((s) => s.setAgents);
  const [refreshing, setRefreshing] = useState(false);
  const [bridgeOk, setBridgeOk] = useState<boolean | null>(null);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const list = await api.listAgents();
      setAgents(list);
      setBridgeOk(true);
    } catch {
      setBridgeOk(false);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 8000);
    return () => clearInterval(t);
  }, []);

  const active = agents.filter((a) => a.status === "active").length;

  return (
    <header className="flex items-center justify-between px-5 py-3 border-b border-[color:var(--color-line)] bg-[color:var(--color-bg-1)]">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg glow-accent flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #f2c06c, #d99530)" }}>
          <span className="text-[#1a1208] text-[13px] font-semibold">a3</span>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[14px] font-medium">agentes3d</span>
          <span className="text-[11px] text-[color:var(--color-text-mute)]">oficina 3D</span>
        </div>
      </div>

      <div className="flex items-center gap-3 text-[12px]">
        <div className="flex items-center gap-1.5 text-[color:var(--color-text-dim)]">
          <Activity className="w-3.5 h-3.5 text-[color:var(--color-success)]" />
          <span className="font-mono">{active}</span>
          <span className="text-[color:var(--color-text-mute)]">activos de</span>
          <span className="font-mono">{agents.length}</span>
        </div>
        <div
          className="flex items-center gap-1.5"
          title={bridgeOk ? "Bridge conectado" : "Bridge no responde"}
        >
          <span
            className={
              "status-dot " +
              (bridgeOk === null ? "idle" : bridgeOk ? "active" : "error")
            }
          />
          <span className="text-[color:var(--color-text-dim)]">bridge</span>
        </div>
        <button className="btn !py-1.5" onClick={refresh} aria-label="Refrescar">
          <RefreshCw className={"w-3.5 h-3.5 " + (refreshing ? "animate-spin" : "")} />
        </button>
      </div>
    </header>
  );
}
