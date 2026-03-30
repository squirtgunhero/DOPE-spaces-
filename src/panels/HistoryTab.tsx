'use client';

import { useSceneStore } from '@/store/scene-store';

function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

export default function HistoryTab() {
  const versions = useSceneStore((s) => s.versions);
  const currentVersionIndex = useSceneStore((s) => s.currentVersionIndex);
  const restoreVersion = useSceneStore((s) => s.restoreVersion);

  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center px-4">
        <p className="text-[13px] text-[#555]">No history yet</p>
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
            className={`w-full text-left px-3 py-2.5 border-b border-[#333] transition-colors ${
              isCurrent ? 'bg-[#2680eb]/8' : 'hover:bg-[#2a2a2a]'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                isCurrent ? 'bg-[#2680eb]/20 text-[#2680eb]' : 'bg-[#333] text-[#888]'
              }`}>
                v{version.originalIndex + 1}
              </span>
              <span className={`text-[10px] uppercase tracking-wider font-medium ${
                isGeneration ? 'text-[#2d9d78]' : 'text-[#e68619]'
              }`}>
                {isGeneration ? 'Generated' : 'Revised'}
              </span>
              <span className="text-[10px] text-[#555] ml-auto font-mono">
                {formatRelativeTime(version.timestamp)}
              </span>
            </div>
            <p className={`text-[11px] leading-relaxed ${isCurrent ? 'text-[#bbb]' : 'text-[#777]'}`}>
              {version.changesSummary}
            </p>
            {isCurrent && (
              <span className="inline-block mt-1 text-[9px] text-[#2680eb] uppercase tracking-wider font-bold">Current</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
