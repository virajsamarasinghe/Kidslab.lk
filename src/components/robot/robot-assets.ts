export const robotAssetPaths = {
  model: "/robot/line-follower.glb",
  components: {
    wheel: "/robot/components/robot-wheel-realistic.png",
    gearMotor: "/robot/components/tt-gear-motor-realistic.png",
    assembledFallback: "/robot/components/assembled-robot-realistic.png",
  },
  references: {
    assembled: "/robot/references/assembled-reference.webp",
    exploded: "/robot/references/exploded-reference.webp",
  },
} as const;

/**
 * A production GLB can replace the procedural model once the exact physical
 * kit is supplied. Until then the procedural model is the primary 3D scene,
 * so no missing network asset can break the landing page.
 */
export const availableRobotModelAsset: string | undefined = undefined;
