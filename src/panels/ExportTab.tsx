'use client';

import { useState, useCallback } from 'react';
import { useSceneStore } from '@/store/scene-store';

function useToast() {
  const [toast, setToast] = useState({ message: '', visible: false });
  const show = useCallback((message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 2500);
  }, []);
  return { toast, show };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ExportTab() {
  const scene = useSceneStore((s) => s.scene);
  const exportAs = useSceneStore((s) => s.exportAs);
  const { toast, show } = useToast();

  if (scene.objects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center px-4">
        <p className="text-[13px] text-[#555]">Nothing to export</p>
      </div>
    );
  }

  const exports = [
    { title: 'Scene JSON', sub: 'Full scene document', fn: async () => { const r = await exportAs('json'); downloadBlob(new Blob([JSON.stringify(r, null, 2)]), 'scene.json'); show('Downloaded'); } },
    { title: 'Embed HTML', sub: 'Self-contained snippet', fn: async () => { const r = await exportAs('embed_config'); downloadBlob(new Blob([JSON.stringify(r, null, 2)]), 'scene-embed.html'); show('Downloaded'); } },
    { title: 'GLTF Config', sub: 'Three.js config', fn: async () => { const r = await exportAs('gltf_config'); downloadBlob(new Blob([JSON.stringify(r, null, 2)]), 'scene-gltf.json'); show('Downloaded'); } },
    { title: 'Copy JSON', sub: 'Clipboard', fn: async () => { await navigator.clipboard.writeText(JSON.stringify(scene, null, 2)); show('Copied'); } },
  ];

  return (
    <div className="flex flex-col">
      {exports.map((item) => (
        <button
          key={item.title}
          onClick={() => item.fn().catch(() => show('Failed'))}
          className="flex items-center justify-between px-3 py-3 border-b border-[#333] text-left hover:bg-[#2a2a2a] transition-colors"
        >
          <div>
            <p className="text-[12px] text-white font-medium">{item.title}</p>
            <p className="text-[10px] text-[#666] mt-0.5">{item.sub}</p>
          </div>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[#666] shrink-0">
            <path d="M7 2v7M4 7l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 11h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>
      ))}
      {toast.visible && (
        <div className="px-3 py-2 text-center">
          <span className="text-[11px] text-[#2d9d78] font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
