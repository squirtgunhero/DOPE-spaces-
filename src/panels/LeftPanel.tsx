'use client';

import { useState, useCallback, KeyboardEvent, useRef, useEffect } from 'react';
import { useSceneStore, GenerationStatus } from '@/store/scene-store';

const PRESETS = [
  { name: 'Product Pedestal', prompt: 'A futuristic floating product pedestal with glossy black surface, subtle neon accent lighting, glass elements, and floating geometric particles. Cinematic camera angle, dramatic shadows.' },
  { name: 'Abstract Shapes', prompt: 'An abstract composition of floating geometric shapes — spheres, torus knots, and dodecahedrons in a modern color palette of soft pink, deep navy, and metallic gold. Subtle float and rotation animations.' },
  { name: 'Luxury Architecture', prompt: 'A minimal luxury architectural scene with a marble arch, concrete steps, a reflecting pool, and warm golden hour lighting. Elegant proportions, strong shadows.' },
  { name: 'Sci-Fi Control', prompt: 'A sci-fi control room with holographic displays, glowing panels, mechanical components with subtle rotation, neon blue and orange accents, and atmospheric fog.' },
  { name: 'Gallery Space', prompt: 'A minimal modern art gallery with white walls, dramatic spot lighting, sculptural pedestals, and a few abstract artworks. Clean, spacious, museum-quality lighting.' },
  { name: 'Cinematic Estate', prompt: 'A cinematic real estate hero scene with a modern building, landscaping elements, warm interior glow from windows, dramatic sunset lighting, and subtle environmental animation.' },
];

function SectionHeader({ children, collapsed, onToggle }: { children: React.ReactNode; collapsed?: boolean; onToggle?: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 w-full py-1.5 text-[11px] font-semibold text-[var(--color-adobe-text-secondary)] uppercase tracking-[0.06em] hover:text-[var(--color-adobe-text)] transition-colors"
    >
      <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className={`transition-transform ${collapsed ? '' : 'rotate-90'}`}>
        <polygon points="2,0 8,4 2,8" />
      </svg>
      {children}
    </button>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-[var(--color-adobe-text-secondary)] w-[72px] shrink-0">{label}</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1"
      />
      <span className="text-[11px] text-[var(--color-adobe-text-tertiary)] font-mono tabular-nums w-8 text-right">
        {(value * 100).toFixed(0)}%
      </span>
    </div>
  );
}

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
      {/* Prompt area */}
      <div className="p-3 border-b border-[var(--color-adobe-border)]">
        <div className="flex flex-col gap-2">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Describe your 3D scene…"
            className="w-full bg-[var(--color-adobe-bg)] border border-[var(--color-adobe-border)] rounded px-2.5 py-2 text-[12px] text-[var(--color-adobe-text)] placeholder:text-[var(--color-adobe-text-tertiary)] focus:outline-none focus:border-[var(--color-adobe-accent)] resize-none min-h-[52px] max-h-[120px] leading-relaxed transition-colors"
          />
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isWorking}
            className="w-full h-8 flex items-center justify-center gap-2 rounded text-[12px] font-semibold transition-all disabled:opacity-35 disabled:cursor-not-allowed bg-[var(--color-adobe-accent)] hover:bg-[var(--color-adobe-accent-hover)] text-white"
          >
            {isWorking ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating…
              </>
            ) : (
              'Generate Scene'
            )}
          </button>
        </div>
        {error && (
          <div className="mt-2 bg-[var(--color-adobe-danger)]/10 border border-[var(--color-adobe-danger)]/20 text-[var(--color-adobe-danger)] text-[11px] px-2.5 py-1.5 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Scrollable sections */}
      <div className="flex-1 overflow-y-auto">
        {/* Presets */}
        <div className="p-3 border-b border-[var(--color-adobe-border)]">
          <SectionHeader>Presets</SectionHeader>
          <div className="grid grid-cols-2 gap-1 mt-2">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => handlePreset(p.prompt)}
                disabled={isWorking}
                className="text-left px-2.5 py-2 rounded text-[11px] text-[var(--color-adobe-text-secondary)] bg-[var(--color-adobe-bg)] border border-[var(--color-adobe-border)] hover:border-[var(--color-adobe-border-light)] hover:text-[var(--color-adobe-text)] transition-all disabled:opacity-35"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Generation Controls */}
        <div className="p-3 border-b border-[var(--color-adobe-border)]">
          <SectionHeader>Generation Controls</SectionHeader>
          <div className="flex flex-col gap-2.5 mt-2">
            <Slider label="Realism" value={params.realism} onChange={(v) => setParams({ realism: v })} />
            <Slider label="Complexity" value={params.complexity} onChange={(v) => setParams({ complexity: v })} />
            <Slider label="Animation" value={params.animationAmount} onChange={(v) => setParams({ animationAmount: v })} />
          </div>
        </div>

        {/* Camera */}
        <div className="p-3">
          <SectionHeader>Camera Framing</SectionHeader>
          <div className="flex flex-wrap gap-1 mt-2">
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
                className={`px-2.5 py-1.5 rounded text-[11px] font-medium transition-all border ${
                  params.cameraFraming === opt.key
                    ? 'bg-[var(--color-adobe-accent)]/15 border-[var(--color-adobe-accent)]/40 text-[var(--color-adobe-accent)]'
                    : 'bg-[var(--color-adobe-bg)] border-[var(--color-adobe-border)] text-[var(--color-adobe-text-secondary)] hover:border-[var(--color-adobe-border-light)] hover:text-[var(--color-adobe-text)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
