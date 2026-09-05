"use client";

import { useTexture } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import { useMotionValueEvent } from "motion/react";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { robotAssetPaths } from "./robot-assets";
import { frameBaseLayout, framePhotoSize, framePlateGap, framePlateSize, robotMotionConfig } from "./robot-motion";
import type { RobotPartId, RobotProgress } from "./robot-types";

type PhotoLayerProps = {
  path: string;
  size: readonly [number, number];
  order: number;
  // Pixel where the photographed part attaches to its mounting point.
  anchor?: readonly [number, number];
  clippingPlanes?: THREE.Plane[];
};

function PhotoLayer({ path, size, order, anchor, clippingPlanes }: PhotoLayerProps) {
  const texture = useTexture(path);
  const [width, height] = size;
  const anchorX = anchor?.[0] ?? framePhotoSize / 2;
  const anchorY = anchor?.[1] ?? framePhotoSize / 2;

  return (
    <mesh
      renderOrder={order}
      position={[
        (0.5 - anchorX / framePhotoSize) * width,
        (anchorY / framePhotoSize - 0.5) * height,
        0,
      ]}
    >
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={texture}
        transparent
        alphaTest={0.025}
        depthTest={false}
        depthWrite={false}
        clippingPlanes={clippingPlanes}
        toneMapped={false}
      />
    </mesh>
  );
}

const sceneOffsetY = -0.35;

function PartImage({ id, progress, reduceMotion }: { id: RobotPartId; progress: RobotProgress; reduceMotion: boolean }) {
  const clippingPlanes = useMemo(() => {
    if (id.startsWith("upperScrew")) return [new THREE.Plane(new THREE.Vector3(0, 1, 0))];
    if (id.startsWith("standoff")) return [
      new THREE.Plane(new THREE.Vector3(0, 1, 0)),
      new THREE.Plane(new THREE.Vector3(0, -1, 0)),
    ];
    return [];
  }, [id]);

  useFrame(() => {
    if (!clippingPlanes.length) return;
    const scrollProgress = reduceMotion ? 0 : progress.get();
    const mountY = frameBaseLayout[id][1] + sceneOffsetY;

    // Occlude against this mounting hole's surface, rather than the silhouette
    // of the entire plate. Threads reveal smoothly as the parts separate.
    if (id.startsWith("upperScrew")) {
      clippingPlanes[0].setComponents(0, 1, 0, -(mountY + getPartTravel("frameUpper", scrollProgress)));
    } else {
      clippingPlanes[0].setComponents(0, 1, 0, -(mountY + getPartTravel("frameLower", scrollProgress)));
      clippingPlanes[1].setComponents(0, -1, 0, mountY + framePlateGap + getPartTravel("frameUpper", scrollProgress));
    }
  });
  if (id === "frameLower" || id === "frameUpper") {
    return <PhotoLayer path={robotAssetPaths.components.framePlate} size={framePlateSize} order={id === "frameLower" ? 20 : 40} />;
  }

  if (id.startsWith("standoff")) {
    // Fit the hex body's endpoints to the gap; the threaded ends enter the plates.
    return <PhotoLayer path={robotAssetPaths.components.standoff} size={[0.96, framePlateGap * framePhotoSize / (928 - 315)]} anchor={[627, 928]} order={30} clippingPlanes={clippingPlanes} />;
  }

  if (id.startsWith("upperScrew")) {
    return <PhotoLayer path={robotAssetPaths.components.screw} size={[0.52, 0.52]} anchor={[624, 346]} order={50} clippingPlanes={clippingPlanes} />;
  }

  if (id === "caster") {
    return <PhotoLayer path={robotAssetPaths.components.caster} size={[1.16, 1.16]} anchor={[648, 355]} order={5} />;
  }

  return <PhotoLayer path={robotAssetPaths.components.nut} size={[0.43, 0.43]} anchor={[627, 420]} order={10} />;
}

function getEasedPhaseProgress(progress: number, [start, end]: readonly [number, number]) {
  const normalized = THREE.MathUtils.clamp((progress - start) / (end - start), 0, 1);
  return normalized < 0.5
    ? 4 * normalized * normalized * normalized
    : 1 - Math.pow(-2 * normalized + 2, 3) / 2;
}

const motionById = new Map(robotMotionConfig.map((config) => [config.id, config]));

function getPartTravel(id: RobotPartId, progress: number) {
  const config = motionById.get(id);
  return config ? (config.position?.[1] ?? 0) * getEasedPhaseProgress(progress, config.phase) : 0;
}

function RobotModel({ progress, reduceMotion }: { progress: RobotProgress; reduceMotion: boolean }) {
  const partRefs = useRef<Partial<Record<RobotPartId, THREE.Group | null>>>({});
  const invalidate = useThree((state) => state.invalidate);

  useMotionValueEvent(progress, "change", () => invalidate());
  useEffect(() => invalidate(), [reduceMotion, invalidate]);

  useFrame(() => {
    const scrollProgress = reduceMotion ? 0 : progress.get();

    for (const config of robotMotionConfig) {
      const group = partRefs.current[config.id];
      if (!group) continue;

      group.position.set(
        config.basePosition[0],
        config.basePosition[1]
          + getPartTravel(config.id, scrollProgress)
          + (config.follows ? getPartTravel(config.follows, scrollProgress) : 0),
        0,
      );
    }
  });

  return (
    <group position={[0, sceneOffsetY, 0]}>
      {robotMotionConfig.map(({ id, basePosition }) => (
        <group key={id} ref={(node) => { partRefs.current[id] = node; }} position={basePosition}>
          <PartImage id={id} progress={progress} reduceMotion={reduceMotion} />
        </group>
      ))}
    </group>
  );
}

export default function RobotWorld(props: { progress: RobotProgress; reduceMotion: boolean }) {
  return (
    <Suspense fallback={null}>
      <RobotModel {...props} />
    </Suspense>
  );
}
