'use client';

import PresetChip from './PresetChip';

interface Preset {
  name: string;
  description: string;
}

interface SceneObject {
  name: string;
  type: string;
  partCount: number;
  animationTags: string[];
}

interface SceneInfo {
  background: string;
  lightCount: number;
  animatedCount: number;
  objectCount: number;
}

interface ScenePanelProps {
  presets: Preset[];
  objects: SceneObject[];
  sceneInfo: SceneInfo;
  onPresetClick: (name: string) => void;
  activePreset?: string;
}

const TAG_STYLES: Record<string, string> = {
  rotate: 'bg-blue-500/10 text-blue-400/80',
  float: 'bg-cyan-500/10 text-cyan-400/80',
  sway: 'bg-emerald-500/10 text-emerald-400/80',
  pulse: 'bg-amber-500/10 text-amber-400/80',
  orbit: 'bg-violet-500/10 text-violet-400/80',
  path: 'bg-orange-500/10 text-orange-400/80',
  keyframes: 'bg-pink-500/10 text-pink-400/80',
  emissivePulse: 'bg-yellow-500/10 text-yellow-400/80',
  partAnimations: 'bg-rose-500/10 text-rose-400/80',
};

function Tag({ label }: { label: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-medium ${TAG_STYLES[label] || 'bg-white/5 text-white/40'}`}>
      {label}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold text-white/30 uppercase tracking-[0.08em] mb-3">
      {children}
    </h3>
  );
}

export default function ScenePanel({
  presets,
  objects,
  sceneInfo,
  onPresetClick,
  activePreset,
}: ScenePanelProps) {
  return (
    <div className="flex flex-col gap-8 px-5 py-5">
      {/* Presets */}
      <section>
        <SectionLabel>Quick Start</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {presets.map((preset) => (
            <PresetChip
              key={preset.name}
              name={preset.name}
              onClick={() => onPresetClick(preset.name)}
              active={activePreset === preset.name}
            />
          ))}
        </div>
      </section>

      {/* Scene Graph */}
      <section>
        <SectionLabel>
          Objects {objects.length > 0 && <span className="text-white/15 ml-1">({objects.length})</span>}
        </SectionLabel>
        {objects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 rounded-2xl border border-dashed border-white/[0.06]">
            <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center mb-3">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-white/15">
                <rect x="1" y="1" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
              </svg>
            </div>
            <p className="text-white/20 text-[13px]">No objects yet</p>
            <p className="text-white/10 text-[11px] mt-1">Generate a scene to get started</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {objects.map((obj) => (
              <div
                key={obj.name}
                className="group bg-white/[0.02] hover:bg-white/[0.04] rounded-xl px-3.5 py-3 transition-all duration-150 cursor-default"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full ${obj.type === 'compound' ? 'bg-indigo-400/60' : 'bg-slate-400/40'}`} />
                  <span className="text-[13px] text-white/75 font-medium truncate flex-1">
                    {obj.name}
                  </span>
                  <span className="text-[10px] text-white/20 font-medium">
                    {obj.type === 'compound' ? `${obj.partCount}p` : 'mesh'}
                  </span>
                </div>
                {obj.animationTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2 ml-[18px]">
                    {obj.animationTags.map((tag) => (
                      <Tag key={tag} label={tag} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Stats */}
      <section>
        <SectionLabel>Scene Info</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Lights" value={sceneInfo.lightCount} color="text-amber-400/50" />
          <StatCard label="Animated" value={sceneInfo.animatedCount} color="text-emerald-400/50" />
          <StatCard label="Objects" value={sceneInfo.objectCount} color="text-blue-400/50" />
          <div className="bg-white/[0.02] rounded-xl p-3.5">
            <div className="flex items-center gap-2 mb-1.5">
              <div
                className="w-3.5 h-3.5 rounded-full border border-white/10"
                style={{ backgroundColor: sceneInfo.background }}
              />
              <span className="text-[10px] text-white/20 uppercase tracking-wider">BG</span>
            </div>
            <span className="text-[13px] font-mono text-white/40">{sceneInfo.background}</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white/[0.02] rounded-xl p-3.5">
      <p className={`text-2xl font-semibold ${value > 0 ? 'text-white/90' : 'text-white/20'} tabular-nums`}>
        {value}
      </p>
      <p className="text-[10px] text-white/25 uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}
