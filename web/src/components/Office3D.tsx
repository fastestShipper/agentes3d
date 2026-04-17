"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment } from "@react-three/drei";
import { useMemo } from "react";
import Character from "./Character";
import Desk from "./Desk";
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

export default function Office3D({ agents, selectedId, onSelect }: Props) {
  const desks = useMemo(() => {
    // Row of desks behind, facing camera
    const n = Math.max(agents.length, 1);
    const spacing = 2.2;
    const totalWidth = (n - 1) * spacing;
    return agents.map((a, i) => {
      const x = -totalWidth / 2 + i * spacing;
      const z = -3.5;
      return {
        agent: a,
        deskPos: [x, 0, z] as [number, number, number],
        facing: Math.PI, // looking toward -z (back)
      };
    });
  }, [agents]);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 5.5, 9], fov: 44 }}
      onPointerMissed={() => onSelect(null)}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#06070a"]} />
      <fog attach="fog" args={["#06070a", 18, 48]} />

      {/* warm key light */}
      <directionalLight
        position={[6, 10, 4]}
        intensity={1.05}
        color="#f6dcb1"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
      <directionalLight position={[-8, 6, -4]} intensity={0.35} color="#6ea3cc" />
      <ambientLight intensity={0.32} />

      {/* back wall */}
      <mesh position={[0, 3.5, -7]} receiveShadow>
        <planeGeometry args={[40, 10]} />
        <meshStandardMaterial color="#0b0e13" roughness={1} />
      </mesh>
      {/* window strip with warm backlight */}
      <mesh position={[0, 4.2, -6.98]}>
        <planeGeometry args={[14, 1.2]} />
        <meshStandardMaterial
          color="#1a1f28"
          emissive="#e5a768"
          emissiveIntensity={0.6}
          toneMapped={false}
        />
      </mesh>

      {/* floor */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#0d1016" roughness={0.95} />
      </mesh>
      {/* rug in common area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 3]} receiveShadow>
        <circleGeometry args={[3.2, 48]} />
        <meshStandardMaterial color="#1b1a1f" roughness={1} />
      </mesh>
      {/* subtle grid */}
      <gridHelper args={[40, 40, "#1a1d24", "#10121a"]} position={[0, 0.01, 0]} />

      <ContactShadows
        position={[0, 0.02, 0]}
        opacity={0.55}
        scale={30}
        blur={2.8}
        far={12}
        resolution={512}
      />

      {/* decorative plant */}
      <group position={[-6, 0, 1.5]}>
        <mesh castShadow position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.3, 0.35, 0.5, 16]} />
          <meshStandardMaterial color="#39342a" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[0, 0.95, 0]}>
          <sphereGeometry args={[0.55, 12, 10]} />
          <meshStandardMaterial color="#2e5c3a" roughness={0.85} />
        </mesh>
        <mesh castShadow position={[0.25, 1.2, 0.1]}>
          <sphereGeometry args={[0.4, 12, 10]} />
          <meshStandardMaterial color="#37734a" roughness={0.85} />
        </mesh>
      </group>
      <group position={[6.2, 0, 1.3]}>
        <mesh castShadow position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.3, 0.36, 0.6, 16]} />
          <meshStandardMaterial color="#37352b" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[0, 1.1, 0]}>
          <sphereGeometry args={[0.62, 12, 10]} />
          <meshStandardMaterial color="#2f5e3c" roughness={0.85} />
        </mesh>
      </group>

      {/* coffee table in common area */}
      <group position={[0, 0, 3]}>
        <mesh castShadow position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.7, 0.7, 0.06, 24]} />
          <meshStandardMaterial color="#201a12" roughness={0.7} metalness={0.1} />
        </mesh>
        <mesh castShadow position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.3, 12]} />
          <meshStandardMaterial color="#0d1016" />
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
            selected={selectedId === agent.id}
            onSelect={() => onSelect(agent.id)}
          />
        </group>
      ))}

      <OrbitControls
        makeDefault
        minDistance={5}
        maxDistance={22}
        maxPolarAngle={Math.PI / 2.05}
        minPolarAngle={Math.PI / 7}
        enablePan={false}
        target={[0, 1, 0]}
      />
    </Canvas>
  );
}
