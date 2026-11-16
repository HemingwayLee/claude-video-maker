// Musical clock. The track (tools/music.mjs) is 128 BPM, so 32 beats = 15 s.
export const FPS = 30;
export const BPM = 128;
export const TOTAL_FRAMES = 15 * FPS;
export const BEAT_FRAMES = (FPS * 60) / BPM; // 14.0625

export const beatAt = (frame: number) => frame / BEAT_FRAMES;

/** 1 on the beat, decaying toward 0 before the next one. */
export const pulse = (frame: number, sharpness = 6, every = 1) => {
  const ph = (beatAt(frame) / every) % 1;
  return Math.exp(-ph * sharpness);
};
