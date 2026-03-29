import * as THREE from 'three';
import { StateSpec } from './types';
import { getEasing } from '../lib/easings';

interface Snapshot {
  position: THREE.Vector3;
  scale: THREE.Vector3;
  rotation: THREE.Euler;
  color: THREE.Color | null;
  opacity: number;
}

export class ObjectStateMachine {
  object: THREE.Object3D;
  states: Record<string, StateSpec>;
  currentState: string;
  private transitioning = false;
  private transitionStart = 0;
  private transitionDuration = 0.25;
  private snapshot: Snapshot | null = null;
  private targetState: StateSpec | null = null;

  constructor(object: THREE.Object3D, states: Record<string, StateSpec>) {
    this.object = object;
    this.states = states;
    this.currentState = 'idle';
  }

  private getFirstMaterial(): THREE.MeshStandardMaterial | null {
    let mat: THREE.MeshStandardMaterial | null = null;
    this.object.traverse((child) => {
      if (!mat && child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        mat = child.material;
      }
    });
    return mat;
  }

  private captureSnapshot(): Snapshot {
    const mat = this.getFirstMaterial();
    return {
      position: this.object.position.clone(),
      scale: this.object.scale.clone(),
      rotation: this.object.rotation.clone(),
      color: mat ? mat.color.clone() : null,
      opacity: mat ? mat.opacity : 1,
    };
  }

  transitionTo(stateName: string, duration = 0.25) {
    const state = this.states[stateName];
    if (!state) return;
    this.snapshot = this.captureSnapshot();
    this.targetState = state;
    this.currentState = stateName;
    this.transitionStart = performance.now() / 1000;
    this.transitionDuration = duration;
    this.transitioning = true;
  }

  update() {
    if (!this.transitioning || !this.snapshot || !this.targetState) return;

    const elapsed = performance.now() / 1000 - this.transitionStart;
    const rawT = Math.min(elapsed / this.transitionDuration, 1);
    const t = getEasing('inOutCubic')(rawT);
    const target = this.targetState;

    if (target.position) {
      this.object.position.lerpVectors(
        this.snapshot.position,
        new THREE.Vector3(...target.position),
        t
      );
    }

    if (target.scale) {
      this.object.scale.lerpVectors(
        this.snapshot.scale,
        new THREE.Vector3(...target.scale),
        t
      );
    }

    if (target.rotation) {
      const targetEuler = new THREE.Euler(...target.rotation);
      this.object.rotation.set(
        THREE.MathUtils.lerp(this.snapshot.rotation.x, targetEuler.x, t),
        THREE.MathUtils.lerp(this.snapshot.rotation.y, targetEuler.y, t),
        THREE.MathUtils.lerp(this.snapshot.rotation.z, targetEuler.z, t)
      );
    }

    const mat = this.getFirstMaterial();
    if (mat) {
      if (target.color && this.snapshot.color) {
        mat.color.copy(this.snapshot.color).lerp(new THREE.Color(target.color), t);
      }
      if (target.opacity !== undefined) {
        mat.opacity = THREE.MathUtils.lerp(this.snapshot.opacity, target.opacity, t);
        mat.transparent = mat.opacity < 1;
      }
    }

    if (rawT >= 1) {
      this.transitioning = false;
    }
  }
}
