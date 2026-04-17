"use client";
type Props = {
  position: [number, number, number];
  scale?: number;
  tall?: boolean;
};

export default function Plant({ position, scale = 1, tall = false }: Props) {
  return (
    <group position={position} scale={scale}>
      {/* pot */}
      <mesh castShadow position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.3, 0.36, 0.6, 16]} />
        <meshStandardMaterial color="#3a2b20" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.32, 0.3, 0.05, 16]} />
        <meshStandardMaterial color="#2a1e15" roughness={0.9} />
      </mesh>
      {/* foliage */}
      {tall ? (
        <>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh
              key={i}
              position={[
                Math.cos(i * 1.2) * 0.15,
                0.8 + i * 0.35,
                Math.sin(i * 1.2) * 0.15,
              ]}
              castShadow
            >
              <coneGeometry args={[0.35 - i * 0.04, 0.7, 6]} />
              <meshStandardMaterial color={`hsl(${120 + i * 8}, 35%, ${28 + i * 3}%)`} roughness={0.8} />
            </mesh>
          ))}
        </>
      ) : (
        <>
          <mesh position={[0, 0.95, 0]} castShadow>
            <sphereGeometry args={[0.55, 14, 12]} />
            <meshStandardMaterial color="#2e5c3a" roughness={0.85} flatShading />
          </mesh>
          <mesh position={[0.3, 1.1, 0.15]} castShadow>
            <sphereGeometry args={[0.4, 12, 10]} />
            <meshStandardMaterial color="#37734a" roughness={0.85} flatShading />
          </mesh>
          <mesh position={[-0.25, 1.15, -0.1]} castShadow>
            <sphereGeometry args={[0.35, 12, 10]} />
            <meshStandardMaterial color="#31653f" roughness={0.85} flatShading />
          </mesh>
        </>
      )}
    </group>
  );
}
