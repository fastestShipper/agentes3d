"use client";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import ChatPanel from "@/components/ChatPanel";
import CreateAgentModal from "@/components/CreateAgentModal";
import { useStore } from "@/lib/store";

const Office3D = dynamic(() => import("@/components/Office3D"), { ssr: false });

export default function Page() {
  const agents = useStore((s) => s.agents);
  const selectedId = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);

  return (
    <main className="h-screen w-screen flex flex-col overflow-hidden">
      <Header />
      <div className="flex-1 grid grid-cols-[280px_1fr_360px] gap-3 p-3 min-h-0">
        <Sidebar />
        <section className="panel relative overflow-hidden min-h-0">
          <Office3D agents={agents} selectedId={selectedId} onSelect={select} />
          <div className="pointer-events-none absolute bottom-3 left-3 text-[10px] uppercase tracking-[0.12em] text-[color:var(--color-text-mute)]">
            click sobre un agente para seleccionar · scroll para zoom · arrastra para rotar
          </div>
        </section>
        <ChatPanel />
      </div>
      <CreateAgentModal />
    </main>
  );
}
