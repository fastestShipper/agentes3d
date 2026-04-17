"use client";
type Props = {
  position: [number, number, number];
  color?: string;
  intensity?: number;
};

export default function HangingLamp({ position, color = "#f5b76a", intensity = 1.8 }: Props) {
  return (
    <group position={position}>
      {/* cord */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 2.4, 6]} />
        <meshStandardMaterial color="#1a1d24" />
      </mesh>
      {/* shade */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.42, 0.38, 24, 1, true]} />
        <meshStandardMaterial color="#1a1815" side={2} roughness={0.9} />
      </mesh>
      {/* bulb glow */}
      <mesh position={[0, -0.1, 0]}>
        <sphereGeometry args={[0.18, 16, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
      <pointLight position={[0, -0.05, 0]} color={color} intensity={intensity} distance={6} decay={1.4} castShadow />
    </group>
  );
}
