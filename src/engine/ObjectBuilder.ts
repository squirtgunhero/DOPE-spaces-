import * as THREE from 'three';
import { ObjectSpec, PartSpec } from './types';
import { buildGeometry } from './GeometryBuilder';
import { buildMaterial } from './MaterialBuilder';

function applyTransform(
  obj: THREE.Object3D,
  position?: [number, number, number],
  rotation?: [number, number, number],
  scale?: [number, number, number] | number
) {
  if (position) obj.position.set(...position);
  if (rotation) obj.rotation.set(...rotation);
  if (scale !== undefined) {
    if (typeof scale === 'number') {
      obj.scale.setScalar(scale);
    } else {
      obj.scale.set(...scale);
    }
  }
}

function buildPart(part: PartSpec): THREE.Mesh {
  const geometry = buildGeometry(part.geometry);
  const material = buildMaterial(part.material);
  const mesh = new THREE.Mesh(geometry, material);
  applyTransform(mesh, part.position, part.rotation, part.scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function buildObject(spec: ObjectSpec): THREE.Object3D {
  let obj: THREE.Object3D;

  if (spec.parts && spec.parts.length > 0) {
    // Compound object
    const group = new THREE.Group();
    spec.parts.forEach((part) => {
      group.add(buildPart(part));
    });
    obj = group;
  } else if (spec.geometry) {
    // Simple mesh
    const geometry = buildGeometry(spec.geometry);
    const material = buildMaterial(spec.material);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    obj = mesh;
  } else {
    obj = new THREE.Group();
  }

  obj.name = spec.name;
  applyTransform(obj, spec.position, spec.rotation, spec.scale);

  // Store spec data for animation and state machine
  obj.userData.spec = spec;

  return obj;
}
