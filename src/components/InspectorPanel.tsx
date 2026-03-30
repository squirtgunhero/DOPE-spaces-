'use client';

interface PartInfo {
  geometry: string;
  color: string;
  animation?: string[];
}

interface SelectedObject {
  name: string;
  type: string;
  partCount: number;
  position: [number, number, number];
  scale: [number, number, number];
  animation?: Record<string, unknown>;
  parts?: PartInfo[];
  states?: string[];
}

interface InspectorPanelProps {
  selectedObject: SelectedObject | null;
  onTriggerState?: (objectName: string, stateName: string) => void;
}

const TAG_STYLES: Record<string, string> = {
  rotate: 'bg-blue-500/10 text-blue-400/80',
  float: 'bg-cyan-500/10 text-cyan-400/80',
  sway: 'bg-emerald-500/10 text-emerald-400/80',
  pulse: 'bg-amber-500/10 text-amber-400/80',
  orbit: 'bg-violet-500/10 text-violet-400/80',
  path: 'bg-orange-500/10 text-orange-400/80',
  keyframes: 'bg-pink-500/10 text-pink-400/80',
  emissivePulse: 'bg-yellow-500/10 text-yellow-400/80',
  partAnimations: 'bg-rose-500/10 text-rose-400/80',
};

function Tag({ label }: { label: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-medium ${TAG_STYLES[label] || 'bg-white/5 text-white/40'}`}>
      {label}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold text-white/30 uppercase tracking-[0.08em] mb-3">
      {children}
    </h3>
  );
}

const AXIS_COLORS = ['text-rose-400/60', 'text-emerald-400/60', 'text-blue-400/60'];
const AXIS_LABELS = ['X', 'Y', 'Z'];

function VectorRow({ label, values }: { label: string; values: [number, number, number] }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-white/25 w-12 shrink-0">{label}</span>
      <div className="flex gap-1.5 flex-1">
        {values.map((v, i) => (
          <div key={i} className="flex-1 bg-white/[0.02] rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
            <span className={`text-[10px] font-semibold ${AXIS_COLORS[i]}`}>{AXIS_LABELS[i]}</span>
            <span className="text-[12px] text-white/50 font-mono tabular-nums">{v.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InspectorPanel({ selectedObject, onTriggerState }: InspectorPanelProps) {
  if (!selectedObject) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-8">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.02] flex items-center justify-center mb-4">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-white/10">
            <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 6V14M6 10H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <p className="text-white/25 text-[13px] text-center">Select an object</p>
        <p className="text-white/12 text-[11px] mt-1 text-center">Click on an object in the viewport</p>
      </div>
    );
  }

  const animationKeys = selectedObject.animation ? Object.keys(selectedObject.animation) : [];

  return (
    <div className="flex flex-col gap-7 px-5 py-5">
      {/* Header */}
      <div>
        <h2 className="text-[16px] font-semibold text-white/90">{selectedObject.name}</h2>
        <div className="flex items-center gap-2 mt-1.5">
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
            selectedObject.type === 'compound'
              ? 'bg-indigo-500/10 text-indigo-400/70'
              : 'bg-white/[0.04] text-white/30'
          }`}>
            {selectedObject.type}
          </span>
          {selectedObject.type === 'compound' && selectedObject.partCount > 0 && (
            <span className="text-[11px] text-white/20">{selectedObject.partCount} parts</span>
          )}
        </div>
      </div>

      {/* Transform */}
      <section>
        <SectionLabel>Transform</SectionLabel>
        <div className="flex flex-col gap-2">
          <VectorRow label="Position" values={selectedObject.position} />
          <VectorRow label="Scale" values={selectedObject.scale} />
        </div>
      </section>

      {/* Animation */}
      {animationKeys.length > 0 && (
        <section>
          <SectionLabel>Animation</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {animationKeys.map((key) => (
              <Tag key={key} label={key} />
            ))}
          </div>
        </section>
      )}

      {/* Parts */}
      {selectedObject.type === 'compound' && selectedObject.parts && selectedObject.parts.length > 0 && (
        <section>
          <SectionLabel>Parts</SectionLabel>
          <div className="flex flex-col gap-1.5">
            {selectedObject.parts.map((part, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/[0.02] rounded-xl px-3.5 py-2.5">
                <span className="text-[11px] text-white/15 font-mono w-4">{i}</span>
                <div
                  className="w-3 h-3 rounded-full border border-white/10 shrink-0"
                  style={{ backgroundColor: part.color }}
                />
                <span className="text-[12px] text-white/50 font-medium flex-1">{part.geometry}</span>
                {part.animation && part.animation.length > 0 && (
                  <div className="flex gap-1">
                    {part.animation.map((tag) => (
                      <Tag key={tag} label={tag} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* States */}
      {selectedObject.states && selectedObject.states.length > 0 && (
        <section>
          <SectionLabel>States</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {selectedObject.states.map((state) => (
              <button
                key={state}
                onClick={() => onTriggerState?.(selectedObject.name, state)}
                className="px-3 py-1.5 rounded-xl text-[12px] font-medium text-white/40 bg-white/[0.03] border border-white/[0.04] hover:bg-violet-500/[0.08] hover:text-violet-300 hover:border-violet-500/20 transition-all duration-200"
              >
                {state}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
