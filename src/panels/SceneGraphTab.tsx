'use client';

import { useSceneStore } from '@/store/scene-store';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.1em] mb-1.5 mt-4 first:mt-0">
      {children}
    </h3>
  );
}

function ColorSwatch({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-3 h-3 rounded-[3px] border border-white/10 shrink-0"
      style={{ backgroundColor: color }}
    />
  );
}

function LightTypeIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    directional: '☀',
    point: '●',
    spot: '◉',
    hemisphere: '◑',
    ambient: '○',
  };
  return <span className="text-[10px] text-white/40">{icons[type] || '●'}</span>;
}

export default function SceneGraphTab() {
  const scene = useSceneStore((s) => s.scene);
  const selectedObjectName = useSceneStore((s) => s.selectedObjectName);
  const selectObject = useSceneStore((s) => s.selectObject);

  const { environment, camera, lights, objects } = scene;

  return (
    <div className="px-4 py-3 flex flex-col gap-1">
      {/* Environment */}
      <SectionLabel>Environment</SectionLabel>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg">
          <ColorSwatch color={environment.background} />
          <span className="text-[12px] text-white/50">Background</span>
          <span className="text-[10px] text-white/20 ml-auto font-mono">
            {environment.background}
          </span>
        </div>
        {environment.fogColor && (
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg">
            <span className="text-[10px] text-white/40">🌫</span>
            <span className="text-[12px] text-white/50">Fog</span>
            <span className="text-[10px] text-white/20 ml-auto font-mono">
              d={environment.fogDensity?.toFixed(2)}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg">
          <span className="text-[10px] text-white/40">◐</span>
          <span className="text-[12px] text-white/50">Ambient</span>
          <span className="text-[10px] text-white/20 ml-auto font-mono">
            {environment.ambientIntensity.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Camera */}
      <SectionLabel>Camera</SectionLabel>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg">
          <span className="text-[10px] text-white/40">📷</span>
          <span className="text-[12px] text-white/50">Position</span>
          <span className="text-[10px] text-white/20 ml-auto font-mono">
            {camera.position.map((v) => v.toFixed(1)).join(', ')}
          </span>
        </div>
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg">
          <span className="text-[10px] text-white/40">◆</span>
          <span className="text-[12px] text-white/50">FOV</span>
          <span className="text-[10px] text-white/20 ml-auto font-mono">{camera.fov}°</span>
        </div>
      </div>

      {/* Lights */}
      {lights.length > 0 && (
        <>
          <SectionLabel>Lights ({lights.length})</SectionLabel>
          <div className="flex flex-col gap-0.5">
            {lights.map((light, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.03] transition-colors"
              >
                <LightTypeIcon type={light.type} />
                <ColorSwatch color={light.color} />
                <span className="text-[12px] text-white/50 capitalize">{light.type}</span>
                <span className="text-[10px] text-white/20 ml-auto font-mono">
                  {light.intensity.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Objects */}
      {objects.length > 0 && (
        <>
          <SectionLabel>Objects ({objects.length})</SectionLabel>
          <div className="flex flex-col gap-0.5">
            {objects.map((obj) => {
              const isCompound = !!obj.parts && obj.parts.length > 0;
              const isSelected = selectedObjectName === obj.name;
              const hasAnimation = !!obj.animation;

              return (
                <button
                  key={obj.name}
                  onClick={() => selectObject(obj.name)}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all duration-150 w-full ${
                    isSelected
                      ? 'bg-violet-500/[0.08] border border-violet-500/15'
                      : 'border border-transparent hover:bg-white/[0.03]'
                  }`}
                >
                  {/* Type dot */}
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isCompound ? 'bg-indigo-400' : 'bg-slate-400'
                    }`}
                  />

                  {/* Name */}
                  <span
                    className={`text-[12px] truncate ${
                      isSelected ? 'text-white/80' : 'text-white/50'
                    }`}
                  >
                    {obj.name}
                  </span>

                  {/* Indicators */}
                  <div className="flex items-center gap-1.5 ml-auto shrink-0">
                    {obj.semanticRole && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/25 uppercase tracking-wider">
                        {obj.semanticRole}
                      </span>
                    )}
                    {hasAnimation && (
                      <span className="text-[9px] text-violet-400/60">●</span>
                    )}
                    {isCompound && (
                      <span className="text-[10px] text-white/20 font-mono">
                        {obj.parts!.length}p
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Empty state */}
      {objects.length === 0 && lights.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-white/10 text-2xl mb-3">◇</div>
          <p className="text-[12px] text-white/20">No scene loaded</p>
          <p className="text-[11px] text-white/10 mt-1">Generate a scene to see its graph</p>
        </div>
      )}
    </div>
  );
}
