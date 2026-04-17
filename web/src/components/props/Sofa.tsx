"use client";
type Props = {
  position: [number, number, number];
  rotation?: number;
  color?: string;
};

export default function Sofa({ position, rotation = 0, color = "#4a5764" }: Props) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* base */}
      <mesh castShadow position={[0, 0.25, 0]}>
        <boxGeometry args={[2.2, 0.35, 0.9]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      {/* seat cushions */}
      {[-0.6, 0, 0.6].map((x) => (
        <mesh key={x} castShadow position={[x, 0.48, 0.02]}>
          <boxGeometry args={[0.6, 0.22, 0.8]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      ))}
      {/* back */}
      <mesh castShadow position={[0, 0.8, -0.32]}>
        <boxGeometry args={[2.2, 0.7, 0.28]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      {/* arms */}
      <mesh castShadow position={[-1.05, 0.55, 0]}>
        <boxGeometry args={[0.22, 0.6, 0.9]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh castShadow position={[1.05, 0.55, 0]}>
        <boxGeometry args={[0.22, 0.6, 0.9]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      {/* throw pillow */}
      <mesh castShadow position={[-0.75, 0.65, 0.05]} rotation={[0, 0.3, 0.1]}>
        <boxGeometry args={[0.36, 0.36, 0.16]} />
        <meshStandardMaterial color="#d97a56" roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0.78, 0.66, 0.0]} rotation={[0, -0.2, -0.05]}>
        <boxGeometry args={[0.32, 0.32, 0.14]} />
        <meshStandardMaterial color="#e0a846" roughness={0.8} />
      </mesh>
    </group>
  );
}
