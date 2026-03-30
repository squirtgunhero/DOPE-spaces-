'use client';

import { useCallback, useState } from 'react';
import { useSceneStore } from '@/store/scene-store';
import RightPanel from '@/panels/RightPanel';
import RevisionBar from '@/panels/RevisionBar';
import dynamic from 'next/dynamic';
import HomeScreen from './HomeScreen';

const SceneRenderer = dynamic(() => import('@/viewport/SceneRenderer'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[#1a1a1a]">
      <div className="text-[#666] text-[13px]">Loading viewport…</div>
    </div>
  ),
});

export default function EditorLayout() {
  const scene = useSceneStore((s) => s.scene);
  const status = useSceneStore((s) => s.status);
  const selectedObjectName = useSceneStore((s) => s.selectedObjectName);
  const selectObject = useSceneStore((s) => s.selectObject);
  const rightPanelOpen = useSceneStore((s) => s.rightPanelOpen);
  const toggleRightPanel = useSceneStore((s) => s.toggleRightPanel);
  const [paused, setPaused] = useState(false);

  const handleSelectObject = useCallback(
    (name: string | null) => selectObject(name),
    [selectObject],
  );

  const hasScene = scene.objects.length > 0;
  const isWorking = status === 'generating' || status === 'revising';

  // ─── No scene yet → show prompt-first home screen ───
  if (!hasScene && !isWorking) {
    return <HomeScreen />;
  }

  // ─── Generating → show loading state ───
  if (!hasScene && isWorking) {
    return (
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#1a1a1a]">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-6">
            <svg className="animate-spin h-6 w-6 text-[#2680eb]" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" opacity="0.2" />
              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <h2 className="text-[18px] font-semibold text-white mb-2">Creating your scene</h2>
          <p className="text-[14px] text-[#888]">This usually takes 10–20 seconds…</p>
        </div>
      </div>
    );
  }

  // ─── Scene loaded → show editor ───
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#1a1a1a]">
      {/* ─── Top bar ─── */}
      <div className="h-11 min-h-[44px] flex items-center justify-between px-4 bg-[#252525] border-b border-[#333]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#2680eb] flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L18 7V13L10 18L2 13V7L10 2Z" fill="white" fillOpacity="0.9" />
              </svg>
            </div>
            <span className="text-[14px] font-semibold text-white">DOPE [spaces]</span>
          </div>
          {isWorking && (
            <div className="flex items-center gap-2 ml-4 text-[#2680eb]">
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-[12px] font-medium">
                {status === 'generating' ? 'Generating…' : 'Revising…'}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPaused((p) => !p)}
            className="h-7 px-3 rounded-md text-[12px] font-medium text-[#aaa] hover:text-white hover:bg-[#333] transition-colors"
          >
            {paused ? '▶ Play' : '⏸ Pause'}
          </button>
          <div className="w-px h-4 bg-[#333] mx-1" />
          <button
            onClick={toggleRightPanel}
            className={`h-7 px-2.5 rounded-md text-[12px] font-medium transition-colors ${
              rightPanelOpen ? 'text-[#2680eb] bg-[#2680eb]/10' : 'text-[#888] hover:text-white hover:bg-[#333]'
            }`}
          >
            Inspector
          </button>
        </div>
      </div>

      {/* ─── Main content ─── */}
      <div className="flex flex-1 min-h-0">
        {/* Viewport */}
        <div className="flex-1 flex flex-col relative min-w-0">
          <div className="flex-1">
            <SceneRenderer
              scene={scene}
              selectedObjectName={selectedObjectName}
              onSelectObject={handleSelectObject}
              paused={paused}
            />
          </div>
          <RevisionBar />
        </div>

        {/* Right Panel */}
        {rightPanelOpen && (
          <div className="w-[300px] min-w-[300px] flex flex-col border-l border-[#333] bg-[#222]">
            <RightPanel />
          </div>
        )}
      </div>
    </div>
  );
}
