'use client';

import { useState, useCallback, KeyboardEvent } from 'react';
import { useSceneStore } from '@/store/scene-store';

const EXAMPLE_REVISIONS = [
  'more cinematic',
  'warmer lighting',
  'add particles',
  'more reflective',
  'lower camera',
  'simplify',
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
    <div className="border-t border-[var(--color-adobe-border)] bg-[var(--color-adobe-panel)] px-3 py-2.5">
      {/* Quick revision chips */}
      <div className="flex gap-1 mb-2 overflow-x-auto scrollbar-none">
        {EXAMPLE_REVISIONS.map((r) => (
          <button
            key={r}
            onClick={() => handleChip(r)}
            disabled={isWorking}
            className="shrink-0 px-2 py-1 rounded text-[10px] font-medium text-[var(--color-adobe-text-tertiary)] bg-[var(--color-adobe-bg)] border border-[var(--color-adobe-border)] hover:border-[var(--color-adobe-border-light)] hover:text-[var(--color-adobe-text-secondary)] transition-all disabled:opacity-30"
          >
            {r}
          </button>
        ))}
      </div>

      {/* Revision input */}
      <div className="flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[var(--color-adobe-text-tertiary)] shrink-0">
          <path d="M1 13L4.5 9.5M4.5 9.5L9 1L13 5L4.5 9.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Revise scene…"
          disabled={isWorking}
          className="flex-1 bg-[var(--color-adobe-bg)] border border-[var(--color-adobe-border)] rounded px-2.5 py-1.5 text-[12px] text-[var(--color-adobe-text)] placeholder:text-[var(--color-adobe-text-tertiary)] focus:outline-none focus:border-[var(--color-adobe-accent)] transition-colors disabled:opacity-40"
        />
        {text.trim() && (
          <button
            onClick={handleRevise}
            disabled={isWorking}
            className="h-7 px-3 rounded text-[11px] font-semibold bg-[var(--color-adobe-accent)] hover:bg-[var(--color-adobe-accent-hover)] text-white transition-colors shrink-0"
          >
            Apply
          </button>
        )}
      </div>
    </div>
  );
}
