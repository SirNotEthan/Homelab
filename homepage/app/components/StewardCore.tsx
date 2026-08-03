"use client";

import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html, Line, useCursor } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import {
  AdditiveBlending,
  Color,
  MathUtils,
  QuadraticBezierCurve3,
  Vector3
} from "three";
import { useMemo, useRef, useState } from "react";
import type { Points, Group, Mesh } from "three";
import { palette } from "../theme";
import { STEWARD_PARTICLES, DEFAULT_FOCUS_PARTICLE_ID, type StewardParticle, type ParticleCluster } from "../data/stewardNodes";

const ANCHOR_PARTICLES = STEWARD_PARTICLES.filter((particle) => particle.orbit !== "satellite");
const SATELLITE_PARTICLES = STEWARD_PARTICLES.filter((particle) => particle.orbit === "satellite");

function hashOffset(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) % 1000;
  return hash / 1000;
}

type StewardCoreProps = {
  detail?: boolean;
  selectedId?: string | null;
  onSelectNode?: (id: string | null) => void;
};

const cyanColor = new Color(palette.cyan);
const tealColor = new Color(palette.teal);
const whiteColor = new Color(palette.softCore);
const dimColor = new Color(palette.dimText);

const CLUSTER_HUE: Record<ParticleCluster, Color> = {
  intelligence: cyanColor,
  homelab: cyanColor,
  observability: cyanColor,
  devices: cyanColor,
  homeAutomation: cyanColor,
  memory: tealColor,
  gitops: tealColor,
  security: tealColor
};

function particleColor(particle: StewardParticle): Color {
  const hue = CLUSTER_HUE[particle.cluster] ?? cyanColor;
  return hue.clone().lerp(dimColor, 1 - particle.trust / 100);
}

function particleColorHex(particle: StewardParticle): string {
  return `#${particleColor(particle).getHexString()}`;
}

function ParticleCloud({ count = 550 }: { count?: number }) {
  const points = useRef<Points>(null);
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      const radius = MathUtils.randFloat(0.5, 3.2) ** 1.15;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(MathUtils.randFloatSpread(2));
      const flatten = MathUtils.randFloat(0.58, 1.08);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi) * flatten;
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      // Bias farther particles toward the dim background color so depth
      // reads clearly instead of an even, foggy scatter.
      const depthFalloff = MathUtils.clamp(1 - radius / 3.6, 0.28, 1);
      const mixed = cyanColor.clone().lerp(Math.random() > 0.48 ? tealColor : whiteColor, Math.random() * 0.8);
      mixed.multiplyScalar(depthFalloff);
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
        size={0.024}
        vertexColors
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}

function OrbitRing({
  radius,
  rotation,
  color = palette.cyan,
  speed = 0.08,
  opacity = 0.42
}: {
  radius: number;
  rotation: [number, number, number];
  color?: string;
  speed?: number;
  opacity?: number;
}) {
  const mesh = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    mesh.current.rotation.z = rotation[2] + clock.elapsedTime * speed;
  });

  return (
    <mesh ref={mesh} rotation={rotation}>
      <torusGeometry args={[radius, 0.005, 6, 160]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} blending={AdditiveBlending} />
    </mesh>
  );
}

function EnergyCore({ pulseColor }: { pulseColor: string }) {
  const inner = useRef<Mesh>(null);
  const wire = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (inner.current) {
      const scale = 1 + Math.sin(clock.elapsedTime * 1.4) * 0.035;
      inner.current.scale.setScalar(scale);
    }
    if (wire.current) {
      wire.current.rotation.y = clock.elapsedTime * 0.09;
      wire.current.rotation.x = clock.elapsedTime * 0.05;
    }
  });

  return (
    <>
      <mesh ref={inner}>
        <sphereGeometry args={[0.54, 48, 48]} />
        <meshBasicMaterial color={palette.softCore} transparent opacity={1} blending={AdditiveBlending} />
      </mesh>
      <mesh scale={1.14}>
        <sphereGeometry args={[0.54, 48, 48]} />
        <meshBasicMaterial color={palette.softCore} transparent opacity={0.4} blending={AdditiveBlending} />
      </mesh>
      <mesh scale={1.5}>
        <sphereGeometry args={[0.54, 32, 32]} />
        <meshBasicMaterial color={palette.cyan} transparent opacity={0.13} blending={AdditiveBlending} />
      </mesh>
      <mesh ref={wire} scale={0.82}>
        <icosahedronGeometry args={[0.54, 1]} />
        <meshBasicMaterial color={pulseColor} wireframe transparent opacity={0.4} blending={AdditiveBlending} />
      </mesh>
    </>
  );
}

function ConnectionArcs({
  curves,
  activeId,
  selectedId,
  hoveredId
}: {
  curves: Map<string, QuadraticBezierCurve3>;
  activeId: string;
  selectedId: string | null;
  hoveredId: string | null;
}) {
  return (
    <>
      {ANCHOR_PARTICLES.map((particle) => {
        const curve = curves.get(particle.id);
        if (!curve) return null;
        const points = curve.getPoints(40);
        const isFocused = particle.id === selectedId || particle.id === hoveredId;
        const isActive = particle.id === activeId;

        return (
          <Line
            key={particle.id}
            points={points}
            color={particleColorHex(particle)}
            transparent
            opacity={isFocused ? 0.85 : isActive ? 0.5 : 0.14}
            lineWidth={isFocused ? 1.6 : 1}
          />
        );
      })}
    </>
  );
}

/** Faint always-on threads from each satellite (skill/memory) to its parent
 * anchor - this is what makes the "Skill Lattice" / dense memory cluster
 * read as structure rather than random dots. */
function LatticeLinks() {
  return (
    <>
      {SATELLITE_PARTICLES.map((particle) => {
        if (!particle.parentId) return null;
        const parent = STEWARD_PARTICLES.find((candidate) => candidate.id === particle.parentId);
        if (!parent) return null;
        const points = [new Vector3(...particle.position), new Vector3(...parent.position)];

        return (
          <Line key={particle.id} points={points} color={particleColorHex(particle)} transparent opacity={0.16} lineWidth={1} />
        );
      })}
    </>
  );
}

function DependencyLinks({ selectedId }: { selectedId: string | null }) {
  const selected = useMemo(() => STEWARD_PARTICLES.find((particle) => particle.id === selectedId), [selectedId]);

  if (!selected) return null;

  return (
    <>
      {selected.links.map((link) => {
        const target = STEWARD_PARTICLES.find((particle) => particle.id === link.target);
        if (!target) return null;
        const start = new Vector3(...selected.position);
        const end = new Vector3(...target.position);
        const mid = start.clone().lerp(end, 0.5).multiplyScalar(0.9);
        const points = new QuadraticBezierCurve3(start, mid, end).getPoints(20);

        return (
          <Line key={link.target} points={points} color={palette.softCore} transparent opacity={0.85} lineWidth={2} />
        );
      })}
    </>
  );
}

/** Small pulses travel outward along every link the active particle depends
 * on, so "active reasoning" reads as motion along real edges, not just a
 * single trail to the core. */
function ActiveLinkPulses({ activeId }: { activeId: string }) {
  const active = STEWARD_PARTICLES.find((particle) => particle.id === activeId);
  const heads = useRef<(Group | null)[]>([]);

  const segments = useMemo(() => {
    if (!active) return [];
    return active.links
      .map((link) => STEWARD_PARTICLES.find((particle) => particle.id === link.target))
      .filter((target): target is StewardParticle => Boolean(target))
      .map((target) => {
        const start = new Vector3(...active.position);
        const end = new Vector3(...target.position);
        const mid = start.clone().lerp(end, 0.5).add(new Vector3(0, 0.12, 0));
        return new QuadraticBezierCurve3(start, mid, end);
      });
  }, [active]);

  useFrame(({ clock }) => {
    segments.forEach((curve, index) => {
      const head = heads.current[index];
      if (!head) return;
      const phase = (clock.elapsedTime * 0.5 + index * 0.35) % 1;
      head.position.copy(curve.getPointAt(phase));
    });
  });

  if (!active) return null;

  return (
    <>
      {segments.map((_, index) => (
        <group key={index} ref={(el) => { heads.current[index] = el; }}>
          <mesh>
            <sphereGeometry args={[0.032, 10, 10]} />
            <meshBasicMaterial color={palette.softCore} transparent opacity={0.9} blending={AdditiveBlending} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/** A slow expanding, fading ring from the core - Steward "thinking" even
 * when nothing is selected. */
function ThoughtRipple({ color }: { color: string }) {
  const ring = useRef<Mesh>(null);
  const period = 4.5;

  useFrame(({ clock }) => {
    if (!ring.current) return;
    const t = (clock.elapsedTime % period) / period;
    const scale = MathUtils.lerp(0.6, 3.4, t);
    ring.current.scale.setScalar(scale);
    const material = ring.current.material as import("three").MeshBasicMaterial;
    material.opacity = (1 - t) * 0.3;
  });

  return (
    <mesh ref={ring} rotation={[Math.PI / 2, 0.3, 0]}>
      <torusGeometry args={[0.6, 0.004, 6, 96]} />
      <meshBasicMaterial color={color} transparent opacity={0} blending={AdditiveBlending} />
    </mesh>
  );
}

function ReasoningTrail({ curve, color }: { curve: QuadraticBezierCurve3; color: string }) {
  const head = useRef<Group>(null);
  const trailPoints = useMemo(() => curve.getPoints(24), [curve]);

  useFrame(({ clock }) => {
    if (!head.current) return;
    const t = (Math.sin(clock.elapsedTime * 0.6) + 1) / 2;
    const point = curve.getPointAt(MathUtils.clamp(t, 0, 1));
    head.current.position.copy(point);
  });

  return (
    <>
      <Line points={trailPoints} color={color} transparent opacity={0.62} lineWidth={2.5} />
      <group ref={head}>
        <mesh>
          <sphereGeometry args={[0.05, 14, 14]} />
          <meshBasicMaterial color={color} transparent opacity={1} blending={AdditiveBlending} />
        </mesh>
        <mesh scale={2.2}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshBasicMaterial color={color} transparent opacity={0.35} blending={AdditiveBlending} />
        </mesh>
      </group>
    </>
  );
}

function ParticleMesh({
  particle,
  isSelected,
  isHovered,
  onHover,
  onSelect
}: {
  particle: StewardParticle;
  isSelected: boolean;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  useCursor(isHovered);
  const colorHex = useMemo(() => particleColorHex(particle), [particle]);
  const group = useRef<Group>(null);
  const halo = useRef<Mesh>(null);
  const shimmer = useRef<Mesh>(null);
  const baseOpacity = 0.35 + (particle.activation / 100) * 0.6;
  const pulseSpeed = isSelected ? 0.5 : 0.4 + (particle.energy / 100) * 2.2;
  const flicker = !isSelected && particle.stability < 60;
  const unconfirmed = particle.approved === false;
  const wanderPhase = useMemo(() => hashOffset(particle.id) * Math.PI * 2, [particle.id]);
  const wanderAmount = isSelected ? 0.006 : 0.02 + ((100 - particle.stability) / 100) * 0.03;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    if (group.current) {
      // Tiny orbital instability - particles gently wander around their
      // own base position instead of sitting perfectly still.
      group.current.position.set(
        particle.position[0] + Math.sin(t * 0.6 + wanderPhase) * wanderAmount,
        particle.position[1] + Math.cos(t * 0.5 + wanderPhase * 1.3) * wanderAmount,
        particle.position[2] + Math.sin(t * 0.4 + wanderPhase * 0.7) * wanderAmount
      );
    }

    if (halo.current) {
      let scale: number;
      if (flicker) {
        scale =
          1 +
          Math.sin(t * pulseSpeed + particle.position[0]) * 0.06 +
          Math.sin(t * pulseSpeed * 2.7 + particle.position[1]) * 0.05;
      } else {
        const amplitude = isSelected ? 0.03 : 0.08;
        scale = 1 + Math.sin(t * pulseSpeed + particle.position[0]) * amplitude;
      }
      halo.current.scale.setScalar(scale);
    }

    if (shimmer.current) {
      const material = shimmer.current.material as import("three").MeshBasicMaterial;
      material.opacity = 0.25 + Math.abs(Math.sin(t * 4 + wanderPhase)) * 0.35;
    }
  });

  return (
    <group ref={group} position={particle.position}>
      <mesh
        onPointerOver={(event: ThreeEvent<PointerEvent>) => {
          event.stopPropagation();
          onHover(particle.id);
        }}
        onPointerOut={(event: ThreeEvent<PointerEvent>) => {
          event.stopPropagation();
          onHover(null);
        }}
        onClick={(event: ThreeEvent<MouseEvent>) => {
          event.stopPropagation();
          onSelect(particle.id);
        }}
      >
        <sphereGeometry args={[particle.size, 14, 14]} />
        <meshBasicMaterial color={colorHex} transparent opacity={baseOpacity} />
      </mesh>
      <mesh ref={halo} scale={1.8}>
        <sphereGeometry args={[particle.size, 10, 10]} />
        <meshBasicMaterial
          color={colorHex}
          transparent
          opacity={isSelected || isHovered ? 0.3 : 0.12}
          blending={AdditiveBlending}
        />
      </mesh>
      {unconfirmed && (
        <mesh ref={shimmer} rotation={[Math.PI / 2, 0.4, 0]}>
          <torusGeometry args={[particle.size * 1.9, 0.004, 4, 24]} />
          <meshBasicMaterial color={colorHex} transparent opacity={0.3} blending={AdditiveBlending} />
        </mesh>
      )}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[particle.size * 2.1, 0.005, 6, 40]} />
          <meshBasicMaterial color={colorHex} transparent opacity={0.75} blending={AdditiveBlending} />
        </mesh>
      )}
      {(isHovered || isSelected) && (
        <Html center style={{ pointerEvents: "none" }}>
          <div className={`node-label${isSelected ? " node-label--selected" : ""}`}>
            <span className="node-label-dot" style={{ background: colorHex, boxShadow: `0 0 8px ${colorHex}` }} />
            {particle.label}
            {unconfirmed && <span className="node-label-pending">pending</span>}
          </div>
        </Html>
      )}
    </group>
  );
}

function ParticleField({
  selectedId,
  onSelect
}: {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const group = useRef<Group>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const activeId = selectedId ?? DEFAULT_FOCUS_PARTICLE_ID;
  const activeParticle = STEWARD_PARTICLES.find((particle) => particle.id === activeId) ?? STEWARD_PARTICLES[0];

  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.rotation.y = Math.sin(clock.elapsedTime * 0.12) * 0.09;
  });

  const curves = useMemo(() => {
    const map = new Map<string, QuadraticBezierCurve3>();
    STEWARD_PARTICLES.forEach((particle) => {
      const end = new Vector3(...particle.position);
      const mid = end.clone().multiplyScalar(0.5).add(new Vector3(0, 0.22, 0));
      map.set(particle.id, new QuadraticBezierCurve3(new Vector3(0, 0, 0), mid, end));
    });
    return map;
  }, []);

  return (
    <group ref={group}>
      <ConnectionArcs curves={curves} activeId={activeId} selectedId={selectedId} hoveredId={hoveredId} />
      <LatticeLinks />
      <DependencyLinks selectedId={selectedId} />
      {STEWARD_PARTICLES.map((particle) => (
        <ParticleMesh
          key={particle.id}
          particle={particle}
          isSelected={selectedId === particle.id}
          isHovered={hoveredId === particle.id}
          onHover={setHoveredId}
          onSelect={onSelect}
        />
      ))}
      <ReasoningTrail
        curve={curves.get(activeId) ?? curves.get(STEWARD_PARTICLES[0].id)!}
        color={particleColorHex(activeParticle)}
      />
      <ActiveLinkPulses activeId={activeId} />
    </group>
  );
}

function CoreScene({ detail = false, selectedId = null, onSelectNode }: StewardCoreProps) {
  const group = useRef<Group>(null);
  const activeId = selectedId ?? DEFAULT_FOCUS_PARTICLE_ID;
  const activeParticle = STEWARD_PARTICLES.find((particle) => particle.id === activeId) ?? STEWARD_PARTICLES[0];
  const activeColor = particleColorHex(activeParticle);

  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.rotation.y = clock.elapsedTime * 0.055;
    group.current.rotation.x = Math.sin(clock.elapsedTime * 0.18) * 0.05;
  });

  return (
    <>
      <color attach="background" args={[palette.void]} />
      <ambientLight intensity={0.25} />
      <pointLight position={[0, 0, 4]} intensity={16} color={palette.softCore} />
      <pointLight position={[4, 2, 2]} intensity={4} color={palette.teal} />
      <group ref={group} scale={detail ? 1.22 : 1}>
        <ParticleCloud count={detail ? 750 : 550} />
        <EnergyCore pulseColor={activeColor} />
        <ThoughtRipple color={activeColor} />
        <OrbitRing radius={1.05} rotation={[1.35, 0.1, 0.1]} speed={0.18} color={activeColor} opacity={0.45} />
        <OrbitRing radius={1.62} rotation={[0.95, 0.85, 0.7]} color={palette.teal} speed={-0.11} />
        <OrbitRing radius={2.12} rotation={[1.4, -0.45, 1.8]} speed={0.07} />
        <OrbitRing radius={2.74} rotation={[1.15, 0.28, -0.6]} color={palette.teal} speed={-0.045} />
        <ParticleField selectedId={selectedId} onSelect={(id) => onSelectNode?.(id)} />
      </group>
    </>
  );
}

export default function StewardCore({ detail = false, selectedId = null, onSelectNode }: StewardCoreProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, detail ? 6.2 : 6.8], fov: 48 }}
      dpr={[1, 1.5]}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      onPointerMissed={() => onSelectNode?.(null)}
    >
      <CoreScene detail={detail} selectedId={selectedId} onSelectNode={onSelectNode} />
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.55} luminanceThreshold={0.22} luminanceSmoothing={0.25} mipmapBlur radius={0.32} />
      </EffectComposer>
    </Canvas>
  );
}
