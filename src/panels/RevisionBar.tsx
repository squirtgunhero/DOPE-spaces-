'use client';

import { useState, useCallback, KeyboardEvent } from 'react';
import { useSceneStore } from '@/store/scene-store';

const QUICK_REVISIONS = [
  'more cinematic',
  'warmer lighting',
  'add particles',
  'more reflective',
  'lower camera',
  'simplify',
  'add fog',
  'more colorful',
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
    <div className="border-t border-[#333] bg-[#222] px-4 py-3">
      {/* Quick chips */}
      <div className="flex gap-1.5 mb-2.5 overflow-x-auto scrollbar-none">
        {QUICK_REVISIONS.map((r) => (
          <button
            key={r}
            onClick={() => handleChip(r)}
            disabled={isWorking}
            className="shrink-0 px-2.5 py-1 rounded-full text-[11px] text-[#888] bg-[#2a2a2a] border border-[#333] hover:border-[#555] hover:text-white transition-all disabled:opacity-30"
          >
            {r}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="flex items-center gap-2.5">
        <div className="flex-1 relative">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe changes… e.g. 'make it more dramatic'"
            disabled={isWorking}
            className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3.5 py-2 text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#2680eb] transition-colors disabled:opacity-40"
          />
        </div>
        {text.trim() && (
          <button
            onClick={handleRevise}
            disabled={isWorking}
            className="h-[36px] px-4 rounded-lg text-[13px] font-semibold bg-[#2680eb] hover:bg-[#3891ff] text-white transition-colors shrink-0"
          >
            Revise
          </button>
        )}
      </div>
    </div>
  );
}
