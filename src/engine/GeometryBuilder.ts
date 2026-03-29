import * as THREE from 'three';
import { GeometrySpec } from './types';

export function buildGeometry(spec: GeometrySpec): THREE.BufferGeometry {
  const p = spec.params || {};

  switch (spec.type) {
    case 'sphere':
      return new THREE.SphereGeometry(
        p.radius as number ?? 1,
        p.widthSegments as number ?? 32,
        p.heightSegments as number ?? 32
      );

    case 'box':
      return new THREE.BoxGeometry(
        p.width as number ?? 1,
        p.height as number ?? 1,
        p.depth as number ?? 1
      );

    case 'cylinder':
      return new THREE.CylinderGeometry(
        p.radiusTop as number ?? 0.5,
        p.radiusBottom as number ?? 0.5,
        p.height as number ?? 1,
        p.radialSegments as number ?? 32
      );

    case 'cone':
      return new THREE.ConeGeometry(
        p.radius as number ?? 0.5,
        p.height as number ?? 1,
        p.radialSegments as number ?? 32
      );

    case 'torus':
      return new THREE.TorusGeometry(
        p.radius as number ?? 1,
        p.tube as number ?? 0.3,
        p.radialSegments as number ?? 16,
        p.tubularSegments as number ?? 48
      );

    case 'torusKnot':
      return new THREE.TorusKnotGeometry(
        p.radius as number ?? 1,
        p.tube as number ?? 0.3,
        p.tubularSegments as number ?? 64,
        p.radialSegments as number ?? 8,
        p.p as number ?? 2,
        p.q as number ?? 3
      );

    case 'dodecahedron':
      return new THREE.DodecahedronGeometry(p.radius as number ?? 1, p.detail as number ?? 0);

    case 'icosahedron':
      return new THREE.IcosahedronGeometry(p.radius as number ?? 1, p.detail as number ?? 0);

    case 'octahedron':
      return new THREE.OctahedronGeometry(p.radius as number ?? 1, p.detail as number ?? 0);

    case 'plane':
      return new THREE.PlaneGeometry(
        p.width as number ?? 1,
        p.height as number ?? 1,
        p.widthSegments as number ?? 1,
        p.heightSegments as number ?? 1
      );

    case 'ring':
      return new THREE.RingGeometry(
        p.innerRadius as number ?? 0.5,
        p.outerRadius as number ?? 1,
        p.thetaSegments as number ?? 32
      );

    case 'lathe': {
      const pts = (p.points as [number, number][]) || [
        [0, 0], [0.5, 0], [0.5, 1], [0.3, 1.2], [0, 1.2],
      ];
      const vectors = pts.map(([x, y]) => new THREE.Vector2(x, y));
      return new THREE.LatheGeometry(vectors, p.segments as number ?? 32);
    }

    case 'extrude': {
      const vertices = (p.vertices as [number, number][]) || [
        [0, 0], [1, 0], [0.5, 1],
      ];
      const shape = new THREE.Shape();
      shape.moveTo(vertices[0][0], vertices[0][1]);
      for (let i = 1; i < vertices.length; i++) {
        shape.lineTo(vertices[i][0], vertices[i][1]);
      }
      shape.closePath();
      return new THREE.ExtrudeGeometry(shape, {
        depth: p.depth as number ?? 0.5,
        bevelEnabled: (p.bevelEnabled as boolean) ?? false,
        bevelThickness: p.bevelThickness as number ?? 0.1,
        bevelSize: p.bevelSize as number ?? 0.1,
        bevelSegments: p.bevelSegments as number ?? 3,
      });
    }

    case 'terrain': {
      const size = p.size as number ?? 20;
      const segments = p.segments as number ?? 64;
      const heightScale = p.heightScale as number ?? 2;
      const geo = new THREE.PlaneGeometry(size, size, segments, segments);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z =
          Math.sin(x * 0.5) * Math.cos(y * 0.3) * heightScale * 0.5 +
          Math.sin(x * 0.2 + y * 0.4) * heightScale * 0.3 +
          Math.cos(x * 0.8 - y * 0.6) * heightScale * 0.2;
        pos.setZ(i, z);
      }
      geo.computeVertexNormals();
      geo.rotateX(-Math.PI / 2);
      return geo;
    }

    default:
      return new THREE.BoxGeometry(1, 1, 1);
  }
}
