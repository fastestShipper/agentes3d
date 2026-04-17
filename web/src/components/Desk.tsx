"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";

type Props = {
  position: [number, number, number];
  rotation?: number;
  accentColor?: string;
};

export default function Desk({ position, rotation = 0, accentColor = "#e0a846" }: Props) {
  const screen = useRef<Mesh>(null);
  useFrame(() => {
    if (!screen.current) return;
    // subtle screen glow flicker
    const t = performance.now() / 1000;
    const mat = screen.current.material as {
      emissiveIntensity?: number;
    };
    if (mat.emissiveIntensity !== undefined) {
      mat.emissiveIntensity = 1.2 + Math.sin(t * 3) * 0.15;
    }
  });

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* desk top */}
      <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[1.4, 0.05, 0.7]} />
        <meshStandardMaterial color="#1a1f27" roughness={0.6} metalness={0.15} />
      </mesh>
      {/* legs */}
      {[[-0.6, -0.28], [0.6, -0.28], [-0.6, 0.28], [0.6, 0.28]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.25, z]} castShadow>
          <boxGeometry args={[0.05, 0.5, 0.05]} />
          <meshStandardMaterial color="#0e1116" roughness={0.8} />
        </mesh>
      ))}
      {/* monitor stand */}
      <mesh position={[0, 0.6, -0.15]} castShadow>
        <boxGeometry args={[0.1, 0.2, 0.1]} />
        <meshStandardMaterial color="#12151a" roughness={0.9} />
      </mesh>
      {/* monitor back */}
      <mesh position={[0, 0.88, -0.18]} castShadow>
        <boxGeometry args={[0.8, 0.5, 0.04]} />
        <meshStandardMaterial color="#0f1218" roughness={0.85} metalness={0.1} />
      </mesh>
      {/* monitor screen */}
      <mesh ref={screen} position={[0, 0.88, -0.16]}>
        <planeGeometry args={[0.74, 0.44]} />
        <meshStandardMaterial
          color="#10141a"
          emissive={accentColor}
          emissiveIntensity={1.2}
          toneMapped={false}
        />
      </mesh>
      {/* keyboard */}
      <mesh position={[0, 0.54, 0.15]} castShadow>
        <boxGeometry args={[0.5, 0.025, 0.16]} />
        <meshStandardMaterial color="#1a1d22" roughness={0.7} />
      </mesh>
      {/* mug */}
      <mesh position={[0.5, 0.57, 0.15]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.12, 16]} />
        <meshStandardMaterial color="#c05a3c" roughness={0.6} />
      </mesh>
      {/* chair */}
      <group position={[0, 0, 0.55]}>
        <mesh castShadow position={[0, 0.28, 0]}>
          <boxGeometry args={[0.5, 0.04, 0.45]} />
          <meshStandardMaterial color="#1e222a" roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0, 0.55, 0.22]}>
          <boxGeometry args={[0.5, 0.54, 0.04]} />
          <meshStandardMaterial color="#1e222a" roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0, 0.14, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.28, 12]} />
          <meshStandardMaterial color="#0e1116" />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.04, 16]} />
          <meshStandardMaterial color="#0e1116" />
        </mesh>
      </group>
    </group>
  );
}
