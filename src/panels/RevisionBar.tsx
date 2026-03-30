'use client';

import { useState, useCallback, KeyboardEvent } from 'react';
import { useSceneStore } from '@/store/scene-store';

const EXAMPLE_REVISIONS = [
  'make it more cinematic',
  'warmer lighting',
  'add floating particles',
  'more reflective materials',
  'lower the camera angle',
  'less cluttered',
];

export default function RevisionBar() {
  const [text, setText] = useState('');
  const status = useSceneStore((s) => s.status);
  const revise = useSceneStore((s) => s.revise);
  const scene = useSceneStore((s) => s.scene);
  const clearError = useSceneStore((s) => s.clearError);

  const hasScene = scene.objects.length > 0;
  const isWorking = status === 'generating' || status === 'revising';

  const handleRevise = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || isWorking || !hasScene) return;
    clearError();
    revise(trimmed);
    setText('');
  }, [text, isWorking, hasScene, revise, clearError]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleRevise();
      }
    },
    [handleRevise],
  );

  const handleChip = useCallback(
    (instruction: string) => {
      if (isWorking || !hasScene) return;
      clearError();
      revise(instruction);
    },
    [isWorking, hasScene, revise, clearError],
  );

  if (!hasScene) return null;

  return (
    <div className="border-t border-white/[0.04] bg-[#07090f]/90 backdrop-blur-xl px-4 py-3">
      {/* Revision chips */}
      <div className="flex gap-1.5 mb-2.5 overflow-x-auto pb-1 scrollbar-none">
        {EXAMPLE_REVISIONS.map((r) => (
          <button
            key={r}
            onClick={() => handleChip(r)}
            disabled={isWorking}
            className="shrink-0 px-2.5 py-1 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[11px] text-white/30 hover:text-white/55 hover:bg-white/[0.05] transition-all duration-200 disabled:opacity-30"
          >
            {r}
          </button>
        ))}
      </div>

      {/* Revision input */}
      <div className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.05] rounded-xl px-3 py-2 focus-within:border-violet-500/20 transition-all">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-white/15 shrink-0">
          <path d="M1 13L4.5 9.5M4.5 9.5L9 1L13 5L4.5 9.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Revise scene... (e.g., 'make it more cinematic')"
          disabled={isWorking}
          className="flex-1 bg-transparent text-[13px] text-white/70 placeholder:text-white/15 focus:outline-none disabled:opacity-40"
        />
        {text.trim() && (
          <button
            onClick={handleRevise}
            disabled={isWorking}
            className="text-[11px] text-violet-400/70 hover:text-violet-300 font-medium transition-colors shrink-0"
          >
            Apply
          </button>
        )}
      </div>
    </div>
  );
}
