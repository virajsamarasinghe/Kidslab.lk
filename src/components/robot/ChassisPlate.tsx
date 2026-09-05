import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { CHASSIS_THICKNESS, createChassisShape } from "./chassis-geometry";

export default function ChassisPlate() {
  const geometry = useMemo(() => {
    const result = new THREE.ExtrudeGeometry(createChassisShape(), {
      depth: CHASSIS_THICKNESS,
      bevelEnabled: true,
      bevelSize: 0.018,
      bevelThickness: 0.012,
      bevelSegments: 2,
      curveSegments: 18,
    });
    result.rotateX(Math.PI / 2);
    result.computeVertexNormals();
    return result;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshPhysicalMaterial
        color="#101416"
        metalness={0.18}
        roughness={0.3}
        clearcoat={0.7}
        clearcoatRoughness={0.24}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
