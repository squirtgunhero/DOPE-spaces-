'use client';

import { useSceneStore } from '@/store/scene-store';

function SectionRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center px-3 py-1.5 bg-[#282828] border-b border-[#333]">
      <span className="text-[11px] font-semibold text-[#999] uppercase tracking-wide">{children}</span>
    </div>
  );
}

function TreeItem({
  label,
  detail,
  swatch,
  selected,
  onClick,
}: {
  label: string;
  detail?: string;
  swatch?: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 w-full px-3 py-[6px] text-left transition-colors ${
        selected ? 'bg-[#2680eb]/15 text-white' : 'text-[#bbb] hover:bg-[#2a2a2a]'
      }`}
    >
      {swatch && (
        <span className="w-2.5 h-2.5 rounded-sm shrink-0 border border-white/10" style={{ backgroundColor: swatch }} />
      )}
      <span className="text-[12px] truncate flex-1">{label}</span>
      {detail && <span className="text-[10px] text-[#666] font-mono shrink-0">{detail}</span>}
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
        <p className="text-[13px] text-[#555]">No scene loaded</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <SectionRow>Environment</SectionRow>
      <TreeItem label="Background" detail={environment.background} swatch={environment.background} />
      <TreeItem label="Ambient" detail={environment.ambientIntensity.toFixed(2)} />

      <SectionRow>Camera</SectionRow>
      <TreeItem label="Position" detail={camera.position.map((v) => v.toFixed(1)).join(', ')} />
      <TreeItem label="FOV" detail={`${camera.fov}°`} />

      {lights.length > 0 && (
        <>
          <SectionRow>Lights ({lights.length})</SectionRow>
          {lights.map((light, i) => (
            <TreeItem key={i} label={light.type} detail={light.intensity.toFixed(1)} swatch={light.color} />
          ))}
        </>
      )}

      {objects.length > 0 && (
        <>
          <SectionRow>Objects ({objects.length})</SectionRow>
          {objects.map((obj) => (
            <TreeItem
              key={obj.name}
              label={obj.name}
              detail={obj.parts?.length ? `${obj.parts.length}p` : obj.geometry?.type ?? ''}
              selected={selectedObjectName === obj.name}
              onClick={() => selectObject(obj.name)}
            />
          ))}
        </>
      )}
    </div>
  );
}
