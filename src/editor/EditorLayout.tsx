'use client';

import { Suspense, useCallback, useState } from 'react';
import { useSceneStore } from '@/store/scene-store';
import LeftPanel from '@/panels/LeftPanel';
import RightPanel from '@/panels/RightPanel';
import RevisionBar from '@/panels/RevisionBar';
import dynamic from 'next/dynamic';

// Dynamic import for R3F (must be client-side only)
const SceneRenderer = dynamic(() => import('@/viewport/SceneRenderer'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[#0a0e1a]">
      <div className="text-white/20 text-sm">Loading viewport...</div>
    </div>
  ),
});

export default function EditorLayout() {
  const scene = useSceneStore((s) => s.scene);
  const status = useSceneStore((s) => s.status);
  const selectedObjectName = useSceneStore((s) => s.selectedObjectName);
  const selectObject = useSceneStore((s) => s.selectObject);
  const leftPanelOpen = useSceneStore((s) => s.leftPanelOpen);
  const rightPanelOpen = useSceneStore((s) => s.rightPanelOpen);
  const [paused, setPaused] = useState(false);

  const handleSelectObject = useCallback(
    (name: string | null) => {
      selectObject(name);
    },
    [selectObject],
  );

  const isWorking = status === 'generating' || status === 'revising';

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#07090f]">
      {/* Main area */}
      <div className="flex flex-1 min-h-0">
        {/* Left Panel */}
        {leftPanelOpen && (
          <div className="w-[340px] min-w-[340px] flex flex-col border-r border-white/[0.04] bg-[#0b0f19]/95 backdrop-blur-xl">
            <LeftPanel />
          </div>
        )}

        {/* Center — Viewport */}
        <div className="flex-1 flex flex-col relative min-w-0">
          {/* Status bar */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto">
              {isWorking && (
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-xl px-3 py-1.5 border border-white/[0.06]">
                  <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                  <span className="text-[12px] text-white/60 font-medium">
                    {status === 'generating' ? 'Generating scene...' : 'Applying revision...'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                onClick={() => setPaused((p) => !p)}
                className="bg-black/30 backdrop-blur-md border border-white/[0.06] text-white/50 hover:text-white/80 hover:bg-white/[0.08] rounded-xl px-3 py-1.5 text-[12px] font-medium transition-all duration-200"
              >
                {paused ? 'Play' : 'Pause'}
              </button>
            </div>
          </div>

          {/* Viewport */}
          <div className="flex-1">
            <SceneRenderer
              scene={scene}
              selectedObjectName={selectedObjectName}
              onSelectObject={handleSelectObject}
              paused={paused}
            />
          </div>

          {/* Revision bar */}
          <RevisionBar />
        </div>

        {/* Right Panel */}
        {rightPanelOpen && (
          <div className="w-[320px] min-w-[320px] flex flex-col border-l border-white/[0.04] bg-[#0b0f19]/95 backdrop-blur-xl">
            <RightPanel />
          </div>
        )}
      </div>
    </div>
  );
}
