import type { RobotMotionConfig, RobotPartId } from "./robot-types";

// The photographs already contain perspective. All layers share this image
// plane; projecting each part independently would move it off its mounting hole.
export const framePhotoSize = 1254;
export const framePlateSize = [6.2, 4.16] as const;
export const framePlateGap = 0.72;

export function framePhotoPoint(x: number, y: number, height = 0): readonly [number, number, number] {
  return [
    (x / framePhotoSize - 0.5) * framePlateSize[0],
    (0.5 - y / framePhotoSize) * framePlateSize[1] + height,
    0,
  ];
}

// Actual hole centers in chassis-plate-photo.png. Every fastener on an axis
// derives from the same point on both identically sized plates.
const mounts = {
  FrontLeft: [188, 600],
  FrontRight: [455, 908],
  RearLeft: [835, 284],
  RearRight: [1107, 570],
} as const;

export const frameBaseLayout = {
  frameLower: [0, 0, 0],
  frameUpper: [0, framePlateGap, 0],
  standoffFrontLeft: framePhotoPoint(...mounts.FrontLeft),
  standoffFrontRight: framePhotoPoint(...mounts.FrontRight),
  standoffRearLeft: framePhotoPoint(...mounts.RearLeft),
  standoffRearRight: framePhotoPoint(...mounts.RearRight),
  upperScrewFrontLeft: framePhotoPoint(...mounts.FrontLeft, framePlateGap),
  upperScrewFrontRight: framePhotoPoint(...mounts.FrontRight, framePlateGap),
  upperScrewRearLeft: framePhotoPoint(...mounts.RearLeft, framePlateGap),
  upperScrewRearRight: framePhotoPoint(...mounts.RearRight, framePlateGap),
  lowerNutFrontLeft: framePhotoPoint(...mounts.FrontLeft, -0.035),
  lowerNutFrontRight: framePhotoPoint(...mounts.FrontRight, -0.035),
  lowerNutRearLeft: framePhotoPoint(...mounts.RearLeft, -0.035),
  lowerNutRearRight: framePhotoPoint(...mounts.RearRight, -0.035),
  caster: framePhotoPoint(258, 862, -0.025),
} as const satisfies Record<RobotPartId, readonly [number, number, number]>;

/** Vertical separation preserves the mounting axes, including on reverse scroll. */
export const robotMotionConfig: readonly RobotMotionConfig[] = [
  { id: "frameLower", phase: [0.16, 0.64], basePosition: frameBaseLayout.frameLower, position: [0, -0.7, 0] },
  { id: "frameUpper", phase: [0.16, 0.64], basePosition: frameBaseLayout.frameUpper, position: [0, 0.95, 0] },
  ...(["FrontLeft", "FrontRight", "RearLeft", "RearRight"] as const).flatMap((mount): RobotMotionConfig[] => {
    const standoff = `standoff${mount}` as const;
    const screw = `upperScrew${mount}` as const;
    const nut = `lowerNut${mount}` as const;

    return [
      { id: standoff, phase: [0.24, 0.72], basePosition: frameBaseLayout[standoff], position: [0, 0.1, 0] },
      { id: screw, phase: [0.04, 0.32], basePosition: frameBaseLayout[screw], position: [0, 0.48, 0], follows: "frameUpper" },
      { id: nut, phase: [0.08, 0.4], basePosition: frameBaseLayout[nut], position: [0, -0.24, 0], follows: "frameLower" },
    ];
  }),
  { id: "caster", phase: [0.68, 0.96], basePosition: frameBaseLayout.caster, position: [0, -0.42, 0], follows: "frameLower" },
];
