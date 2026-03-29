import * as THREE from 'three';
import { SceneSpec, ObjectSpec } from './types';
import { buildObject } from './ObjectBuilder';
import { buildMaterial } from './MaterialBuilder';
import { ObjectStateMachine } from './StateMachine';
import { processAnimation } from './MotionEngine';

export interface SceneObjects {
  objects: THREE.Object3D[];
  stateMachines: Map<string, ObjectStateMachine>;
  animatedObjects: { obj: THREE.Object3D; spec: ObjectSpec }[];
  camera?: { position: [number, number, number]; fov: number; lookAt: [number, number, number] };
}

export function clearScene(scene: THREE.Scene) {
  const toRemove: THREE.Object3D[] = [];
  scene.traverse((child) => {
    if (child === scene) return;
    toRemove.push(child);
  });
  // Only remove direct children
  while (scene.children.length > 0) {
    const child = scene.children[0];
    scene.remove(child);
    child.traverse((c) => {
      if (c instanceof THREE.Mesh) {
        c.geometry?.dispose();
        if (Array.isArray(c.material)) {
          c.material.forEach((m) => m.dispose());
        } else {
          c.material?.dispose();
        }
      }
    });
  }
}

export function buildSceneFromSpec(scene: THREE.Scene, spec: SceneSpec): SceneObjects {
  clearScene(scene);

  // Background
  if (spec.background) {
    scene.background = new THREE.Color(spec.background);
  }

  // Fog
  if (spec.fog) {
    scene.fog = new THREE.FogExp2(spec.fog.color, spec.fog.density);
  }

  // Ground
  if (spec.ground) {
    const groundGeo = new THREE.PlaneGeometry(spec.ground.size, spec.ground.size);
    const groundMat = buildMaterial(spec.ground.material);
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = spec.ground.y ?? 0;
    ground.receiveShadow = true;
    ground.name = '__ground';
    scene.add(ground);
  }

  // Lights
  for (const lightSpec of spec.lights) {
    let light: THREE.Light;
    const color = lightSpec.color || '#ffffff';
    const intensity = lightSpec.intensity ?? 1;

    switch (lightSpec.type) {
      case 'directional': {
        const dl = new THREE.DirectionalLight(color, intensity);
        if (lightSpec.position) dl.position.set(...lightSpec.position);
        if (lightSpec.castShadow) {
          dl.castShadow = true;
          dl.shadow.mapSize.width = 2048;
          dl.shadow.mapSize.height = 2048;
          dl.shadow.camera.near = 0.1;
          dl.shadow.camera.far = 50;
          dl.shadow.camera.left = -15;
          dl.shadow.camera.right = 15;
          dl.shadow.camera.top = 15;
          dl.shadow.camera.bottom = -15;
        }
        light = dl;
        break;
      }
      case 'point': {
        const pl = new THREE.PointLight(color, intensity, lightSpec.distance || 0);
        if (lightSpec.position) pl.position.set(...lightSpec.position);
        if (lightSpec.castShadow) pl.castShadow = true;
        light = pl;
        break;
      }
      case 'spot': {
        const sl = new THREE.SpotLight(
          color,
          intensity,
          lightSpec.distance || 0,
          lightSpec.angle ?? Math.PI / 4,
          lightSpec.penumbra ?? 0.5
        );
        if (lightSpec.position) sl.position.set(...lightSpec.position);
        if (lightSpec.castShadow) {
          sl.castShadow = true;
          sl.shadow.mapSize.width = 1024;
          sl.shadow.mapSize.height = 1024;
        }
        light = sl;
        break;
      }
      case 'hemisphere': {
        light = new THREE.HemisphereLight(color, lightSpec.groundColor || '#444444', intensity);
        if (lightSpec.position) light.position.set(...lightSpec.position);
        break;
      }
      case 'ambient':
      default:
        light = new THREE.AmbientLight(color, intensity);
        break;
    }

    scene.add(light);
  }

  // Objects
  const objects: THREE.Object3D[] = [];
  const stateMachines = new Map<string, ObjectStateMachine>();
  const animatedObjects: { obj: THREE.Object3D; spec: ObjectSpec }[] = [];

  for (const objSpec of spec.objects) {
    const obj = buildObject(objSpec);
    scene.add(obj);
    objects.push(obj);

    // State machine
    if (objSpec.states) {
      const sm = new ObjectStateMachine(obj, objSpec.states);
      stateMachines.set(objSpec.name, sm);
    }

    // Animation tracking
    if (objSpec.animation) {
      animatedObjects.push({ obj, spec: objSpec });
    }
  }

  return {
    objects,
    stateMachines,
    animatedObjects,
    camera: spec.camera,
  };
}

export function updateAnimations(
  animatedObjects: { obj: THREE.Object3D; spec: ObjectSpec }[],
  elapsed: number,
  delta: number
) {
  for (const { obj, spec } of animatedObjects) {
    if (spec.animation) {
      processAnimation(obj, spec.animation, elapsed, delta);
    }
  }
}

export function updateStateMachines(stateMachines: Map<string, ObjectStateMachine>) {
  for (const sm of stateMachines.values()) {
    sm.update();
  }
}
