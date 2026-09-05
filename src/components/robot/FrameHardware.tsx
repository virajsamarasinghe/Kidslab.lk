import { Path, Shape, Vector2 } from "three";

const STEEL = "#bcc6d0";
const BRASS = "#c79940";
const BLACK_STEEL = "#20252b";

function circularHole(shape: Shape, radius: number, x = 0, y = 0) {
  const hole = new Path();
  hole.absarc(x, y, radius, 0, Math.PI * 2, true);
  shape.holes.push(hole);
}

function roundedRectangle(width: number, height: number, radius: number) {
  const shape = new Shape();
  const x = -width / 2;
  const y = -height / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

function hexagon(radius: number, holeRadius: number) {
  const shape = new Shape();
  for (let side = 0; side <= 6; side++) {
    const angle = (side / 6) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (side === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  circularHole(shape, holeRadius);
  return shape;
}

// A single lathed profile gives the small threaded shafts their silhouette
// without one mesh and draw call for every thread ring.
function threadProfile(length: number, radius: number, turns: number) {
  const points = [new Vector2(0, 0), new Vector2(radius * 0.82, 0)];
  for (let turn = 0; turn < turns; turn++) {
    const y = (turn / turns) * length;
    points.push(new Vector2(radius * 0.82, y));
    points.push(new Vector2(radius, y + (length / turns) * 0.42));
    points.push(new Vector2(radius * 0.82, y + (length / turns) * 0.85));
  }
  points.push(new Vector2(radius * 0.82, length), new Vector2(0, length));
  return points;
}

const screwThread = threadProfile(0.22, 0.035, 9);
const spacerThread = threadProfile(0.055, 0.049, 3);
const spacerSection = hexagon(0.092, 0.033);
const nutSection = hexagon(0.074, 0.036);
const washerSection = new Shape();
washerSection.absarc(0, 0, 0.08, 0, Math.PI * 2, false);
circularHole(washerSection, 0.036);

const screwHead = new Shape();
screwHead.absarc(0, 0, 0.084, 0, Math.PI * 2, false);
const screwRecess = new Path();
const recessPoints = [
  [-0.016, -0.052], [-0.016, -0.016], [-0.052, -0.016],
  [-0.052, 0.016], [-0.016, 0.016], [-0.016, 0.052],
  [0.016, 0.052], [0.016, 0.016], [0.052, 0.016],
  [0.052, -0.016], [0.016, -0.016], [0.016, -0.052],
] as const;
recessPoints.forEach(([x, y], index) => {
  if (index === 0) screwRecess.moveTo(x, y);
  else screwRecess.lineTo(x, y);
});
screwRecess.closePath();
screwHead.holes.push(screwRecess);

const casterPlate = roundedRectangle(0.86, 0.33, 0.06);
for (const x of [-0.3, 0.3]) {
  const slot = new Path();
  slot.moveTo(x - 0.047, -0.035);
  slot.lineTo(x - 0.047, 0.035);
  slot.absarc(x, 0.035, 0.047, Math.PI, 0, true);
  slot.lineTo(x + 0.047, -0.035);
  slot.absarc(x, -0.035, 0.047, 0, -Math.PI, true);
  slot.closePath();
  casterPlate.holes.push(slot);
}

const casterFork = new Shape();
casterFork.moveTo(-0.11, -0.14);
casterFork.lineTo(0.11, -0.14);
casterFork.bezierCurveTo(0.11, -0.25, 0.19, -0.29, 0.19, -0.42);
casterFork.bezierCurveTo(0.19, -0.56, 0.08, -0.59, -0.045, -0.555);
casterFork.bezierCurveTo(-0.16, -0.53, -0.15, -0.44, -0.13, -0.34);
casterFork.bezierCurveTo(-0.11, -0.26, -0.11, -0.2, -0.11, -0.14);
circularHole(casterFork, 0.034, 0, -0.455);

/** The complete spacer occupies y=0..height, including the short end threads. */
export function Standoff({ height }: { height: number }) {
  return (
    <group>
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <extrudeGeometry args={[spacerSection, { depth: Math.max(0.01, height - 0.12), bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.004, bevelSegments: 1, curveSegments: 12 }]} />
        <meshStandardMaterial color={BRASS} metalness={0.8} roughness={0.3} />
      </mesh>
      {[0, height - 0.055].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <latheGeometry args={[spacerThread, 12]} />
          <meshStandardMaterial color={BRASS} metalness={0.8} roughness={0.32} />
        </mesh>
      ))}
    </group>
  );
}

/** Screw head rests on y=0, with a recessed Phillips drive and downward shaft. */
export function FrameScrew() {
  return (
    <group>
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <extrudeGeometry args={[screwHead, { depth: 0.024, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2, curveSegments: 16 }]} />
        <meshStandardMaterial color={STEEL} metalness={0.86} roughness={0.26} />
      </mesh>
      <mesh position={[0, 0.0075, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.015, 20]} />
        <meshStandardMaterial color={STEEL} metalness={0.86} roughness={0.32} />
      </mesh>
      <mesh position={[0, -0.22, 0]}>
        <latheGeometry args={[screwThread, 12]} />
        <meshStandardMaterial color={STEEL} metalness={0.84} roughness={0.32} />
      </mesh>
    </group>
  );
}

/** Hollow nut and flange: its upper seating face is y=0. */
export function FrameNut() {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <mesh position={[0, 0, 0.005]}>
        <extrudeGeometry args={[washerSection, { depth: 0.005, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.003, bevelSegments: 1, curveSegments: 16 }]} />
        <meshStandardMaterial color={STEEL} metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.018]}>
        <extrudeGeometry args={[nutSection, { depth: 0.051, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.004, bevelSegments: 1, curveSegments: 12 }]} />
        <meshStandardMaterial color={STEEL} metalness={0.84} roughness={0.28} />
      </mesh>
    </group>
  );
}

/** Mounting plate top is y=0; the ball remains wholly underneath the chassis. */
export function FrameCaster() {
  return (
    <group>
      <mesh position={[0, -0.005, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <extrudeGeometry args={[casterPlate, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005, bevelSegments: 1, curveSegments: 6 }]} />
        <meshStandardMaterial color={BLACK_STEEL} metalness={0.7} roughness={0.32} />
      </mesh>
      <mesh position={[0, -0.105, 0]}>
        <cylinderGeometry args={[0.155, 0.155, 0.12, 24]} />
        <meshStandardMaterial color={BLACK_STEEL} metalness={0.75} roughness={0.28} />
      </mesh>
      {[-0.238, 0.2].map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <extrudeGeometry args={[casterFork, { depth: 0.038, bevelEnabled: false, curveSegments: 8 }]} />
          <meshStandardMaterial color={BLACK_STEEL} metalness={0.7} roughness={0.34} />
        </mesh>
      ))}
      <mesh position={[0, -0.455, 0]} scale={[0.73, 1, 1]}>
        <sphereGeometry args={[0.265, 24, 16]} />
        <meshStandardMaterial color="#111820" metalness={0.12} roughness={0.23} />
      </mesh>
      <mesh position={[0, -0.455, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.031, 0.031, 0.62, 12]} />
        <meshStandardMaterial color={STEEL} metalness={0.85} roughness={0.3} />
      </mesh>
      {([-1, 1] as const).map((side) => (
        <group key={side} position={[side * 0.239, -0.455, 0]} rotation={[0, 0, side * Math.PI / 2]}>
          <FrameNut />
        </group>
      ))}
    </group>
  );
}
