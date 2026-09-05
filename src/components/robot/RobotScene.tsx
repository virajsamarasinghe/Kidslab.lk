"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useReducedMotion } from "motion/react";
import { useCallback, useState } from "react";
import type { RobotProgress } from "./robot-types";
import { robotAssetPaths } from "./robot-assets";

const RobotCanvas = dynamic(() => import("./RobotCanvas"), { ssr: false });

type RobotSceneProps = {
  progress: RobotProgress;
};

export default function RobotScene({ progress }: RobotSceneProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [showFallback, setShowFallback] = useState(false);
  const handleContextLost = useCallback(() => setShowFallback(true), []);

  return (
    <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden" aria-hidden="true">
      <div className="absolute left-1/2 top-1/2 w-[min(92vw,820px)] max-w-none -translate-x-1/2 -translate-y-1/2 sm:w-[min(84vw,900px)] md:w-[min(70vw,980px)] lg:w-[min(66vw,1100px)] 2xl:w-[min(60vw,1120px)]">
        <div className="relative aspect-[4/3] w-full">
          <div className="absolute inset-[9%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(43,95,224,0.11),transparent_67%)]" />
          {showFallback ? (
            <Image
              src={robotAssetPaths.components.frameAssemblyFallback}
              alt=""
              fill
              sizes="100vw"
              className="object-contain mix-blend-multiply"
              priority
            />
          ) : (
            <RobotCanvas
              progress={progress}
              reduceMotion={reduceMotion}
              onContextLost={handleContextLost}
            />
          )}
        </div>
      </div>
    </div>
  );
}
