/**
 * Timeline editing maths. The main track is `segments`, in order: kept parts of the source video
 * ({id, start, end} in source seconds) and Material inserted between them ({id, start, end, source, name, kind,
 * source_duration}, start/end being times in that material). Removed parts close up (ripple), so the timeline
 * shows "output" time: segment i starts at the summed length of the segments before it. Subtitle cues stay in
 * source time; they are mapped for display through the source parts only.
 */

export const MIN_LENGTH = 0.05; // shortest clip or cue, seconds (matches the backend)

let nextId = 1;
export const newSegment = (start, end) => ({ id: nextId++, start, end });

/** True for Material inserted on the main track (not a part of the source video). */
export const isInsert = (c) => !!c.source;

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
  let lastEnd = 0;
  for (const c of clips) {
    if (isInsert(c)) continue;
    lastEnd = c.outEnd;
    if (src < c.start) return c.outStart;
    if (src <= c.end) return c.outStart + (src - c.start);
  }
  return lastEnd;
}

/** Index of the clip at output time t (the last one at the very end). */
export function clipIndexAt(clips, t) {
  const i = clips.findIndex((c) => t < c.outEnd);
  return i === -1 ? clips.length - 1 : i;
}

/** Media time for an output time, within the clip there (source video or inserted material). */
export function mediaTime(c, t) {
  return c.start + Math.min(Math.max(t - c.outStart, 0), c.end - c.start);
}

/** Source time for an output time. Inside inserted material: where the source video stopped before it. */
export function toSource(clips, t) {
  if (!clips.length) return 0;
  const i = clipIndexAt(clips, Math.max(0, t));
  if (!isInsert(clips[i])) return mediaTime(clips[i], t);
  for (let k = i - 1; k >= 0; k--) if (!isInsert(clips[k])) return clips[k].end;
  const next = clips.slice(i + 1).find((c) => !isInsert(c));
  return next ? next.start : 0;
}

/** Where a cue shows on the timeline (output time), or null when it is entirely in removed parts. */
export function cueSpan(clips, cue) {
  let first = null;
  let last = null;
  for (const c of clips) {
    if (isInsert(c)) continue;
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
  const seg = segments[i];
  return [
    ...segments.slice(0, i),
    { ...seg, id: nextId++, end: src },
    { ...seg, id: nextId++, start: src },
    ...segments.slice(i + 1),
  ];
}

/**
 * Insert a Material item (video) into the main track at the clip edge nearest to output time t, like dropping
 * on CapCut's main track. Returns {segments, at} where `at` is the new clip's output start.
 */
export function insertAt(segments, clips, t, item) {
  let i = clips.length;
  if (clips.length) {
    const k = clipIndexAt(clips, t);
    const c = clips[k];
    i = t < (c.outStart + c.outEnd) / 2 ? k : k + 1;
  }
  const length = Math.max(MIN_LENGTH, item.duration || 5);
  const seg = {
    id: nextId++,
    start: 0,
    end: length,
    source: item.source,
    name: item.name,
    kind: "video",
    source_duration: item.duration || null,
  };
  return {
    segments: [...segments.slice(0, i), seg, ...segments.slice(i)],
    at: i < clips.length ? clips[i].outStart : clips.length ? clips[clips.length - 1].outEnd : 0,
    id: seg.id,
  };
}

/** A main-track segment as the server stores it: [start, end] for the source, an object for inserted material. */
export const segmentToSave = (s) =>
  isInsert(s)
    ? { start: s.start, end: s.end, source: s.source, name: s.name, kind: s.kind || "video", source_duration: s.source_duration }
    : [s.start, s.end];

/** A saved main-track segment back into editor form. */
export const segmentFromSaved = (s) =>
  Array.isArray(s) ? newSegment(s[0], s[1]) : { ...s, id: nextId++ };

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
