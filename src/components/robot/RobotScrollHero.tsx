"use client";

import { motion, useScroll, useTransform } from "motion/react";
import RobotScene from "./RobotScene";

export default function RobotScrollHero() {
  const { scrollYProgress } = useScroll();
  const robotProgress = useTransform(scrollYProgress, [0, 0.24], [0, 1]);
  const sceneOpacity = useTransform(
    scrollYProgress,
    [0, 0.08, 0.24, 0.4, 1],
    [0.88, 0.72, 0.5, 0.22, 0.08],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "var(--brand-paper)" }}
      />
      <div
        className="absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage:
            "linear-gradient(var(--brand-blue) 1px, transparent 1px), linear-gradient(90deg, var(--brand-blue) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(var(--brand-red) 1.5px, transparent 1.5px)",
          backgroundSize: "68px 68px",
          backgroundPosition: "17px 17px",
        }}
      />
      <div
        className="absolute top-0 right-0 h-[700px] w-[700px] opacity-20"
        style={{
          background:
            "radial-gradient(circle at 65% 35%, #dbe6ff 0%, transparent 55%), radial-gradient(circle at 80% 75%, #f3ddc3 0%, transparent 50%)",
        }}
      />
      <motion.div className="absolute inset-0" style={{ opacity: sceneOpacity }}>
        <RobotScene progress={robotProgress} />
      </motion.div>
    </div>
  );
}
