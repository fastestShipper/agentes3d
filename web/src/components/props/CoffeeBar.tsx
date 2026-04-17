"use client";
type Props = { position: [number, number, number]; rotation?: number };

export default function CoffeeBar({ position, rotation = 0 }: Props) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* counter */}
      <mesh castShadow position={[0, 0.45, 0]}>
        <boxGeometry args={[2.4, 0.9, 0.7]} />
        <meshStandardMaterial color="#2a211a" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.91, 0]}>
        <boxGeometry args={[2.42, 0.04, 0.72]} />
        <meshStandardMaterial color="#d0bf95" roughness={0.4} metalness={0.1} />
      </mesh>
      {/* coffee machine */}
      <mesh castShadow position={[-0.7, 1.15, -0.1]}>
        <boxGeometry args={[0.5, 0.45, 0.4]} />
        <meshStandardMaterial color="#0f1218" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[-0.7, 1.08, 0.11]}>
        <boxGeometry args={[0.2, 0.06, 0.04]} />
        <meshStandardMaterial color="#e0a846" emissive="#e0a846" emissiveIntensity={0.8} />
      </mesh>
      {/* cups */}
      {[-0.1, 0.1, 0.3].map((x, i) => (
        <mesh key={i} castShadow position={[x, 1.0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.12, 14]} />
          <meshStandardMaterial color={i === 1 ? "#d97a56" : "#f3efe6"} roughness={0.6} />
        </mesh>
      ))}
      {/* jar of snacks */}
      <mesh castShadow position={[0.8, 1.05, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.22, 16]} />
        <meshStandardMaterial color="#eaeae5" transparent opacity={0.4} roughness={0.2} />
      </mesh>
    </group>
  );
}
