"use client";
type Props = {
  position: [number, number, number];
  rotation?: number;
};

export default function Whiteboard({ position, rotation = 0 }: Props) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* frame */}
      <mesh castShadow position={[0, 1.5, 0]}>
        <boxGeometry args={[3.2, 1.8, 0.08]} />
        <meshStandardMaterial color="#151820" roughness={0.6} />
      </mesh>
      {/* writing surface */}
      <mesh position={[0, 1.5, 0.045]}>
        <planeGeometry args={[3.0, 1.65]} />
        <meshStandardMaterial color="#f3efe6" roughness={0.8} />
      </mesh>
      {/* fake notes */}
      <mesh position={[-1.0, 1.9, 0.05]}>
        <planeGeometry args={[1.2, 0.03]} />
        <meshBasicMaterial color="#d65a5a" />
      </mesh>
      <mesh position={[-0.95, 1.8, 0.05]}>
        <planeGeometry args={[1.1, 0.03]} />
        <meshBasicMaterial color="#1a1d24" />
      </mesh>
      <mesh position={[-0.9, 1.7, 0.05]}>
        <planeGeometry args={[0.9, 0.03]} />
        <meshBasicMaterial color="#1a1d24" />
      </mesh>
      <mesh position={[0.8, 1.75, 0.05]}>
        <planeGeometry args={[1.1, 0.03]} />
        <meshBasicMaterial color="#3fb77a" />
      </mesh>
      <mesh position={[0.85, 1.65, 0.05]}>
        <planeGeometry args={[0.95, 0.03]} />
        <meshBasicMaterial color="#1a1d24" />
      </mesh>
      {/* sticky notes */}
      <mesh position={[1.2, 2.2, 0.06]} rotation={[0, 0, 0.1]}>
        <planeGeometry args={[0.3, 0.3]} />
        <meshBasicMaterial color="#f2d479" />
      </mesh>
      <mesh position={[-1.3, 2.2, 0.06]} rotation={[0, 0, -0.08]}>
        <planeGeometry args={[0.3, 0.3]} />
        <meshBasicMaterial color="#f29ea5" />
      </mesh>
      {/* tray */}
      <mesh castShadow position={[0, 0.58, 0.1]}>
        <boxGeometry args={[3.0, 0.05, 0.15]} />
        <meshStandardMaterial color="#151820" />
      </mesh>
    </group>
  );
}
