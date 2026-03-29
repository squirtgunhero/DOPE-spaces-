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
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${color}`}>
      {tag}
    </span>
  );
}

function VectorDisplay({ label, values }: { label: string; values: [number, number, number] }) {
  const axes = ['X', 'Y', 'Z'] as const;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-white/30 uppercase tracking-wider">{label}</span>
      <div className="flex gap-2">
        {axes.map((axis, i) => (
          <div key={axis} className="flex-1 bg-[#0f1729] rounded px-2 py-1.5 flex items-center gap-1.5">
            <span className="text-[10px] text-white/30 font-medium">{axis}</span>
            <span className="text-xs text-white/60 font-mono">
              {typeof values[i] === 'number' ? values[i].toFixed(2) : '0.00'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InspectorPanel({ selectedObject, onTriggerState }: InspectorPanelProps) {
  if (!selectedObject) {
    return (
      <div className="flex items-center justify-center h-full px-6">
        <p className="text-white/30 text-sm text-center">
          Select an object in the viewport or scene list
        </p>
      </div>
    );
  }

  const animationKeys = selectedObject.animation ? Object.keys(selectedObject.animation) : [];

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-white">{selectedObject.name}</h2>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
              selectedObject.type === 'compound'
                ? 'bg-indigo-500/20 text-indigo-300'
                : 'bg-slate-500/20 text-slate-300'
            }`}
          >
            {selectedObject.type}
          </span>
          {selectedObject.type === 'compound' && selectedObject.partCount > 0 && (
            <span className="text-[10px] text-white/30">{selectedObject.partCount} parts</span>
          )}
        </div>
      </div>

      {/* Transform */}
      <section>
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
          Transform
        </h3>
        <div className="bg-[#1e293b] rounded-lg p-3 flex flex-col gap-3">
          <VectorDisplay label="Position" values={selectedObject.position} />
          <VectorDisplay label="Scale" values={selectedObject.scale} />
        </div>
      </section>

      {/* Animation */}
      {animationKeys.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
            Animation
          </h3>
          <div className="bg-[#1e293b] rounded-lg p-3">
            <div className="flex flex-wrap gap-1.5">
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
          <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
            Parts
          </h3>
          <div className="flex flex-col gap-1.5">
            {selectedObject.parts.map((part, i) => (
              <div key={i} className="bg-[#1e293b] rounded-lg px-3 py-2.5 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/60 font-medium">{part.geometry}</span>
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-white/10 shrink-0"
                    style={{ backgroundColor: part.color }}
                    title={part.color}
                  />
                </div>
                {part.animation && part.animation.length > 0 && (
                  <div className="flex flex-wrap gap-1">
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
          <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
            States
          </h3>
          <div className="flex flex-col gap-1.5">
            {selectedObject.states.map((state) => (
              <div
                key={state}
                className="bg-[#1e293b] rounded-lg px-3 py-2 flex items-center justify-between"
              >
                <span className="text-xs text-white/60">{state}</span>
                <button
                  onClick={() => onTriggerState?.(selectedObject.name, state)}
                  className="px-2.5 py-1 rounded text-[10px] font-medium text-purple-300 border border-purple-500/30 hover:bg-purple-500/10 transition-colors"
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
