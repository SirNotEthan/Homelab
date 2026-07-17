"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, Color, MathUtils } from "three";
import { useMemo, useRef } from "react";
import type { Points, Group, Mesh } from "three";

type StewardCoreProps = {
  detail?: boolean;
};

const cyan = new Color("#4dd9e8");
const teal = new Color("#2dd4bf");
const white = new Color("#dffcff");

function ParticleCloud({ count = 900 }: { count?: number }) {
  const points = useRef<Points>(null);
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      const radius = MathUtils.randFloat(0.35, 3.7) ** 1.15;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(MathUtils.randFloatSpread(2));
      const flatten = MathUtils.randFloat(0.58, 1.08);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi) * flatten;
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      const mixed = cyan.clone().lerp(Math.random() > 0.48 ? teal : white, Math.random() * 0.8);
      colors[i * 3] = mixed.r;
      colors[i * 3 + 1] = mixed.g;
      colors[i * 3 + 2] = mixed.b;
    }

    return { positions, colors };
  }, [count]);

  useFrame(({ clock }) => {
    if (!points.current) return;
    points.current.rotation.y = clock.elapsedTime * 0.035;
    points.current.rotation.z = Math.sin(clock.elapsedTime * 0.13) * 0.045;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[geometry.positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[geometry.colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.028}
        vertexColors
        transparent
        opacity={0.78}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}

function OrbitRing({
  radius,
  rotation,
  color = "#4dd9e8",
  speed = 0.08
}: {
  radius: number;
  rotation: [number, number, number];
  color?: string;
  speed?: number;
}) {
  const mesh = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    mesh.current.rotation.z = rotation[2] + clock.elapsedTime * speed;
  });

  return (
    <mesh ref={mesh} rotation={rotation}>
      <torusGeometry args={[radius, 0.006, 12, 192]} />
      <meshBasicMaterial color={color} transparent opacity={0.35} blending={AdditiveBlending} />
    </mesh>
  );
}

function KnowledgeNodes() {
  const group = useRef<Group>(null);
  const nodes = [
    ["Memory", -1.05, 0.34, 0.45, 0.14, "#dffcff"],
    ["Reasoning", 1.05, -0.38, 0.72, 0.13, "#4dd9e8"],
    ["Skills", -1.6, -0.42, -0.2, 0.11, "#bffbff"],
    ["Tools", -2.15, 0.1, 0.35, 0.1, "#2dd4bf"],
    ["Kubernetes", 1.7, 1.0, -0.35, 0.1, "#2dd4bf"],
    ["GitOps", 2.8, 0.32, -0.7, 0.09, "#4dd9e8"],
    ["Monitoring", 1.35, -1.1, 0.2, 0.1, "#4dd9e8"],
    ["Search", -2.6, -0.92, -0.55, 0.08, "#2dd4bf"],
    ["Home Automation", -2.7, 1.0, -0.8, 0.08, "#2dd4bf"]
  ] as const;

  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.rotation.y = Math.sin(clock.elapsedTime * 0.12) * 0.09;
  });

  return (
    <group ref={group}>
      {nodes.map(([name, x, y, z, size, color]) => (
        <group key={name} position={[x, y, z]}>
          <mesh>
            <sphereGeometry args={[size, 32, 32]} />
            <meshBasicMaterial color={color} transparent opacity={0.9} />
          </mesh>
          <mesh scale={1.75}>
            <sphereGeometry args={[size, 32, 32]} />
            <meshBasicMaterial color={color} transparent opacity={0.12} blending={AdditiveBlending} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function ActiveReasoningTrail() {
  const group = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.rotation.z = Math.sin(clock.elapsedTime * 0.3) * 0.04;
  });

  return (
    <group ref={group} rotation={[0.2, -0.2, -0.18]}>
      <OrbitRing radius={1.55} rotation={[1.25, 0.35, 0.2]} color="#dffcff" speed={0.42} />
      <OrbitRing radius={1.58} rotation={[1.25, 0.35, 0.8]} color="#4dd9e8" speed={0.38} />
      <mesh position={[1.35, -0.55, 0.28]}>
        <sphereGeometry args={[0.06, 24, 24]} />
        <meshBasicMaterial color="#dffcff" transparent opacity={0.95} blending={AdditiveBlending} />
      </mesh>
    </group>
  );
}

function CoreScene({ detail = false }: StewardCoreProps) {
  const group = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.rotation.y = clock.elapsedTime * 0.055;
    group.current.rotation.x = Math.sin(clock.elapsedTime * 0.18) * 0.05;
  });

  return (
    <>
      <color attach="background" args={["#031018"]} />
      <ambientLight intensity={0.25} />
      <pointLight position={[0, 0, 4]} intensity={16} color="#bffbff" />
      <pointLight position={[4, 2, 2]} intensity={4} color="#2dd4bf" />
      <group ref={group} scale={detail ? 1.22 : 1}>
        <ParticleCloud count={detail ? 1300 : 900} />
        <mesh>
          <sphereGeometry args={[0.54, 64, 64]} />
          <meshBasicMaterial color="#dffcff" transparent opacity={0.92} blending={AdditiveBlending} />
        </mesh>
        <mesh scale={1.72}>
          <sphereGeometry args={[0.54, 64, 64]} />
          <meshBasicMaterial color="#4dd9e8" transparent opacity={0.11} blending={AdditiveBlending} />
        </mesh>
        <OrbitRing radius={1.05} rotation={[1.35, 0.1, 0.1]} speed={0.18} />
        <OrbitRing radius={1.62} rotation={[0.95, 0.85, 0.7]} color="#2dd4bf" speed={-0.11} />
        <OrbitRing radius={2.12} rotation={[1.4, -0.45, 1.8]} speed={0.07} />
        <OrbitRing radius={2.74} rotation={[1.15, 0.28, -0.6]} color="#2dd4bf" speed={-0.045} />
        <KnowledgeNodes />
        <ActiveReasoningTrail />
      </group>
    </>
  );
}

export default function StewardCore({ detail = false }: StewardCoreProps) {
  return (
    <Canvas camera={{ position: [0, 0, detail ? 6.2 : 6.8], fov: 48 }} dpr={[1, 1.75]}>
      <CoreScene detail={detail} />
    </Canvas>
  );
}
