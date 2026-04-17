"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, SMAA } from "@react-three/postprocessing";
import { ACESFilmicToneMapping } from "three";
import { useMemo } from "react";
import Character from "./Character";
import Desk from "./Desk";
import Plant from "./props/Plant";
import HangingLamp from "./props/Lamp";
import Sofa from "./props/Sofa";
import Whiteboard from "./props/Whiteboard";
import CoffeeBar from "./props/CoffeeBar";
import type { Agent } from "@/lib/types";

type Props = {
  agents: Agent[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

const accentFor = (id: string) => {
  const palette = ["#e0a846", "#7aa7ce", "#c78fb3", "#7fc59a", "#d97a56", "#9786d6", "#d5c873", "#5bb3a5"];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length];
};

// wander zones: [x, z] — lounge center, near plants, coffee bar, whiteboard
const WANDER_ZONES: [number, number][] = [
  [0, 4.2],      // lounge front
  [-4.5, 2.5],   // plants left
  [4.5, 2.2],    // coffee bar
  [0, 1.5],      // middle
  [-3, 5],       // sofa left
  [3, 5],        // sofa right
];

export default function Office3D({ agents, selectedId, onSelect }: Props) {
  const desks = useMemo(() => {
    const n = Math.max(agents.length, 1);
    const spacing = 2.3;
    const totalWidth = (n - 1) * spacing;
    return agents.map((a, i) => {
      const x = -totalWidth / 2 + i * spacing;
      const z = -3.8;
      return { agent: a, deskPos: [x, 0, z] as [number, number, number], facing: 0 };
    });
  }, [agents]);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 5.5, 10], fov: 42 }}
      onPointerMissed={() => onSelect(null)}
      gl={{ antialias: true, toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#0a0b10"]} />
      <fog attach="fog" args={["#0a0b10", 22, 55]} />

      {/* key warm light */}
      <directionalLight
        position={[6, 10, 6]}
        intensity={0.9}
        color="#f6dcb1"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      {/* cool fill */}
      <directionalLight position={[-8, 6, -4]} intensity={0.35} color="#7fb0d5" />
      <ambientLight intensity={0.28} />

      {/* back wall */}
      <mesh position={[0, 4, -7.5]} receiveShadow>
        <planeGeometry args={[30, 10]} />
        <meshStandardMaterial color="#10131a" roughness={1} />
      </mesh>
      {/* large window behind desks with sunset light */}
      <mesh position={[-6, 3.8, -7.48]}>
        <planeGeometry args={[5, 2.6]} />
        <meshStandardMaterial
          color="#1f2530"
          emissive="#f0a55a"
          emissiveIntensity={0.7}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[-6, 3.8, -7.48]}>
        <planeGeometry args={[5, 2.6]} />
        <meshBasicMaterial color="#000" transparent opacity={0} wireframe />
      </mesh>
      {/* window frame */}
      {[-2.5, 0, 2.5].map((x) => (
        <mesh key={x} position={[-6 + x, 3.8, -7.45]}>
          <boxGeometry args={[0.05, 2.6, 0.02]} />
          <meshStandardMaterial color="#0b0d12" />
        </mesh>
      ))}
      <mesh position={[-6, 2.5, -7.45]}>
        <boxGeometry args={[5.05, 0.05, 0.02]} />
        <meshStandardMaterial color="#0b0d12" />
      </mesh>
      <mesh position={[-6, 5.1, -7.45]}>
        <boxGeometry args={[5.05, 0.05, 0.02]} />
        <meshStandardMaterial color="#0b0d12" />
      </mesh>

      {/* right side wall */}
      <mesh position={[9.5, 4, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[18, 10]} />
        <meshStandardMaterial color="#13161d" roughness={1} />
      </mesh>
      {/* left side wall */}
      <mesh position={[-9.5, 4, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[18, 10]} />
        <meshStandardMaterial color="#13161d" roughness={1} />
      </mesh>

      {/* wood floor with plank strips */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#1a1410" roughness={0.9} />
      </mesh>
      {Array.from({ length: 24 }).map((_, i) => (
        <mesh
          key={`plank-${i}`}
          receiveShadow
          position={[-12 + i * 1.05, 0.005, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[1.0, 40]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#20180f" : "#1c150c"} roughness={0.95} />
        </mesh>
      ))}

      {/* rug in lounge */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 4.5]} receiveShadow>
        <circleGeometry args={[3.5, 64]} />
        <meshStandardMaterial color="#2a1f24" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 4.5]} receiveShadow>
        <ringGeometry args={[3.0, 3.15, 64]} />
        <meshStandardMaterial color="#d97a56" roughness={0.9} />
      </mesh>

      <ContactShadows position={[0, 0.02, 0]} opacity={0.55} scale={35} blur={3} far={12} resolution={1024} />

      {/* hanging lamps over desks */}
      {desks.map((d, i) => (
        <HangingLamp
          key={`lamp-${i}`}
          position={[d.deskPos[0], 4.3, d.deskPos[2] + 0.4]}
          color="#f5b76a"
          intensity={1.4}
        />
      ))}

      {/* lounge lamp */}
      <HangingLamp position={[0, 4.3, 4.2]} color="#ffb87c" intensity={1.2} />

      {/* props */}
      <Plant position={[-8.3, 0, 3.8]} scale={1.1} tall />
      <Plant position={[8.3, 0, 3.5]} scale={1.2} tall />
      <Plant position={[-7.5, 0, -5]} scale={0.9} />
      <Plant position={[7.5, 0, -5]} scale={1} />

      {/* lounge sofas */}
      <Sofa position={[-3.2, 0, 5.5]} rotation={0.3} color="#4a5764" />
      <Sofa position={[3.2, 0, 5.5]} rotation={-0.3} color="#5a4a58" />

      {/* coffee bar on right */}
      <CoffeeBar position={[7.3, 0, -0.2]} rotation={-Math.PI / 2} />

      {/* whiteboard on left */}
      <Whiteboard position={[-8.9, 0, 0]} rotation={Math.PI / 2} />

      {/* coffee table in lounge center */}
      <group position={[0, 0, 4.7]}>
        <mesh castShadow position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.75, 0.75, 0.06, 32]} />
          <meshStandardMaterial color="#2a1b10" roughness={0.5} metalness={0.15} />
        </mesh>
        <mesh castShadow position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.3, 12]} />
          <meshStandardMaterial color="#0d1016" />
        </mesh>
        {/* magazine on table */}
        <mesh position={[-0.2, 0.335, 0.2]}>
          <boxGeometry args={[0.35, 0.02, 0.45]} />
          <meshStandardMaterial color="#e0a846" roughness={0.4} />
        </mesh>
        <mesh position={[0.25, 0.335, -0.05]}>
          <cylinderGeometry args={[0.06, 0.06, 0.08, 16]} />
          <meshStandardMaterial color="#f3efe6" />
        </mesh>
      </group>

      {/* desks + characters */}
      {desks.map(({ agent, deskPos, facing }) => (
        <group key={agent.id}>
          <Desk position={deskPos} rotation={facing + Math.PI} accentColor={accentFor(agent.id)} />
          <Character
            agent={agent}
            deskPosition={deskPos}
            facing={facing}
            wanderZones={WANDER_ZONES}
            selected={selectedId === agent.id}
            onSelect={() => onSelect(agent.id)}
          />
        </group>
      ))}

      <OrbitControls
        makeDefault
        minDistance={6}
        maxDistance={24}
        maxPolarAngle={Math.PI / 2.05}
        minPolarAngle={Math.PI / 7}
        enablePan={false}
        target={[0, 1, 0]}
      />

      <EffectComposer multisampling={0} enableNormalPass={false}>
        <SMAA />
        <Bloom intensity={0.7} luminanceThreshold={0.75} luminanceSmoothing={0.22} mipmapBlur />
        <Vignette offset={0.25} darkness={0.65} />
      </EffectComposer>
    </Canvas>
  );
}
