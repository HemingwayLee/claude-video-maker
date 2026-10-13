import { Easing, interpolate, spring } from "remotion";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.33, 1, 0.68, 1);

// 0 → 1 over `dur` frames starting at `start`, eased.
export const fade = (frame: number, start: number, dur = 15) =>
  interpolate(frame, [start, start + dur], [0, 1], { ...clamp, easing: ease });

// 1 → 0 over `dur` frames starting at `start`.
export const fadeOut = (frame: number, start: number, dur = 15) => 1 - fade(frame, start, dur);

// Bouncy 0 → 1 starting at `start`.
export const pop = (frame: number, fps: number, start: number, damping = 14) =>
  spring({ frame: frame - start, fps, config: { damping } });

// Linear map with clamping and easing.
export const lerp = (frame: number, input: number[], output: number[]) =>
  interpolate(frame, input, output, { ...clamp, easing: ease });

// Linear map with clamping, no easing (for counters and steady motion).
export const linear = (frame: number, input: number[], output: number[]) =>
  interpolate(frame, input, output, clamp);
