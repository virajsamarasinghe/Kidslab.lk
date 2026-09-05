"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import type { RobotProgress } from "./robot-types";
import RobotWorld from "./RobotModel";

type RobotCanvasProps = {
  progress: RobotProgress;
  reduceMotion: boolean;
  onContextLost?: () => void;
};

function WebGLContextMonitor({ onContextLost }: { onContextLost?: () => void }) {
  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      onContextLost?.();
    };

    canvas.addEventListener("webglcontextlost", handleContextLost, false);
    return () => canvas.removeEventListener("webglcontextlost", handleContextLost, false);
  }, [gl, onContextLost]);

  return null;
}

function CameraSetup() {
  const { camera, invalidate } = useThree();

  useEffect(() => {
    camera.position.set(7.4, 6.1, 9.4);
    camera.lookAt(0, 0.65, 0);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, invalidate]);

  return null;
}

export default function RobotCanvas({ progress, reduceMotion, onContextLost }: RobotCanvasProps) {
  return (
    <Canvas
      shadows="basic"
      dpr={[1, 1.25]}
      frameloop="demand"
      camera={{ position: [7.4, 6.1, 9.4], fov: 38, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <WebGLContextMonitor onContextLost={onContextLost} />
      <CameraSetup />
      <RobotWorld progress={progress} reduceMotion={reduceMotion} />
    </Canvas>
  );
}
