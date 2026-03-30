'use client';

import { useCallback } from 'react';
import { useSceneStore } from '@/store/scene-store';
import { SceneObject } from '@/schema/scene';

function SectionRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center px-3 py-1.5 bg-[#282828] border-b border-[#333]">
      <span className="text-[11px] font-semibold text-[#999] uppercase tracking-wide">{children}</span>
    </div>
  );
}

function AxisInput({ axis, value, onChange }: { axis: 'X' | 'Y' | 'Z'; value: number; onChange: (v: number) => void }) {
  const colors = { X: '#e34850', Y: '#2d9d78', Z: '#2680eb' };
  return (
    <div className="flex items-center gap-1 flex-1 min-w-0">
      <span className="text-[10px] font-bold w-3 text-center" style={{ color: colors[axis] }}>{axis}</span>
      <input
        type="number"
        step={0.1}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full bg-[#1a1a1a] border border-[#333] rounded px-1.5 py-1 text-[11px] text-white font-mono focus:outline-none focus:border-[#2680eb] transition-colors"
      />
    </div>
  );
}

function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <span className="text-[11px] text-[#999] w-16 shrink-0">{label}</span>
      <div className="flex gap-1 flex-1">{children}</div>
    </div>
  );
}

function SliderRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <span className="text-[11px] text-[#999] w-16 shrink-0">{label}</span>
      <input type="range" min={0} max={1} step={0.01} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="flex-1" />
      <span className="text-[10px] text-[#666] font-mono w-8 text-right">{value.toFixed(2)}</span>
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

  if (!obj) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center px-4">
        <p className="text-[13px] text-[#555]">Select an object to edit</p>
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
      {/* Name header */}
      <div className="px-3 py-2.5 border-b border-[#333]">
        <h2 className="text-[13px] font-semibold text-white truncate">{obj.name}</h2>
        <p className="text-[11px] text-[#666] mt-0.5">
          {obj.parts?.length ? `Compound · ${obj.parts.length} parts` : obj.geometry?.type ?? 'Object'}
        </p>
      </div>

      <SectionRow>Transform</SectionRow>
      <div className="py-1">
        <PropRow label="Position">
          <AxisInput axis="X" value={position[0]} onChange={(v) => handleUpdate({ position: [v, position[1], position[2]] })} />
          <AxisInput axis="Y" value={position[1]} onChange={(v) => handleUpdate({ position: [position[0], v, position[2]] })} />
          <AxisInput axis="Z" value={position[2]} onChange={(v) => handleUpdate({ position: [position[0], position[1], v] })} />
        </PropRow>
        <PropRow label="Rotation">
          <AxisInput axis="X" value={rotation[0]} onChange={(v) => handleUpdate({ rotation: [v, rotation[1], rotation[2]] })} />
          <AxisInput axis="Y" value={rotation[1]} onChange={(v) => handleUpdate({ rotation: [rotation[0], v, rotation[2]] })} />
          <AxisInput axis="Z" value={rotation[2]} onChange={(v) => handleUpdate({ rotation: [rotation[0], rotation[1], v] })} />
        </PropRow>
        <PropRow label="Scale">
          <AxisInput axis="X" value={scale[0]} onChange={(v) => handleUpdate({ scale: [v, scale[1], scale[2]] })} />
          <AxisInput axis="Y" value={scale[1]} onChange={(v) => handleUpdate({ scale: [scale[0], v, scale[2]] })} />
          <AxisInput axis="Z" value={scale[2]} onChange={(v) => handleUpdate({ scale: [scale[0], scale[1], v] })} />
        </PropRow>
      </div>

      {material && (
        <>
          <SectionRow>Material</SectionRow>
          <div className="py-1">
            <div className="flex items-center gap-2 px-3 py-1.5">
              <span className="text-[11px] text-[#999] w-16 shrink-0">Color</span>
              <input
                type="color"
                value={material.color}
                onChange={(e) => {
                  if (obj.material) handleUpdate({ material: { ...obj.material, color: e.target.value } });
                  else if (obj.parts?.[0]?.material) {
                    const newParts = [...obj.parts];
                    newParts[0] = { ...newParts[0], material: { ...newParts[0].material!, color: e.target.value } };
                    handleUpdate({ parts: newParts });
                  }
                }}
                className="w-6 h-6 rounded border border-[#333] bg-transparent cursor-pointer [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-none"
              />
              <span className="text-[11px] text-[#666] font-mono">{material.color}</span>
            </div>
            <SliderRow label="Roughness" value={material.roughness} onChange={(v) => {
              if (obj.material) handleUpdate({ material: { ...obj.material, roughness: v } });
              else if (obj.parts?.[0]?.material) {
                const newParts = [...obj.parts];
                newParts[0] = { ...newParts[0], material: { ...newParts[0].material!, roughness: v } };
                handleUpdate({ parts: newParts });
              }
            }} />
            <SliderRow label="Metalness" value={material.metalness} onChange={(v) => {
              if (obj.material) handleUpdate({ material: { ...obj.material, metalness: v } });
              else if (obj.parts?.[0]?.material) {
                const newParts = [...obj.parts];
                newParts[0] = { ...newParts[0], material: { ...newParts[0].material!, metalness: v } };
                handleUpdate({ parts: newParts });
              }
            }} />
          </div>
        </>
      )}

      {animationTypes.length > 0 && (
        <>
          <SectionRow>Animation</SectionRow>
          <div className="flex flex-wrap gap-1 px-3 py-2">
            {animationTypes.map((type) => (
              <span key={type} className="text-[10px] px-2 py-0.5 rounded bg-[#2680eb]/10 text-[#2680eb] capitalize font-medium">{type}</span>
            ))}
          </div>
        </>
      )}

      <div className="p-3 mt-4">
        <button
          onClick={() => { removeObject(selectedObjectName!); selectObject(null); }}
          className="w-full px-3 py-1.5 rounded text-[11px] font-medium text-[#e34850] bg-[#e34850]/8 border border-[#e34850]/15 hover:bg-[#e34850]/15 transition-colors"
        >
          Delete Object
        </button>
      </div>
    </div>
  );
}
