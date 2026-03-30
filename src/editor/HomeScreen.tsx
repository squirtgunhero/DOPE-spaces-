'use client';

import { useState, useCallback, KeyboardEvent, useRef, useEffect } from 'react';
import { useSceneStore } from '@/store/scene-store';

const PRESETS = [
  { label: '🏛 Product Pedestal', prompt: 'A futuristic floating product pedestal with glossy black surface, subtle neon accent lighting, glass elements, and floating geometric particles. Cinematic camera angle, dramatic shadows.' },
  { label: '🔮 Abstract Shapes', prompt: 'An abstract composition of floating geometric shapes — spheres, torus knots, and dodecahedrons in a modern color palette of soft pink, deep navy, and metallic gold. Subtle float and rotation animations.' },
  { label: '🏗 Architecture', prompt: 'A minimal luxury architectural scene with a marble arch, concrete steps, a reflecting pool, and warm golden hour lighting. Elegant proportions, strong shadows.' },
  { label: '🚀 Sci-Fi Scene', prompt: 'A sci-fi control room with holographic displays, glowing panels, mechanical components with subtle rotation, neon blue and orange accents, and atmospheric fog.' },
  { label: '🖼 Gallery Space', prompt: 'A minimal modern art gallery with white walls, dramatic spot lighting, sculptural pedestals, and a few abstract artworks. Clean, spacious, museum-quality lighting.' },
  { label: '🏠 Real Estate', prompt: 'A cinematic real estate hero scene with a modern building, landscaping elements, warm interior glow from windows, dramatic sunset lighting, and subtle environmental animation.' },
];

const GALLERY = [
  { title: 'Neon City Block', category: 'Sci-Fi', color: '#7c3aed' },
  { title: 'Floating Crystals', category: 'Abstract', color: '#2680eb' },
  { title: 'Modern Villa', category: 'Architecture', color: '#059669' },
  { title: 'Product Showcase', category: 'Commercial', color: '#d97706' },
  { title: 'Zen Garden', category: 'Nature', color: '#16a34a' },
  { title: 'Robot Workshop', category: 'Sci-Fi', color: '#dc2626' },
];

export default function HomeScreen() {
  const [prompt, setPrompt] = useState('');
  const generate = useSceneStore((s) => s.generate);
  const setParams = useSceneStore((s) => s.setParams);
  const clearError = useSceneStore((s) => s.clearError);
  const error = useSceneStore((s) => s.error);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  }, [prompt]);

  const handleGenerate = useCallback(() => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    clearError();
    generate(trimmed);
  }, [prompt, generate, clearError]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleGenerate();
      }
    },
    [handleGenerate],
  );

  const handlePreset = useCallback(
    (presetPrompt: string) => {
      clearError();
      generate(presetPrompt);
    },
    [generate, clearError],
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#1a1a1a]">
      {/* ─── Sidebar ─── */}
      <div className="w-[220px] min-w-[220px] flex flex-col bg-[#1e1e1e] border-r border-[#2a2a2a]">
        {/* Brand */}
        <div className="px-4 pt-5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#2680eb] flex items-center justify-center">
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L18 7V13L10 18L2 13V7L10 2Z" fill="white" fillOpacity="0.9" />
              </svg>
            </div>
            <span className="text-[15px] font-bold text-white">DOPE [spaces]</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col px-2 gap-0.5">
          <button className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium bg-white/[0.06] text-white">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="opacity-70"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" /><path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
            Create
          </button>
          <button className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[#999] hover:text-white hover:bg-white/[0.03] transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="opacity-50"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3" /><path d="M5 6h6M5 8h4M5 10h5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /></svg>
            My Scenes
          </button>
          <button className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[#999] hover:text-white hover:bg-white/[0.03] transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="opacity-50"><path d="M8 1L14.5 5V11L8 15L1.5 11V5L8 1Z" stroke="currentColor" strokeWidth="1.3" /></svg>
            Components
          </button>
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User */}
        <div className="px-4 py-4 border-t border-[#2a2a2a]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#333] flex items-center justify-center text-[11px] text-[#999] font-semibold">
              U
            </div>
            <span className="text-[13px] text-[#999]">User</span>
          </div>
        </div>
      </div>

      {/* ─── Main content ─── */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Hero section */}
        <div className="flex flex-col items-center pt-16 pb-8 px-6">
          <h1 className="text-[32px] font-bold text-white mb-2 tracking-tight">Create Anything in 3D</h1>
          <p className="text-[16px] text-[#888] mb-8">Describe what you want to build</p>

          {/* Prompt input */}
          <div className="w-full max-w-[620px]">
            <div className="relative bg-[#252525] border border-[#3a3a3a] rounded-xl overflow-hidden focus-within:border-[#2680eb] transition-colors">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="What do you want to create?"
                className="w-full bg-transparent px-4 py-3.5 pr-12 text-[15px] text-white placeholder:text-[#666] focus:outline-none resize-none min-h-[50px] max-h-[120px] leading-relaxed"
              />
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim()}
                className="absolute right-3 bottom-3 w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-20 bg-[#2680eb] hover:bg-[#3891ff] text-white"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mt-3 bg-[#e34850]/10 border border-[#e34850]/20 text-[#e34850] text-[13px] px-4 py-2.5 rounded-lg">
                {error}
              </div>
            )}

            {/* Preset chips */}
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => handlePreset(p.prompt)}
                  className="px-3.5 py-1.5 rounded-full text-[13px] text-[#999] bg-[#252525] border border-[#333] hover:border-[#555] hover:text-white transition-all"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Gallery section */}
        <div className="px-8 pb-12">
          <div className="max-w-[900px] mx-auto">
            <h2 className="text-[18px] font-semibold text-white mb-1">Examples</h2>
            <p className="text-[14px] text-[#666] mb-5">Click any example to generate it instantly</p>

            <div className="grid grid-cols-3 gap-3">
              {GALLERY.map((item) => (
                <button
                  key={item.title}
                  onClick={() => handlePreset(`A ${item.title.toLowerCase()} scene — detailed, cinematic lighting, professional 3D composition`)}
                  className="group relative bg-[#222] border border-[#2a2a2a] rounded-xl overflow-hidden hover:border-[#444] transition-all text-left"
                >
                  {/* Colored preview area */}
                  <div
                    className="h-[140px] flex items-center justify-center relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${item.color}22, ${item.color}08)` }}
                  >
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="opacity-20 group-hover:opacity-30 transition-opacity">
                      <path d="M24 4L44 16V32L24 44L4 32V16L24 4Z" stroke={item.color} strokeWidth="2" />
                      <path d="M24 4V44M4 16L44 32M44 16L4 32" stroke={item.color} strokeWidth="1" strokeOpacity="0.3" />
                    </svg>
                  </div>
                  <div className="px-3.5 py-3">
                    <p className="text-[13px] font-medium text-white truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-[#666] px-1.5 py-0.5 rounded bg-[#2a2a2a]">{item.category}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
