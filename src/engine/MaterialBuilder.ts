import * as THREE from 'three';
import { MaterialSpec } from './types';

export function buildMaterial(spec?: MaterialSpec): THREE.Material {
  if (!spec) {
    return new THREE.MeshStandardMaterial({ color: '#888888' });
  }

  const opts: Record<string, unknown> = {};

  if (spec.color) opts.color = new THREE.Color(spec.color);
  if (spec.roughness !== undefined) opts.roughness = spec.roughness;
  if (spec.metalness !== undefined) opts.metalness = spec.metalness;
  if (spec.wireframe !== undefined) opts.wireframe = spec.wireframe;
  if (spec.emissive) opts.emissive = new THREE.Color(spec.emissive);
  if (spec.emissiveIntensity !== undefined) opts.emissiveIntensity = spec.emissiveIntensity;
  if (spec.opacity !== undefined) {
    opts.opacity = spec.opacity;
    opts.transparent = true;
  }
  if (spec.doubleSide) opts.side = THREE.DoubleSide;

  switch (spec.type) {
    case 'physical': {
      if (spec.clearcoat !== undefined) opts.clearcoat = spec.clearcoat;
      if (spec.transmission !== undefined) {
        opts.transmission = spec.transmission;
        opts.transparent = true;
      }
      return new THREE.MeshPhysicalMaterial(opts as THREE.MeshPhysicalMaterialParameters);
    }
    case 'basic':
      return new THREE.MeshBasicMaterial(opts as THREE.MeshBasicMaterialParameters);
    default:
      return new THREE.MeshStandardMaterial(opts as THREE.MeshStandardMaterialParameters);
  }
}
