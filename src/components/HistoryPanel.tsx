'use client';

interface HistoryEntry {
  prompt: string;
  timestamp: number;
}

interface HistoryPanelProps {
  history: HistoryEntry[];
  onRerun: (prompt: string) => void;
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = Math.max(0, now - timestamp);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function HistoryPanel({ history, onRerun }: HistoryPanelProps) {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 gap-3">
        <div className="w-16 h-16 rounded-2xl border border-dashed border-white/[0.08] flex items-center justify-center">
          <span className="text-2xl text-white/10">{'\u25F4'}</span>
        </div>
        <p className="text-white/25 text-xs text-center leading-relaxed">
          No prompts yet.<br />Try a preset or type a prompt below.
        </p>
      </div>
    );
  }

  const sorted = [...history].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="flex flex-col gap-2 p-4">
      {sorted.map((entry, i) => (
        <button
          key={`${entry.timestamp}-${i}`}
          onClick={() => onRerun(entry.prompt)}
          className="group w-full text-left bg-[#111827] border border-white/[0.06] rounded-xl px-4 py-3 hover:bg-white/[0.03] hover:border-white/[0.1] transition-all duration-200"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-white/25 uppercase tracking-wider font-medium">
                {formatRelativeTime(entry.timestamp)}
              </span>
              <p className="text-sm text-white/70 mt-1.5 line-clamp-2 leading-relaxed">
                {entry.prompt}
              </p>
            </div>
            <span className="text-[10px] font-medium text-violet-400/0 group-hover:text-violet-400/80 transition-all duration-200 bg-violet-500/0 group-hover:bg-violet-500/10 px-2 py-1 rounded-md shrink-0 mt-0.5">
              Re-run
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
