/**
 * Central Zustand store — owns all scene state, generation, revision, history.
 * The UI reads from here. The viewport renders from here.
 */

import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import {
  SceneDocument,
  SceneRevision,
  SceneObject,
  createEmptyScene,
} from '@/schema/scene';
import { generateScene, reviseScene, exportScene } from './api';

// ─── Types ────────────────────────────────────────────────

export type GenerationStatus = 'idle' | 'generating' | 'revising' | 'exporting' | 'error';
export type RightTab = 'graph' | 'properties' | 'history' | 'export';

interface GenerationParams {
  style?: string;
  realism: number;
  complexity: number;
  animationAmount: number;
  cameraFraming?: string;
}

// ─── Store Interface ──────────────────────────────────────

interface SceneStore {
  // Scene state
  scene: SceneDocument;
  status: GenerationStatus;
  error: string | null;

  // Selection
  selectedObjectName: string | null;

  // UI state
  rightTab: RightTab;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;

  // Generation params
  params: GenerationParams;

  // History
  versions: SceneRevision[];
  currentVersionIndex: number;

  // Actions — generation
  generate: (prompt: string) => Promise<void>;
  revise: (instruction: string) => Promise<void>;

  // Actions — scene editing
  setScene: (scene: SceneDocument) => void;
  updateObject: (name: string, updates: Partial<SceneObject>) => void;
  removeObject: (name: string) => void;
  selectObject: (name: string | null) => void;

  // Actions — UI
  setRightTab: (tab: RightTab) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;

  // Actions — params
  setParams: (params: Partial<GenerationParams>) => void;

  // Actions — history
  restoreVersion: (index: number) => void;

  // Actions — export
  exportAs: (format: 'json' | 'gltf_config' | 'embed_config') => Promise<Record<string, unknown>>;

  // Actions — error
  clearError: () => void;
}

// ─── Helpers ──────────────────────────────────────────────

function snapshotRevision(
  scene: SceneDocument,
  prompt?: string,
  revisionText?: string,
  summary?: string,
): SceneRevision {
  return {
    id: uuid(),
    timestamp: new Date().toISOString(),
    prompt,
    revisionText,
    changesSummary: summary || (prompt ? `Generated: "${prompt}"` : 'Scene updated'),
    sceneSnapshot: JSON.parse(JSON.stringify(scene)),
  };
}

// ─── Store ────────────────────────────────────────────────

export const useSceneStore = create<SceneStore>((set, get) => ({
  // Initial state
  scene: createEmptyScene(),
  status: 'idle',
  error: null,
  selectedObjectName: null,
  rightTab: 'graph',
  leftPanelOpen: true,
  rightPanelOpen: true,
  params: {
    realism: 0.5,
    complexity: 0.5,
    animationAmount: 0.5,
  },
  versions: [],
  currentVersionIndex: -1,

  // ─── Generation ───────────────────────────────────────

  generate: async (prompt: string) => {
    set({ status: 'generating', error: null });
    try {
      const { params } = get();
      const scene = await generateScene({
        prompt,
        style: params.style,
        realism: params.realism,
        complexity: params.complexity,
        animationAmount: params.animationAmount,
        cameraFraming: params.cameraFraming as 'eye_level' | 'low_angle' | 'top_down' | 'dramatic' | undefined,
      });

      const revision = snapshotRevision(scene, prompt, undefined, `Generated: "${prompt}"`);
      const versions = [...get().versions, revision];

      set({
        scene,
        status: 'idle',
        versions,
        currentVersionIndex: versions.length - 1,
        selectedObjectName: null,
      });
    } catch (e) {
      set({
        status: 'error',
        error: e instanceof Error ? e.message : 'Generation failed',
      });
    }
  },

  revise: async (instruction: string) => {
    set({ status: 'revising', error: null });
    try {
      const currentScene = get().scene;
      const scene = await reviseScene(currentScene, instruction);

      const revision = snapshotRevision(scene, undefined, instruction, `Revised: "${instruction}"`);
      const versions = [...get().versions, revision];

      set({
        scene,
        status: 'idle',
        versions,
        currentVersionIndex: versions.length - 1,
      });
    } catch (e) {
      set({
        status: 'error',
        error: e instanceof Error ? e.message : 'Revision failed',
      });
    }
  },

  // ─── Scene Editing ────────────────────────────────────

  setScene: (scene) => set({ scene }),

  updateObject: (name, updates) => {
    const { scene } = get();
    const objects = scene.objects.map((obj) =>
      obj.name === name ? { ...obj, ...updates } : obj,
    );
    set({ scene: { ...scene, objects } });
  },

  removeObject: (name) => {
    const { scene, selectedObjectName } = get();
    const objects = scene.objects.filter((obj) => obj.name !== name);
    set({
      scene: { ...scene, objects },
      selectedObjectName: selectedObjectName === name ? null : selectedObjectName,
    });
  },

  selectObject: (name) => {
    set({ selectedObjectName: name });
    if (name) set({ rightTab: 'properties' });
  },

  // ─── UI ───────────────────────────────────────────────

  setRightTab: (tab) => set({ rightTab: tab }),
  toggleLeftPanel: () => set((s) => ({ leftPanelOpen: !s.leftPanelOpen })),
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),

  // ─── Params ───────────────────────────────────────────

  setParams: (params) => set((s) => ({ params: { ...s.params, ...params } })),

  // ─── History ──────────────────────────────────────────

  restoreVersion: (index) => {
    const { versions } = get();
    const version = versions[index];
    if (version?.sceneSnapshot) {
      set({
        scene: JSON.parse(JSON.stringify(version.sceneSnapshot)),
        currentVersionIndex: index,
        selectedObjectName: null,
      });
    }
  },

  // ─── Export ───────────────────────────────────────────

  exportAs: async (format) => {
    set({ status: 'exporting', error: null });
    try {
      const { scene } = get();
      const result = await exportScene(scene, format);
      set({ status: 'idle' });
      return result;
    } catch (e) {
      set({
        status: 'error',
        error: e instanceof Error ? e.message : 'Export failed',
      });
      throw e;
    }
  },

  // ─── Error ────────────────────────────────────────────

  clearError: () => set({ error: null, status: 'idle' }),
}));
