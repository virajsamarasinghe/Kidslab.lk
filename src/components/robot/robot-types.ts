import type { MotionValue } from "motion/react";

export type RobotPartId =
  | "frameLower"
  | "frameUpper"
  | "standoffs"
  | "upperScrews"
  | "lowerNuts"
  | "caster"
  | "arduino"
  | "wires"
  | "battery"
  | "motorDriver"
  | "motorLeft"
  | "motorRight"
  | "wheelLeft"
  | "wheelRight"
  | "irSensor";

export type RobotMotionConfig = {
  id: RobotPartId;
  phase: readonly [number, number];
  basePosition: readonly [number, number, number];
  position?: readonly [number, number, number];
  rotation?: readonly [number, number, number];
  follows?: RobotPartId;
};

export type RobotProgress = MotionValue<number>;
