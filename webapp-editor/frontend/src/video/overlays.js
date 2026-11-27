/**
 * Extra timeline tracks made by dropping Material on the timeline (like CapCut's overlay/audio tracks).
 *
 * overlays = [{id, kind: "video" | "audio", muted, clips: [{id, source: {type: "animation" | "material", id},
 *   name, start, in, duration, source_duration}]}]
 * Times are timeline (output) seconds: a clip shows `duration` s of its media, from `in`, starting at `start`.
 */
import { animationsApi, materialsApi } from "../api";
import { MIN_LENGTH } from "./edit";

export const uid = () => Math.floor(Math.random() * 2 ** 31);

export const mediaUrl = (source) =>
  source.type === "animation" ? animationsApi.videoUrl(source.id) : materialsApi.fileUrl(source.id);

export const clipEnd = (c) => c.start + c.duration;

/** Find a clip and its track. */
export function findClip(overlays, clipId) {
  for (const track of overlays) {
    const clip = track.clips.find((c) => c.id === clipId);
    if (clip) return { track, clip };
  }
  return null;
}

/** Replace one clip (by id) using fn(clip) -> clip. */
export function updateClip(overlays, clipId, fn) {
  return overlays.map((t) =>
    t.clips.some((c) => c.id === clipId) ? { ...t, clips: t.clips.map((c) => (c.id === clipId ? fn(c) : c)) } : t
  );
}

/** The free space around a clip on its track: [lo, hi] in timeline seconds. */
function freeSpace(track, clip, total) {
  let lo = 0;
  let hi = total;
  for (const c of track.clips) {
    if (c.id === clip.id) continue;
    if (clipEnd(c) <= clip.start + 1e-6) lo = Math.max(lo, clipEnd(c));
    else if (c.start >= clipEnd(clip) - 1e-6) hi = Math.min(hi, c.start);
  }
  return [lo, hi];
}

/** Snap t to the nearest of `points` within `threshold` seconds. */
const snapTo = (t, points, threshold) => {
  let best = t;
  let dist = threshold;
  for (const p of points) {
    const d = Math.abs(p - t);
    if (d < dist) {
      dist = d;
      best = p;
    }
  }
  return best;
};

/** Edges other clips could snap to: the playhead, the main video's cuts, and every other overlay clip. */
export function snapPoints(overlays, mainClips, playhead, exceptId) {
  const points = [0, playhead];
  for (const c of mainClips) points.push(c.outStart, c.outEnd);
  for (const t of overlays) for (const c of t.clips) if (c.id !== exceptId) points.push(c.start, clipEnd(c));
  return points;
}

/**
 * The clip after a drag, from its state when the drag began (`orig`):
 * mode "move" shifts it by `delta`; "start"/"end" trims that edge to time `t`. Stays in its free space,
 * within its media, at least MIN_LENGTH long, and snaps to `points` within `threshold`.
 */
export function dragClip(track, orig, mode, value, total, points, threshold) {
  const [lo, hi] = freeSpace(track, orig, total);
  const sourceLeft = orig.source_duration ? orig.source_duration - orig.in : Infinity; // media after `in`
  if (mode === "move") {
    let start = orig.start + value;
    const snappedStart = snapTo(start, points, threshold);
    const snappedEnd = snapTo(start + orig.duration, points, threshold) - orig.duration;
    start = Math.abs(snappedStart - start) <= Math.abs(snappedEnd - start) ? snappedStart : snappedEnd;
    start = Math.min(Math.max(start, lo), hi - orig.duration);
    return { ...orig, start: Math.max(0, start) };
  }
  if (mode === "start") {
    let s = snapTo(value, points, threshold);
    s = Math.min(Math.max(s, lo, orig.start - orig.in), clipEnd(orig) - MIN_LENGTH);
    const shift = s - orig.start;
    return { ...orig, start: s, in: orig.in + shift, duration: orig.duration - shift };
  }
  let e = snapTo(value, points, threshold);
  e = Math.max(Math.min(e, hi, orig.start + sourceLeft), orig.start + MIN_LENGTH);
  return { ...orig, duration: e - orig.start };
}

/** Split a clip at timeline time t (no-op when t isn't well inside it). */
export function splitClip(overlays, clipId, t) {
  const found = findClip(overlays, clipId);
  if (!found) return overlays;
  const { clip } = found;
  if (t - clip.start < MIN_LENGTH || clipEnd(clip) - t < MIN_LENGTH) return overlays;
  const first = { ...clip, duration: t - clip.start };
  const second = { ...clip, id: uid(), start: t, in: clip.in + (t - clip.start), duration: clipEnd(clip) - t };
  return overlays.map((tr) =>
    tr === found.track ? { ...tr, clips: tr.clips.flatMap((c) => (c.id === clipId ? [first, second] : [c])) } : tr
  );
}

/** Remove clips; tracks left empty go too. */
export function removeClips(overlays, ids) {
  const doomed = new Set(ids);
  return overlays.map((t) => ({ ...t, clips: t.clips.filter((c) => !doomed.has(c.id)) })).filter((t) => t.clips.length);
}

/**
 * A new track holding the dropped material at time t. `item` = {source, name, kind, duration}.
 * Animations already contain the source video's voice, so their track starts muted.
 */
export function dropMaterial(overlays, item, t, total) {
  const length = Math.min(item.duration || 5, total);
  const start = Math.min(Math.max(t, 0), Math.max(0, total - length));
  const clip = {
    id: uid(),
    source: item.source,
    name: item.name,
    start,
    in: 0,
    duration: Math.max(MIN_LENGTH, Math.min(length, total - start)),
    source_duration: item.duration || null,
  };
  const track = { id: uid(), kind: item.kind, muted: item.source.type === "animation", clips: [clip] };
  return { overlays: [...overlays, track], clip };
}

// What is being dragged from the Material tab (dataTransfer can't be read during dragover).
export const materialDrag = { current: null };
