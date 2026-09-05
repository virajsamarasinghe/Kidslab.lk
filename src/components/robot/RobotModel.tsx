"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMotionValueEvent } from "motion/react";
import { useCallback, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import ChassisPlate from "./ChassisPlate";
import { CHASSIS_MOUNTS, CHASSIS_THICKNESS, CASTER_MOUNT } from "./chassis-geometry";
import { FrameCaster, FrameNut, FrameScrew, Standoff } from "./FrameHardware";
import { FRAME_UPPER_Y, robotMotionConfig } from "./robot-motion";
import type { RobotPartId, RobotProgress } from "./robot-types";

const BLUE = "#1769aa";
const BLACK = "#131719";
const STEEL = "#aeb7bd";
const YELLOW = "#f6bd16";
const RED = "#c62e32";
const BRASS = "#c7963c";

function ArduinoBoard() {
  return (
    <group>
      <RoundedBox args={[2.05, 0.08, 1.42]} radius={0.06} smoothness={3} castShadow>
        <meshStandardMaterial color={BLUE} metalness={0.35} roughness={0.34} />
      </RoundedBox>
      <RoundedBox position={[-0.82, 0.16, 0.18]} args={[0.52, 0.24, 0.48]} radius={0.035} smoothness={2} castShadow>
        <meshStandardMaterial color={STEEL} metalness={0.9} roughness={0.2} />
      </RoundedBox>
      <RoundedBox position={[-0.76, 0.13, -0.46]} args={[0.42, 0.18, 0.32]} radius={0.04} smoothness={2} castShadow>
        <meshStandardMaterial color="#202326" metalness={0.32} roughness={0.45} />
      </RoundedBox>
      <RoundedBox position={[0.34, 0.14, 0]} args={[0.7, 0.18, 0.3]} radius={0.025} smoothness={2} castShadow>
        <meshStandardMaterial color="#16191b" metalness={0.32} roughness={0.4} />
      </RoundedBox>
      {([-0.58, 0.6] as const).map((z) => (
        <group key={z} position={[0.18, 0.12, z]}>
          <RoundedBox args={[1.45, 0.19, 0.13]} radius={0.018} smoothness={2}>
            <meshStandardMaterial color="#111516" metalness={0.24} roughness={0.52} />
          </RoundedBox>
          {Array.from({ length: 10 }, (_, index) => (
            <mesh key={index} position={[-0.61 + index * 0.136, 0.115, 0]}>
              <boxGeometry args={[0.045, 0.06, 0.045]} />
              <meshStandardMaterial color={BRASS} metalness={0.88} roughness={0.24} />
            </mesh>
          ))}
        </group>
      ))}
      {[[-0.88, -0.58], [-0.88, 0.58], [0.88, -0.58], [0.88, 0.58]].map(([x, z]) => (
        <mesh key={`${x}:${z}`} position={[x, 0.055, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.07, 0.018, 8, 20]} />
          <meshStandardMaterial color={STEEL} metalness={0.86} roughness={0.26} />
        </mesh>
      ))}
      <mesh position={[0.02, 0.16, 0.36]}>
        <sphereGeometry args={[0.035, 12, 8]} />
        <meshStandardMaterial color="#66f29b" emissive="#35cc72" emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
}

function MotorDriver() {
  return (
    <group>
      <RoundedBox args={[1.5, 0.08, 1.18]} radius={0.045} smoothness={3} castShadow>
        <meshStandardMaterial color={RED} metalness={0.28} roughness={0.38} />
      </RoundedBox>
      <RoundedBox position={[0, 0.24, 0.03]} args={[0.54, 0.38, 0.55]} radius={0.025} smoothness={2} castShadow>
        <meshStandardMaterial color="#1b1e20" metalness={0.62} roughness={0.35} />
      </RoundedBox>
      {[-0.21, -0.105, 0, 0.105, 0.21].map((x) => (
        <mesh key={x} position={[x, 0.45, 0.03]} castShadow>
          <boxGeometry args={[0.045, 0.22, 0.52]} />
          <meshStandardMaterial color="#30363a" metalness={0.72} roughness={0.3} />
        </mesh>
      ))}
      {[-0.55, 0.55].map((x) => (
        <RoundedBox key={x} position={[x, 0.18, -0.4]} args={[0.27, 0.28, 0.27]} radius={0.025} smoothness={2}>
          <meshStandardMaterial color="#1672c9" metalness={0.25} roughness={0.38} />
        </RoundedBox>
      ))}
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, 0.16, 0.42]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.24, 20]} />
          <meshStandardMaterial color="#22282a" metalness={0.35} roughness={0.45} />
        </mesh>
      ))}
    </group>
  );
}

function BatteryPack() {
  return (
    <group>
      <RoundedBox args={[1.75, 0.42, 1.08]} radius={0.11} smoothness={4} castShadow>
        <meshStandardMaterial color={BLACK} metalness={0.25} roughness={0.46} />
      </RoundedBox>
      {[-0.27, 0.27].map((z) => (
        <mesh key={z} position={[0, 0.25, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.22, 0.22, 1.44, 24]} />
          <meshStandardMaterial color="#8b5bd1" metalness={0.25} roughness={0.34} />
        </mesh>
      ))}
      {[-0.74, 0.74].flatMap((x) => [-0.27, 0.27].map((z) => (
        <mesh key={`${x}:${z}`} position={[x, 0.25, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.15, 0.15, 0.025, 20]} />
          <meshStandardMaterial color={x < 0 ? "#3a3d41" : BRASS} metalness={0.78} roughness={0.28} />
        </mesh>
      )))}
    </group>
  );
}

function Wire({ color, points }: { color: string; points: readonly (readonly [number, number, number])[] }) {
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point))),
    [points],
  );

  return (
    <mesh>
      <tubeGeometry args={[curve, 28, 0.024, 7, false]} />
      <meshStandardMaterial color={color} roughness={0.55} />
    </mesh>
  );
}

const wirePaths = [
  { color: "#f07c21", points: [[-1.05, 0.02, 0.85], [-0.7, 0.76, 0.15], [0.65, 0.18, 0.65]] },
  { color: "#2368bd", points: [[-0.78, 0.02, 0.85], [-0.35, 0.9, 0.1], [0.82, 0.2, 0.5]] },
  { color: "#f5c51b", points: [[-0.5, 0.02, 0.85], [0.05, 0.82, 0], [1.0, 0.15, 0.34]] },
  { color: "#238a58", points: [[-0.2, 0.02, 0.85], [0.35, 0.68, 0.12], [1.12, 0.13, 0.18]] },
  { color: "#d83a3d", points: [[0.05, 0.02, 0.85], [0.58, 0.55, 0.2], [1.16, 0.12, 0.02]] },
] as const;

function JumperWires() {
  return (
    <group position={[-0.15, 0, -0.15]}>
      {wirePaths.map((wire) => <Wire key={wire.color} {...wire} />)}
    </group>
  );
}

function GearMotor({ side }: { side: "left" | "right" }) {
  const direction = side === "left" ? -1 : 1;
  return (
    <group>
      <RoundedBox args={[0.72, 0.62, 1.35]} radius={0.1} smoothness={4} castShadow>
        <meshStandardMaterial color={YELLOW} roughness={0.42} />
      </RoundedBox>
      <mesh position={[-direction * 0.43, 0.03, -0.36]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.29, 0.29, 0.52, 28]} />
        <meshStandardMaterial color={STEEL} metalness={0.86} roughness={0.28} />
      </mesh>
      <mesh position={[direction * 0.48, 0, 0.25]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.34, 16]} />
        <meshStandardMaterial color="#e4e6e7" metalness={0.62} roughness={0.32} />
      </mesh>
      {[[-0.2, 0.22], [0.18, -0.2]].map(([y, z]) => (
        <mesh key={`${y}:${z}`} position={[direction * 0.37, y, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.055, 0.055, 0.03, 14]} />
          <meshStandardMaterial color={STEEL} metalness={0.88} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
}

function DriveWheel() {
  return (
    <group>
      <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
        <torusGeometry args={[0.72, 0.16, 16, 48]} />
        <meshStandardMaterial color="#151719" roughness={0.78} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
        <torusGeometry args={[0.53, 0.09, 12, 36]} />
        <meshStandardMaterial color={YELLOW} roughness={0.38} />
      </mesh>
      {Array.from({ length: 6 }, (_, index) => {
        const angle = index * Math.PI / 3;
        return (
          <mesh key={index} position={[0, Math.cos(angle) * 0.29, Math.sin(angle) * 0.29]} rotation={[angle, 0, 0]} castShadow>
            <boxGeometry args={[0.2, 0.48, 0.095]} />
            <meshStandardMaterial color={YELLOW} roughness={0.38} />
          </mesh>
        );
      })}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.25, 24]} />
        <meshStandardMaterial color={STEEL} metalness={0.82} roughness={0.28} />
      </mesh>
    </group>
  );
}

function IRSensorArray() {
  return (
    <group>
      <RoundedBox args={[1.72, 0.07, 0.42]} radius={0.05} smoothness={3} castShadow>
        <meshStandardMaterial color="#161b1c" metalness={0.28} roughness={0.42} />
      </RoundedBox>
      {[-0.62, -0.31, 0, 0.31, 0.62].map((x) => (
        <group key={x} position={[x, -0.1, 0]}>
          <mesh>
            <cylinderGeometry args={[0.08, 0.08, 0.12, 18]} />
            <meshStandardMaterial color="#202529" metalness={0.38} roughness={0.36} />
          </mesh>
          <mesh position={[0, -0.07, 0]}>
            <sphereGeometry args={[0.038, 12, 8]} />
            <meshStandardMaterial color="#171b1c" roughness={0.25} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function StandoffSet() {
  const height = FRAME_UPPER_Y - CHASSIS_THICKNESS;
  return (
    <>
      {Object.entries(CHASSIS_MOUNTS).map(([name, [x, z]]) => (
        <group key={name} position={[x, 0, z]}>
          <Standoff height={height} />
        </group>
      ))}
    </>
  );
}

function ScrewSet() {
  return (
    <>
      {Object.entries(CHASSIS_MOUNTS).map(([name, [x, z]]) => (
        <group key={name} position={[x, 0, z]}>
          <FrameScrew />
        </group>
      ))}
    </>
  );
}

function NutSet() {
  return (
    <>
      {Object.entries(CHASSIS_MOUNTS).map(([name, [x, z]]) => (
        <group key={name} position={[x, 0, z]}>
          <FrameNut />
        </group>
      ))}
    </>
  );
}

function RobotPart({
  id,
  children,
  register,
}: {
  id: RobotPartId;
  children: ReactNode;
  register: (id: RobotPartId, node: THREE.Group | null) => void;
}) {
  const config = motionById.get(id);
  return (
    <group ref={(node) => register(id, node)} position={config?.basePosition}>
      {children}
    </group>
  );
}

function getEasedProgress(progress: number, [start, end]: readonly [number, number]) {
  const normalized = THREE.MathUtils.clamp((progress - start) / (end - start), 0, 1);
  return normalized < 0.5
    ? 4 * normalized * normalized * normalized
    : 1 - Math.pow(-2 * normalized + 2, 3) / 2;
}

const motionById = new Map(robotMotionConfig.map((config) => [config.id, config]));

function getPartOffset(id: RobotPartId, progress: number) {
  const config = motionById.get(id);
  if (!config) return [0, 0, 0] as const;
  const amount = getEasedProgress(progress, config.phase);
  return (config.position ?? [0, 0, 0]).map((value) => value * amount) as [number, number, number];
}

function RobotModel({ progress, reduceMotion }: { progress: RobotProgress; reduceMotion: boolean }) {
  const worldRef = useRef<THREE.Group>(null);
  const partRefs = useRef<Partial<Record<RobotPartId, THREE.Group | null>>>({});
  const invalidate = useThree((state) => state.invalidate);
  const registerPart = useCallback((id: RobotPartId, node: THREE.Group | null) => {
    partRefs.current[id] = node;
  }, []);

  useMotionValueEvent(progress, "change", invalidate);

  useFrame(() => {
    const scrollProgress = reduceMotion ? 0 : progress.get();
    const world = worldRef.current;
    if (world) {
      world.rotation.y = -0.38 + scrollProgress * Math.PI * 2;
      const framingProgress = THREE.MathUtils.clamp(scrollProgress / 0.45, 0, 1);
      world.scale.setScalar(THREE.MathUtils.lerp(1.42, 1, framingProgress));
    }

    for (const config of robotMotionConfig) {
      const group = partRefs.current[config.id];
      if (!group) continue;

      const amount = getEasedProgress(scrollProgress, config.phase);
      const offset = getPartOffset(config.id, scrollProgress);
      const parentOffset = config.follows ? getPartOffset(config.follows, scrollProgress) : [0, 0, 0];

      group.position.set(
        config.basePosition[0] + offset[0] + parentOffset[0],
        config.basePosition[1] + offset[1] + parentOffset[1],
        config.basePosition[2] + offset[2] + parentOffset[2],
      );
      group.rotation.set(
        (config.rotation?.[0] ?? 0) * amount,
        (config.rotation?.[1] ?? 0) * amount,
        (config.rotation?.[2] ?? 0) * amount,
      );
    }
  });

  return (
    <group ref={worldRef} rotation={[0, -0.38, 0]} position={[0, -0.25, 0]} scale={1.42}>
      <RobotPart id="frameLower" register={registerPart}><ChassisPlate /></RobotPart>
      <RobotPart id="standoffs" register={registerPart}><StandoffSet /></RobotPart>
      <RobotPart id="frameUpper" register={registerPart}><ChassisPlate /></RobotPart>
      <RobotPart id="upperScrews" register={registerPart}><ScrewSet /></RobotPart>
      <RobotPart id="lowerNuts" register={registerPart}><NutSet /></RobotPart>
      <RobotPart id="caster" register={registerPart}>
        <group position={[CASTER_MOUNT[0], 0, CASTER_MOUNT[1]]}><FrameCaster /></group>
      </RobotPart>
      <RobotPart id="arduino" register={registerPart}><ArduinoBoard /></RobotPart>
      <RobotPart id="wires" register={registerPart}><JumperWires /></RobotPart>
      <RobotPart id="battery" register={registerPart}><BatteryPack /></RobotPart>
      <RobotPart id="motorDriver" register={registerPart}><MotorDriver /></RobotPart>
      <RobotPart id="motorLeft" register={registerPart}><GearMotor side="left" /></RobotPart>
      <RobotPart id="motorRight" register={registerPart}><GearMotor side="right" /></RobotPart>
      <RobotPart id="wheelLeft" register={registerPart}><DriveWheel /></RobotPart>
      <RobotPart id="wheelRight" register={registerPart}><DriveWheel /></RobotPart>
      <RobotPart id="irSensor" register={registerPart}><IRSensorArray /></RobotPart>
    </group>
  );
}

export default function RobotWorld({ progress, reduceMotion }: { progress: RobotProgress; reduceMotion: boolean }) {
  return (
    <>
      <ambientLight intensity={0.9} />
      <hemisphereLight args={["#ffffff", "#53635c", 1.15]} />
      <directionalLight
        castShadow
        position={[5, 9, 6]}
        intensity={3.5}
        shadow-bias={-0.0004}
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-4, 5, 4]} intensity={16} distance={14} color="#b8cbff" />
      <pointLight position={[5, 4, -3]} intensity={12} distance={13} color="#ffd2a5" />
      <RobotModel progress={progress} reduceMotion={reduceMotion} />
      <mesh position={[0, -2.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <shadowMaterial transparent opacity={0.12} />
      </mesh>
    </>
  );
}
