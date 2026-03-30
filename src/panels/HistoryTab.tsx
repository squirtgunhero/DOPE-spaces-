'use client';

import { useSceneStore } from '@/store/scene-store';

function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export default function HistoryTab() {
  const versions = useSceneStore((s) => s.versions);
  const currentVersionIndex = useSceneStore((s) => s.currentVersionIndex);
  const restoreVersion = useSceneStore((s) => s.restoreVersion);

  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center px-4">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-[var(--color-adobe-text-tertiary)] mb-3 opacity-40">
          <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <p className="text-[12px] text-[var(--color-adobe-text-tertiary)]">No version history</p>
        <p className="text-[11px] text-[var(--color-adobe-text-tertiary)] opacity-60 mt-1">Generate or revise a scene to create snapshots</p>
      </div>
    );
  }

  const reversed = [...versions].map((v, i) => ({ ...v, originalIndex: i })).reverse();

  return (
    <div className="flex flex-col">
      {reversed.map((version) => {
        const isCurrent = version.originalIndex === currentVersionIndex;
        const isGeneration = !!version.prompt;

        return (
          <button
            key={version.id}
            onClick={() => restoreVersion(version.originalIndex)}
            className={`w-full text-left px-3 py-2.5 border-b border-[var(--color-adobe-border)] transition-colors ${
              isCurrent
                ? 'bg-[var(--color-adobe-accent)]/8'
                : 'hover:bg-[var(--color-adobe-elevated)]'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                isCurrent
                  ? 'bg-[var(--color-adobe-accent)]/20 text-[var(--color-adobe-accent)]'
                  : 'bg-[var(--color-adobe-elevated)] text-[var(--color-adobe-text-tertiary)]'
              }`}>
                v{version.originalIndex + 1}
              </span>
              <span className={`text-[10px] uppercase tracking-wider font-medium ${
                isGeneration ? 'text-[var(--color-adobe-success)]' : 'text-[var(--color-adobe-warning)]'
              }`}>
                {isGeneration ? 'Generated' : 'Revised'}
              </span>
              <span className="text-[10px] text-[var(--color-adobe-text-tertiary)] ml-auto font-mono">
                {formatRelativeTime(version.timestamp)}
              </span>
            </div>
            <p className={`text-[11px] leading-relaxed ${
              isCurrent ? 'text-[var(--color-adobe-text-secondary)]' : 'text-[var(--color-adobe-text-tertiary)]'
            }`}>
              {version.changesSummary}
            </p>
            {isCurrent && (
              <span className="inline-block mt-1 text-[9px] text-[var(--color-adobe-accent)] uppercase tracking-wider font-bold">
                Current
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
