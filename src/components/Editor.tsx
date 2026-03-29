'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Viewport, { ViewportHandle } from './Viewport';
import Sidebar from './Sidebar';
import ScenePanel from './ScenePanel';
import InspectorPanel from './InspectorPanel';
import HistoryPanel from './HistoryPanel';
import PromptInput from './PromptInput';
import { presets } from '@/lib/presets';
import { SceneSpec, ObjectSpec, AnimationSpec } from '@/engine/types';
import {
  buildSceneFromSpec,
  updateAnimations,
  updateStateMachines,
  SceneObjects,
} from '@/engine/SceneBuilder';
import { ObjectStateMachine } from '@/engine/StateMachine';

interface HistoryEntry {
  prompt: string;
  timestamp: number;
}

function getAnimationTags(anim?: AnimationSpec): string[] {
  if (!anim) return [];
  const tags: string[] = [];
  if (anim.rotateX || anim.rotateY || anim.rotateZ) tags.push('rotate');
  if (anim.float) tags.push('float');
  if (anim.sway) tags.push('sway');
  if (anim.pulse) tags.push('pulse');
  if (anim.orbit) tags.push('orbit');
  if (anim.path) tags.push('path');
  if (anim.keyframes) tags.push('keyframes');
  if (anim.emissivePulse) tags.push('emissivePulse');
  if (anim.partAnimations) tags.push('partAnimations');
  return tags;
}

function getObjectInfo(spec: ObjectSpec) {
  return {
    name: spec.name,
    type: spec.parts ? 'compound' : 'mesh',
    partCount: spec.parts?.length || 0,
    animationTags: getAnimationTags(spec.animation),
  };
}

export default function Editor() {
  const [activeTab, setActiveTab] = useState<'scene' | 'inspector' | 'history'>('scene');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activePreset, setActivePreset] = useState<string | undefined>();
  const [selectedObjectName, setSelectedObjectName] = useState<string | null>(null);
  const [sceneSpec, setSceneSpec] = useState<SceneSpec | null>(null);

  const viewportRef = useRef<ViewportHandle>(null);
  const sceneObjectsRef = useRef<SceneObjects | null>(null);

  const handleAnimate = useCallback((elapsed: number, delta: number) => {
    const so = sceneObjectsRef.current;
    if (!so) return;
    updateAnimations(so.animatedObjects, elapsed, delta);
    updateStateMachines(so.stateMachines);
  }, []);

  const handleObjectSelect = useCallback((name: string | null) => {
    setSelectedObjectName(name);
    if (name) setActiveTab('inspector');
  }, []);

  const applyScene = useCallback((spec: SceneSpec) => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const scene = viewport.getScene();
    const sceneObjects = buildSceneFromSpec(scene, spec);
    sceneObjectsRef.current = sceneObjects;
    setSceneSpec(spec);

    // Update camera if specified
    if (sceneObjects.camera) {
      const cam = viewport.camera;
      if (cam) {
        cam.position.set(...sceneObjects.camera.position);
        cam.fov = sceneObjects.camera.fov;
        cam.updateProjectionMatrix();
      }
    }

    // Set up interaction manager with new state machines
    viewport.updateInteraction(sceneObjects.stateMachines);
  }, []);

  const handleGenerate = useCallback(
    async (prompt: string) => {
      setLoading(true);
      setError(undefined);

      setHistory((prev) => [{ prompt, timestamp: Date.now() }, ...prev]);

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Generation failed');

        applyScene(data.scene as SceneSpec);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [applyScene]
  );

  const handlePresetClick = useCallback(
    (name: string) => {
      const preset = presets.find((p) => p.name === name);
      if (preset) {
        setActivePreset(name);
        handleGenerate(preset.prompt);
      }
    },
    [handleGenerate]
  );

  const handleTriggerState = useCallback((objectName: string, stateName: string) => {
    const so = sceneObjectsRef.current;
    if (!so) return;
    const sm = so.stateMachines.get(objectName);
    if (sm) sm.transitionTo(stateName);
  }, []);

  // Build selected object info for inspector
  const selectedObjectInfo = (() => {
    if (!selectedObjectName || !sceneSpec) return null;
    const objSpec = sceneSpec.objects.find((o) => o.name === selectedObjectName);
    if (!objSpec) return null;

    const so = sceneObjectsRef.current;
    const obj3d = so?.objects.find((o) => o.name === selectedObjectName);

    return {
      name: objSpec.name,
      type: objSpec.parts ? 'compound' : 'mesh',
      partCount: objSpec.parts?.length || 0,
      position: (obj3d
        ? [obj3d.position.x, obj3d.position.y, obj3d.position.z]
        : objSpec.position || [0, 0, 0]) as [number, number, number],
      scale: (obj3d
        ? [obj3d.scale.x, obj3d.scale.y, obj3d.scale.z]
        : typeof objSpec.scale === 'number'
          ? [objSpec.scale, objSpec.scale, objSpec.scale]
          : objSpec.scale || [1, 1, 1]) as [number, number, number],
      animation: objSpec.animation as Record<string, unknown> | undefined,
      parts: objSpec.parts?.map((p, i) => ({
        geometry: p.geometry.type,
        color: p.material?.color || '#888888',
        animation: objSpec.animation?.partAnimations
          ?.filter((pa) => pa.partIndex === i)
          .flatMap((pa) => getAnimationTags(pa)),
      })),
      states: objSpec.states ? Object.keys(objSpec.states) : undefined,
    };
  })();

  // Scene info
  const sceneInfo = sceneSpec
    ? {
        background: sceneSpec.background || '#000000',
        lightCount: sceneSpec.lights.length,
        animatedCount: sceneSpec.objects.filter((o) => o.animation).length,
        objectCount: sceneSpec.objects.length,
      }
    : { background: '#0f1729', lightCount: 0, animatedCount: 0, objectCount: 0 };

  const objectList = sceneSpec?.objects.map(getObjectInfo) || [];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0a0e1a]">
      <Sidebar activeTab={activeTab} onTabChange={(t) => setActiveTab(t as 'scene' | 'inspector' | 'history')}>
        {activeTab === 'scene' && (
          <ScenePanel
            presets={presets.map((p) => ({ name: p.name, description: p.description }))}
            objects={objectList}
            sceneInfo={sceneInfo}
            onPresetClick={handlePresetClick}
            activePreset={activePreset}
          />
        )}
        {activeTab === 'inspector' && (
          <InspectorPanel
            selectedObject={selectedObjectInfo}
            onTriggerState={handleTriggerState}
          />
        )}
        {activeTab === 'history' && (
          <HistoryPanel history={history} onRerun={handleGenerate} />
        )}
      </Sidebar>

      <div className="flex-1 flex flex-col relative">
        <Viewport
          ref={viewportRef}
          onAnimate={handleAnimate}
          onObjectSelect={handleObjectSelect}
          className="flex-1"
        />
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0e1a] via-[#0a0e1a]/80 to-transparent pointer-events-none">
          <div className="pointer-events-auto max-w-2xl mx-auto">
            <PromptInput onSubmit={handleGenerate} loading={loading} error={error} />
          </div>
        </div>
      </div>
    </div>
  );
}
