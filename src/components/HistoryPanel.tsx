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
  const diff = Math.max(0, Date.now() - timestamp);
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
      <div className="flex flex-col items-center justify-center h-full px-8">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.02] flex items-center justify-center mb-4">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-white/10">
            <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9 5.5V9L11.5 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <p className="text-white/25 text-[13px] text-center">No history yet</p>
        <p className="text-white/12 text-[11px] mt-1 text-center">Try a preset or type a prompt</p>
      </div>
    );
  }

  const sorted = [...history].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="flex flex-col gap-1.5 px-5 py-5">
      {sorted.map((entry, i) => (
        <button
          key={`${entry.timestamp}-${i}`}
          onClick={() => onRerun(entry.prompt)}
          className="group w-full text-left bg-white/[0.01] hover:bg-white/[0.04] rounded-xl px-4 py-3.5 transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-white/20 font-medium">
              {formatRelativeTime(entry.timestamp)}
            </span>
            <span className="text-[10px] text-violet-400/0 group-hover:text-violet-400/60 font-medium transition-all duration-200">
              Re-run
            </span>
          </div>
          <p className="text-[13px] text-white/50 group-hover:text-white/70 line-clamp-2 leading-relaxed transition-colors duration-200">
            {entry.prompt}
          </p>
        </button>
      ))}
    </div>
  );
}
