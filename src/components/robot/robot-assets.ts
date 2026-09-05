export const robotAssetPaths = {
  model: "/robot/line-follower.glb",
  components: {
    framePlate: "/robot/components/chassis-plate-photo.png",
    standoff: "/robot/components/brass-standoff-photo.png",
    screw: "/robot/components/frame-screw-photo.png",
    nut: "/robot/components/frame-nut-photo.png",
    caster: "/robot/components/frame-caster-photo.png",
    frameAssemblyFallback: "/robot/components/frame-assembly-photo.png",
  },
  references: {
    assembled: "/robot/references/assembled-reference.webp",
    exploded: "/robot/references/exploded-reference.webp",
  },
} as const;

/**
 * A production GLB can replace the photo-derived layers once the exact
 * physical kit model is supplied. Until then the layered scene stays local,
 * so no missing network asset can break the landing page.
 */
export const availableRobotModelAsset: string | undefined = undefined;
