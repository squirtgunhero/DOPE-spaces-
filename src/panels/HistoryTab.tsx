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

  // Empty state
  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center px-4">
        <div className="text-white/10 text-2xl mb-3">↻</div>
        <p className="text-[12px] text-white/20">No versions yet</p>
        <p className="text-[11px] text-white/10 mt-1">
          Generate or revise a scene to create history
        </p>
      </div>
    );
  }

  // Show in reverse chronological order
  const reversed = [...versions].map((v, i) => ({ ...v, originalIndex: i })).reverse();

  return (
    <div className="px-4 py-3 flex flex-col gap-1">
      {reversed.map((version) => {
        const isCurrent = version.originalIndex === currentVersionIndex;
        const isGeneration = !!version.prompt;

        return (
          <button
            key={version.id}
            onClick={() => restoreVersion(version.originalIndex)}
            className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all duration-150 ${
              isCurrent
                ? 'bg-violet-500/[0.08] border-violet-500/15'
                : 'border-transparent hover:bg-white/[0.03]'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              {/* Version badge */}
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  isCurrent
                    ? 'bg-violet-500/20 text-violet-300/70'
                    : 'bg-white/[0.04] text-white/25'
                }`}
              >
                v{version.originalIndex + 1}
              </span>

              {/* Type badge */}
              <span
                className={`text-[9px] uppercase tracking-wider ${
                  isGeneration ? 'text-emerald-400/40' : 'text-amber-400/40'
                }`}
              >
                {isGeneration ? 'generated' : 'revised'}
              </span>

              {/* Time */}
              <span className="text-[10px] text-white/15 ml-auto font-mono">
                {formatRelativeTime(version.timestamp)}
              </span>
            </div>

            {/* Summary */}
            <p className={`text-[11px] leading-relaxed ${
              isCurrent ? 'text-white/50' : 'text-white/30'
            }`}>
              {version.changesSummary}
            </p>

            {/* Current indicator */}
            {isCurrent && (
              <div className="mt-1.5">
                <span className="text-[9px] text-violet-400/50 uppercase tracking-wider font-medium">
                  Current
                </span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
