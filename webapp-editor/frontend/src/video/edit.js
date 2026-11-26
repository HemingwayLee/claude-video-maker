/**
 * Timeline editing maths. The edit keeps `segments` of the source video, in order: [{id, start, end}] in
 * source seconds. Removed parts close up (ripple), so the timeline shows "output" time: segment i starts at
 * the summed length of the segments before it. Subtitle cues stay in source time; they are mapped for display.
 */

export const MIN_LENGTH = 0.05; // shortest clip or cue, seconds (matches the backend)

let nextId = 1;
export const newSegment = (start, end) => ({ id: nextId++, start, end });

/** Segments with their output-time placement, plus the total output duration. */
export function layout(segments) {
  let t = 0;
  const clips = segments.map((s) => {
    const clip = { ...s, outStart: t, outEnd: t + (s.end - s.start) };
    t = clip.outEnd;
    return clip;
  });
  return { clips, duration: t };
}

/** Output time for a source time; a time inside a removed part maps to where that cut is. */
export function toOutput(clips, src) {
  for (const c of clips) {
    if (src < c.start) return c.outStart;
    if (src <= c.end) return c.outStart + (src - c.start);
  }
  return clips.length ? clips[clips.length - 1].outEnd : 0;
}

/** Index of the clip at output time t (the last one at the very end). */
export function clipIndexAt(clips, t) {
  const i = clips.findIndex((c) => t < c.outEnd);
  return i === -1 ? clips.length - 1 : i;
}

/** Source time for an output time. */
export function toSource(clips, t) {
  if (!clips.length) return 0;
  const c = clips[clipIndexAt(clips, Math.max(0, t))];
  return c.start + Math.min(Math.max(t - c.outStart, 0), c.end - c.start);
}

/** Where a cue shows on the timeline (output time), or null when it is entirely in removed parts. */
export function cueSpan(clips, cue) {
  let first = null;
  let last = null;
  for (const c of clips) {
    const a = Math.max(cue.start, c.start);
    const b = Math.min(cue.end, c.end);
    if (b - a > 1e-6) {
      if (first === null) first = c.outStart + (a - c.start);
      last = c.outStart + (b - c.start);
    }
  }
  return first === null ? null : { outStart: first, outEnd: last };
}

/** Split the clip under output time t into two. Returns the same array when t is too close to an edge. */
export function splitAt(segments, clips, t) {
  const i = clipIndexAt(clips, t);
  const c = clips[i];
  if (!c) return segments;
  const src = c.start + (t - c.outStart);
  if (src - c.start < MIN_LENGTH || c.end - src < MIN_LENGTH) return segments;
  return [...segments.slice(0, i), newSegment(c.start, src), newSegment(src, c.end), ...segments.slice(i + 1)];
}

/**
 * Split a cue's text at `caret` into two cues, dividing its time in proportion to the characters on each
 * side (like CapCut). Returns [first, second] or null when either side would be empty or too short.
 */
export function splitCueText(cue, text, caret, newId) {
  const a = text.slice(0, caret).trim();
  const b = text.slice(caret).trim();
  if (!a || !b) return null;
  const weight = (s) => s.replace(/\s+/g, "").length || 1;
  const length = cue.end - cue.start;
  if (length < 2 * MIN_LENGTH) return null;
  const mid = Math.min(
    Math.max(cue.start + (length * weight(a)) / (weight(a) + weight(b)), cue.start + MIN_LENGTH),
    cue.end - MIN_LENGTH
  );
  return [
    { ...cue, end: mid, text: a },
    { id: newId, start: mid, end: cue.end, text: b },
  ];
}

/** "1:02:03.45" / "02:03.4" / "123.4" -> seconds, or null. */
export function parseTimecode(text) {
  const parts = String(text).trim().split(":");
  if (!parts.length || parts.length > 3 || parts.some((p) => p === "" || Number.isNaN(Number(p)))) return null;
  return parts.reduce((acc, p) => acc * 60 + Number(p), 0);
}

/** Seconds -> "02:03.45" (hundredths, for precise editing). */
export function formatPrecise(s) {
  const cs = Math.round(Math.max(0, s) * 100);
  const h = Math.floor(cs / 360000);
  const m = Math.floor((cs % 360000) / 6000);
  const sec = Math.floor((cs % 6000) / 100);
  const base = `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${String(cs % 100).padStart(2, "0")}`;
  return h ? `${h}:${base}` : base;
}
