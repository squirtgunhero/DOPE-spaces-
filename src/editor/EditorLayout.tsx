'use client';

import { Suspense, useCallback, useState } from 'react';
import { useSceneStore } from '@/store/scene-store';
import LeftPanel from '@/panels/LeftPanel';
import RightPanel from '@/panels/RightPanel';
import RevisionBar from '@/panels/RevisionBar';
import dynamic from 'next/dynamic';

const SceneRenderer = dynamic(() => import('@/viewport/SceneRenderer'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[var(--color-adobe-bg)]">
      <div className="text-[var(--color-adobe-text-tertiary)] text-[12px]">Loading viewport…</div>
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
  const toggleLeftPanel = useSceneStore((s) => s.toggleLeftPanel);
  const toggleRightPanel = useSceneStore((s) => s.toggleRightPanel);
  const [paused, setPaused] = useState(false);

  const handleSelectObject = useCallback(
    (name: string | null) => selectObject(name),
    [selectObject],
  );

  const isWorking = status === 'generating' || status === 'revising';

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--color-adobe-bg)]">
      {/* ─── Top toolbar ─── */}
      <div className="h-10 min-h-[40px] flex items-center justify-between px-3 bg-[var(--color-adobe-surface)] border-b border-[var(--color-adobe-border)]">
        {/* Left: brand + panel toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleLeftPanel}
            className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${leftPanelOpen ? 'bg-[var(--color-adobe-accent)]/15 text-[var(--color-adobe-accent)]' : 'text-[var(--color-adobe-text-tertiary)] hover:text-[var(--color-adobe-text-secondary)]'}`}
            title="Toggle left panel"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="2" width="5" height="12" rx="1" stroke="currentColor" strokeWidth="1.2" />
              <rect x="8" y="2" width="7" height="12" rx="1" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.4" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[var(--color-adobe-accent)] flex items-center justify-center">
              <svg width="11" height="11" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L18 7V13L10 18L2 13V7L10 2Z" fill="white" fillOpacity="0.9" />
              </svg>
            </div>
            <span className="text-[13px] font-semibold text-[var(--color-adobe-text)] tracking-tight">DOPE [spaces]</span>
          </div>
        </div>

        {/* Center: status */}
        <div className="flex items-center gap-2">
          {isWorking && (
            <div className="flex items-center gap-2 text-[var(--color-adobe-accent)]">
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
                <path fill="currentColor" opacity="0.8" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-[12px] font-medium">
                {status === 'generating' ? 'Generating…' : 'Revising…'}
              </span>
            </div>
          )}
        </div>

        {/* Right: viewport controls + panel toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPaused((p) => !p)}
            className="h-7 px-2.5 flex items-center gap-1.5 rounded text-[11px] font-medium text-[var(--color-adobe-text-secondary)] hover:text-[var(--color-adobe-text)] hover:bg-[var(--color-adobe-elevated)] transition-colors"
          >
            {paused ? (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><polygon points="1,0 10,5 1,10" /></svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><rect x="1" y="0" width="3" height="10" /><rect x="6" y="0" width="3" height="10" /></svg>
            )}
            {paused ? 'Play' : 'Pause'}
          </button>
          <div className="w-px h-4 bg-[var(--color-adobe-border)]" />
          <button
            onClick={toggleRightPanel}
            className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${rightPanelOpen ? 'bg-[var(--color-adobe-accent)]/15 text-[var(--color-adobe-accent)]' : 'text-[var(--color-adobe-text-tertiary)] hover:text-[var(--color-adobe-text-secondary)]'}`}
            title="Toggle right panel"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="2" width="7" height="12" rx="1" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.4" />
              <rect x="10" y="2" width="5" height="12" rx="1" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </button>
        </div>
      </div>

      {/* ─── Main area ─── */}
      <div className="flex flex-1 min-h-0">
        {/* Left Panel */}
        {leftPanelOpen && (
          <div className="w-[300px] min-w-[300px] flex flex-col border-r border-[var(--color-adobe-border)] bg-[var(--color-adobe-panel)]">
            <LeftPanel />
          </div>
        )}

        {/* Center — Viewport */}
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
          <div className="w-[280px] min-w-[280px] flex flex-col border-l border-[var(--color-adobe-border)] bg-[var(--color-adobe-panel)]">
            <RightPanel />
          </div>
        )}
      </div>
    </div>
  );
}
