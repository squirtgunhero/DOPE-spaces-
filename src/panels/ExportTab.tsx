'use client';

import { useState, useCallback } from 'react';
import { useSceneStore } from '@/store/scene-store';

type ToastState = { message: string; visible: boolean };

function useToast() {
  const [toast, setToast] = useState<ToastState>({ message: '', visible: false });
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

function ExportRow({ icon, title, subtitle, onClick, disabled }: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-3 px-3 py-2.5 text-left border-b border-[var(--color-adobe-border)] hover:bg-[var(--color-adobe-elevated)] transition-colors disabled:opacity-30 disabled:pointer-events-none"
    >
      <div className="w-8 h-8 rounded bg-[var(--color-adobe-surface)] border border-[var(--color-adobe-border)] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[12px] text-[var(--color-adobe-text)] font-medium">{title}</p>
        <p className="text-[10px] text-[var(--color-adobe-text-tertiary)] mt-0.5">{subtitle}</p>
      </div>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[var(--color-adobe-text-tertiary)] ml-auto shrink-0">
        <path d="M6 2v6M3 6l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 10h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </button>
  );
}

export default function ExportTab() {
  const scene = useSceneStore((s) => s.scene);
  const exportAs = useSceneStore((s) => s.exportAs);
  const { toast, show } = useToast();

  const isEmpty = scene.objects.length === 0;

  const handleExportJSON = useCallback(async () => {
    try {
      const result = await exportAs('json');
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      downloadBlob(blob, 'scene.json');
      show('Scene JSON downloaded');
    } catch { show('Export failed'); }
  }, [exportAs, show]);

  const handleExportEmbed = useCallback(async () => {
    try {
      const result = await exportAs('embed_config');
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'text/html' });
      downloadBlob(blob, 'scene-embed.html');
      show('Embed config downloaded');
    } catch { show('Export failed'); }
  }, [exportAs, show]);

  const handleExportGLTF = useCallback(async () => {
    try {
      const result = await exportAs('gltf_config');
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      downloadBlob(blob, 'scene-gltf.json');
      show('GLTF config downloaded');
    } catch { show('Export failed'); }
  }, [exportAs, show]);

  const handleCopyJSON = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(scene, null, 2));
      show('Copied to clipboard');
    } catch { show('Copy failed'); }
  }, [scene, show]);

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center px-4">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-[var(--color-adobe-text-tertiary)] mb-3 opacity-40">
          <path d="M12 3v12M7 10l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <p className="text-[12px] text-[var(--color-adobe-text-tertiary)]">Nothing to export</p>
        <p className="text-[11px] text-[var(--color-adobe-text-tertiary)] opacity-60 mt-1">Generate a scene first</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <ExportRow
        icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-[var(--color-adobe-text-secondary)]"><path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" /><path d="M5 9h6M5 11.5h4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /></svg>}
        title="Scene JSON"
        subtitle="Full scene document"
        onClick={handleExportJSON}
      />
      <ExportRow
        icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-[var(--color-adobe-text-secondary)]"><rect x="1.5" y="3" width="13" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" /><path d="M4.5 7L6.5 9L4.5 11" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" /><path d="M8.5 11h3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /></svg>}
        title="Embed HTML"
        subtitle="Self-contained HTML snippet"
        onClick={handleExportEmbed}
      />
      <ExportRow
        icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-[var(--color-adobe-text-secondary)]"><path d="M8 1L14.5 5V11L8 15L1.5 11V5L8 1Z" stroke="currentColor" strokeWidth="1.2" /><path d="M8 1V15M1.5 5L14.5 11M14.5 5L1.5 11" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.4" /></svg>}
        title="GLTF Config"
        subtitle="Three.js-compatible config"
        onClick={handleExportGLTF}
      />
      <ExportRow
        icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-[var(--color-adobe-text-secondary)]"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" /><path d="M5.5 6L7 8L5.5 10M8.5 6h2.5v1.5M11 8.5V10H8.5" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        title="Copy JSON"
        subtitle="Copy to clipboard"
        onClick={handleCopyJSON}
      />

      {toast.visible && (
        <div className="px-3 py-2 text-center">
          <span className="text-[11px] text-[var(--color-adobe-success)] font-medium">
            {toast.message}
          </span>
        </div>
      )}
    </div>
  );
}
