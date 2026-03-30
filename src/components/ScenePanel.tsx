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

const ANIMATION_TAG_COLORS: Record<string, string> = {
  rotate: 'bg-blue-500/20 text-blue-300',
  float: 'bg-cyan-500/20 text-cyan-300',
  sway: 'bg-green-500/20 text-green-300',
  pulse: 'bg-yellow-500/20 text-yellow-300',
  orbit: 'bg-purple-500/20 text-purple-300',
  path: 'bg-orange-500/20 text-orange-300',
  keyframes: 'bg-pink-500/20 text-pink-300',
  emissivePulse: 'bg-amber-500/20 text-amber-300',
  partAnimations: 'bg-red-500/20 text-red-300',
};

function AnimationTag({ tag }: { tag: string }) {
  const color = ANIMATION_TAG_COLORS[tag] || 'bg-white/10 text-white/50';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${color}`}>
      <span className="w-1 h-1 rounded-full bg-current opacity-60" />
      {tag}
    </span>
  );
}

const TYPE_ACCENT: Record<string, string> = {
  compound: 'border-l-indigo-500/60',
  mesh: 'border-l-slate-500/40',
};

export default function ScenePanel({
  presets,
  objects,
  sceneInfo,
  onPresetClick,
  activePreset,
}: ScenePanelProps) {
  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Scenes / Presets */}
      <section>
        <h3 className="flex items-center text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-3 border-l-2 border-violet-500 pl-3">
          Scenes
        </h3>
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
        <h3 className="flex items-center text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-3 border-l-2 border-violet-500 pl-3">
          Scene Graph
          <span className="ml-2 text-white/20">({objects.length})</span>
        </h3>
        <div className="flex flex-col gap-1.5">
          {objects.map((obj) => (
            <div
              key={obj.name}
              className={`bg-[#111827] border border-white/[0.06] rounded-xl px-3 py-2.5 flex flex-col gap-1.5 border-l-2 ${
                TYPE_ACCENT[obj.type] || 'border-l-slate-500/40'
              } hover:bg-white/[0.03] transition-colors`}
            >
              <div className="flex items-center gap-2">
                <span className="text-white/30 text-sm">
                  {obj.type === 'compound' ? '\u2B22' : '\u25C6'}
                </span>
                <span className="text-sm text-white/80 font-medium truncate flex-1">
                  {obj.name}
                </span>
                {obj.type === 'compound' && obj.partCount > 0 && (
                  <span className="text-[10px] text-white/25 bg-white/[0.04] px-1.5 py-0.5 rounded">
                    {obj.partCount} parts
                  </span>
                )}
              </div>
              {obj.animationTags.length > 0 && (
                <div className="flex flex-wrap gap-1 ml-6">
                  {obj.animationTags.map((tag) => (
                    <AnimationTag key={tag} tag={tag} />
                  ))}
                </div>
              )}
            </div>
          ))}
          {objects.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 border border-dashed border-white/[0.08] rounded-xl">
              <span className="text-2xl text-white/10 mb-2">{'\u25A1'}</span>
              <p className="text-white/20 text-xs">No objects in scene</p>
            </div>
          )}
        </div>
      </section>

      {/* Scene Info */}
      <section>
        <h3 className="flex items-center text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-3 border-l-2 border-violet-500 pl-3">
          Scene Info
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {/* Lights */}
          <div className="bg-[#111827] border border-white/[0.06] rounded-xl p-3 flex flex-col gap-1">
            <span className="text-yellow-400/60 text-sm">{'\u2600'}</span>
            <span className="text-lg font-bold text-white">{sceneInfo.lightCount}</span>
            <span className="text-[10px] text-white/30 uppercase tracking-wider">Lights</span>
          </div>
          {/* Animated */}
          <div className="bg-[#111827] border border-white/[0.06] rounded-xl p-3 flex flex-col gap-1">
            <span className="text-emerald-400/60 text-sm">{'\u25B6'}</span>
            <span className="text-lg font-bold text-white">{sceneInfo.animatedCount}</span>
            <span className="text-[10px] text-white/30 uppercase tracking-wider">Animated</span>
          </div>
          {/* Objects */}
          <div className="bg-[#111827] border border-white/[0.06] rounded-xl p-3 flex flex-col gap-1">
            <span className="text-blue-400/60 text-sm">{'\u2B22'}</span>
            <span className="text-lg font-bold text-white">{sceneInfo.objectCount}</span>
            <span className="text-[10px] text-white/30 uppercase tracking-wider">Objects</span>
          </div>
          {/* Background */}
          <div className="bg-[#111827] border border-white/[0.06] rounded-xl p-3 flex flex-col gap-1">
            <div
              className="w-4 h-4 rounded-full border border-white/10"
              style={{ backgroundColor: sceneInfo.background }}
            />
            <span className="text-xs font-mono text-white/50 mt-0.5">{sceneInfo.background}</span>
            <span className="text-[10px] text-white/30 uppercase tracking-wider">Background</span>
          </div>
        </div>
      </section>
    </div>
  );
}
