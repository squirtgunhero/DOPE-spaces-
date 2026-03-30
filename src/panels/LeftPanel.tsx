'use client';

import { useState, useCallback, KeyboardEvent, useRef, useEffect } from 'react';
import { useSceneStore, GenerationStatus } from '@/store/scene-store';

// ─── Scene Presets ────────────────────────────────────────

const PRESETS = [
  { name: 'Product Pedestal', prompt: 'A futuristic floating product pedestal with glossy black surface, subtle neon accent lighting, glass elements, and floating geometric particles. Cinematic camera angle, dramatic shadows.' },
  { name: 'Abstract Shapes', prompt: 'An abstract composition of floating geometric shapes — spheres, torus knots, and dodecahedrons in a modern color palette of soft pink, deep navy, and metallic gold. Subtle float and rotation animations.' },
  { name: 'Luxury Architecture', prompt: 'A minimal luxury architectural scene with a marble arch, concrete steps, a reflecting pool, and warm golden hour lighting. Elegant proportions, strong shadows.' },
  { name: 'Sci-Fi Control', prompt: 'A sci-fi control room with holographic displays, glowing panels, mechanical components with subtle rotation, neon blue and orange accents, and atmospheric fog.' },
  { name: 'Gallery Space', prompt: 'A minimal modern art gallery with white walls, dramatic spot lighting, sculptural pedestals, and a few abstract artworks. Clean, spacious, museum-quality lighting.' },
  { name: 'Cinematic Estate', prompt: 'A cinematic real estate hero scene with a modern building, landscaping elements, warm interior glow from windows, dramatic sunset lighting, and subtle environmental animation.' },
];

// ─── Slider Component ─────────────────────────────────────

function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.05,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-white/35 font-medium">{label}</span>
        <span className="text-[10px] text-white/20 font-mono tabular-nums">
          {(value * 100).toFixed(0)}%
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-white/[0.06] rounded-full appearance-none cursor-pointer accent-violet-500 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-400 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-violet-500/20"
      />
    </div>
  );
}

// ─── Section Label ────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.1em] mb-2">
      {children}
    </h3>
  );
}

// ─── Left Panel ───────────────────────────────────────────

export default function LeftPanel() {
  const [prompt, setPrompt] = useState('');
  const status = useSceneStore((s) => s.status);
  const error = useSceneStore((s) => s.error);
  const params = useSceneStore((s) => s.params);
  const generate = useSceneStore((s) => s.generate);
  const setParams = useSceneStore((s) => s.setParams);
  const clearError = useSceneStore((s) => s.clearError);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isWorking = status === 'generating' || status === 'revising';

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  }, [prompt]);

  const handleGenerate = useCallback(() => {
    const trimmed = prompt.trim();
    if (!trimmed || isWorking) return;
    clearError();
    generate(trimmed);
  }, [prompt, isWorking, generate, clearError]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleGenerate();
      }
    },
    [handleGenerate],
  );

  const handlePreset = useCallback(
    (presetPrompt: string) => {
      setPrompt(presetPrompt);
      if (!isWorking) {
        clearError();
        generate(presetPrompt);
      }
    },
    [isWorking, generate, clearError],
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/15">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L18 7V13L10 18L2 13V7L10 2Z" fill="white" fillOpacity="0.9" />
              <path d="M10 2L18 7L10 12L2 7L10 2Z" fill="white" />
              <path d="M10 12V18L2 13V7L10 12Z" fill="white" fillOpacity="0.6" />
            </svg>
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-white tracking-tight">DOPE [spaces]</h1>
            <p className="text-[10px] text-white/25 font-medium">3D Scene Engine</p>
          </div>
        </div>
      </div>

      <div className="h-px bg-white/[0.04] mx-5" />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-6">
        {/* Prompt */}
        <section>
          <SectionLabel>Describe your scene</SectionLabel>
          <div className="flex items-end gap-2 bg-white/[0.02] border border-white/[0.05] rounded-xl p-2 focus-within:border-violet-500/20 transition-all">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="A futuristic floating product display..."
              className="flex-1 bg-transparent text-[13px] text-white/80 placeholder:text-white/15 focus:outline-none resize-none min-h-[36px] max-h-[120px] py-1.5 px-2 leading-relaxed"
            />
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isWorking}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 shrink-0 ${
                prompt.trim() && !isWorking
                  ? 'bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/20 hover:scale-105'
                  : 'bg-white/[0.03]'
              }`}
            >
              {isWorking ? (
                <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
                  <path fill="currentColor" opacity="0.8" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={prompt.trim() ? 'text-white' : 'text-white/10'}>
                  <path d="M7 12V2M7 2L3 6M7 2L11 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
          {error && (
            <div className="mt-2 bg-rose-500/[0.06] border border-rose-500/15 text-rose-300/70 text-[11px] px-3 py-2 rounded-lg">
              {error}
            </div>
          )}
        </section>

        {/* Quick Scenes */}
        <section>
          <SectionLabel>Quick Scenes</SectionLabel>
          <div className="grid grid-cols-2 gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => handlePreset(p.prompt)}
                disabled={isWorking}
                className="text-left px-3 py-2.5 rounded-lg bg-white/[0.015] border border-white/[0.03] text-[12px] text-white/50 hover:text-white/70 hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-200 disabled:opacity-40"
              >
                {p.name}
              </button>
            ))}
          </div>
        </section>

        {/* Generation Controls */}
        <section>
          <SectionLabel>Generation Controls</SectionLabel>
          <div className="flex flex-col gap-4">
            <Slider
              label="Realism"
              value={params.realism}
              onChange={(v) => setParams({ realism: v })}
            />
            <Slider
              label="Complexity"
              value={params.complexity}
              onChange={(v) => setParams({ complexity: v })}
            />
            <Slider
              label="Animation"
              value={params.animationAmount}
              onChange={(v) => setParams({ animationAmount: v })}
            />
          </div>
        </section>

        {/* Camera Framing */}
        <section>
          <SectionLabel>Camera Framing</SectionLabel>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { key: undefined, label: 'Auto' },
              { key: 'eye_level', label: 'Eye Level' },
              { key: 'low_angle', label: 'Low Angle' },
              { key: 'top_down', label: 'Top Down' },
              { key: 'dramatic', label: 'Dramatic' },
            ].map((opt) => (
              <button
                key={opt.label}
                onClick={() => setParams({ cameraFraming: opt.key })}
                className={`px-3 py-2 rounded-lg text-[11px] font-medium transition-all duration-200 ${
                  params.cameraFraming === opt.key
                    ? 'bg-violet-500/[0.1] border border-violet-500/25 text-violet-300'
                    : 'bg-white/[0.015] border border-white/[0.03] text-white/35 hover:text-white/55 hover:bg-white/[0.04]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
