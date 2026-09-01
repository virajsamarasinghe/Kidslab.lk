import type { RobotMotionConfig } from "./robot-types";

/**
 * Scroll phases and 3D offsets are intentionally kept here so the physical
 * disassembly can be tuned without touching the model geometry or copy.
 * Position values are in scene units; the camera keeps the scene responsive.
 */
export const robotMotionConfig = [
  {
    id: "caster",
    phase: [0.86, 0.98],
    position: [0, -0.16, 0.24],
    rotation: [0.02, 0, 0.02],
  },
  {
    id: "wheelLeft",
    phase: [0.7, 0.86],
    position: [-1.3, 0.04, 0],
    rotation: [0, 0, -0.04],
  },
  {
    id: "wheelRight",
    phase: [0.7, 0.86],
    position: [1.3, 0.04, 0],
    rotation: [0, 0, 0.04],
  },
  {
    id: "motorLeft",
    phase: [0.46, 0.7],
    position: [-0.9, 0.03, 0.04],
    rotation: [0, 0, -0.025],
  },
  {
    id: "motorRight",
    phase: [0.46, 0.7],
    position: [0.9, 0.03, 0.04],
    rotation: [0, 0, 0.025],
  },
  {
    id: "chassisLower",
    phase: [0.4, 0.62],
    position: [0, -0.28, 0],
    rotation: [0.02, 0, 0],
    scale: 0.985,
  },
  {
    id: "structural",
    phase: [0.42, 0.8],
    position: [0, 0.13, 0],
    scale: 0.97,
  },
  {
    id: "battery",
    phase: [0.28, 0.5],
    position: [0.55, 0.78, 0.18],
    rotation: [0.04, 0.08, 0.02],
  },
  {
    id: "motorDriver",
    phase: [0.28, 0.5],
    position: [1.08, 0.18, 0.3],
    rotation: [0.04, 0.1, 0.07],
  },
  {
    id: "chassisUpper",
    phase: [0.4, 0.62],
    position: [0, 0.82, 0],
    rotation: [-0.05, 0.02, 0.02],
    scale: 1.015,
  },
  {
    id: "wires",
    phase: [0.12, 0.34],
    position: [0, 1.35, 0.08],
    rotation: [0.08, -0.02, -0.03],
  },
  {
    id: "arduino",
    phase: [0.12, 0.34],
    position: [0, 1.42, 0.08],
    rotation: [0.08, -0.02, -0.03],
    scale: 1.015,
  },
  {
    id: "irSensor",
    phase: [0.84, 0.96],
    position: [0, -0.2, 0.82],
    rotation: [0.04, 0, 0],
  },
] satisfies readonly RobotMotionConfig[];
