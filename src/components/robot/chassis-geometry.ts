import * as THREE from "three";

export const CHASSIS_WIDTH = 4.2;
export const CHASSIS_LENGTH = 6.25;
export const CHASSIS_THICKNESS = 0.08;

export const CHASSIS_MOUNTS = {
  FrontLeft: [-1.56, 2.02],
  FrontRight: [1.56, 2.02],
  RearLeft: [-1.56, -2.18],
  RearRight: [1.56, -2.18],
} as const satisfies Record<string, readonly [number, number]>;

export const CASTER_MOUNT = [0, 2.42] as const;

function circleHole(shape: THREE.Shape, x: number, z: number, radius: number) {
  const hole = new THREE.Path();
  hole.absarc(x, z, radius, 0, Math.PI * 2, true);
  shape.holes.push(hole);
}

function slotHole(shape: THREE.Shape, x: number, z: number, width: number, length: number) {
  const halfWidth = width / 2;
  const halfStraight = (length - width) / 2;
  const hole = new THREE.Path();
  hole.moveTo(x - halfWidth, z - halfStraight);
  hole.absarc(x, z - halfStraight, halfWidth, Math.PI, 0, true);
  hole.lineTo(x + halfWidth, z + halfStraight);
  hole.absarc(x, z + halfStraight, halfWidth, 0, -Math.PI, true);
  hole.closePath();
  shape.holes.push(hole);
}

/** Same rounded-front, square-rear acrylic plate used by the reference robot. */
export function createChassisShape() {
  const halfWidth = CHASSIS_WIDTH / 2;
  const rear = -CHASSIS_LENGTH / 2;
  const front = CHASSIS_LENGTH / 2;
  const shoulder = 1.1;
  const shape = new THREE.Shape();

  shape.moveTo(-1.72, rear);
  shape.lineTo(1.72, rear);
  shape.quadraticCurveTo(halfWidth, rear, halfWidth, rear + 0.38);
  shape.lineTo(halfWidth, shoulder);
  shape.bezierCurveTo(halfWidth, 2.2, 1.22, front, 0, front);
  shape.bezierCurveTo(-1.22, front, -halfWidth, 2.2, -halfWidth, shoulder);
  shape.lineTo(-halfWidth, rear + 0.38);
  shape.quadraticCurveTo(-halfWidth, rear, -1.72, rear);
  shape.closePath();

  Object.values(CHASSIS_MOUNTS).forEach(([x, z]) => circleHole(shape, x, z, 0.085));

  // Functional mounting pattern visible on the physical kit.
  [
    [-0.78, 1.9, 0.12], [0.78, 1.9, 0.12],
    [-0.55, 1.45, 0.09], [0.55, 1.45, 0.09],
    [-1.02, 0.78, 0.09], [0, 0.78, 0.14], [1.02, 0.78, 0.09],
    [-0.68, 0.2, 0.11], [0.68, 0.2, 0.11],
    [-1.08, -0.48, 0.1], [0, -0.48, 0.15], [1.08, -0.48, 0.1],
    [-0.72, -1.18, 0.09], [0.72, -1.18, 0.09],
    [-0.92, -2.48, 0.1], [0, -2.52, 0.1], [0.92, -2.48, 0.1],
  ].forEach(([x, z, radius]) => circleHole(shape, x, z, radius));

  // Long attachment slots are deliberately real cut-outs, so they read from
  // the back and side during the full turn.
  [
    [-1.72, -1.35], [1.72, -1.35],
    [-1.72, 0.25], [1.72, 0.25],
    [-0.62, -2.68], [0.62, -2.68],
    [-0.62, 2.5], [0.62, 2.5],
  ].forEach(([x, z]) => slotHole(shape, x, z, 0.13, 0.58));

  return shape;
}

