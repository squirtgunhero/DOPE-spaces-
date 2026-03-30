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
      className={`relative rounded-xl px-3.5 py-3 text-left transition-all duration-200 cursor-pointer group ${
        active
          ? 'bg-violet-500/[0.12] border border-violet-500/30 shadow-sm shadow-violet-500/10'
          : 'bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] hover:border-white/[0.1]'
      }`}
    >
      <span className={`text-[13px] font-medium transition-colors duration-200 ${
        active ? 'text-violet-300' : 'text-white/60 group-hover:text-white/80'
      }`}>
        {name}
      </span>
    </button>
  );
}
