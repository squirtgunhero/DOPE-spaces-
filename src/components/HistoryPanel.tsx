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
      <div className="flex items-center justify-center h-full px-6">
        <p className="text-white/30 text-sm text-center">
          No prompts yet. Try a preset or type a prompt below.
        </p>
      </div>
    );
  }

  const sorted = [...history].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="flex flex-col">
      {sorted.map((entry, i) => (
        <button
          key={`${entry.timestamp}-${i}`}
          onClick={() => onRerun(entry.prompt)}
          className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
        >
          <span className="text-[10px] text-white/30 uppercase tracking-wide">
            {formatRelativeTime(entry.timestamp)}
          </span>
          <p className="text-sm text-white/70 mt-1 line-clamp-2">{entry.prompt}</p>
        </button>
      ))}
    </div>
  );
}
