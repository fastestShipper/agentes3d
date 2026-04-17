"use client";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Group, Mesh, Material } from "three";
import { MathUtils } from "three";
import type { Agent } from "@/lib/types";

type Props = {
  agent: Agent;
  deskPosition: [number, number, number];
  facing: number;
  wanderZones: [number, number][];
  selected: boolean;
  onSelect: () => void;
};

const skinTones = ["#f3c9a6", "#e5b18c", "#c9906e", "#a57051", "#825c3f"];
const hairTones = ["#1a1512", "#3a2a1f", "#8b6b3f", "#5c3a22", "#c39a63"];
const shirtPalette = [
  "#e0a846", "#7aa7ce", "#c78fb3", "#7fc59a",
  "#d97a56", "#9786d6", "#d5c873", "#5bb3a5", "#f06b6b",
];

const hash = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const activityFor = (agent: Agent, wanderIdx: number): string => {
  if (agent.status !== "active") {
    return ["☕ descansando", "🚶 paseando", "💭 pensando", "🪴 mirando plantas"][wanderIdx % 4];
  }
  const id = agent.id.toLowerCase();
  if (id.includes("carlitos")) return "🔍 investigando";
  if (id.includes("ainstein")) return "📊 analizando";
  if (id.includes("tcher") || id.includes("t-cher")) return "📚 preparando clase";
  if (id.includes("hermes")) return "🎯 orquestando";
  return "💻 trabajando";
};

export default function Character({
  agent,
  deskPosition,
  facing,
  wanderZones,
  selected,
  onSelect,
}: Props) {
  const group = useRef<Group>(null);
  const body = useRef<Group>(null);
  const torso = useRef<Mesh>(null);
  const head = useRef<Group>(null);
  const leftArm = useRef<Group>(null);
  const rightArm = useRef<Group>(null);
  const leftLeg = useRef<Group>(null);
  const rightLeg = useRef<Group>(null);
  const leftEye = useRef<Mesh>(null);
  const rightEye = useRef<Mesh>(null);
  const ring = useRef<Mesh>(null);
  const wanderIdxRef = useRef(0);

  const h = useMemo(() => hash(agent.id), [agent.id]);
  const shirt = agent.avatar_color ?? shirtPalette[h % shirtPalette.length];
  const skin = skinTones[(h >> 3) % skinTones.length];
  const hair = hairTones[(h >> 5) % hairTones.length];
  const pants = "#1a1f28";
  const isActive = agent.status === "active";

  // pick wander target rotation based on hash
  const wanderTarget = useMemo(() => {
    return wanderZones[h % wanderZones.length];
  }, [wanderZones, h]);

  useFrame((_, delta) => {
    if (!group.current) return;
    const t = performance.now() / 1000;
    const g = group.current;

    if (isActive) {
      // Sitting at desk station
      const seatX = deskPosition[0];
      const seatZ = deskPosition[2] + 0.55;
      g.position.x = MathUtils.damp(g.position.x, seatX, 5, delta);
      g.position.z = MathUtils.damp(g.position.z, seatZ, 5, delta);
      g.position.y = MathUtils.damp(g.position.y, 0.48, 5, delta);
      g.rotation.y = MathUtils.damp(g.rotation.y, facing, 5, delta);

      if (body.current) body.current.position.y = 0.03 * Math.sin(t * 2.3);
      // typing subtle arm movement
      if (leftArm.current) leftArm.current.rotation.x = -1.25 + Math.sin(t * 5.5) * 0.15;
      if (rightArm.current) rightArm.current.rotation.x = -1.25 + Math.sin(t * 5.5 + 1) * 0.15;
      if (leftLeg.current) leftLeg.current.rotation.x = -1.3;
      if (rightLeg.current) rightLeg.current.rotation.x = -1.3;
      if (head.current) {
        head.current.rotation.y = Math.sin(t * 0.7 + h) * 0.06;
        head.current.rotation.x = 0.15; // looking at monitor
      }
    } else {
      // Wander: move between zones slowly
      const zone = wanderTarget;
      const targetX = zone[0] + Math.sin(t * 0.2 + h) * 0.8;
      const targetZ = zone[1] + Math.cos(t * 0.25 + h) * 0.6;

      const dx = targetX - g.position.x;
      const dz = targetZ - g.position.z;
      const dist = Math.hypot(dx, dz);

      g.position.x = MathUtils.damp(g.position.x, targetX, 1.3, delta);
      g.position.z = MathUtils.damp(g.position.z, targetZ, 1.3, delta);
      g.position.y = MathUtils.damp(g.position.y, 0, 4, delta);

      if (dist > 0.1) {
        const targetRot = Math.atan2(dx, dz);
        g.rotation.y = MathUtils.damp(g.rotation.y, targetRot, 3, delta);
      }

      const walking = dist > 0.15;
      if (body.current) {
        body.current.position.y = walking ? Math.abs(Math.sin(t * 5)) * 0.06 : 0;
        body.current.rotation.z = walking ? Math.sin(t * 5) * 0.03 : 0;
      }
      const swing = walking ? Math.sin(t * 5) * 0.7 : Math.sin(t * 1.2) * 0.08;
      if (leftArm.current) leftArm.current.rotation.x = swing;
      if (rightArm.current) rightArm.current.rotation.x = -swing;
      if (leftLeg.current) leftLeg.current.rotation.x = -swing;
      if (rightLeg.current) rightLeg.current.rotation.x = swing;
      if (head.current) {
        head.current.rotation.y = Math.sin(t * 0.4 + h) * 0.25;
        head.current.rotation.x = 0;
      }
      wanderIdxRef.current = Math.floor((t / 10 + h) % 4);
    }

    // blink
    const blink = Math.sin(t * 2.1 + h) > 0.985 ? 0.08 : 1;
    if (leftEye.current) leftEye.current.scale.y = blink;
    if (rightEye.current) rightEye.current.scale.y = blink;

    // selection ring pulse
    if (ring.current && selected) {
      ring.current.rotation.z += delta * 0.6;
      const mat = ring.current.material as Material & { opacity: number };
      mat.opacity = 0.55 + Math.sin(t * 3) * 0.2;
    }
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
        {/* torso (chibi: short) */}
        <mesh ref={torso} castShadow position={[0, 0.65, 0]}>
          <capsuleGeometry args={[0.28, 0.38, 6, 16]} />
          <meshStandardMaterial color={shirt} roughness={0.7} />
        </mesh>
        {/* belt */}
        <mesh position={[0, 0.42, 0]}>
          <cylinderGeometry args={[0.24, 0.24, 0.06, 16]} />
          <meshStandardMaterial color="#0e1116" roughness={0.9} />
        </mesh>

        {/* head (chibi: big) */}
        <group ref={head} position={[0, 1.25, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.32, 24, 20]} />
            <meshStandardMaterial color={skin} roughness={0.85} />
          </mesh>
          {/* hair cap with slight overhang */}
          <mesh position={[0, 0.06, 0]} castShadow>
            <sphereGeometry args={[0.33, 24, 20, 0, Math.PI * 2, 0, Math.PI / 1.9]} />
            <meshStandardMaterial color={hair} roughness={0.85} flatShading />
          </mesh>
          {/* front fringe */}
          <mesh position={[0, 0.23, 0.18]} rotation={[0.35, 0, 0]} castShadow>
            <sphereGeometry args={[0.16, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={hair} roughness={0.85} flatShading />
          </mesh>
          {/* eyes */}
          <mesh ref={leftEye} position={[-0.11, -0.02, 0.29]}>
            <sphereGeometry args={[0.035, 10, 10]} />
            <meshStandardMaterial color="#0a0a0f" />
          </mesh>
          <mesh ref={rightEye} position={[0.11, -0.02, 0.29]}>
            <sphereGeometry args={[0.035, 10, 10]} />
            <meshStandardMaterial color="#0a0a0f" />
          </mesh>
          {/* blush */}
          <mesh position={[-0.17, -0.08, 0.27]}>
            <circleGeometry args={[0.035, 12]} />
            <meshBasicMaterial color="#e88a8a" transparent opacity={0.55} />
          </mesh>
          <mesh position={[0.17, -0.08, 0.27]}>
            <circleGeometry args={[0.035, 12]} />
            <meshBasicMaterial color="#e88a8a" transparent opacity={0.55} />
          </mesh>
          {/* smile */}
          <mesh position={[0, -0.11, 0.28]}>
            <torusGeometry args={[0.05, 0.012, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#4a1717" />
          </mesh>
        </group>

        {/* arms */}
        <group ref={leftArm} position={[-0.32, 0.95, 0]}>
          <mesh castShadow position={[0, -0.25, 0]}>
            <capsuleGeometry args={[0.085, 0.4, 6, 12]} />
            <meshStandardMaterial color={shirt} roughness={0.8} />
          </mesh>
          <mesh castShadow position={[0, -0.52, 0]}>
            <sphereGeometry args={[0.09, 14, 12]} />
            <meshStandardMaterial color={skin} roughness={0.9} />
          </mesh>
        </group>
        <group ref={rightArm} position={[0.32, 0.95, 0]}>
          <mesh castShadow position={[0, -0.25, 0]}>
            <capsuleGeometry args={[0.085, 0.4, 6, 12]} />
            <meshStandardMaterial color={shirt} roughness={0.8} />
          </mesh>
          <mesh castShadow position={[0, -0.52, 0]}>
            <sphereGeometry args={[0.09, 14, 12]} />
            <meshStandardMaterial color={skin} roughness={0.9} />
          </mesh>
        </group>

        {/* legs */}
        <group ref={leftLeg} position={[-0.13, 0.35, 0]}>
          <mesh castShadow position={[0, -0.22, 0]}>
            <capsuleGeometry args={[0.11, 0.38, 6, 12]} />
            <meshStandardMaterial color={pants} roughness={0.8} />
          </mesh>
          <mesh castShadow position={[0, -0.48, 0.05]}>
            <boxGeometry args={[0.16, 0.07, 0.22]} />
            <meshStandardMaterial color="#0b0d12" roughness={0.85} />
          </mesh>
        </group>
        <group ref={rightLeg} position={[0.13, 0.35, 0]}>
          <mesh castShadow position={[0, -0.22, 0]}>
            <capsuleGeometry args={[0.11, 0.38, 6, 12]} />
            <meshStandardMaterial color={pants} roughness={0.8} />
          </mesh>
          <mesh castShadow position={[0, -0.48, 0.05]}>
            <boxGeometry args={[0.16, 0.07, 0.22]} />
            <meshStandardMaterial color="#0b0d12" roughness={0.85} />
          </mesh>
        </group>
      </group>

      {/* activity bubble */}
      <Html
        center
        position={[0, 2.2, 0]}
        distanceFactor={10}
        zIndexRange={[20, 0]}
        style={{ pointerEvents: "none" }}
      >
        <div
          className="select-none flex flex-col items-center gap-1"
          style={{ transition: "transform 180ms ease", transform: selected ? "scale(1.15)" : "scale(1)" }}
        >
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
            style={{
              background: selected ? "rgba(224,168,70,0.22)" : "rgba(10,12,18,0.82)",
              color: selected ? "#f2b95e" : "#e6e8ec",
              border: `1px solid ${selected ? "rgba(224,168,70,0.6)" : "rgba(255,255,255,0.12)"}`,
              backdropFilter: "blur(8px)",
              whiteSpace: "nowrap",
              boxShadow: selected ? "0 0 24px -6px rgba(224,168,70,0.55)" : "0 2px 8px rgba(0,0,0,0.35)",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: isActive ? "#3fb77a" : "#8a8f96",
                boxShadow: isActive ? "0 0 8px #3fb77a" : "none",
              }}
            />
            {agent.name}
          </div>
          <div
            className="text-[10px] px-2 py-0.5 rounded-md"
            style={{
              background: "rgba(10,12,18,0.75)",
              color: "#c4c8cf",
              border: "1px solid rgba(255,255,255,0.08)",
              whiteSpace: "nowrap",
            }}
          >
            {activityFor(agent, wanderIdxRef.current)}
          </div>
        </div>
      </Html>

      {selected && (
        <mesh ref={ring} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.78, 64]} />
          <meshBasicMaterial color="#e0a846" transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
}
