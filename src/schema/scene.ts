/**
 * Canonical Scene Schema — TypeScript mirror of the Python Pydantic models.
 * This is the single source of truth for the frontend.
 * All rendering, editing, and export flows consume this schema.
 */

// ─── Environment ──────────────────────────────────────────
export interface SceneEnvironment {
  background: string;
  fogColor?: string;
  fogDensity?: number;
  ambientIntensity: number;
  environmentPreset?: 'studio' | 'sunset' | 'night' | 'warehouse';
}

// ─── Camera ───────────────────────────────────────────────
export interface SceneCamera {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
}

// ─── Lights ───────────────────────────────────────────────
export type LightType = 'directional' | 'point' | 'spot' | 'hemisphere' | 'ambient';

export interface SceneLight {
  type: LightType;
  color: string;
  intensity: number;
  position?: [number, number, number];
  castShadow?: boolean;
  groundColor?: string;
  target?: [number, number, number];
  distance?: number;
  angle?: number;
  penumbra?: number;
}

// ─── Materials ────────────────────────────────────────────
export interface SceneMaterial {
  type: 'standard' | 'physical' | 'basic';
  color: string;
  roughness: number;
  metalness: number;
  emissive?: string;
  emissiveIntensity?: number;
  opacity?: number;
  transparent?: boolean;
  wireframe?: boolean;
  clearcoat?: number;
  transmission?: number;
  doubleSide?: boolean;
}

// ─── Geometry ─────────────────────────────────────────────
export type GeometryType =
  | 'sphere' | 'box' | 'cylinder' | 'cone' | 'torus' | 'torusKnot'
  | 'dodecahedron' | 'icosahedron' | 'octahedron' | 'plane' | 'ring'
  | 'lathe' | 'extrude' | 'terrain' | 'roundedBox';

export interface SceneGeometry {
  type: GeometryType;
  params?: Record<string, unknown>;
}

// ─── Animation ────────────────────────────────────────────
export interface FloatAnimation {
  amplitude: number;
  speed: number;
  phase?: number;
  baseY?: number;
}

export interface SwayAnimation {
  axis: 'x' | 'y' | 'z';
  amplitude: number;
  speed: number;
  phase?: number;
}

export interface PulseAnimation {
  baseScale?: number;
  amplitude: number;
  speed: number;
  phase?: number;
}

export interface OrbitAnimation {
  center?: [number, number, number];
  radius: number;
  speed: number;
  phase?: number;
  tilt?: number;
}

export interface KeyframeStep {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number] | number;
  dur: number;
  ease?: string;
}

export interface KeyframeAnimation {
  loop?: boolean;
  frames: KeyframeStep[];
}

export interface EmissivePulseAnimation {
  min: number;
  max: number;
  speed: number;
  phase?: number;
}

export interface PathAnimation {
  points: [number, number, number][];
  speed: number;
  loop?: boolean;
}

export interface SceneAnimation {
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  float?: FloatAnimation;
  sway?: SwayAnimation;
  pulse?: PulseAnimation;
  orbit?: OrbitAnimation;
  path?: PathAnimation;
  keyframes?: KeyframeAnimation;
  emissivePulse?: EmissivePulseAnimation;
  partAnimations?: (SceneAnimation & { partIndex: number })[];
}

// ─── Objects ──────────────────────────────────────────────
export interface ObjectPart {
  geometry: SceneGeometry;
  material?: SceneMaterial;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number] | number;
}

export interface StateSpec {
  position?: [number, number, number];
  scale?: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  opacity?: number;
}

export interface SceneObject {
  name: string;
  geometry?: SceneGeometry;
  material?: SceneMaterial;
  parts?: ObjectPart[];
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number] | number;
  animation?: SceneAnimation;
  states?: Record<string, StateSpec>;
  semanticRole?: 'hero' | 'accent' | 'background' | 'lighting';
  semanticTags?: string[];
}

// ─── Revision History ─────────────────────────────────────
export interface SceneRevision {
  id: string;
  timestamp: string;
  prompt?: string;
  revisionText?: string;
  changesSummary: string;
  sceneSnapshot?: SceneDocument;
}

// ─── Metadata ─────────────────────────────────────────────
export type SceneCategory =
  | 'product_pedestal' | 'abstract_shapes' | 'architectural'
  | 'sci_fi' | 'gallery' | 'real_estate';

export interface SceneMetadata {
  title?: string;
  category?: SceneCategory;
  style?: string;
  mood?: string;
  complexity: number;   // 0–1
  realism: number;      // 0–1
}

// ─── Scene Document (top-level) ───────────────────────────
export interface SceneDocument {
  version: string;
  metadata: SceneMetadata;
  environment: SceneEnvironment;
  camera: SceneCamera;
  lights: SceneLight[];
  objects: SceneObject[];
  ground?: {
    size: number;
    y: number;
    material: SceneMaterial;
  };
  revisions: SceneRevision[];
}

// ─── API Request/Response Types ───────────────────────────
export interface GenerateRequest {
  prompt: string;
  style?: string;
  realism?: number;
  complexity?: number;
  animationAmount?: number;
  cameraFraming?: 'eye_level' | 'low_angle' | 'top_down' | 'dramatic';
}

export interface ReviseRequest {
  scene: SceneDocument;
  instruction: string;
}

export interface ExportRequest {
  scene: SceneDocument;
  format: 'json' | 'gltf_config' | 'embed_config';
}

// ─── Defaults ─────────────────────────────────────────────
export function createEmptyScene(): SceneDocument {
  return {
    version: '1.0',
    metadata: { complexity: 0.5, realism: 0.5 },
    environment: {
      background: '#0a0e1a',
      ambientIntensity: 0.4,
    },
    camera: {
      position: [8, 6, 8],
      lookAt: [0, 1, 0],
      fov: 50,
    },
    lights: [],
    objects: [],
    revisions: [],
  };
}
