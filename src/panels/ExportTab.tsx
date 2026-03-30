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

function ExportCard({
  icon,
  title,
  subtitle,
  onClick,
  disabled,
}: {
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
      className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-left hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-200 disabled:opacity-30 disabled:pointer-events-none"
    >
      <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[12px] text-white/60 font-medium">{title}</p>
        <p className="text-[10px] text-white/20 mt-0.5">{subtitle}</p>
      </div>
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
    } catch {
      show('Export failed');
    }
  }, [exportAs, show]);

  const handleExportEmbed = useCallback(async () => {
    try {
      const result = await exportAs('embed_config');
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'text/html' });
      downloadBlob(blob, 'scene-embed.html');
      show('Embed config downloaded');
    } catch {
      show('Export failed');
    }
  }, [exportAs, show]);

  const handleExportGLTF = useCallback(async () => {
    try {
      const result = await exportAs('gltf_config');
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      downloadBlob(blob, 'scene-gltf.json');
      show('GLTF config downloaded');
    } catch {
      show('Export failed');
    }
  }, [exportAs, show]);

  const handleCopyJSON = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(scene, null, 2));
      show('Copied to clipboard');
    } catch {
      show('Copy failed');
    }
  }, [scene, show]);

  // Empty state
  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center px-4">
        <div className="text-white/10 text-2xl mb-3">↓</div>
        <p className="text-[12px] text-white/20">Nothing to export</p>
        <p className="text-[11px] text-white/10 mt-1">Generate a scene first</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 flex flex-col gap-2">
      <ExportCard
        icon={
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-white/40">
            <path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" />
            <path d="M5 9h6M5 11.5h4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </svg>
        }
        title="Scene JSON"
        subtitle="Full scene document as JSON"
        onClick={handleExportJSON}
      />

      <ExportCard
        icon={
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-white/40">
            <rect x="1.5" y="3" width="13" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <path d="M4.5 7L6.5 9L4.5 11" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8.5 11h3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </svg>
        }
        title="Embed Config"
        subtitle="Embeddable HTML snippet"
        onClick={handleExportEmbed}
      />

      <ExportCard
        icon={
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-white/40">
            <path d="M8 1L14.5 5V11L8 15L1.5 11V5L8 1Z" stroke="currentColor" strokeWidth="1.2" />
            <path d="M8 1V15M1.5 5L14.5 11M14.5 5L1.5 11" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.4" />
          </svg>
        }
        title="GLTF Config"
        subtitle="Three.js-compatible scene config"
        onClick={handleExportGLTF}
      />

      <ExportCard
        icon={
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-white/40">
            <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
            <path d="M5 8h6M8 5v6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0" />
            <path d="M5.5 6L7 8L5.5 10M8.5 6h2.5v1.5M11 8.5V10H8.5" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        }
        title="Copy JSON"
        subtitle="Copy scene to clipboard"
        onClick={handleCopyJSON}
      />

      {/* Toast */}
      {toast.visible && (
        <div className="mt-3 text-center">
          <span className="text-[11px] text-emerald-400/70 font-medium animate-pulse">
            {toast.message}
          </span>
        </div>
      )}
    </div>
  );
}
