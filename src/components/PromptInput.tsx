'use client';

import { useState, useCallback, KeyboardEvent } from 'react';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  loading?: boolean;
  error?: string;
}

export default function PromptInput({ onSubmit, loading = false, error }: PromptInputProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = useCallback(() => {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;
    onSubmit(trimmed);
    setPrompt('');
  }, [prompt, loading, onSubmit]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={3}
        placeholder="Describe a 3D scene with motion... (e.g., 'A windmill on a hill with spinning blades and swaying grass')"
        className="bg-[#1e293b] border border-white/10 rounded-lg p-3 text-sm text-white/90 placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none resize-none w-full"
      />

      {error && (
        <p className="text-rose-400 text-xs px-1">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !prompt.trim()}
        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium py-2.5 rounded-lg transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Generating...
          </>
        ) : (
          'Generate Scene'
        )}
      </button>
    </div>
  );
}
