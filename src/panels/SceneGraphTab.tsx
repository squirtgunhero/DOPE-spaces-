'use client';

import { useSceneStore } from '@/store/scene-store';

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-adobe-surface)] border-b border-[var(--color-adobe-border)]">
      <svg width="7" height="7" viewBox="0 0 8 8" fill="currentColor" className="text-[var(--color-adobe-text-tertiary)] rotate-90">
        <polygon points="2,0 8,4 2,8" />
      </svg>
      <span className="text-[11px] font-semibold text-[var(--color-adobe-text-secondary)] uppercase tracking-[0.04em]">
        {children}
      </span>
    </div>
  );
}

function TreeRow({
  icon,
  label,
  detail,
  color,
  selected,
  onClick,
  indent = 0,
}: {
  icon?: React.ReactNode;
  label: string;
  detail?: string;
  color?: string;
  selected?: boolean;
  onClick?: () => void;
  indent?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 w-full px-3 py-[5px] text-left transition-colors ${
        selected
          ? 'bg-[var(--color-adobe-accent)]/15 text-[var(--color-adobe-text)]'
          : 'text-[var(--color-adobe-text-secondary)] hover:bg-[var(--color-adobe-elevated)]'
      }`}
      style={{ paddingLeft: `${12 + indent * 16}px` }}
    >
      {icon && <span className="w-4 text-center shrink-0 text-[10px]">{icon}</span>}
      {color && (
        <span
          className="w-2.5 h-2.5 rounded-sm shrink-0 border border-white/10"
          style={{ backgroundColor: color }}
        />
      )}
      <span className="text-[11px] truncate flex-1">{label}</span>
      {detail && (
        <span className="text-[10px] text-[var(--color-adobe-text-tertiary)] font-mono shrink-0">
          {detail}
        </span>
      )}
    </button>
  );
}

export default function SceneGraphTab() {
  const scene = useSceneStore((s) => s.scene);
  const selectedObjectName = useSceneStore((s) => s.selectedObjectName);
  const selectObject = useSceneStore((s) => s.selectObject);

  const { environment, camera, lights, objects } = scene;

  if (objects.length === 0 && lights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center px-4">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-[var(--color-adobe-text-tertiary)] mb-3 opacity-40">
          <path d="M12 2L22 8.5V15.5L12 22L2 15.5V8.5L12 2Z" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <p className="text-[12px] text-[var(--color-adobe-text-tertiary)]">No scene loaded</p>
        <p className="text-[11px] text-[var(--color-adobe-text-tertiary)] opacity-60 mt-1">Generate a scene to view its hierarchy</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Environment */}
      <SectionHeader>Environment</SectionHeader>
      <div className="py-0.5">
        <TreeRow icon="◐" label="Background" detail={environment.background} color={environment.background} indent={0} />
        <TreeRow icon="☀" label="Ambient" detail={environment.ambientIntensity.toFixed(2)} indent={0} />
        {environment.fogColor && (
          <TreeRow icon="◌" label="Fog" detail={`d=${environment.fogDensity?.toFixed(2)}`} indent={0} />
        )}
      </div>

      {/* Camera */}
      <SectionHeader>Camera</SectionHeader>
      <div className="py-0.5">
        <TreeRow icon="▣" label="Position" detail={camera.position.map((v) => v.toFixed(1)).join(', ')} indent={0} />
        <TreeRow icon="◆" label="FOV" detail={`${camera.fov}°`} indent={0} />
      </div>

      {/* Lights */}
      {lights.length > 0 && (
        <>
          <SectionHeader>Lights ({lights.length})</SectionHeader>
          <div className="py-0.5">
            {lights.map((light, i) => (
              <TreeRow
                key={i}
                color={light.color}
                label={light.type}
                detail={light.intensity.toFixed(1)}
                indent={0}
              />
            ))}
          </div>
        </>
      )}

      {/* Objects */}
      {objects.length > 0 && (
        <>
          <SectionHeader>Objects ({objects.length})</SectionHeader>
          <div className="py-0.5">
            {objects.map((obj) => {
              const isCompound = !!obj.parts && obj.parts.length > 0;
              const isSelected = selectedObjectName === obj.name;

              return (
                <TreeRow
                  key={obj.name}
                  icon={isCompound ? '▤' : '■'}
                  label={obj.name}
                  detail={
                    isCompound
                      ? `${obj.parts!.length} parts`
                      : obj.geometry?.type ?? ''
                  }
                  selected={isSelected}
                  onClick={() => selectObject(obj.name)}
                  indent={0}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
