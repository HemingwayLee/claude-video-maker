import { useCallback, useEffect, useRef, useState } from "react";
import { videosApi } from "../api";
import { MIN_LENGTH, newSegment, segmentFromSaved, segmentToSave } from "./edit";

const HISTORY = 100;
const SAVE_DELAY = 700;

let nextCueId = 1;
export const newCueId = () => nextCueId++;
const withIds = (cues) => cues.map((c) => ({ id: nextCueId++, start: c.start, end: c.end, text: c.text }));

/**
 * The editor's undoable state, { segments, cues }, saved to the server shortly after each change.
 *
 * `apply(fn)` records an undo step; for drags, call `checkpoint()` once at the start and then `preview(fn)`
 * on every move. `fn` gets the current state and returns the next one (or the same object for "no change").
 */
export default function useVideoEdit({ video, sourceDuration, loadedCues, onSaved, onError }) {
  const [state, setState] = useState({ segments: null, cues: [], overlays: video.overlays ?? [] });
  const history = useRef({ past: [], future: [] });
  const [, rerender] = useState(0); // history lives in a ref; this re-renders when it changes
  const [saveState, setSaveState] = useState("saved"); // saved | pending | saving | error
  const stateRef = useRef(state);
  const dirty = useRef({ segments: false, cues: false, overlays: false });
  const timer = useRef(null);
  const saveRef = useRef(null);

  // Segments: the saved edit, or the whole video, once its length is known.
  useEffect(() => {
    if (stateRef.current.segments || !sourceDuration) return;
    const segments = video.segments?.length
      ? video.segments.map(segmentFromSaved)
      : [newSegment(0, sourceDuration)];
    stateRef.current = { ...stateRef.current, segments };
    setState(stateRef.current);
  }, [sourceDuration, video.segments]);

  // Cues: whenever the subtitles are (re)loaded from the server. Earlier undo steps no longer apply.
  useEffect(() => {
    stateRef.current = { ...stateRef.current, cues: withIds(loadedCues) };
    setState(stateRef.current);
    history.current = { past: [], future: [] };
    rerender((n) => n + 1);
  }, [loadedCues]);

  const save = useCallback(async () => {
    clearTimeout(timer.current);
    timer.current = null;
    const body = {};
    const { segments, cues } = stateRef.current;
    if (dirty.current.segments && segments) body.segments = segments.map(segmentToSave);
    if (dirty.current.cues) body.cues = cues.map(({ start, end, text }) => ({ start, end, text }));
    if (dirty.current.overlays) body.overlays = stateRef.current.overlays;
    dirty.current = { segments: false, cues: false, overlays: false };
    if (!Object.keys(body).length) return;
    setSaveState("saving");
    try {
      onSaved(await videosApi.saveEdit(video.id, body));
      if (!timer.current) setSaveState("saved");
    } catch (e) {
      setSaveState("error");
      onError(`Couldn't save the edit: ${e.message}`);
    }
  }, [video.id, onSaved, onError]);
  saveRef.current = save;

  // Save what's pending when leaving this video.
  useEffect(() => () => timer.current && saveRef.current(), []);

  const commit = useCallback((next, prev) => {
    stateRef.current = next;
    setState(next);
    if (next.segments !== prev.segments) dirty.current.segments = true;
    if (next.cues !== prev.cues) dirty.current.cues = true;
    if (next.overlays !== prev.overlays) dirty.current.overlays = true;
    setSaveState("pending");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => saveRef.current(), SAVE_DELAY);
  }, []);

  const record = (snapshot) => {
    history.current = { past: [...history.current.past.slice(-HISTORY + 1), snapshot], future: [] };
    rerender((n) => n + 1);
  };

  const apply = useCallback(
    (fn) => {
      const prev = stateRef.current;
      const next = fn(prev);
      if (next === prev) return;
      record(prev);
      commit(next, prev);
    },
    [commit]
  );

  /** Record an undo step now, for a change made with preview() (e.g. while dragging). */
  const checkpoint = useCallback(() => record(stateRef.current), []);

  const preview = useCallback(
    (fn) => {
      const prev = stateRef.current;
      const next = fn(prev);
      if (next !== prev) commit(next, prev);
    },
    [commit]
  );

  const undo = useCallback(() => {
    const { past, future } = history.current;
    if (!past.length) return;
    const current = stateRef.current;
    const prev = past[past.length - 1];
    history.current = { past: past.slice(0, -1), future: [current, ...future] };
    commit(prev, current);
    rerender((n) => n + 1);
  }, [commit]);

  const redo = useCallback(() => {
    const { past, future } = history.current;
    if (!future.length) return;
    const current = stateRef.current;
    history.current = { past: [...past, current], future: future.slice(1) };
    commit(future[0], current);
    rerender((n) => n + 1);
  }, [commit]);

  /** Change one cue, keeping it at least MIN_LENGTH long and between its neighbours. */
  const clampCue = useCallback(
    (cues, id, patch) => {
      const k = cues.findIndex((c) => c.id === id);
      if (k === -1) return cues;
      const cue = cues[k];
      const lo = Math.min(k > 0 ? cues[k - 1].end : 0, cue.start);
      const hi = Math.max(k < cues.length - 1 ? cues[k + 1].start : sourceDuration || Infinity, cue.end);
      let { start = cue.start, end = cue.end } = patch;
      if ("start" in patch) start = Math.min(Math.max(start, lo), end - MIN_LENGTH);
      if ("end" in patch) end = Math.max(Math.min(end, hi), start + MIN_LENGTH);
      const next = { ...cue, ...patch, start, end };
      if (next.start === cue.start && next.end === cue.end && next.text === cue.text) return cues;
      return cues.map((c, i) => (i === k ? next : c));
    },
    [sourceDuration]
  );

  const reset = useCallback(async () => {
    clearTimeout(timer.current);
    timer.current = null;
    dirty.current = { segments: false, cues: false, overlays: false };
    try {
      const updated = await videosApi.resetEdit(video.id);
      stateRef.current = { ...stateRef.current, segments: [newSegment(0, sourceDuration)], overlays: [] };
      setState(stateRef.current);
      history.current = { past: [], future: [] };
      setSaveState("saved");
      onSaved(updated, { subtitlesReset: true });
    } catch (e) {
      onError(`Couldn't reset: ${e.message}`);
    }
  }, [video.id, sourceDuration, onSaved, onError]);

  return {
    segments: state.segments,
    cues: state.cues,
    overlays: state.overlays,
    apply,
    preview,
    checkpoint,
    undo,
    redo,
    canUndo: history.current.past.length > 0,
    canRedo: history.current.future.length > 0,
    clampCue,
    reset,
    /** Save pending changes now (e.g. before something on the server reads them). */
    flush: () => (timer.current ? saveRef.current() : Promise.resolve()),
    saveState,
  };
}
