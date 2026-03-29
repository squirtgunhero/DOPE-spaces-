'use client';

import {
  useRef,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
  useState,
} from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { InteractionManager } from '@/engine/InteractionManager';
import { ObjectStateMachine } from '@/engine/StateMachine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ViewportProps {
  onAnimate?: (elapsed: number, delta: number) => void;
  onObjectSelect?: (name: string | null) => void;
  className?: string;
}

export interface ViewportHandle {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  resetCamera: () => void;
  getScene: () => THREE.Scene;
  updateInteraction: (stateMachines: Map<string, ObjectStateMachine>) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_CAM_POS = new THREE.Vector3(8, 6, 8);
const DEFAULT_CAM_TARGET = new THREE.Vector3(0, 1, 0);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Viewport = forwardRef<ViewportHandle, ViewportProps>(function Viewport(
  { onAnimate, onObjectSelect, className },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const rafRef = useRef<number>(0);
  const clockRef = useRef<THREE.Clock | null>(null);
  const interactionRef = useRef<InteractionManager | null>(null);
  const onAnimateRef = useRef(onAnimate);
  const onObjectSelectRef = useRef(onObjectSelect);

  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);

  // Keep callback refs in sync without triggering re-init.
  useEffect(() => {
    onAnimateRef.current = onAnimate;
  }, [onAnimate]);

  useEffect(() => {
    onObjectSelectRef.current = onObjectSelect;
  }, [onObjectSelect]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  // ------------------------------------------------------------------
  // Reset camera helper
  // ------------------------------------------------------------------

  const resetCamera = useCallback(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    camera.position.copy(DEFAULT_CAM_POS);
    controls.target.copy(DEFAULT_CAM_TARGET);
    controls.update();
  }, []);

  // ------------------------------------------------------------------
  // Expose imperative handle
  // ------------------------------------------------------------------

  const updateInteraction = useCallback(
    (stateMachines: Map<string, ObjectStateMachine>) => {
      const camera = cameraRef.current;
      const scene = sceneRef.current;
      const renderer = rendererRef.current;
      if (!camera || !scene || !renderer) return;

      if (interactionRef.current) {
        interactionRef.current.updateRefs(camera, scene, stateMachines);
      } else {
        const im = new InteractionManager(camera, scene, renderer.domElement, stateMachines);
        im.setSelectCallback((obj) => {
          onObjectSelectRef.current?.(obj?.name || null);
        });
        interactionRef.current = im;
      }
    },
    [],
  );

  useImperativeHandle(
    ref,
    () => ({
      get scene() {
        return sceneRef.current!;
      },
      get camera() {
        return cameraRef.current!;
      },
      get renderer() {
        return rendererRef.current!;
      },
      resetCamera,
      getScene: () => sceneRef.current!,
      updateInteraction,
    }),
    [resetCamera, updateInteraction],
  );

  // ------------------------------------------------------------------
  // Three.js initialisation & render loop
  // ------------------------------------------------------------------

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- Scene ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // --- Camera ---
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000,
    );
    camera.position.copy(DEFAULT_CAM_POS);
    camera.lookAt(DEFAULT_CAM_TARGET);
    cameraRef.current = camera;

    // --- Controls ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 50;
    controls.target.copy(DEFAULT_CAM_TARGET);
    controls.update();
    controlsRef.current = controls;

    // --- Clock ---
    const clock = new THREE.Clock();
    clockRef.current = clock;

    // --- Resize handler ---
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Also observe the container itself for layout-driven resizes.
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // --- Animation loop ---
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();
      const delta = clock.getDelta();

      controls.update();

      if (!pausedRef.current && onAnimateRef.current) {
        onAnimateRef.current(elapsed, delta);
      }

      renderer.render(scene, camera);
    };

    rafRef.current = requestAnimationFrame(animate);

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      if (interactionRef.current) {
        interactionRef.current.dispose();
        interactionRef.current = null;
      }
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      rendererRef.current = null;
      cameraRef.current = null;
      sceneRef.current = null;
      controlsRef.current = null;
      clockRef.current = null;
    };
  }, []); // Run once on mount.

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  const btnClass =
    'bg-black/40 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:bg-white/10 rounded-lg px-3 py-1.5 text-sm cursor-pointer select-none transition-colors';

  return (
    <div ref={containerRef} className={`relative w-full h-full ${className ?? ''}`}>
      {/* Info badge — top-left */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 pointer-events-none select-none">
        <span className="inline-block w-2 h-2 rounded-full bg-purple-500" />
        <span className="text-xs text-white/60 tracking-wide">AI 3D Studio</span>
      </div>

      {/* Tool buttons — top-right */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        <button
          type="button"
          className={btnClass}
          onClick={() => setPaused((p) => !p)}
        >
          {paused ? '▶ Play' : '⏸ Pause'}
        </button>
        <button type="button" className={btnClass} onClick={resetCamera}>
          ↺ Reset Camera
        </button>
      </div>
    </div>
  );
});

export default Viewport;
