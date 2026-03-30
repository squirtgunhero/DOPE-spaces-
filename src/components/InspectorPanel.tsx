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

const ANIMATION_TAG_COLORS: Record<string, string> = {
  rotate: 'bg-blue-500/20 text-blue-300',
  float: 'bg-cyan-500/20 text-cyan-300',
  sway: 'bg-green-500/20 text-green-300',
  pulse: 'bg-yellow-500/20 text-yellow-300',
  orbit: 'bg-purple-500/20 text-purple-300',
  path: 'bg-orange-500/20 text-orange-300',
  keyframes: 'bg-pink-500/20 text-pink-300',
  emissivePulse: 'bg-amber-500/20 text-amber-300',
  partAnimations: 'bg-red-500/20 text-red-300',
};

function AnimationTag({ tag }: { tag: string }) {
  const color = ANIMATION_TAG_COLORS[tag] || 'bg-white/10 text-white/50';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium ${color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
      {tag}
    </span>
  );
}

const AXIS_COLORS = {
  X: 'text-rose-400',
  Y: 'text-emerald-400',
  Z: 'text-blue-400',
} as const;

function VectorDisplay({ label, values }: { label: string; values: [number, number, number] }) {
  const axes = ['X', 'Y', 'Z'] as const;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] text-white/30 uppercase tracking-widest">{label}</span>
      <div className="grid grid-cols-3 gap-1.5">
        {axes.map((axis, i) => (
          <div key={axis} className="bg-white/[0.03] border border-white/[0.04] rounded-lg px-2.5 py-2 flex items-center gap-2">
            <span className={`text-[10px] font-bold ${AXIS_COLORS[axis]}`}>{axis}</span>
            <span className="text-xs text-white/70 font-mono">
              {typeof values[i] === 'number' ? values[i].toFixed(2) : '0.00'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="flex items-center text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-3 border-l-2 border-violet-500 pl-3">
      {children}
    </h3>
  );
}

export default function InspectorPanel({ selectedObject, onTriggerState }: InspectorPanelProps) {
  if (!selectedObject) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 gap-3">
        <div className="w-16 h-16 rounded-2xl border border-dashed border-white/[0.08] flex items-center justify-center">
          <span className="text-2xl text-white/10">{'\u2316'}</span>
        </div>
        <p className="text-white/25 text-xs text-center leading-relaxed">
          Select an object in the viewport<br />or scene list to inspect
        </p>
      </div>
    );
  }

  const animationKeys = selectedObject.animation ? Object.keys(selectedObject.animation) : [];

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Header */}
      <div className="bg-[#111827] border border-white/[0.06] rounded-xl p-4">
        <h2 className="text-base font-semibold text-white">{selectedObject.name}</h2>
        <div className="flex items-center gap-2 mt-2">
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
              selectedObject.type === 'compound'
                ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
                : 'bg-slate-500/15 text-slate-300 border border-slate-500/20'
            }`}
          >
            {selectedObject.type}
          </span>
          {selectedObject.type === 'compound' && selectedObject.partCount > 0 && (
            <span className="text-[10px] text-white/25">{selectedObject.partCount} parts</span>
          )}
        </div>
      </div>

      {/* Transform */}
      <section>
        <SectionHeader>Transform</SectionHeader>
        <div className="bg-[#111827] border border-white/[0.06] rounded-xl p-3.5 flex flex-col gap-3.5">
          <VectorDisplay label="Position" values={selectedObject.position} />
          <div className="h-px bg-white/[0.04]" />
          <VectorDisplay label="Scale" values={selectedObject.scale} />
        </div>
      </section>

      {/* Animation */}
      {animationKeys.length > 0 && (
        <section>
          <SectionHeader>Animation</SectionHeader>
          <div className="bg-[#111827] border border-white/[0.06] rounded-xl p-3.5">
            <div className="flex flex-wrap gap-2">
              {animationKeys.map((key) => (
                <AnimationTag key={key} tag={key} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Parts (compound objects) */}
      {selectedObject.type === 'compound' && selectedObject.parts && selectedObject.parts.length > 0 && (
        <section>
          <SectionHeader>Parts</SectionHeader>
          <div className="flex flex-col gap-1.5">
            {selectedObject.parts.map((part, i) => (
              <div key={i} className="bg-[#111827] border border-white/[0.06] rounded-xl px-3.5 py-3 flex flex-col gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] text-white/25 font-mono w-4 text-right">{i + 1}</span>
                  <div
                    className="w-4 h-4 rounded-md border border-white/10 shrink-0 shadow-sm"
                    style={{ backgroundColor: part.color }}
                    title={part.color}
                  />
                  <span className="text-xs text-white/70 font-medium">{part.geometry}</span>
                </div>
                {part.animation && part.animation.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 ml-[26px]">
                    {part.animation.map((tag) => (
                      <AnimationTag key={tag} tag={tag} />
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
          <SectionHeader>States</SectionHeader>
          <div className="flex flex-col gap-1.5">
            {selectedObject.states.map((state) => (
              <div
                key={state}
                className="bg-[#111827] border border-white/[0.06] rounded-xl px-3.5 py-2.5 flex items-center justify-between"
              >
                <span className="text-xs text-white/70">{state}</span>
                <button
                  onClick={() => onTriggerState?.(selectedObject.name, state)}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-medium text-violet-300 bg-white/[0.04] border border-white/[0.06] hover:bg-violet-500/10 hover:border-violet-500/20 transition-all duration-200"
                >
                  Trigger
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
