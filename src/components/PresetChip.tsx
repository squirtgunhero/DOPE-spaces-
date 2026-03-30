'use client';

interface PresetChipProps {
  name: string;
  onClick: () => void;
  active?: boolean;
}

export default function PresetChip({ name, onClick, active = false }: PresetChipProps) {
  return (
    <button
      onClick={onClick}
      className={`relative bg-white/[0.03] hover:bg-white/[0.06] border rounded-xl p-3 transition-all duration-200 cursor-pointer hover:scale-[1.02] text-left ${
        active
          ? 'border-violet-500/40 bg-violet-500/[0.08]'
          : 'border-white/[0.06] hover:border-white/[0.12]'
      }`}
    >
      <div className="flex items-center gap-2">
        {active && (
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
        )}
        <span className="text-xs font-medium text-white/80">{name}</span>
      </div>
    </button>
  );
}
