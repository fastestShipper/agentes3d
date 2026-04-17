"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, SoftShadows, ContactShadows } from "@react-three/drei";
import { useMemo } from "react";
import Character from "./Character";
import type { Agent } from "@/lib/types";

type Props = {
  agents: Agent[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

export default function Office3D({ agents, selectedId, onSelect }: Props) {
  const positions = useMemo(() => {
    const n = Math.max(agents.length, 1);
    const radius = Math.max(3, n * 0.9);
    return agents.map((a, i) => {
      const angle = (i / n) * Math.PI * 2;
      return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius] as [
        number,
        number,
        number,
      ];
    });
  }, [agents]);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 6.5, 10], fov: 42 }}
      onPointerMissed={() => onSelect(null)}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#07080a"]} />
      <fog attach="fog" args={["#07080a", 18, 45]} />

      <ambientLight intensity={0.35} />
      <directionalLight
        position={[8, 12, 6]}
        intensity={1.1}
        color="#f7ddb0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-10, 6, -6]} intensity={0.35} color="#7fb0d0" />
      <SoftShadows size={30} samples={16} />

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[18, 64]} />
        <meshStandardMaterial color="#0d1116" roughness={0.95} metalness={0} />
      </mesh>

      {/* Grid */}
      <gridHelper args={[30, 30, "#1a1d24", "#111418"]} position={[0, 0.01, 0]} />

      <ContactShadows
        position={[0, 0.02, 0]}
        opacity={0.6}
        scale={30}
        blur={2.4}
        far={10}
        resolution={512}
      />

      {agents.map((agent, i) => (
        <Character
          key={agent.id}
          agent={agent}
          position={positions[i]}
          selected={selectedId === agent.id}
          onSelect={() => onSelect(agent.id)}
        />
      ))}

      <OrbitControls
        makeDefault
        minDistance={5}
        maxDistance={22}
        maxPolarAngle={Math.PI / 2.1}
        minPolarAngle={Math.PI / 6}
        enablePan={false}
      />
    </Canvas>
  );
}
