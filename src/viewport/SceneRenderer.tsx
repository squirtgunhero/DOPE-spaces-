'use client';

import React, { Suspense, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Environment, Grid } from '@react-three/drei';
import * as THREE from 'three';
import type {
  SceneDocument,
  SceneObject,
  SceneLight,
  SceneGeometry,
  SceneMaterial,
  SceneAnimation,
  ObjectPart,
  EmissivePulseAnimation,
} from '@/schema/scene';

// ─── Props ──────────────────────────────────────────────────
interface SceneRendererProps {
  scene: SceneDocument;
  selectedObjectName: string | null;
  onSelectObject: (name: string | null) => void;
  paused?: boolean;
}

// ─── Helpers ────────────────────────────────────────────────
function normalizeScale(s: [number, number, number] | number | undefined): [number, number, number] {
  if (s == null) return [1, 1, 1];
  if (typeof s === 'number') return [s, s, s];
  return s;
}

function toEuler(r: [number, number, number] | undefined): [number, number, number] {
  if (!r) return [0, 0, 0];
  return r;
}

function toVec3(v: [number, number, number] | undefined, fallback: [number, number, number] = [0, 0, 0]): [number, number, number] {
  return v ?? fallback;
}

function colorToThree(c: string | undefined, fallback = '#000000'): string {
  return c ?? fallback;
}

// ─── DynamicGeometry ────────────────────────────────────────
function DynamicGeometry({ geo }: { geo: SceneGeometry }) {
  const p = geo.params ?? {};

  switch (geo.type) {
    case 'sphere':
      return (
        <sphereGeometry
          args={[
            (p.radius as number) ?? 1,
            (p.widthSegments as number) ?? 32,
            (p.heightSegments as number) ?? 32,
          ]}
        />
      );
    case 'box':
      return (
        <boxGeometry
          args={[
            (p.width as number) ?? 1,
            (p.height as number) ?? 1,
            (p.depth as number) ?? 1,
          ]}
        />
      );
    case 'cylinder':
      return (
        <cylinderGeometry
          args={[
            (p.radiusTop as number) ?? 1,
            (p.radiusBottom as number) ?? 1,
            (p.height as number) ?? 2,
            (p.radialSegments as number) ?? 32,
          ]}
        />
      );
    case 'cone':
      return (
        <coneGeometry
          args={[
            (p.radius as number) ?? 1,
            (p.height as number) ?? 2,
            (p.radialSegments as number) ?? 32,
          ]}
        />
      );
    case 'torus':
      return (
        <torusGeometry
          args={[
            (p.radius as number) ?? 1,
            (p.tube as number) ?? 0.4,
            (p.radialSegments as number) ?? 16,
            (p.tubularSegments as number) ?? 48,
          ]}
        />
      );
    case 'torusKnot':
      return (
        <torusKnotGeometry
          args={[
            (p.radius as number) ?? 1,
            (p.tube as number) ?? 0.3,
            (p.tubularSegments as number) ?? 64,
            (p.radialSegments as number) ?? 8,
            (p.p as number) ?? 2,
            (p.q as number) ?? 3,
          ]}
        />
      );
    case 'dodecahedron':
      return <dodecahedronGeometry args={[(p.radius as number) ?? 1, (p.detail as number) ?? 0]} />;
    case 'icosahedron':
      return <icosahedronGeometry args={[(p.radius as number) ?? 1, (p.detail as number) ?? 0]} />;
    case 'octahedron':
      return <octahedronGeometry args={[(p.radius as number) ?? 1, (p.detail as number) ?? 0]} />;
    case 'plane':
      return (
        <planeGeometry
          args={[
            (p.width as number) ?? 1,
            (p.height as number) ?? 1,
            (p.widthSegments as number) ?? 1,
            (p.heightSegments as number) ?? 1,
          ]}
        />
      );
    case 'ring':
      return (
        <ringGeometry
          args={[
            (p.innerRadius as number) ?? 0.5,
            (p.outerRadius as number) ?? 1,
            (p.thetaSegments as number) ?? 32,
          ]}
        />
      );
    case 'roundedBox':
      // drei's RoundedBox is a component — fall back to a box with segments
      return (
        <boxGeometry
          args={[
            (p.width as number) ?? 1,
            (p.height as number) ?? 1,
            (p.depth as number) ?? 1,
          ]}
        />
      );
    case 'lathe':
    case 'extrude':
    case 'terrain':
      return <ImperativeGeometry geo={geo} />;
    default:
      return <sphereGeometry args={[1, 32, 32]} />;
  }
}

/** Imperative geometry for lathe, extrude, terrain */
function ImperativeGeometry({ geo }: { geo: SceneGeometry }) {
  const geometry = useMemo(() => {
    const p = geo.params ?? {};

    if (geo.type === 'lathe') {
      const rawPoints = (p.points as [number, number][]) ?? [
        [0, 0], [0.5, 0], [0.5, 1], [0.2, 1.2],
      ];
      const pts = rawPoints.map(([x, y]) => new THREE.Vector2(x, y));
      return new THREE.LatheGeometry(pts, (p.segments as number) ?? 32);
    }

    if (geo.type === 'extrude') {
      const shape = new THREE.Shape();
      const rawPath = (p.shapePath as [number, number][]) ?? [
        [-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5],
      ];
      if (rawPath.length > 0) {
        shape.moveTo(rawPath[0][0], rawPath[0][1]);
        for (let i = 1; i < rawPath.length; i++) {
          shape.lineTo(rawPath[i][0], rawPath[i][1]);
        }
        shape.closePath();
      }
      return new THREE.ExtrudeGeometry(shape, {
        depth: (p.depth as number) ?? 1,
        bevelEnabled: (p.bevelEnabled as boolean) ?? false,
        bevelThickness: (p.bevelThickness as number) ?? 0.1,
        bevelSize: (p.bevelSize as number) ?? 0.1,
        bevelSegments: (p.bevelSegments as number) ?? 3,
      });
    }

    if (geo.type === 'terrain') {
      const size = (p.size as number) ?? 10;
      const segments = (p.segments as number) ?? 64;
      const heightScale = (p.heightScale as number) ?? 1;
      const g = new THREE.PlaneGeometry(size, size, segments, segments);
      g.rotateX(-Math.PI / 2);
      const posAttr = g.getAttribute('position');
      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const z = posAttr.getZ(i);
        const y = Math.sin(x * 0.5) * Math.cos(z * 0.5) * heightScale;
        posAttr.setY(i, y);
      }
      posAttr.needsUpdate = true;
      g.computeVertexNormals();
      return g;
    }

    return new THREE.SphereGeometry(1, 32, 32);
  }, [geo]);

  return <primitive object={geometry} attach="geometry" />;
}

// ─── DynamicMaterial ────────────────────────────────────────
function DynamicMaterial({ mat, meshRef }: { mat: SceneMaterial; meshRef?: React.RefObject<THREE.Mesh | null> }) {
  const common: Record<string, unknown> = {
    color: mat.color,
    roughness: mat.roughness,
    metalness: mat.metalness,
    opacity: mat.opacity ?? 1,
    transparent: mat.transparent ?? (mat.opacity != null && mat.opacity < 1),
    wireframe: mat.wireframe ?? false,
    side: mat.doubleSide ? THREE.DoubleSide : THREE.FrontSide,
  };

  if (mat.emissive) {
    common.emissive = mat.emissive;
    common.emissiveIntensity = mat.emissiveIntensity ?? 1;
  }

  if (mat.type === 'basic') {
    return (
      <meshBasicMaterial
        color={common.color as string}
        opacity={common.opacity as number}
        transparent={common.transparent as boolean}
        wireframe={common.wireframe as boolean}
        side={common.side as THREE.Side}
      />
    );
  }

  if (mat.type === 'physical') {
    return (
      <meshPhysicalMaterial
        {...(common as Record<string, unknown>)}
        clearcoat={mat.clearcoat ?? 0}
        transmission={mat.transmission ?? 0}
      />
    );
  }

  // default: standard
  return <meshStandardMaterial {...(common as Record<string, unknown>)} />;
}

// ─── useObjectAnimation ─────────────────────────────────────
function useObjectAnimation(
  ref: React.RefObject<THREE.Object3D | null>,
  anim: SceneAnimation | undefined,
  paused: boolean,
  basePos: [number, number, number],
) {
  // Store base values to prevent compounding
  const baseRef = useRef({
    pos: new THREE.Vector3(...basePos),
    rot: new THREE.Euler(),
    scale: new THREE.Vector3(1, 1, 1),
    initialized: false,
  });

  useFrame((state) => {
    const obj = ref.current;
    if (!obj || !anim || paused) return;

    const t = state.clock.elapsedTime;

    // Capture base on first frame
    if (!baseRef.current.initialized) {
      baseRef.current.pos.copy(obj.position);
      baseRef.current.rot.copy(obj.rotation);
      baseRef.current.scale.copy(obj.scale);
      baseRef.current.initialized = true;
    }

    const base = baseRef.current;

    // Reset to base before applying all animations
    obj.position.copy(base.pos);
    obj.rotation.copy(base.rot);
    obj.scale.copy(base.scale);

    // rotateX / rotateY / rotateZ — continuous rotation speed (rad/s)
    if (anim.rotateX) obj.rotation.x += t * anim.rotateX;
    if (anim.rotateY) obj.rotation.y += t * anim.rotateY;
    if (anim.rotateZ) obj.rotation.z += t * anim.rotateZ;

    // float
    if (anim.float) {
      const f = anim.float;
      const baseY = f.baseY ?? base.pos.y;
      obj.position.y = baseY + Math.sin(t * f.speed + (f.phase ?? 0)) * f.amplitude;
    }

    // sway
    if (anim.sway) {
      const s = anim.sway;
      const offset = Math.sin(t * s.speed + (s.phase ?? 0)) * s.amplitude;
      switch (s.axis) {
        case 'x': obj.position.x += offset; break;
        case 'y': obj.position.y += offset; break;
        case 'z': obj.position.z += offset; break;
      }
    }

    // pulse
    if (anim.pulse) {
      const p = anim.pulse;
      const bs = p.baseScale ?? 1;
      const factor = bs + Math.sin(t * p.speed + (p.phase ?? 0)) * p.amplitude;
      obj.scale.setScalar(factor);
    }

    // orbit
    if (anim.orbit) {
      const o = anim.orbit;
      const cx = o.center?.[0] ?? 0;
      const cy = o.center?.[1] ?? base.pos.y;
      const cz = o.center?.[2] ?? 0;
      const angle = t * o.speed + (o.phase ?? 0);
      const tilt = o.tilt ?? 0;
      obj.position.x = cx + Math.cos(angle) * o.radius;
      obj.position.z = cz + Math.sin(angle) * o.radius;
      obj.position.y = cy + Math.sin(angle) * Math.sin(tilt) * o.radius;
    }

    // path
    if (anim.path && anim.path.points.length >= 2) {
      const pts = anim.path.points;
      const totalLen = pts.length;
      const loopDuration = totalLen / anim.path.speed;
      let progress = (t / loopDuration) % 1;
      if (!anim.path.loop && t / loopDuration >= 1) progress = 0.999;
      const idx = progress * (totalLen - 1);
      const i = Math.floor(idx);
      const frac = idx - i;
      const a = pts[Math.min(i, totalLen - 1)];
      const b = pts[Math.min(i + 1, totalLen - 1)];
      obj.position.set(
        a[0] + (b[0] - a[0]) * frac,
        a[1] + (b[1] - a[1]) * frac,
        a[2] + (b[2] - a[2]) * frac,
      );
    }

    // keyframes
    if (anim.keyframes && anim.keyframes.frames.length > 0) {
      const kf = anim.keyframes;
      const totalDur = kf.frames.reduce((sum, f) => sum + f.dur, 0);
      let elapsed = kf.loop ? (t % totalDur) : Math.min(t, totalDur);
      let accum = 0;
      for (let i = 0; i < kf.frames.length; i++) {
        const frame = kf.frames[i];
        if (elapsed <= accum + frame.dur) {
          const frac = (elapsed - accum) / frame.dur;
          const next = kf.frames[Math.min(i + 1, kf.frames.length - 1)];
          if (frame.position && next.position) {
            obj.position.set(
              frame.position[0] + (next.position[0] - frame.position[0]) * frac,
              frame.position[1] + (next.position[1] - frame.position[1]) * frac,
              frame.position[2] + (next.position[2] - frame.position[2]) * frac,
            );
          }
          if (frame.rotation && next.rotation) {
            obj.rotation.set(
              frame.rotation[0] + (next.rotation[0] - frame.rotation[0]) * frac,
              frame.rotation[1] + (next.rotation[1] - frame.rotation[1]) * frac,
              frame.rotation[2] + (next.rotation[2] - frame.rotation[2]) * frac,
            );
          }
          if (frame.scale != null && next.scale != null) {
            const sA = typeof frame.scale === 'number' ? frame.scale : frame.scale[0];
            const sB = typeof next.scale === 'number' ? next.scale : next.scale[0];
            const sLerp = sA + (sB - sA) * frac;
            if (typeof frame.scale === 'number') {
              obj.scale.setScalar(sLerp);
            } else {
              const nsA = frame.scale;
              const nsB = typeof next.scale === 'number' ? [next.scale, next.scale, next.scale] as [number, number, number] : next.scale;
              obj.scale.set(
                nsA[0] + (nsB[0] - nsA[0]) * frac,
                nsA[1] + (nsB[1] - nsA[1]) * frac,
                nsA[2] + (nsB[2] - nsA[2]) * frac,
              );
            }
          }
          break;
        }
        accum += frame.dur;
      }
    }

    // emissivePulse — handled by the material component separately

    // partAnimations
    if (anim.partAnimations) {
      for (const pa of anim.partAnimations) {
        const child = obj.children[pa.partIndex];
        if (!child) continue;
        if (pa.rotateY) child.rotation.y = t * pa.rotateY;
        if (pa.rotateX) child.rotation.x = t * pa.rotateX;
        if (pa.rotateZ) child.rotation.z = t * pa.rotateZ;
        if (pa.float) {
          child.position.y = (pa.float.baseY ?? 0) + Math.sin(t * pa.float.speed + (pa.float.phase ?? 0)) * pa.float.amplitude;
        }
      }
    }
  });
}

// ─── EmissivePulseUpdater ───────────────────────────────────
function EmissivePulseUpdater({
  meshRef,
  pulse,
  paused,
}: {
  meshRef: React.RefObject<THREE.Mesh | null>;
  pulse: EmissivePulseAnimation;
  paused: boolean;
}) {
  useFrame((state) => {
    if (paused) return;
    const mesh = meshRef.current;
    if (!mesh) return;
    const mat = mesh.material as THREE.MeshStandardMaterial;
    if (!mat || !('emissiveIntensity' in mat)) return;
    const t = state.clock.elapsedTime;
    const val = pulse.min + (pulse.max - pulse.min) * (0.5 + 0.5 * Math.sin(t * pulse.speed + (pulse.phase ?? 0)));
    mat.emissiveIntensity = val;
  });
  return null;
}

// ─── SelectionHighlight ─────────────────────────────────────
function SelectionHighlight({ objRef }: { objRef: React.RefObject<THREE.Object3D | null> }) {
  const boxRef = useRef<THREE.LineSegments>(null);

  useFrame(() => {
    const obj = objRef.current;
    const box = boxRef.current;
    if (!obj || !box) return;

    const bbox = new THREE.Box3().setFromObject(obj);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    bbox.getSize(size);
    bbox.getCenter(center);

    box.position.copy(center);
    box.scale.set(size.x || 0.1, size.y || 0.1, size.z || 0.1);
  });

  return (
    <lineSegments ref={boxRef}>
      <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
      <lineBasicMaterial color="#00d4ff" linewidth={1} transparent opacity={0.8} />
    </lineSegments>
  );
}

// ─── SceneObjectMesh — a single mesh with geometry + material
function SceneObjectMesh({
  geo,
  mat,
  position,
  rotation,
  scale,
  isSelected,
  onSelect,
  castShadow,
  receiveShadow,
  animation,
  paused,
}: {
  geo: SceneGeometry;
  mat?: SceneMaterial;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  isSelected: boolean;
  onSelect: () => void;
  castShadow?: boolean;
  receiveShadow?: boolean;
  animation?: SceneAnimation;
  paused: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  useObjectAnimation(meshRef, animation, paused, position);

  const defaultMat: SceneMaterial = {
    type: 'standard',
    color: '#888888',
    roughness: 0.5,
    metalness: 0.1,
  };
  const material = mat ?? defaultMat;

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect();
  }, [onSelect]);

  return (
    <>
      <mesh
        ref={meshRef}
        position={position}
        rotation={rotation}
        scale={scale}
        castShadow={castShadow ?? true}
        receiveShadow={receiveShadow ?? true}
        onClick={handleClick}
      >
        <DynamicGeometry geo={geo} />
        <DynamicMaterial mat={material} meshRef={meshRef} />
      </mesh>
      {animation?.emissivePulse && (
        <EmissivePulseUpdater meshRef={meshRef} pulse={animation.emissivePulse} paused={paused} />
      )}
      {isSelected && <SelectionHighlight objRef={meshRef as React.RefObject<THREE.Object3D | null>} />}
    </>
  );
}

// ─── SceneObjectGroup — compound object with parts array ────
function SceneObjectGroup({
  parts,
  position,
  rotation,
  scale,
  isSelected,
  onSelect,
  animation,
  paused,
}: {
  parts: ObjectPart[];
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  isSelected: boolean;
  onSelect: () => void;
  animation?: SceneAnimation;
  paused: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  useObjectAnimation(groupRef, animation, paused, position);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect();
  }, [onSelect]);

  const defaultMat: SceneMaterial = {
    type: 'standard',
    color: '#888888',
    roughness: 0.5,
    metalness: 0.1,
  };

  return (
    <>
      <group
        ref={groupRef}
        position={position}
        rotation={rotation}
        scale={scale}
        onClick={handleClick}
      >
        {parts.map((part, i) => {
          const pPos = toVec3(part.position);
          const pRot = toEuler(part.rotation);
          const pScale = normalizeScale(part.scale);
          return (
            <mesh
              key={i}
              position={pPos}
              rotation={pRot}
              scale={pScale}
              castShadow
              receiveShadow
            >
              <DynamicGeometry geo={part.geometry} />
              <DynamicMaterial mat={part.material ?? defaultMat} />
            </mesh>
          );
        })}
      </group>
      {isSelected && <SelectionHighlight objRef={groupRef as React.RefObject<THREE.Object3D | null>} />}
    </>
  );
}

// ─── SceneObjectRenderer ────────────────────────────────────
function SceneObjectRenderer({
  obj,
  isSelected,
  onSelect,
  paused,
}: {
  obj: SceneObject;
  isSelected: boolean;
  onSelect: () => void;
  paused: boolean;
}) {
  const pos = toVec3(obj.position);
  const rot = toEuler(obj.rotation);
  const scl = normalizeScale(obj.scale);

  if (obj.parts && obj.parts.length > 0) {
    return (
      <SceneObjectGroup
        parts={obj.parts}
        position={pos}
        rotation={rot}
        scale={scl}
        isSelected={isSelected}
        onSelect={onSelect}
        animation={obj.animation}
        paused={paused}
      />
    );
  }

  if (obj.geometry) {
    return (
      <SceneObjectMesh
        geo={obj.geometry}
        mat={obj.material}
        position={pos}
        rotation={rot}
        scale={scl}
        isSelected={isSelected}
        onSelect={onSelect}
        animation={obj.animation}
        paused={paused}
      />
    );
  }

  // Object with neither geometry nor parts — empty group placeholder
  return null;
}

// ─── SceneLightRenderer ─────────────────────────────────────
function SceneLightRenderer({ light }: { light: SceneLight }) {
  const pos = toVec3(light.position, [5, 5, 5]);

  switch (light.type) {
    case 'directional': {
      const target = light.target ?? [0, 0, 0];
      return (
        <directionalLight
          position={pos}
          color={light.color}
          intensity={light.intensity}
          castShadow={light.castShadow ?? true}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
          target-position={target}
        />
      );
    }
    case 'point':
      return (
        <pointLight
          position={pos}
          color={light.color}
          intensity={light.intensity}
          distance={light.distance ?? 0}
          castShadow={light.castShadow ?? false}
        />
      );
    case 'spot':
      return (
        <spotLight
          position={pos}
          color={light.color}
          intensity={light.intensity}
          distance={light.distance ?? 0}
          angle={light.angle ?? Math.PI / 6}
          penumbra={light.penumbra ?? 0.5}
          castShadow={light.castShadow ?? true}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
      );
    case 'hemisphere':
      return (
        <hemisphereLight
          position={pos}
          color={light.color}
          groundColor={light.groundColor ?? '#444444'}
          intensity={light.intensity}
        />
      );
    case 'ambient':
      return <ambientLight color={light.color} intensity={light.intensity} />;
    default:
      return null;
  }
}

// ─── Ground ─────────────────────────────────────────────────
function GroundPlane({ size, y, material }: { size: number; y: number; material: SceneMaterial }) {
  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <DynamicMaterial mat={material} />
    </mesh>
  );
}

// ─── CameraSetup ────────────────────────────────────────────
function CameraSetup({ lookAt }: { lookAt: [number, number, number] }) {
  const { camera } = useThree();
  const didSetup = useRef(false);

  useFrame(() => {
    if (!didSetup.current) {
      camera.lookAt(...lookAt);
      didSetup.current = true;
    }
  });

  return null;
}

// ─── BackgroundColor ────────────────────────────────────────
function BackgroundColor({ color }: { color: string }) {
  const { scene } = useThree();
  useMemo(() => {
    scene.background = new THREE.Color(color);
  }, [scene, color]);
  return null;
}

// ─── Fog ────────────────────────────────────────────────────
function SceneFog({ color, density }: { color: string; density: number }) {
  const { scene } = useThree();
  useMemo(() => {
    scene.fog = new THREE.FogExp2(color, density);
  }, [scene, color, density]);
  return null;
}

// ─── SceneContent ───────────────────────────────────────────
function SceneContent({
  scene,
  selectedObjectName,
  onSelectObject,
  paused,
}: {
  scene: SceneDocument;
  selectedObjectName: string | null;
  onSelectObject: (name: string | null) => void;
  paused: boolean;
}) {
  const handleBackgroundClick = useCallback(() => {
    onSelectObject(null);
  }, [onSelectObject]);

  return (
    <>
      {/* Camera look-at target */}
      <CameraSetup lookAt={scene.camera.lookAt} />

      {/* Background */}
      <BackgroundColor color={scene.environment.background} />

      {/* Fog */}
      {scene.environment.fogColor && scene.environment.fogDensity && (
        <SceneFog
          color={scene.environment.fogColor}
          density={scene.environment.fogDensity}
        />
      )}

      {/* Ambient from environment */}
      <ambientLight intensity={scene.environment.ambientIntensity} />

      {/* Lights */}
      {(scene.lights ?? []).map((light, i) => (
        <SceneLightRenderer key={`light-${i}`} light={light} />
      ))}

      {/* Environment preset */}
      {scene.environment.environmentPreset && (
        <Environment preset={scene.environment.environmentPreset} />
      )}

      {/* Ground plane */}
      {scene.ground && (
        <GroundPlane
          size={scene.ground.size}
          y={scene.ground.y}
          material={scene.ground.material}
        />
      )}

      {/* Subtle grid */}
      <Grid
        args={[30, 30]}
        position={[0, scene.ground?.y ?? 0, 0]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#1a1a2e"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#2a2a4e"
        fadeDistance={40}
        fadeStrength={1}
        infiniteGrid
      />

      {/* Click background to deselect */}
      <mesh
        position={[0, -50, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
        onClick={handleBackgroundClick}
      >
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Objects */}
      {(scene.objects ?? []).map((obj) => (
        <SceneObjectRenderer
          key={obj.name}
          obj={obj}
          isSelected={selectedObjectName === obj.name}
          onSelect={() => onSelectObject(obj.name)}
          paused={paused}
        />
      ))}
    </>
  );
}

// ─── Loading fallback ───────────────────────────────────────
function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#333" wireframe />
    </mesh>
  );
}

// ─── Main Component ─────────────────────────────────────────
function SceneRenderer({
  scene,
  selectedObjectName,
  onSelectObject,
  paused = false,
}: SceneRendererProps) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{
          position: scene.camera.position,
          fov: scene.camera.fov,
          near: 0.1,
          far: 1000,
        }}
        gl={{
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
          antialias: true,
        }}
        onPointerMissed={() => onSelectObject(null)}
      >
        <Suspense fallback={<LoadingFallback />}>
          <SceneContent
            scene={scene}
            selectedObjectName={selectedObjectName}
            onSelectObject={onSelectObject}
            paused={paused}
          />
        </Suspense>
        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          minDistance={1}
          maxDistance={100}
          target={scene.camera.lookAt}
        />
      </Canvas>
    </div>
  );
}

export default SceneRenderer;
