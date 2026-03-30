'use client';

import { useCallback } from 'react';
import { useSceneStore } from '@/store/scene-store';
import { SceneObject } from '@/schema/scene';

// ─── Helpers ─────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.1em] mb-2 mt-5 first:mt-0">
      {children}
    </h3>
  );
}

function AxisInput({
  axis,
  value,
  onChange,
}: {
  axis: 'X' | 'Y' | 'Z';
  value: number;
  onChange: (v: number) => void;
}) {
  const colors = {
    X: 'text-rose-400/70',
    Y: 'text-emerald-400/70',
    Z: 'text-blue-400/70',
  };

  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-0">
      <span className={`text-[10px] font-semibold ${colors[axis]} w-3 text-center shrink-0`}>
        {axis}
      </span>
      <input
        type="number"
        step={0.1}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full bg-white/[0.04] border border-white/[0.06] rounded-md px-2 py-1.5 text-[11px] text-white/70 font-mono tabular-nums focus:outline-none focus:border-violet-500/30 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    </div>
  );
}

function Vec3Row({
  label,
  value,
  onChange,
}: {
  label: string;
  value: [number, number, number];
  onChange: (v: [number, number, number]) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] text-white/35 font-medium">{label}</span>
      <div className="flex gap-1.5">
        <AxisInput axis="X" value={value[0]} onChange={(v) => onChange([v, value[1], value[2]])} />
        <AxisInput axis="Y" value={value[1]} onChange={(v) => onChange([value[0], v, value[2]])} />
        <AxisInput axis="Z" value={value[2]} onChange={(v) => onChange([value[0], value[1], v])} />
      </div>
    </div>
  );
}

function SliderField({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
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
          {value.toFixed(2)}
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

// ─── Main Component ──────────────────────────────────────

export default function PropertiesTab() {
  const scene = useSceneStore((s) => s.scene);
  const selectedObjectName = useSceneStore((s) => s.selectedObjectName);
  const updateObject = useSceneStore((s) => s.updateObject);
  const removeObject = useSceneStore((s) => s.removeObject);
  const selectObject = useSceneStore((s) => s.selectObject);

  const obj = scene.objects.find((o) => o.name === selectedObjectName) ?? null;

  const handleUpdate = useCallback(
    (updates: Partial<SceneObject>) => {
      if (selectedObjectName) updateObject(selectedObjectName, updates);
    },
    [selectedObjectName, updateObject],
  );

  const handleDelete = useCallback(() => {
    if (selectedObjectName) {
      removeObject(selectedObjectName);
      selectObject(null);
    }
  }, [selectedObjectName, removeObject, selectObject]);

  // Empty state
  if (!obj) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center px-4">
        <div className="text-white/10 text-2xl mb-3">◇</div>
        <p className="text-[12px] text-white/20">No object selected</p>
        <p className="text-[11px] text-white/10 mt-1">
          Select an object from the scene graph
        </p>
      </div>
    );
  }

  // Resolve material — direct or from first part
  const material = obj.material ?? obj.parts?.[0]?.material ?? null;

  // Resolve position, rotation, scale
  const position: [number, number, number] = obj.position ?? [0, 0, 0];
  const rotation: [number, number, number] = obj.rotation ?? [0, 0, 0];
  const scaleRaw = obj.scale ?? [1, 1, 1];
  const scale: [number, number, number] = typeof scaleRaw === 'number'
    ? [scaleRaw, scaleRaw, scaleRaw]
    : scaleRaw;

  // Animation tags
  const animationTypes: string[] = [];
  if (obj.animation) {
    const a = obj.animation;
    if (a.rotateX || a.rotateY || a.rotateZ) animationTypes.push('rotate');
    if (a.float) animationTypes.push('float');
    if (a.sway) animationTypes.push('sway');
    if (a.pulse) animationTypes.push('pulse');
    if (a.orbit) animationTypes.push('orbit');
    if (a.path) animationTypes.push('path');
    if (a.keyframes) animationTypes.push('keyframes');
    if (a.emissivePulse) animationTypes.push('emissive');
  }

  return (
    <div className="px-4 py-3">
      {/* Object name */}
      <div className="flex items-center gap-2.5 mb-1">
        <span
          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
            obj.parts && obj.parts.length > 0 ? 'bg-indigo-400' : 'bg-slate-400'
          }`}
        />
        <h2 className="text-[14px] font-semibold text-white/80 truncate">{obj.name}</h2>
      </div>
      {obj.geometry && (
        <p className="text-[11px] text-white/20 mb-2 ml-5 capitalize">{obj.geometry.type}</p>
      )}
      {obj.parts && obj.parts.length > 0 && (
        <p className="text-[11px] text-white/20 mb-2 ml-5">
          Compound — {obj.parts.length} parts
        </p>
      )}

      {/* Transform */}
      <SectionLabel>Transform</SectionLabel>
      <div className="flex flex-col gap-3">
        <Vec3Row
          label="Position"
          value={position}
          onChange={(v) => handleUpdate({ position: v })}
        />
        <Vec3Row
          label="Rotation"
          value={rotation}
          onChange={(v) => handleUpdate({ rotation: v })}
        />
        <Vec3Row
          label="Scale"
          value={scale}
          onChange={(v) => handleUpdate({ scale: v })}
        />
      </div>

      {/* Material */}
      {material && (
        <>
          <SectionLabel>Material</SectionLabel>
          <div className="flex flex-col gap-3">
            {/* Color */}
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] text-white/35 font-medium flex-1">Color</span>
              <input
                type="color"
                value={material.color}
                onChange={(e) => {
                  if (obj.material) {
                    handleUpdate({ material: { ...obj.material, color: e.target.value } });
                  } else if (obj.parts?.[0]?.material) {
                    const newParts = [...obj.parts];
                    newParts[0] = {
                      ...newParts[0],
                      material: { ...newParts[0].material!, color: e.target.value },
                    };
                    handleUpdate({ parts: newParts });
                  }
                }}
                className="w-7 h-7 rounded-md border border-white/10 bg-transparent cursor-pointer [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-[3px] [&::-webkit-color-swatch]:border-none"
              />
              <span className="text-[10px] text-white/20 font-mono">{material.color}</span>
            </div>

            {/* Roughness */}
            <SliderField
              label="Roughness"
              value={material.roughness}
              onChange={(v) => {
                if (obj.material) {
                  handleUpdate({ material: { ...obj.material, roughness: v } });
                } else if (obj.parts?.[0]?.material) {
                  const newParts = [...obj.parts];
                  newParts[0] = {
                    ...newParts[0],
                    material: { ...newParts[0].material!, roughness: v },
                  };
                  handleUpdate({ parts: newParts });
                }
              }}
            />

            {/* Metalness */}
            <SliderField
              label="Metalness"
              value={material.metalness}
              onChange={(v) => {
                if (obj.material) {
                  handleUpdate({ material: { ...obj.material, metalness: v } });
                } else if (obj.parts?.[0]?.material) {
                  const newParts = [...obj.parts];
                  newParts[0] = {
                    ...newParts[0],
                    material: { ...newParts[0].material!, metalness: v },
                  };
                  handleUpdate({ parts: newParts });
                }
              }}
            />
          </div>
        </>
      )}

      {/* Animation */}
      {animationTypes.length > 0 && (
        <>
          <SectionLabel>Animation</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {animationTypes.map((type) => (
              <span
                key={type}
                className="text-[10px] px-2 py-1 rounded-md bg-violet-500/[0.08] text-violet-300/60 capitalize"
              >
                {type}
              </span>
            ))}
          </div>
        </>
      )}

      {/* Semantic */}
      {(obj.semanticRole || (obj.semanticTags && obj.semanticTags.length > 0)) && (
        <>
          <SectionLabel>Semantic</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {obj.semanticRole && (
              <span className="text-[10px] px-2 py-1 rounded-md bg-white/[0.04] text-white/30 capitalize">
                {obj.semanticRole}
              </span>
            )}
            {obj.semanticTags?.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-1 rounded-md bg-white/[0.03] text-white/20"
              >
                {tag}
              </span>
            ))}
          </div>
        </>
      )}

      {/* Actions */}
      <SectionLabel>Actions</SectionLabel>
      <button
        onClick={handleDelete}
        className="w-full px-3 py-2 rounded-lg bg-rose-500/[0.06] border border-rose-500/10 text-rose-300/60 text-[11px] font-medium hover:bg-rose-500/[0.1] hover:text-rose-300/80 transition-all duration-200"
      >
        Delete Object
      </button>
    </div>
  );
}
