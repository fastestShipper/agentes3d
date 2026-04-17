"use client";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Group, Mesh } from "three";
import { MathUtils } from "three";
import type { Agent } from "@/lib/types";

type Props = {
  agent: Agent;
  deskPosition: [number, number, number];
  facing: number;
  selected: boolean;
  onSelect: () => void;
};

const skinTones = ["#f3c9a6", "#e5b18c", "#c9906e", "#a57051", "#825c3f"];
const shirtPalette = [
  "#e0a846", "#7aa7ce", "#c78fb3", "#7fc59a",
  "#d97a56", "#9786d6", "#d5c873", "#5bb3a5",
];

const hash = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
};

export default function Character({
  agent,
  deskPosition,
  facing,
  selected,
  onSelect,
}: Props) {
  const group = useRef<Group>(null);
  const body = useRef<Group>(null);
  const leftArm = useRef<Group>(null);
  const rightArm = useRef<Group>(null);
  const leftLeg = useRef<Group>(null);
  const rightLeg = useRef<Group>(null);
  const head = useRef<Group>(null);
  const leftEye = useRef<Mesh>(null);
  const rightEye = useRef<Mesh>(null);

  const h = useMemo(() => hash(agent.id), [agent.id]);
  const shirt = agent.avatar_color ?? shirtPalette[h % shirtPalette.length];
  const skin = skinTones[(h >> 3) % skinTones.length];
  const pants = "#1f2630";
  const isActive = agent.status === "active";

  const wanderCenter: [number, number] = useMemo(() => {
    // chilling/wandering area (outside the desk cluster)
    const a = (h % 360) * (Math.PI / 180);
    const r = 4.5 + (h % 100) / 60;
    return [Math.cos(a) * r, Math.sin(a) * r];
  }, [h]);

  const seatOffsetZ = -0.25; // slightly in front of desk
  const seatOffsetY = 0.35;  // sitting height

  useFrame((_, delta) => {
    if (!group.current) return;
    const t = performance.now() / 1000;
    const g = group.current;

    if (isActive) {
      // At desk, working. Sit on chair, hands slightly up (typing).
      g.position.x = MathUtils.damp(g.position.x, deskPosition[0], 4, delta);
      g.position.z = MathUtils.damp(
        g.position.z,
        deskPosition[2] + Math.cos(facing) * seatOffsetZ,
        4,
        delta,
      );
      g.position.y = MathUtils.damp(g.position.y, seatOffsetY, 4, delta);
      g.rotation.y = MathUtils.damp(g.rotation.y, facing, 4, delta);

      // subtle typing breath
      if (body.current) {
        body.current.position.y = 0.02 * Math.sin(t * 2);
        body.current.rotation.z = 0;
      }
      // typing arms — small movement
      if (leftArm.current)
        leftArm.current.rotation.x = -1.1 + Math.sin(t * 5) * 0.12;
      if (rightArm.current)
        rightArm.current.rotation.x = -1.1 + Math.sin(t * 5 + 0.8) * 0.12;
      // legs tucked (idle sitting)
      if (leftLeg.current) leftLeg.current.rotation.x = -0.15;
      if (rightLeg.current) rightLeg.current.rotation.x = -0.15;
      // head small movement looking at screen
      if (head.current)
        head.current.rotation.y = Math.sin(t * 0.6) * 0.08;
    } else {
      // Wandering / chilling in open area
      const speed = 0.18;
      const angle = t * speed + h;
      const wr = 1.2;
      const targetX = wanderCenter[0] + Math.cos(angle) * wr;
      const targetZ = wanderCenter[1] + Math.sin(angle) * wr;
      g.position.x = MathUtils.damp(g.position.x, targetX, 2, delta);
      g.position.z = MathUtils.damp(g.position.z, targetZ, 2, delta);
      g.position.y = MathUtils.damp(g.position.y, 0, 3, delta);

      const dx = targetX - g.position.x;
      const dz = targetZ - g.position.z;
      const mag = Math.hypot(dx, dz);
      if (mag > 0.01) {
        const targetRot = Math.atan2(dx, dz);
        g.rotation.y = MathUtils.damp(g.rotation.y, targetRot, 3, delta);
      }

      // walking animation
      if (body.current) {
        body.current.position.y = Math.abs(Math.sin(t * 4)) * 0.06;
        body.current.rotation.z = Math.sin(t * 4) * 0.04;
      }
      const swing = Math.sin(t * 4) * 0.6;
      if (leftArm.current) leftArm.current.rotation.x = swing;
      if (rightArm.current) rightArm.current.rotation.x = -swing;
      if (leftLeg.current) leftLeg.current.rotation.x = -swing * 0.9;
      if (rightLeg.current) rightLeg.current.rotation.x = swing * 0.9;
      if (head.current) head.current.rotation.y = Math.sin(t * 0.5) * 0.2;
    }

    // subtle blink
    const blink = Math.sin(t * 2.3 + h) > 0.985 ? 0.05 : 1;
    if (leftEye.current) leftEye.current.scale.y = blink;
    if (rightEye.current) rightEye.current.scale.y = blink;
  });

  return (
    <group
      ref={group}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <group ref={body}>
        {/* torso */}
        <mesh castShadow position={[0, 0.75, 0]}>
          <capsuleGeometry args={[0.3, 0.55, 4, 14]} />
          <meshStandardMaterial color={shirt} roughness={0.6} />
        </mesh>
        {/* neck + head */}
        <group ref={head} position={[0, 1.35, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.24, 22, 18]} />
            <meshStandardMaterial color={skin} roughness={0.9} />
          </mesh>
          {/* hair cap */}
          <mesh position={[0, 0.08, 0]} castShadow>
            <sphereGeometry args={[0.245, 22, 18, 0, Math.PI * 2, 0, Math.PI / 2.1]} />
            <meshStandardMaterial color="#1a1a1f" roughness={0.85} />
          </mesh>
          {/* eyes */}
          <mesh ref={leftEye} position={[-0.08, 0.02, 0.22]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color="#0a0a0f" />
          </mesh>
          <mesh ref={rightEye} position={[0.08, 0.02, 0.22]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color="#0a0a0f" />
          </mesh>
          {/* smile */}
          <mesh position={[0, -0.08, 0.21]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.05, 0.012, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#5a1e1e" />
          </mesh>
        </group>

        {/* arms */}
        <group ref={leftArm} position={[-0.34, 1.15, 0]}>
          <mesh castShadow position={[0, -0.3, 0]}>
            <capsuleGeometry args={[0.09, 0.5, 4, 10]} />
            <meshStandardMaterial color={shirt} roughness={0.7} />
          </mesh>
          <mesh castShadow position={[0, -0.62, 0]}>
            <sphereGeometry args={[0.09, 12, 12]} />
            <meshStandardMaterial color={skin} roughness={0.9} />
          </mesh>
        </group>
        <group ref={rightArm} position={[0.34, 1.15, 0]}>
          <mesh castShadow position={[0, -0.3, 0]}>
            <capsuleGeometry args={[0.09, 0.5, 4, 10]} />
            <meshStandardMaterial color={shirt} roughness={0.7} />
          </mesh>
          <mesh castShadow position={[0, -0.62, 0]}>
            <sphereGeometry args={[0.09, 12, 12]} />
            <meshStandardMaterial color={skin} roughness={0.9} />
          </mesh>
        </group>

        {/* legs */}
        <group ref={leftLeg} position={[-0.14, 0.4, 0]}>
          <mesh castShadow position={[0, -0.3, 0]}>
            <capsuleGeometry args={[0.12, 0.55, 4, 10]} />
            <meshStandardMaterial color={pants} roughness={0.7} />
          </mesh>
          <mesh castShadow position={[0, -0.64, 0.04]}>
            <boxGeometry args={[0.16, 0.08, 0.22]} />
            <meshStandardMaterial color="#111217" roughness={0.8} />
          </mesh>
        </group>
        <group ref={rightLeg} position={[0.14, 0.4, 0]}>
          <mesh castShadow position={[0, -0.3, 0]}>
            <capsuleGeometry args={[0.12, 0.55, 4, 10]} />
            <meshStandardMaterial color={pants} roughness={0.7} />
          </mesh>
          <mesh castShadow position={[0, -0.64, 0.04]}>
            <boxGeometry args={[0.16, 0.08, 0.22]} />
            <meshStandardMaterial color="#111217" roughness={0.8} />
          </mesh>
        </group>
      </group>

      {/* name label */}
      <Html center position={[0, 2.15, 0]} distanceFactor={11} zIndexRange={[10, 0]}>
        <div
          className="pointer-events-none select-none flex flex-col items-center gap-0.5"
          style={{ transition: "transform 150ms ease", transform: selected ? "scale(1.1)" : "scale(1)" }}
        >
          <span
            className="text-[11px] font-medium tracking-[0.03em] rounded-full px-2 py-0.5"
            style={{
              background: selected ? "rgba(224,168,70,0.2)" : "rgba(8,10,14,0.7)",
              color: selected ? "#f2b95e" : "#e6e8ec",
              border: `1px solid ${selected ? "rgba(224,168,70,0.55)" : "rgba(255,255,255,0.1)"}`,
              backdropFilter: "blur(6px)",
              whiteSpace: "nowrap",
            }}
          >
            {agent.name}
          </span>
          <span
            className="text-[9px] uppercase tracking-[0.12em]"
            style={{ color: isActive ? "#3fb77a" : "#8a8f96" }}
          >
            {isActive ? "● en su estación" : "○ chillin"}
          </span>
        </div>
      </Html>

      {selected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.72, 48]} />
          <meshBasicMaterial color="#e0a846" transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  );
}
