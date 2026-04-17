"use client";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Group } from "three";
import type { Agent } from "@/lib/types";

type Props = {
  agent: Agent;
  position: [number, number, number];
  selected: boolean;
  onSelect: () => void;
};

const palette = [
  "#e0a846", "#7ca7d1", "#c57fa5", "#7fc59a", "#d97a56",
  "#8f7ad9", "#d5c873", "#5bb3a5", "#d46b93", "#7eb86e",
];

const hashColor = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length];
};

export default function Character({ agent, position, selected, onSelect }: Props) {
  const group = useRef<Group>(null);
  const bodyRef = useRef<Group>(null);
  const leftArm = useRef<Group>(null);
  const rightArm = useRef<Group>(null);
  const leftLeg = useRef<Group>(null);
  const rightLeg = useRef<Group>(null);

  const color = useMemo(() => agent.avatar_color ?? hashColor(agent.id), [agent]);
  const isActive = agent.status === "active";
  const radius = 1.8;
  const speed = isActive ? 0.5 : 0.05;

  useFrame((_, delta) => {
    if (!group.current) return;
    const t = performance.now() / 1000;
    if (isActive) {
      const cx = position[0];
      const cz = position[2];
      const angle = t * speed + (agent.id.charCodeAt(0) % 6);
      group.current.position.x = cx + Math.cos(angle) * radius;
      group.current.position.z = cz + Math.sin(angle) * radius;
      group.current.rotation.y = -angle + Math.PI / 2;
    } else {
      group.current.position.x = position[0];
      group.current.position.z = position[2];
      group.current.rotation.y = Math.sin(t * 0.3) * 0.2;
    }

    if (bodyRef.current) {
      bodyRef.current.position.y = isActive
        ? 0.9 + Math.abs(Math.sin(t * 6)) * 0.08
        : 0.9 + Math.sin(t * 1.5) * 0.02;
    }

    const swing = isActive ? Math.sin(t * 6) * 0.7 : Math.sin(t * 1.2) * 0.1;
    if (leftArm.current) leftArm.current.rotation.x = swing;
    if (rightArm.current) rightArm.current.rotation.x = -swing;
    if (leftLeg.current) leftLeg.current.rotation.x = -swing * 0.8;
    if (rightLeg.current) rightLeg.current.rotation.x = swing * 0.8;
  });

  return (
    <group ref={group} position={position} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      <group ref={bodyRef}>
        <mesh position={[0, 0.55, 0]} castShadow>
          <capsuleGeometry args={[0.28, 0.7, 4, 12]} />
          <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} />
        </mesh>
        <mesh position={[0, 1.3, 0]} castShadow>
          <sphereGeometry args={[0.26, 18, 16]} />
          <meshStandardMaterial color="#e8c9a6" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.5, 0.02]}>
          <sphereGeometry args={[0.28, 18, 16]} />
          <meshStandardMaterial color="#1f1f24" roughness={0.9} />
        </mesh>
        <group ref={leftArm} position={[-0.35, 1.0, 0]}>
          <mesh position={[0, -0.3, 0]} castShadow>
            <capsuleGeometry args={[0.09, 0.55, 4, 8]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
        </group>
        <group ref={rightArm} position={[0.35, 1.0, 0]}>
          <mesh position={[0, -0.3, 0]} castShadow>
            <capsuleGeometry args={[0.09, 0.55, 4, 8]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
        </group>
        <group ref={leftLeg} position={[-0.15, 0.2, 0]}>
          <mesh position={[0, -0.3, 0]} castShadow>
            <capsuleGeometry args={[0.11, 0.55, 4, 8]} />
            <meshStandardMaterial color="#2a2a30" roughness={0.7} />
          </mesh>
        </group>
        <group ref={rightLeg} position={[0.15, 0.2, 0]}>
          <mesh position={[0, -0.3, 0]} castShadow>
            <capsuleGeometry args={[0.11, 0.55, 4, 8]} />
            <meshStandardMaterial color="#2a2a30" roughness={0.7} />
          </mesh>
        </group>
      </group>

      <Html center position={[0, 2.15, 0]} distanceFactor={10} zIndexRange={[10, 0]}>
        <div
          className={
            "pointer-events-none select-none flex flex-col items-center gap-0.5 " +
            (selected ? "scale-110" : "")
          }
          style={{ transition: "transform 150ms ease" }}
        >
          <span
            className="text-[11px] font-medium tracking-[0.03em] rounded-full px-2 py-0.5"
            style={{
              background: selected ? "rgba(224,168,70,0.18)" : "rgba(0,0,0,0.55)",
              color: selected ? "#f2b95e" : "#e6e8ec",
              border: `1px solid ${selected ? "rgba(224,168,70,0.45)" : "rgba(255,255,255,0.1)"}`,
              backdropFilter: "blur(6px)",
            }}
          >
            {agent.name}
          </span>
          <span
            className="text-[9px] uppercase tracking-[0.12em]"
            style={{ color: isActive ? "#3fb77a" : "#6d7280" }}
          >
            {isActive ? "● activo" : "○ idle"}
          </span>
        </div>
      </Html>

      {selected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.75, 32]} />
          <meshBasicMaterial color="#e0a846" transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
}
