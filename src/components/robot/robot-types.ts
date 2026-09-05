import type { MotionValue } from "motion/react";

export type RobotPartId =
  | "frameLower"
  | "frameUpper"
  | "standoffFrontLeft"
  | "standoffFrontRight"
  | "standoffRearLeft"
  | "standoffRearRight"
  | "upperScrewFrontLeft"
  | "upperScrewFrontRight"
  | "upperScrewRearLeft"
  | "upperScrewRearRight"
  | "lowerNutFrontLeft"
  | "lowerNutFrontRight"
  | "lowerNutRearLeft"
  | "lowerNutRearRight"
  | "caster";

export type RobotMotionConfig = {
  id: RobotPartId;
  phase: readonly [number, number];
  basePosition: readonly [number, number, number];
  position?: readonly [number, number, number];
  follows?: "frameUpper" | "frameLower";
};

export type RobotProgress = MotionValue<number>;
