export type EasingFn = (t: number) => number;

export const easings: Record<string, EasingFn> = {
  linear: (t) => t,

  inCubic: (t) => t * t * t,

  outCubic: (t) => 1 - Math.pow(1 - t, 3),

  inOutCubic: (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,

  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,

  outElastic: (t) => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
  },

  outBounce: (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },

  spring: (t) => 1 - Math.cos(t * 4.5 * Math.PI) * Math.exp(-t * 6),
};

export function getEasing(name?: string): EasingFn {
  return easings[name || 'inOutCubic'] || easings.inOutCubic;
}
