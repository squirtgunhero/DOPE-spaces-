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
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${color}`}>
      {tag}
    </span>
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
    <div className="flex flex-col gap-5 p-4">
      {/* Quick Start */}
      <section>
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
          Quick Start
        </h3>
        <div className="flex flex-wrap gap-2">
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

      {/* Objects */}
      <section>
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
          Objects
          <span className="ml-2 text-white/30">({objects.length})</span>
        </h3>
        <div className="flex flex-col gap-1">
          {objects.map((obj) => (
            <div
              key={obj.name}
              className="bg-[#1e293b] rounded-lg px-3 py-2.5 flex flex-col gap-1.5"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/80 font-medium truncate flex-1">
                  {obj.name}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    obj.type === 'compound'
                      ? 'bg-indigo-500/20 text-indigo-300'
                      : 'bg-slate-500/20 text-slate-300'
                  }`}
                >
                  {obj.type}
                </span>
                {obj.type === 'compound' && obj.partCount > 0 && (
                  <span className="text-[10px] text-white/30">{obj.partCount} parts</span>
                )}
              </div>
              {obj.animationTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {obj.animationTags.map((tag) => (
                    <AnimationTag key={tag} tag={tag} />
                  ))}
                </div>
              )}
            </div>
          ))}
          {objects.length === 0 && (
            <p className="text-white/20 text-xs text-center py-4">No objects in scene</p>
          )}
        </div>
      </section>

      {/* Scene Info */}
      <section>
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
          Scene Info
        </h3>
        <div className="bg-[#1e293b] rounded-lg p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/40">Background</span>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border border-white/10"
                style={{ backgroundColor: sceneInfo.background }}
              />
              <span className="text-xs text-white/60 font-mono">{sceneInfo.background}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/40">Lights</span>
            <span className="text-xs text-white/60">{sceneInfo.lightCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/40">Animated</span>
            <span className="text-xs text-white/60">{sceneInfo.animatedCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/40">Total Objects</span>
            <span className="text-xs text-white/60">{sceneInfo.objectCount}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
