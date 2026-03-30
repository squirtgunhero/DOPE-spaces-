'use client';

import { useState, useCallback, KeyboardEvent, useEffect, useRef } from 'react';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  loading?: boolean;
  error?: string;
}

export default function PromptInput({ onSubmit, loading = false, error }: PromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const [showError, setShowError] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 80)}px`;
    }
  }, [prompt]);

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
    <div className="relative flex flex-col gap-2">
      {/* Error Toast */}
      {showError && error && (
        <div className="absolute -top-12 left-0 right-0 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs px-3 py-2 rounded-lg animate-in fade-in slide-in-from-bottom-2">
          {error}
        </div>
      )}

      {/* Input Container */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-2 flex items-end gap-2 backdrop-blur-sm transition-all focus-within:border-violet-500/30 focus-within:bg-white/[0.06]">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Describe a 3D scene..."
          className="flex-1 bg-transparent border-none text-sm text-white/90 placeholder:text-white/25 placeholder:italic focus:outline-none resize-none min-h-[36px] max-h-[80px] py-1.5 px-2"
        />

        <div className="flex items-center gap-1.5 shrink-0 pb-0.5">
          <span className="text-[10px] text-white/20 hidden sm:inline">
            {'\u2318\u21B5'}
          </span>
          <button
            onClick={handleSubmit}
            disabled={loading || !prompt.trim()}
            className="w-9 h-9 flex items-center justify-center bg-gradient-to-r from-violet-500 to-indigo-500 rounded-xl transition-all hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:brightness-100 shrink-0"
          >
            {loading ? (
              <svg
                className="animate-spin h-4 w-4 text-white"
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
                  strokeWidth="3"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <span className="text-white text-sm font-bold">{'\u2191'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
