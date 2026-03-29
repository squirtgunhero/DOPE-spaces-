export interface SceneSpec {
  background?: string;
  fog?: { color: string; density: number };
  ground?: { size: number; y: number; material: MaterialSpec };
  lights: LightSpec[];
  objects: ObjectSpec[];
  camera?: {
    position: [number, number, number];
    fov: number;
    lookAt: [number, number, number];
  };
}

export interface LightSpec {
  type: 'directional' | 'point' | 'spot' | 'hemisphere' | 'ambient';
  color?: string;
  intensity?: number;
  position?: [number, number, number];
  castShadow?: boolean;
  groundColor?: string;
  distance?: number;
  angle?: number;
  penumbra?: number;
}

export interface MaterialSpec {
  type?: 'standard' | 'physical' | 'basic';
  color?: string;
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  wireframe?: boolean;
  opacity?: number;
  doubleSide?: boolean;
  clearcoat?: number;
  transmission?: number;
}

export interface GeometrySpec {
  type:
    | 'sphere'
    | 'box'
    | 'cylinder'
    | 'cone'
    | 'torus'
    | 'torusKnot'
    | 'dodecahedron'
    | 'icosahedron'
    | 'octahedron'
    | 'plane'
    | 'ring'
    | 'lathe'
    | 'extrude'
    | 'terrain';
  params?: Record<string, unknown>;
}

export interface PartSpec {
  geometry: GeometrySpec;
  material?: MaterialSpec;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number] | number;
}

export interface AnimationSpec {
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;

  float?: {
    amplitude: number;
    speed: number;
    phase?: number;
    baseY?: number;
  };

  sway?: {
    axis: 'x' | 'y' | 'z';
    amplitude: number;
    speed: number;
    phase?: number;
    baseAngle?: number;
  };

  pulse?: {
    baseScale?: number;
    amplitude: number;
    speed: number;
    phase?: number;
  };

  orbit?: {
    center?: [number, number, number];
    radius: number;
    speed: number;
    phase?: number;
    faceCenter?: boolean;
    tilt?: number;
  };

  path?: {
    points: [number, number, number][];
    speed: number;
    loop?: boolean;
    faceDirection?: boolean;
  };

  keyframes?: {
    loop?: boolean;
    duration?: number;
    frames: {
      position?: [number, number, number];
      rotation?: [number, number, number];
      scale?: [number, number, number] | number;
      dur: number;
      ease?: string;
    }[];
  };

  emissivePulse?: {
    min: number;
    max: number;
    speed: number;
    phase?: number;
  };

  partAnimations?: (AnimationSpec & { partIndex: number })[];
}

export interface StateSpec {
  position?: [number, number, number];
  scale?: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  opacity?: number;
}

export interface ObjectSpec {
  name: string;
  geometry?: GeometrySpec;
  material?: MaterialSpec;
  parts?: PartSpec[];
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number] | number;
  animation?: AnimationSpec;
  states?: Record<string, StateSpec>;
}
