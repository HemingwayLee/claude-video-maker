// The dance, written as a list of steps on the beat grid.
// Each step holds one pose until the next step starts. `move` sets how the
// body travels during the step; `flip` mirrors the pose (left/right).
//
//  beats 0–7   Look A  (black tank + skirt)      wave · selfie · jump
//  beats 8–15  Look B  (rust top + grey jeans)   point · thumbs · back turn · cheer
//  beats 16–23 Look C  (crop tee + wide jeans)   pocket · peace · point · cute
//  beats 24–31 Finale  double-time outfit roulette → final pose
import sprites from "./sprites.json";

export type PoseName = keyof typeof sprites;
export type Move = "bounce" | "jump" | "sway" | "turn";

export type Step = {
  beat: number;
  pose: PoseName;
  flip?: boolean;
  move?: Move;
};

/** Outfit changes happen with a spin + flash on these beats. */
export const OUTFIT_SWITCHES = [8, 16, 24];

export const STEPS: Step[] = [
  // ── Look A ──
  { beat: 0, pose: "a_wave", move: "sway" },
  { beat: 1, pose: "a_selfie" },
  { beat: 2, pose: "a_wave", flip: true, move: "sway" },
  { beat: 3, pose: "a_selfie2", flip: true },
  { beat: 4, pose: "a_wave", move: "sway" },
  { beat: 5, pose: "a_selfie", flip: true },
  { beat: 6, pose: "a_jump", move: "jump" },
  { beat: 7, pose: "a_jump", flip: true, move: "turn" },
  // ── Look B ──
  { beat: 8, pose: "b_point" },
  { beat: 9, pose: "b_point", flip: true },
  { beat: 10, pose: "b_thumbs", move: "sway" },
  { beat: 11, pose: "b_peace" },
  { beat: 12, pose: "b_back", move: "sway" },
  { beat: 13, pose: "b_thumbs", flip: true },
  { beat: 14, pose: "b_cheer", move: "jump" },
  { beat: 15, pose: "b_jump", flip: true, move: "turn" },
  // ── Look C ──
  { beat: 16, pose: "c_pocket", move: "sway" },
  { beat: 17, pose: "c_peace" },
  { beat: 18, pose: "c_point" },
  { beat: 19, pose: "c_point", flip: true },
  { beat: 20, pose: "c_cute", move: "sway" },
  { beat: 21, pose: "c_peace", flip: true },
  { beat: 22, pose: "c_pocket2", move: "sway" },
  { beat: 23, pose: "c_cute", flip: true, move: "turn" },
  // ── Finale: outfit roulette on every half beat ──
  { beat: 24, pose: "a_jump", move: "jump" },
  { beat: 24.5, pose: "b_cheer" },
  { beat: 25, pose: "c_point" },
  { beat: 25.5, pose: "b_point", flip: true },
  { beat: 26, pose: "a_wave" },
  { beat: 26.5, pose: "b_peace" },
  { beat: 27, pose: "c_peace" },
  { beat: 27.5, pose: "a_selfie", flip: true },
  { beat: 28, pose: "b_jump", move: "jump" },
  { beat: 28.5, pose: "a_jump", flip: true },
  { beat: 29, pose: "c_point", flip: true },
  { beat: 29.5, pose: "b_thumbs" },
  { beat: 30, pose: "a_jump", move: "jump" },
  { beat: 31, pose: "c_peace", move: "sway" },
];

/**
 * Per-pose size correction. Stickers on the same sheet are not all drawn at
 * the same scale, so these numbers were tuned by eye to keep her head the
 * same size from pose to pose.
 */
export const SIZE_TWEAK: Partial<Record<PoseName, number>> = {};

export const stepAt = (beat: number) => {
  let i = 0;
  while (i + 1 < STEPS.length && STEPS[i + 1].beat <= beat) i++;
  const cur = STEPS[i];
  const end = i + 1 < STEPS.length ? STEPS[i + 1].beat : 32;
  return { index: i, step: cur, prev: i > 0 ? STEPS[i - 1] : null, start: cur.beat, end };
};
