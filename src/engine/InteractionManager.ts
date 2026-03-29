import * as THREE from 'three';
import { ObjectStateMachine } from './StateMachine';

export class InteractionManager {
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private camera: THREE.Camera;
  private scene: THREE.Scene;
  private canvas: HTMLCanvasElement;
  private stateMachines: Map<string, ObjectStateMachine>;
  private hoveredObject: THREE.Object3D | null = null;
  private onSelect: ((obj: THREE.Object3D | null) => void) | null = null;

  constructor(
    camera: THREE.Camera,
    scene: THREE.Scene,
    canvas: HTMLCanvasElement,
    stateMachines: Map<string, ObjectStateMachine>
  ) {
    this.camera = camera;
    this.scene = scene;
    this.canvas = canvas;
    this.stateMachines = stateMachines;

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);

    canvas.addEventListener('mousemove', this.onMouseMove);
    canvas.addEventListener('click', this.onClick);
    canvas.addEventListener('touchstart', this.onTouchStart, { passive: true });
  }

  setSelectCallback(cb: (obj: THREE.Object3D | null) => void) {
    this.onSelect = cb;
  }

  updateRefs(
    camera: THREE.Camera,
    scene: THREE.Scene,
    stateMachines: Map<string, ObjectStateMachine>
  ) {
    this.camera = camera;
    this.scene = scene;
    this.stateMachines = stateMachines;
  }

  private updateMouse(clientX: number, clientY: number) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  }

  private findInteractableParent(obj: THREE.Object3D): THREE.Object3D | null {
    let current: THREE.Object3D | null = obj;
    while (current) {
      if (current.userData.spec) return current;
      current = current.parent;
    }
    return null;
  }

  private getIntersectedObject(): THREE.Object3D | null {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    for (const hit of intersects) {
      if (hit.object.name === '__ground') continue;
      const parent = this.findInteractableParent(hit.object);
      if (parent) return parent;
    }
    return null;
  }

  private onMouseMove(e: MouseEvent) {
    this.updateMouse(e.clientX, e.clientY);
    const hit = this.getIntersectedObject();

    if (hit !== this.hoveredObject) {
      // Un-hover previous
      if (this.hoveredObject) {
        const sm = this.stateMachines.get(this.hoveredObject.name);
        if (sm) sm.transitionTo('idle');
        this.canvas.style.cursor = 'default';
      }
      // Hover new
      if (hit) {
        const sm = this.stateMachines.get(hit.name);
        if (sm && sm.states.hover) sm.transitionTo('hover');
        this.canvas.style.cursor = 'pointer';
      }
      this.hoveredObject = hit;
    }
  }

  private onClick(e: MouseEvent) {
    this.updateMouse(e.clientX, e.clientY);
    const hit = this.getIntersectedObject();

    if (hit) {
      const sm = this.stateMachines.get(hit.name);
      if (sm && sm.states.active) {
        sm.transitionTo('active');
        setTimeout(() => {
          if (sm.states.hover && this.hoveredObject === hit) {
            sm.transitionTo('hover');
          } else {
            sm.transitionTo('idle');
          }
        }, 400);
      }
    }

    this.onSelect?.(hit);
  }

  private onTouchStart(e: TouchEvent) {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      this.updateMouse(touch.clientX, touch.clientY);
      const hit = this.getIntersectedObject();
      this.onSelect?.(hit);
    }
  }

  dispose() {
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('click', this.onClick);
    this.canvas.removeEventListener('touchstart', this.onTouchStart);
  }
}
