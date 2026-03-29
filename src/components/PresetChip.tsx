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
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
        active
          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
          : 'bg-[#1e293b] text-white/60 hover:text-white hover:bg-purple-500/20 border border-white/5'
      }`}
    >
      {name}
    </button>
  );
}
