'use client';

import { useCallback } from 'react';
import { useSceneStore } from '@/store/scene-store';
import { SceneObject } from '@/schema/scene';

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

function AxisInput({ axis, value, onChange }: { axis: 'X' | 'Y' | 'Z'; value: number; onChange: (v: number) => void }) {
  const colors = { X: '#e34850', Y: '#2d9d78', Z: '#2680eb' };
  return (
    <div className="flex items-center gap-1 flex-1 min-w-0">
      <span className="text-[10px] font-bold w-3 text-center shrink-0" style={{ color: colors[axis] }}>{axis}</span>
      <input
        type="number"
        step={0.1}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full bg-[var(--color-adobe-bg)] border border-[var(--color-adobe-border)] rounded px-1.5 py-1 text-[11px] text-[var(--color-adobe-text)] font-mono tabular-nums focus:outline-none focus:border-[var(--color-adobe-accent)] transition-colors"
      />
    </div>
  );
}

function Vec3Row({ label, value, onChange }: { label: string; value: [number, number, number]; onChange: (v: [number, number, number]) => void }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1">
      <span className="text-[11px] text-[var(--color-adobe-text-secondary)] w-16 shrink-0">{label}</span>
      <div className="flex gap-1 flex-1">
        <AxisInput axis="X" value={value[0]} onChange={(v) => onChange([v, value[1], value[2]])} />
        <AxisInput axis="Y" value={value[1]} onChange={(v) => onChange([value[0], v, value[2]])} />
        <AxisInput axis="Z" value={value[2]} onChange={(v) => onChange([value[0], value[1], v])} />
      </div>
    </div>
  );
}

function SliderRow({ label, value, onChange, min = 0, max = 1 }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1">
      <span className="text-[11px] text-[var(--color-adobe-text-secondary)] w-16 shrink-0">{label}</span>
      <input type="range" min={min} max={max} step={0.01} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="flex-1" />
      <span className="text-[10px] text-[var(--color-adobe-text-tertiary)] font-mono w-8 text-right">{value.toFixed(2)}</span>
    </div>
  );
}

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

  if (!obj) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center px-4">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-[var(--color-adobe-text-tertiary)] mb-3 opacity-40">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <p className="text-[12px] text-[var(--color-adobe-text-tertiary)]">No object selected</p>
        <p className="text-[11px] text-[var(--color-adobe-text-tertiary)] opacity-60 mt-1">Click an object in the viewport or scene panel</p>
      </div>
    );
  }

  const material = obj.material ?? obj.parts?.[0]?.material ?? null;
  const position: [number, number, number] = obj.position ?? [0, 0, 0];
  const rotation: [number, number, number] = obj.rotation ?? [0, 0, 0];
  const scaleRaw = obj.scale ?? [1, 1, 1];
  const scale: [number, number, number] = typeof scaleRaw === 'number' ? [scaleRaw, scaleRaw, scaleRaw] : scaleRaw;

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
    <div className="flex flex-col">
      {/* Object header */}
      <div className="px-3 py-2.5 border-b border-[var(--color-adobe-border)]">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-sm shrink-0 ${obj.parts && obj.parts.length > 0 ? 'bg-[var(--color-adobe-accent)]' : 'bg-[var(--color-adobe-text-tertiary)]'}`} />
          <h2 className="text-[13px] font-semibold text-[var(--color-adobe-text)] truncate">{obj.name}</h2>
        </div>
        <p className="text-[11px] text-[var(--color-adobe-text-tertiary)] mt-0.5 ml-4">
          {obj.parts && obj.parts.length > 0
            ? `Compound · ${obj.parts.length} parts`
            : obj.geometry?.type ?? 'Object'}
        </p>
      </div>

      {/* Transform */}
      <SectionHeader>Transform</SectionHeader>
      <div className="py-1.5">
        <Vec3Row label="Position" value={position} onChange={(v) => handleUpdate({ position: v })} />
        <Vec3Row label="Rotation" value={rotation} onChange={(v) => handleUpdate({ rotation: v })} />
        <Vec3Row label="Scale" value={scale} onChange={(v) => handleUpdate({ scale: v })} />
      </div>

      {/* Material */}
      {material && (
        <>
          <SectionHeader>Material</SectionHeader>
          <div className="py-1.5">
            <div className="flex items-center gap-2 px-3 py-1">
              <span className="text-[11px] text-[var(--color-adobe-text-secondary)] w-16 shrink-0">Color</span>
              <input
                type="color"
                value={material.color}
                onChange={(e) => {
                  if (obj.material) {
                    handleUpdate({ material: { ...obj.material, color: e.target.value } });
                  } else if (obj.parts?.[0]?.material) {
                    const newParts = [...obj.parts];
                    newParts[0] = { ...newParts[0], material: { ...newParts[0].material!, color: e.target.value } };
                    handleUpdate({ parts: newParts });
                  }
                }}
                className="w-6 h-6 rounded border border-[var(--color-adobe-border)] bg-transparent cursor-pointer [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-none"
              />
              <span className="text-[11px] text-[var(--color-adobe-text-tertiary)] font-mono">{material.color}</span>
            </div>
            <SliderRow
              label="Roughness"
              value={material.roughness}
              onChange={(v) => {
                if (obj.material) handleUpdate({ material: { ...obj.material, roughness: v } });
                else if (obj.parts?.[0]?.material) {
                  const newParts = [...obj.parts];
                  newParts[0] = { ...newParts[0], material: { ...newParts[0].material!, roughness: v } };
                  handleUpdate({ parts: newParts });
                }
              }}
            />
            <SliderRow
              label="Metalness"
              value={material.metalness}
              onChange={(v) => {
                if (obj.material) handleUpdate({ material: { ...obj.material, metalness: v } });
                else if (obj.parts?.[0]?.material) {
                  const newParts = [...obj.parts];
                  newParts[0] = { ...newParts[0], material: { ...newParts[0].material!, metalness: v } };
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
          <SectionHeader>Animation</SectionHeader>
          <div className="flex flex-wrap gap-1 px-3 py-2">
            {animationTypes.map((type) => (
              <span key={type} className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-adobe-accent)]/10 text-[var(--color-adobe-accent)] capitalize font-medium">
                {type}
              </span>
            ))}
          </div>
        </>
      )}

      {/* Semantic */}
      {(obj.semanticRole || (obj.semanticTags && obj.semanticTags.length > 0)) && (
        <>
          <SectionHeader>Semantic</SectionHeader>
          <div className="flex flex-wrap gap-1 px-3 py-2">
            {obj.semanticRole && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-adobe-elevated)] text-[var(--color-adobe-text-secondary)] capitalize">{obj.semanticRole}</span>
            )}
            {obj.semanticTags?.map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-adobe-elevated)] text-[var(--color-adobe-text-tertiary)]">{tag}</span>
            ))}
          </div>
        </>
      )}

      {/* Delete */}
      <div className="p-3 mt-auto">
        <button
          onClick={handleDelete}
          className="w-full px-3 py-1.5 rounded text-[11px] font-medium text-[var(--color-adobe-danger)] bg-[var(--color-adobe-danger)]/8 border border-[var(--color-adobe-danger)]/15 hover:bg-[var(--color-adobe-danger)]/15 transition-colors"
        >
          Delete Object
        </button>
      </div>
    </div>
  );
}
