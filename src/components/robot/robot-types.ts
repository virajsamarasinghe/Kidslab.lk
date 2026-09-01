import type { MotionValue } from "motion/react";

export type RobotPartId =
  | "caster"
  | "wheelLeft"
  | "wheelRight"
  | "motorLeft"
  | "motorRight"
  | "chassisLower"
  | "structural"
  | "chassisUpper"
  | "battery"
  | "motorDriver"
  | "wires"
  | "arduino"
  | "irSensor";

export type RobotMotionConfig = {
  id: RobotPartId;
  phase: readonly [number, number];
  position?: readonly [number, number, number];
  rotation?: readonly [number, number, number];
  scale?: number;
};

export type RobotProgress = MotionValue<number>;
