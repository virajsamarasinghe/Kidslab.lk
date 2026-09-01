"use client";

import { Billboard, ContactShadows, Line, RoundedBox, useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMotionValueEvent } from "motion/react";
import { Suspense, useCallback, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { robotAssetPaths } from "./robot-assets";
import { robotMotionConfig } from "./robot-motion";
import type { RobotPartId, RobotProgress } from "./robot-types";

const NAVY = "#0f2418";
const INK = "#17231f";
const GRAPHITE = "#263630";
const METAL = "#65776f";
const METAL_LIGHT = "#aab7ae";
const BLUE = "#2b5fe0";
const COPPER = "#e08a3c";
const GOLD = "#fbbf24";
const RED = "#b94436";

function MetalMaterial({ color = METAL, roughness = 0.28 }: { color?: string; roughness?: number }) {
  return <meshStandardMaterial color={color} metalness={0.82} roughness={roughness} />;
}

function RealisticComponentImage({
  path,
  size,
  flipX = false,
}: {
  path: string;
  size: number;
  flipX?: boolean;
}) {
  const texture = useTexture(path);

  return (
    <Billboard>
      <mesh scale={flipX ? [-1, 1, 1] : [1, 1, 1]} renderOrder={4}>
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial
          map={texture}
          transparent
          alphaTest={0.025}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </Billboard>
  );
}

function Bolt({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <mesh position={position} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[0.075 * scale, 0.075 * scale, 0.04, 20]} />
      <meshStandardMaterial color={GOLD} metalness={0.78} roughness={0.22} />
    </mesh>
  );
}

function ChassisLower() {
  return (
    <group>
      <RoundedBox args={[4.8, 0.2, 2.85]} radius={0.2} smoothness={5} castShadow receiveShadow>
        <MetalMaterial color="#344941" roughness={0.34} />
      </RoundedBox>
      <RoundedBox position={[0, 0.13, 0]} args={[4.38, 0.055, 2.42]} radius={0.12} smoothness={4} receiveShadow>
        <meshStandardMaterial color={INK} metalness={0.28} roughness={0.42} />
      </RoundedBox>
      <mesh position={[0, 0.18, 0]} castShadow>
        <boxGeometry args={[3.35, 0.045, 0.08]} />
        <meshStandardMaterial color={METAL_LIGHT} metalness={0.7} roughness={0.32} transparent opacity={0.26} />
      </mesh>
      {[
        [-2.05, 0.14, -1.03],
        [2.05, 0.14, -1.03],
        [-2.05, 0.14, 1.03],
        [2.05, 0.14, 1.03],
      ].map((position) => (
        <Bolt key={position.join(":")} position={position as [number, number, number]} />
      ))}
    </group>
  );
}

function ChassisUpper() {
  return (
    <group>
      <RoundedBox args={[4.35, 0.19, 2.42]} radius={0.18} smoothness={5} castShadow receiveShadow>
        <MetalMaterial color="#455b51" roughness={0.3} />
      </RoundedBox>
      <RoundedBox position={[0, 0.13, 0]} args={[3.92, 0.05, 2.04]} radius={0.1} smoothness={4} receiveShadow>
        <meshStandardMaterial color="#60736a" metalness={0.35} roughness={0.42} />
      </RoundedBox>
      <mesh position={[0, 0.17, 0]} castShadow>
        <boxGeometry args={[2.75, 0.045, 0.045]} />
        <meshStandardMaterial color="#d8e0d8" metalness={0.5} roughness={0.28} transparent opacity={0.2} />
      </mesh>
      {[
        [-1.8, 0.14, -0.83],
        [1.8, 0.14, -0.83],
        [-1.8, 0.14, 0.83],
        [1.8, 0.14, 0.83],
      ].map((position) => (
        <Bolt key={position.join(":")} position={position as [number, number, number]} scale={0.9} />
      ))}
    </group>
  );
}

function StructuralStandoffs() {
  const locations: [number, number][] = [
    [-1.65, -0.82],
    [1.65, -0.82],
    [-1.65, 0.82],
    [1.65, 0.82],
  ];

  return (
    <group>
      {locations.map(([x, z]) => (
        <group key={`${x}-${z}`} position={[x, 0.5, z]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.11, 0.11, 0.62, 24]} />
            <meshStandardMaterial color={COPPER} metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.32, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.15, 0.08, 24]} />
            <meshStandardMaterial color={GOLD} metalness={0.86} roughness={0.22} />
          </mesh>
          <mesh position={[0, -0.32, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.15, 0.08, 24]} />
            <meshStandardMaterial color={GOLD} metalness={0.86} roughness={0.22} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Arduino() {
  const pins = Array.from({ length: 8 }, (_, index) => -0.82 + index * 0.23);
  return (
    <group>
      <RoundedBox args={[2.12, 0.12, 1.2]} radius={0.1} smoothness={4} castShadow>
        <meshStandardMaterial color={BLUE} metalness={0.5} roughness={0.28} />
      </RoundedBox>
      <RoundedBox position={[-0.35, 0.1, 0.04]} args={[0.72, 0.1, 0.58]} radius={0.04} smoothness={3} castShadow>
        <meshStandardMaterial color="#3973ec" metalness={0.4} roughness={0.26} />
      </RoundedBox>
      <RoundedBox position={[0.36, 0.12, 0.02]} args={[0.62, 0.12, 0.52]} radius={0.04} smoothness={3} castShadow>
        <meshStandardMaterial color={NAVY} metalness={0.42} roughness={0.3} />
      </RoundedBox>
      <RoundedBox position={[-0.82, 0.1, -0.28]} args={[0.42, 0.18, 0.32]} radius={0.04} smoothness={3} castShadow>
        <meshStandardMaterial color="#b5c0cb" metalness={0.78} roughness={0.22} />
      </RoundedBox>
      <RoundedBox position={[0.85, 0.15, -0.03]} args={[0.16, 0.3, 0.62]} radius={0.03} smoothness={3} castShadow>
        <meshStandardMaterial color="#c3ccd2" metalness={0.7} roughness={0.25} />
      </RoundedBox>
      {pins.map((x) => (
        <group key={x} position={[x, 0.13, 0]}>
          <mesh position={[0, 0.04, -0.67]} castShadow>
            <boxGeometry args={[0.055, 0.16, 0.055]} />
            <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.18} />
          </mesh>
          <mesh position={[0, 0.04, 0.67]} castShadow>
            <boxGeometry args={[0.055, 0.16, 0.055]} />
            <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.18} />
          </mesh>
        </group>
      ))}
      <mesh position={[0.03, 0.18, 0.37]}>
        <sphereGeometry args={[0.055, 16, 10]} />
        <meshStandardMaterial color="#6ef1a0" emissive="#36cb74" emissiveIntensity={1.4} />
      </mesh>
    </group>
  );
}

function JumperWires() {
  const wireSets: { color: string; points: [number, number, number][] }[] = [
    { color: COPPER, points: [[-0.7, 0.08, 0.28], [-0.92, 0.42, 0.7], [-1.52, -0.2, 0.82]] },
    { color: BLUE, points: [[-0.42, 0.08, 0.28], [-0.52, 0.38, 0.82], [-1.1, -0.16, 1.08]] },
    { color: "#2f9b67", points: [[0.12, 0.1, 0.2], [0.46, 0.37, 0.72], [1.17, -0.16, 0.88]] },
    { color: GOLD, points: [[0.38, 0.1, 0.2], [0.72, 0.28, 0.5], [1.38, -0.12, 0.62]] },
    { color: "#edf3ee", points: [[0.62, 0.1, 0.2], [0.8, 0.23, 0.42], [1.5, -0.2, 0.36]] },
  ];

  return (
    <group>
      {wireSets.map(({ color, points }) => (
        <Line key={color} points={points} color={color} lineWidth={3} />
      ))}
    </group>
  );
}

function BatteryPack() {
  return (
    <group>
      <RoundedBox args={[1.62, 0.46, 0.9]} radius={0.1} smoothness={4} castShadow>
        <meshStandardMaterial color="#202d29" metalness={0.54} roughness={0.34} />
      </RoundedBox>
      <RoundedBox position={[0, 0.25, 0]} args={[1.25, 0.06, 0.66]} radius={0.04} smoothness={3} castShadow>
        <meshStandardMaterial color="#4b5d55" metalness={0.45} roughness={0.36} />
      </RoundedBox>
      <mesh position={[-0.46, 0.3, 0]}>
        <boxGeometry args={[0.45, 0.018, 0.04]} />
        <meshStandardMaterial color={METAL_LIGHT} metalness={0.65} roughness={0.25} transparent opacity={0.55} />
      </mesh>
      <mesh position={[-0.25, 0.3, 0]}>
        <boxGeometry args={[0.62, 0.018, 0.04]} />
        <meshStandardMaterial color={METAL_LIGHT} metalness={0.65} roughness={0.25} transparent opacity={0.4} />
      </mesh>
      <mesh position={[0.76, 0.3, -0.18]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 0.12, 20]} />
        <meshStandardMaterial color={COPPER} metalness={0.86} roughness={0.22} />
      </mesh>
      <mesh position={[0.76, 0.3, 0.18]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 0.12, 20]} />
        <meshStandardMaterial color={NAVY} metalness={0.86} roughness={0.22} />
      </mesh>
    </group>
  );
}

function MotorDriver() {
  return (
    <group>
      <RoundedBox args={[1.35, 0.14, 1.1]} radius={0.08} smoothness={4} castShadow>
        <meshStandardMaterial color={RED} metalness={0.4} roughness={0.3} />
      </RoundedBox>
      <RoundedBox position={[0, 0.2, 0]} args={[0.98, 0.24, 0.24]} radius={0.03} smoothness={3} castShadow>
        <meshStandardMaterial color="#899795" metalness={0.88} roughness={0.24} />
      </RoundedBox>
      {[-0.36, -0.18, 0, 0.18, 0.36].map((x) => (
        <mesh key={x} position={[x, 0.34, 0]} castShadow>
          <boxGeometry args={[0.045, 0.27, 0.3]} />
          <meshStandardMaterial color="#b7c2bd" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
      <RoundedBox position={[0, 0.13, 0.34]} args={[1.02, 0.12, 0.18]} radius={0.025} smoothness={3} castShadow>
        <meshStandardMaterial color={NAVY} metalness={0.48} roughness={0.3} />
      </RoundedBox>
      {[-0.38, -0.13, 0.13, 0.38].map((x) => (
        <mesh key={x} position={[x, 0.22, 0.37]} castShadow>
          <cylinderGeometry args={[0.055, 0.055, 0.11, 16]} />
          <meshStandardMaterial color={GOLD} metalness={0.88} roughness={0.19} />
        </mesh>
      ))}
    </group>
  );
}

function GearMotor({ side }: { side: "left" | "right" }) {
  const direction = side === "left" ? -1 : 1;
  return (
    <group>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.39, 0.39, 0.92, 32]} />
        <meshStandardMaterial color="#6c7e76" metalness={0.86} roughness={0.25} />
      </mesh>
      <RoundedBox position={[-direction * 0.53, 0, 0]} args={[0.45, 0.68, 0.78]} radius={0.12} smoothness={5} castShadow>
        <meshStandardMaterial color={GRAPHITE} metalness={0.82} roughness={0.24} />
      </RoundedBox>
      <mesh position={[-direction * 0.78, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.26, 0.26, 0.14, 28]} />
        <meshStandardMaterial color={COPPER} metalness={0.88} roughness={0.2} />
      </mesh>
      <mesh position={[direction * 0.48, 0, 0]} castShadow>
        <boxGeometry args={[0.06, 0.28, 0.42]} />
        <meshStandardMaterial color={COPPER} metalness={0.82} roughness={0.21} />
      </mesh>
      <Suspense fallback={null}>
        <RealisticComponentImage
          path={robotAssetPaths.components.gearMotor}
          size={1.78}
          flipX={side === "left"}
        />
      </Suspense>
    </group>
  );
}

function Wheel({ side }: { side: "left" | "right" }) {
  return (
    <group>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[0.88, 0.88, 0.34, 64]} />
        <meshStandardMaterial color="#131d1b" metalness={0.18} roughness={0.72} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
        <torusGeometry args={[0.72, 0.12, 18, 64]} />
        <meshStandardMaterial color="#24322e" metalness={0.38} roughness={0.56} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.43, 0.43, 0.38, 36]} />
        <meshStandardMaterial color="#697d74" metalness={0.82} roughness={0.26} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.43, 28]} />
        <meshStandardMaterial color={COPPER} metalness={0.91} roughness={0.19} />
      </mesh>
      <Suspense fallback={null}>
        <RealisticComponentImage
          path={robotAssetPaths.components.wheel}
          size={1.95}
          flipX={side === "left"}
        />
      </Suspense>
    </group>
  );
}

function IRSensorArray() {
  return (
    <group>
      <RoundedBox args={[1.58, 0.13, 0.36]} radius={0.06} smoothness={4} castShadow>
        <meshStandardMaterial color={INK} metalness={0.44} roughness={0.3} />
      </RoundedBox>
      {[-0.56, -0.28, 0, 0.28, 0.56].map((x, index) => (
        <group key={x} position={[x, 0.13, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.105, 0.105, 0.17, 20]} />
            <meshStandardMaterial color="#202f2b" metalness={0.55} roughness={0.28} />
          </mesh>
          <mesh position={[0, 0.1, 0.08]}>
            <sphereGeometry args={[0.038, 16, 10]} />
            <meshStandardMaterial
              color={index === 2 ? COPPER : BLUE}
              emissive={index === 2 ? COPPER : BLUE}
              emissiveIntensity={0.32}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function CasterWheel() {
  return (
    <group>
      <RoundedBox position={[0, 0.25, 0]} args={[0.42, 0.62, 0.3]} radius={0.08} smoothness={4} castShadow>
        <MetalMaterial color={GRAPHITE} roughness={0.28} />
      </RoundedBox>
      <mesh position={[0, -0.18, 0]} castShadow>
        <sphereGeometry args={[0.36, 32, 20]} />
        <meshStandardMaterial color="#202d29" metalness={0.28} roughness={0.62} />
      </mesh>
      <mesh position={[0, -0.18, 0.3]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.08, 20]} />
        <meshStandardMaterial color={COPPER} metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}

function RobotPart({
  id,
  children,
  position,
  register,
}: {
  id: RobotPartId;
  children: ReactNode;
  position: [number, number, number];
  register: (id: RobotPartId, node: THREE.Group | null) => void;
}) {
  return (
    <group ref={(node) => register(id, node)} position={position}>
      {children}
    </group>
  );
}

function RobotModel({ progress, reduceMotion }: { progress: RobotProgress; reduceMotion: boolean }) {
  const partRefs = useRef<Partial<Record<RobotPartId, THREE.Group | null>>>({});
  const invalidate = useThree((state) => state.invalidate);
  const registerPart = useCallback((id: RobotPartId, node: THREE.Group | null) => {
    partRefs.current[id] = node;
  }, []);

  useMotionValueEvent(progress, "change", () => invalidate());

  useFrame(() => {
    const scrollProgress = reduceMotion ? 0 : progress.get();

    for (const config of robotMotionConfig) {
      const group = partRefs.current[config.id];
      if (!group) continue;

      const phaseProgress = getEasedPhaseProgress(scrollProgress, config.phase);
      const [x, y, z] = config.position ?? [0, 0, 0];
      const [rx, ry, rz] = config.rotation ?? [0, 0, 0];
      const scale = THREE.MathUtils.lerp(1, config.scale ?? 1, phaseProgress);

      group.position.set(x * phaseProgress, y * phaseProgress, z * phaseProgress);
      group.rotation.set(rx * phaseProgress, ry * phaseProgress, rz * phaseProgress);
      group.scale.setScalar(scale);
    }
  });

  return (
    <group rotation={[0, -0.18, 0]} position={[0, -0.05, 0]}>
      <RobotPart register={registerPart} id="chassisLower" position={[0, 0.08, 0]}><ChassisLower /></RobotPart>
      <RobotPart register={registerPart} id="structural" position={[0, 0, 0]}><StructuralStandoffs /></RobotPart>
      <RobotPart register={registerPart} id="motorLeft" position={[-2.28, 0.1, 0.12]}><GearMotor side="left" /></RobotPart>
      <RobotPart register={registerPart} id="motorRight" position={[2.28, 0.1, 0.12]}><GearMotor side="right" /></RobotPart>
      <RobotPart register={registerPart} id="wheelLeft" position={[-2.72, 0.08, 0.12]}><Wheel side="left" /></RobotPart>
      <RobotPart register={registerPart} id="wheelRight" position={[2.72, 0.08, 0.12]}><Wheel side="right" /></RobotPart>
      <RobotPart register={registerPart} id="chassisUpper" position={[0, 0.86, 0]}><ChassisUpper /></RobotPart>
      <RobotPart register={registerPart} id="battery" position={[-0.22, 0.8, -0.18]}><BatteryPack /></RobotPart>
      <RobotPart register={registerPart} id="motorDriver" position={[1.32, 1.05, -0.05]}><MotorDriver /></RobotPart>
      <RobotPart register={registerPart} id="wires" position={[0, 1.25, -0.16]}><JumperWires /></RobotPart>
      <RobotPart register={registerPart} id="arduino" position={[0, 1.26, -0.16]}><Arduino /></RobotPart>
      <RobotPart register={registerPart} id="irSensor" position={[0, -0.2, 1.6]}><IRSensorArray /></RobotPart>
      <RobotPart register={registerPart} id="caster" position={[0, -0.48, -1.15]}><CasterWheel /></RobotPart>
    </group>
  );
}

function getEasedPhaseProgress(progress: number, [start, end]: readonly [number, number]) {
  const normalized = THREE.MathUtils.clamp((progress - start) / (end - start), 0, 1);
  return normalized < 0.5
    ? 4 * normalized * normalized * normalized
    : 1 - Math.pow(-2 * normalized + 2, 3) / 2;
}

export default function RobotWorld({ progress, reduceMotion }: { progress: RobotProgress; reduceMotion: boolean }) {
  return (
    <>
      <ambientLight intensity={1.25} />
      <hemisphereLight args={["#ffffff", "#77847c", 1.15]} />
      <directionalLight
        castShadow
        position={[5, 8, 6]}
        intensity={3.2}
        shadow-bias={-0.0003}
        shadow-mapSize={[768, 768]}
      />
      <pointLight position={[-4, 4, 3]} intensity={12} distance={11} color="#abc4ff" />
      <pointLight position={[4, 3, -2]} intensity={8} distance={9} color="#ffd0a0" />
      <RobotModel progress={progress} reduceMotion={reduceMotion} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.18, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color="#f7f5ee" roughness={1} transparent opacity={0.06} />
      </mesh>
      <ContactShadows position={[0, -1.17, 0]} opacity={0.25} scale={9} blur={2.6} far={4} resolution={256} frames={1} />
    </>
  );
}
