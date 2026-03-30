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

  const canSubmit = prompt.trim().length > 0 && !loading;

  return (
    <div className="relative">
      {/* Error Toast */}
      {showError && error && (
        <div className="absolute -top-14 left-0 right-0 bg-rose-500/[0.08] border border-rose-500/20 text-rose-300/80 text-[12px] px-3 py-2 rounded-xl">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="flex items-end gap-2 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-2 transition-all duration-200 focus-within:border-violet-500/25 focus-within:bg-white/[0.04]">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Describe a 3D scene..."
          className="flex-1 bg-transparent text-[13px] text-white/85 placeholder:text-white/20 focus:outline-none resize-none min-h-[36px] max-h-[80px] py-1.5 px-2 leading-relaxed"
        />
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-200 shrink-0 ${
            canSubmit
              ? 'bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 hover:scale-105'
              : 'bg-white/[0.04]'
          }`}
        >
          {loading ? (
            <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
              <path fill="currentColor" opacity="0.8" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={canSubmit ? 'text-white' : 'text-white/15'}>
              <path d="M7 12V2M7 2L3 6M7 2L11 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>
      <p className="text-[10px] text-white/15 text-center mt-2">
        Press <kbd className="font-mono">⌘</kbd><kbd className="font-mono">↵</kbd> to generate
      </p>
    </div>
  );
}
