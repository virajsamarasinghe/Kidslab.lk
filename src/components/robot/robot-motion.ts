import type { RobotMotionConfig } from "./robot-types";

export const FRAME_UPPER_Y = 0.9;

/**
 * Scroll phases follow the robot's physical disassembly order. Every offset is
 * in the robot's local coordinate system, so the exploded assembly remains
 * coherent while its parent completes one full turn.
 */
export const robotMotionConfig: readonly RobotMotionConfig[] = [
  {
    id: "frameLower",
    phase: [0.42, 0.68],
    basePosition: [0, 0, 0],
    position: [0, -0.72, 0],
  },
  {
    id: "frameUpper",
    phase: [0.34, 0.62],
    basePosition: [0, FRAME_UPPER_Y, 0],
    position: [0, 1.22, 0],
  },
  {
    id: "standoffs",
    phase: [0.44, 0.7],
    basePosition: [0, 0, 0],
    position: [0, 0.12, 0],
  },
  {
    id: "upperScrews",
    phase: [0.26, 0.5],
    basePosition: [0, FRAME_UPPER_Y, 0],
    position: [0, 0.82, 0],
    follows: "frameUpper",
  },
  {
    id: "lowerNuts",
    phase: [0.3, 0.54],
    basePosition: [0, -0.08, 0],
    position: [0, -0.42, 0],
    follows: "frameLower",
  },
  {
    id: "caster",
    phase: [0.78, 0.98],
    basePosition: [0, -0.08, 0],
    position: [0, -0.8, 0.34],
    follows: "frameLower",
  },
  {
    id: "arduino",
    phase: [0.06, 0.3],
    basePosition: [-0.72, 0.99, 0.55],
    position: [-0.18, 1.65, 0.08],
    rotation: [0, -0.12, -0.04],
  },
  {
    id: "wires",
    phase: [0.04, 0.28],
    basePosition: [0, 1.12, 0],
    position: [0, 1.65, 0.12],
    rotation: [0, -0.1, 0],
  },
  {
    id: "battery",
    phase: [0.15, 0.42],
    basePosition: [0.82, 1.2, -1.78],
    position: [0.62, 1.42, -0.24],
    rotation: [0.06, 0.14, 0.05],
  },
  {
    id: "motorDriver",
    phase: [0.16, 0.43],
    basePosition: [0.9, 1.0, 0.7],
    position: [0.82, 1.18, 0.22],
    rotation: [-0.04, 0.12, 0.05],
  },
  {
    id: "motorLeft",
    phase: [0.54, 0.77],
    basePosition: [-1.65, -0.05, -0.08],
    position: [-1.18, 0, 0],
  },
  {
    id: "motorRight",
    phase: [0.54, 0.77],
    basePosition: [1.65, -0.05, -0.08],
    position: [1.18, 0, 0],
  },
  {
    id: "wheelLeft",
    phase: [0.65, 0.87],
    basePosition: [-2.34, -0.03, -0.08],
    position: [-1.52, 0, 0],
  },
  {
    id: "wheelRight",
    phase: [0.65, 0.87],
    basePosition: [2.34, -0.03, -0.08],
    position: [1.52, 0, 0],
  },
  {
    id: "irSensor",
    phase: [0.72, 0.94],
    basePosition: [0, -0.2, 3.27],
    position: [0, -0.32, 1.2],
  },
];
