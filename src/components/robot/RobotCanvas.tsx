"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
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
  const size = useThree((state) => state.size);

  // One projection for all photographic layers, at every viewport size.
  return (
    <OrthographicCamera
      makeDefault
      position={[0, 0, 10]}
      zoom={Math.min(size.width / 8.4, size.height / 6.3)}
      near={0.1}
      far={100}
    />
  );
}

export default function RobotCanvas({ progress, reduceMotion, onContextLost }: RobotCanvasProps) {
  return (
    <Canvas
      dpr={[1, 1.25]}
      frameloop="demand"
      gl={{ antialias: true, alpha: true, localClippingEnabled: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <WebGLContextMonitor onContextLost={onContextLost} />
      <CameraSetup />
      <RobotWorld progress={progress} reduceMotion={reduceMotion} />
    </Canvas>
  );
}
