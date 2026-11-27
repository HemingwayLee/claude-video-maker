import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  LinearProgress,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Snackbar,
  Tab,
  Tabs,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ClosedCaptionIcon from "@mui/icons-material/ClosedCaption";
import ClosedCaptionDisabledOutlinedIcon from "@mui/icons-material/ClosedCaptionDisabledOutlined";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import Forward5Icon from "@mui/icons-material/Forward5";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RedoIcon from "@mui/icons-material/Redo";
import Replay5Icon from "@mui/icons-material/Replay5";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import UndoIcon from "@mui/icons-material/Undo";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import { videosApi } from "../../api";
import { cueSpan, formatPrecise, layout, parseTimecode, splitAt, splitCueText, toOutput, toSource } from "../../video/edit";
import { SUBTITLE_SOURCE, formatTimecode } from "../../video/format";
import { cueAt, parseSrt } from "../../video/srt";
import useVideoEdit, { newCueId } from "../../video/useVideoEdit";
import {
  clipEnd,
  dragClip,
  dropMaterial,
  findClip,
  mediaUrl,
  removeClips,
  snapPoints,
  splitClip,
  updateClip,
} from "../../video/overlays";
import GenerateAnimationDialog from "./GenerateAnimationDialog";
import ExportPanel from "./ExportPanel";
import MaterialPanel from "./MaterialPanel";
import Timeline from "./Timeline";

const CUE_LIST_W = 340;
const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const MOD = isMac ? "⌘" : "Ctrl+";

const isTyping = (el) =>
  el?.closest?.("input, textarea, select, [contenteditable='true'], [role='slider'], [role='dialog']");

/**
 * One clip of an extra track in the player: shown (video) or heard (audio) while the playhead is inside it,
 * kept in step with the timeline. Video clips cover the main picture; later tracks draw on top.
 */
function OverlayMedia({ clip, kind, muted, time, playing }) {
  const ref = useRef(null);
  const active = time >= clip.start && time < clipEnd(clip);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!active) {
      if (!el.paused) el.pause();
      return;
    }
    const want = clip.in + (time - clip.start);
    // While playing, only correct real drift (seeking every frame would stutter).
    if (Math.abs(el.currentTime - want) > (playing ? 0.3 : 0.04)) el.currentTime = want;
    if (playing && el.paused) el.play().catch(() => {});
    if (!playing && !el.paused) el.pause();
  });
  if (kind === "audio") return <audio ref={ref} src={mediaUrl(clip.source)} muted={muted} preload="auto" />;
  return (
    <video
      ref={ref}
      src={mediaUrl(clip.source)}
      muted={muted}
      preload="auto"
      playsInline
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "contain",
        background: "black",
        visibility: active ? "visible" : "hidden",
        pointerEvents: "none",
      }}
    />
  );
}

/** A timecode field that commits on Enter or blur (Esc reverts). */
function TimeField({ label, value, onCommit, disabled }) {
  const [text, setText] = useState(formatPrecise(value));
  const [error, setError] = useState(false);
  useEffect(() => {
    setText(formatPrecise(value));
    setError(false);
  }, [value]);
  const commit = () => {
    const t = parseTimecode(text);
    if (t === null) return setError(true);
    setError(false);
    if (Math.abs(t - value) > 0.004) onCommit(t);
    else setText(formatPrecise(value));
  };
  return (
    <TextField
      label={label}
      size="small"
      value={text}
      error={error}
      disabled={disabled}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        } else if (e.key === "Escape") {
          setText(formatPrecise(value));
          setError(false);
        }
      }}
      slotProps={{ htmlInput: { style: { fontFamily: "monospace" } } }}
      sx={{ flex: 1 }}
    />
  );
}

/** Start/end/text editor for the selected subtitle. Times are in timeline (output) time. */
function CueInspector({ cue, onChange, onDelete, onSplit, disabled, autoFocusText }) {
  const [text, setText] = useState(cue.text);
  useEffect(() => setText(cue.text), [cue.text]);
  const splitting = useRef(false); // the split already saved the text; don't save it again on blur
  const inputRef = useRef(null);
  useEffect(() => {
    if (!autoFocusText || !inputRef.current) return;
    inputRef.current.focus();
    inputRef.current.setSelectionRange(0, 0);
  }, [autoFocusText]);
  return (
    <Stack spacing={1.25} sx={{ p: 1.5, bgcolor: "action.hover" }} onClick={(e) => e.stopPropagation()}>
      <Stack direction="row" spacing={1}>
        <TimeField label="Start" value={cue.outStart} onCommit={(t) => onChange({ outStart: t })} disabled={disabled} />
        <TimeField label="End" value={cue.outEnd} onCommit={(t) => onChange({ outEnd: t })} disabled={disabled} />
      </Stack>
      <TextField
        label="Text"
        size="small"
        multiline
        minRows={1}
        maxRows={4}
        value={text}
        disabled={disabled}
        inputRef={inputRef}
        helperText="Enter splits the subtitle at the cursor · Shift+Enter adds a line break"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          // While an IME is composing (Chinese, Japanese…), Enter confirms the characters instead.
          if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing || e.keyCode === 229) return;
          e.preventDefault();
          if (onSplit(text, e.target.selectionStart)) splitting.current = true;
        }}
        onBlur={() => {
          if (splitting.current) splitting.current = false;
          else if (text !== cue.text) onChange({ text });
        }}
      />
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="caption" color="text.secondary">
          {(cue.outEnd - cue.outStart).toFixed(2)} s · drag its edges on the timeline to retime
        </Typography>
        <Button size="small" color="error" startIcon={<DeleteOutlineIcon />} onClick={onDelete} disabled={disabled}>
          Delete
        </Button>
      </Stack>
    </Stack>
  );
}

/** Subtitles in the side list (timeline order and times); the playing one is highlighted and kept in view. */
function CueList({ blocks, activeId, selectedIds, inspectId, onPick, onContextMenu, placeholder, renderInspector }) {
  const selectedId = selectedIds[selectedIds.length - 1]; // the last one picked is kept in view
  const activeRef = useRef(null);
  const selectedRef = useRef(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeId]);
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  if (!blocks.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
        {placeholder}
      </Typography>
    );
  }
  return (
    <List dense disablePadding sx={{ overflowY: "auto", flex: 1 }}>
      {blocks.map((c, i) => {
        const selected = selectedIds.includes(c.id);
        return (
          <Box
            key={c.id}
            ref={c.id === selectedId ? selectedRef : c.id === activeId ? activeRef : null}
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              borderLeft: 3,
              borderLeftColor: selected ? "primary.main" : "transparent",
              bgcolor: selected && !inspectId ? "rgba(var(--mui-palette-primary-mainChannel) / 0.12)" : undefined,
            }}
          >
            <ListItemButton
              selected={c.id === activeId}
              onClick={(e) => onPick(c, e)}
              onContextMenu={(e) => onContextMenu?.(c.id, e)}
              // Shift+click selects a range of subtitles, not the text on the page.
              onMouseDown={(e) => e.shiftKey && e.preventDefault()}
              sx={{ display: "block", py: 0.75 }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                {i + 1} · {formatTimecode(c.outStart)} → {formatTimecode(c.outEnd)}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                {c.text}
              </Typography>
            </ListItemButton>
            {c.id === inspectId && renderInspector(c)}
          </Box>
        );
      })}
    </List>
  );
}

const SAVE_LABEL = { saved: "All changes saved", pending: "Unsaved changes", saving: "Saving…", error: "Save failed" };

/** The editor for one video: player, subtitle list, transport and an editable timeline. */
export default function VideoEditor({ video, onChanged, onSaved, onError }) {
  const videoRef = useRef(null);
  const srtInput = useRef(null);
  const [loadedCues, setLoadedCues] = useState([]);
  const [subsRev, setSubsRev] = useState(0);
  const [sourceDuration, setSourceDuration] = useState(video.duration_s || 0);
  const [currentTime, setCurrentTime] = useState(0); // output (timeline) time
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [showCC, setShowCC] = useState(true);
  // {kind: "clip" | "cue", ids: [...], anchor}: one clip, or one or more subtitles (⌘/Ctrl/Shift + click).
  const [selection, setSelection] = useState(null);
  const [menu, setMenu] = useState(null); // right-click menu position {x, y}
  const [panel, setPanel] = useState("subtitle"); // right-hand panel tab: subtitle | material | export
  const [generateOpen, setGenerateOpen] = useState(false);
  const [notice, setNotice] = useState(null); // {text, animationId}
  const navigate = useNavigate();
  const [waveform, setWaveform] = useState(null); // {peaks, rate}
  const [audioNote, setAudioNote] = useState("Reading the audio…");

  const hasFile = video.has_video;
  const editable = video.status === "ready";
  const busy = video.status === "downloading" || video.status === "transcribing";

  const handleSaved = useCallback(
    (updated, { subtitlesReset } = {}) => {
      onSaved(updated);
      if (subtitlesReset) setSubsRev((r) => r + 1);
    },
    [onSaved]
  );

  const ed = useVideoEdit({ video, sourceDuration, loadedCues, onSaved: handleSaved, onError });
  const { clips, duration } = useMemo(() => layout(ed.segments ?? []), [ed.segments]);
  const clipsRef = useRef(clips);
  clipsRef.current = clips;

  // Load the subtitles whenever they change on the server (uploaded, replaced, written by Claude Code, reset).
  useEffect(() => {
    if (!video.has_subtitles) {
      setLoadedCues([]);
      return undefined;
    }
    let stale = false;
    fetch(`${videosApi.srtUrl(video.id)}?v=${subsRev}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`${r.status} ${r.statusText}`))))
      .then((text) => !stale && setLoadedCues(parseSrt(text)))
      .catch((e) => !stale && onError(`Couldn't load the subtitles: ${e.message}`));
    return () => {
      stale = true;
    };
  }, [video.id, video.has_subtitles, video.subtitle_source, video.subtitle_lang, subsRev, onError]);

  // The audio waveform (computed by the server on first request, then cached).
  useEffect(() => {
    if (!hasFile) return undefined;
    let stale = false;
    fetch(videosApi.waveformUrl(video.id))
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => null);
          throw new Error(body?.detail || `${r.status} ${r.statusText}`);
        }
        const rate = Number(r.headers.get("X-Waveform-Rate")) || 100;
        return { peaks: new Uint8Array(await r.arrayBuffer()), rate };
      })
      .then((w) => !stale && setWaveform(w))
      .catch((e) => !stale && setAudioNote(e.message));
    return () => {
      stale = true;
    };
  }, [video.id, hasFile]);

  // While playing: move the playhead smoothly and skip the parts that were cut out.
  useEffect(() => {
    if (!playing) return undefined;
    let frame;
    const tick = () => {
      const el = videoRef.current;
      const cl = clipsRef.current;
      if (el && cl.length) {
        const src = el.currentTime;
        const inClip = cl.some((c) => src >= c.start - 0.01 && src < c.end - 0.03);
        if (!inClip) {
          const next = cl.find((c) => c.start > src - 0.005 && c.start >= src);
          if (next) el.currentTime = next.start;
          else {
            el.pause();
            el.currentTime = cl[cl.length - 1].end;
          }
        }
        setCurrentTime(toOutput(cl, el.currentTime));
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  const sourceNow = toSource(clips, currentTime);
  const activeIndex = useMemo(() => cueAt(ed.cues, sourceNow), [ed.cues, sourceNow]);
  const activeCue = activeIndex >= 0 ? ed.cues[activeIndex] : null;
  const cueBlocks = useMemo(
    () =>
      ed.cues
        .map((c) => {
          const span = cueSpan(clips, c);
          return span && { ...c, ...span };
        })
        .filter(Boolean),
    [ed.cues, clips]
  );

  const seek = useCallback(
    (t, cl = clipsRef.current) => {
      const total = cl.length ? cl[cl.length - 1].outEnd : 0;
      const out = Math.min(Math.max(t, 0), total);
      const el = videoRef.current;
      if (el) el.currentTime = toSource(cl, out);
      setCurrentTime(out);
    },
    []
  );

  /** Seeking from the timeline (click, drag, or picking a clip/cue) always leaves the player paused. */
  const seekFromTimeline = useCallback(
    (t) => {
      const el = videoRef.current;
      if (el && !el.paused) el.pause();
      seek(t);
    },
    [seek]
  );

  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      // From the end, start over.
      if (currentTime >= duration - 0.05) seek(0);
      el.play().catch(() => {});
    } else el.pause();
  }, [currentTime, duration, seek]);

  const jumpCue = useCallback(
    (dir) => {
      if (!cueBlocks.length) return;
      const target =
        dir > 0
          ? cueBlocks.find((c) => c.outStart > currentTime + 0.01)
          : [...cueBlocks].reverse().find((c) => c.outStart < currentTime - 0.3) ?? cueBlocks[0];
      if (target) seek(target.outStart);
    },
    [cueBlocks, currentTime, seek]
  );

  // --- editing ---------------------------------------------------------------------------------------------

  const split = useCallback(() => {
    if (!editable) return;
    // A selected clip on an extra track under the playhead is split; otherwise the main video.
    if (selection?.kind === "overlay") {
      const found = findClip(ed.overlays, selection.ids[0]);
      if (found && currentTime > found.clip.start && currentTime < clipEnd(found.clip)) {
        ed.apply((s) => {
          const overlays = splitClip(s.overlays, selection.ids[0], currentTime);
          return overlays === s.overlays ? s : { ...s, overlays };
        });
        return;
      }
    }
    ed.apply((s) => {
      const segments = splitAt(s.segments, clips, currentTime);
      return segments === s.segments ? s : { ...s, segments };
    });
  }, [ed, clips, currentTime, editable, selection]);

  const deleteSelection = useCallback(() => {
    if (!editable || !selection) return;
    if (selection.kind === "clip") {
      const clip = clips.find((c) => c.id === selection.ids[0]);
      if (!clip) return;
      if (clips.length === 1) return onError("That's the only part left. Split it first, then delete a part.");
      const segments = ed.segments.filter((s) => s.id !== clip.id);
      ed.apply((s) => ({ ...s, segments }));
      setSelection(null);
      const next = layout(segments).clips;
      seek(Math.min(clip.outStart, next[next.length - 1].outEnd - 0.01), next);
    } else if (selection.kind === "overlay") {
      ed.apply((s) => ({ ...s, overlays: removeClips(s.overlays, selection.ids) }));
      setSelection(null);
    } else {
      const doomed = new Set(selection.ids);
      ed.apply((s) => ({ ...s, cues: s.cues.filter((c) => !doomed.has(c.id)) }));
      setSelection(null);
    }
  }, [editable, selection, clips, ed, seek, onError]);

  /** Change a cue from the inspector: times are in output time. */
  const changeCue = (id, { outStart, outEnd, text }) => {
    const patch = {};
    if (outStart !== undefined) patch.start = toSource(clips, outStart);
    if (outEnd !== undefined) patch.end = toSource(clips, outEnd);
    if (text !== undefined) patch.text = text;
    ed.apply((s) => {
      const cues = ed.clampCue(s.cues, id, patch);
      return cues === s.cues ? s : { ...s, cues };
    });
  };

  /** Enter in the text field: split the cue at the cursor. Returns true when it split. */
  const [focusCueId, setFocusCueId] = useState(null);
  const splitCue = (id, text, caret) => {
    const cue = ed.cues.find((c) => c.id === id);
    const parts = cue && splitCueText(cue, text, caret, newCueId());
    if (!parts) return false;
    ed.apply((s) => {
      const k = s.cues.findIndex((c) => c.id === id);
      return k === -1 ? s : { ...s, cues: [...s.cues.slice(0, k), ...parts, ...s.cues.slice(k + 1)] };
    });
    // Like CapCut: carry on with the second part, cursor at its start.
    setSelection({ kind: "cue", ids: [parts[1].id], anchor: parts[1].id });
    setFocusCueId(parts[1].id);
    seekFromTimeline(toOutput(clips, parts[1].start));
    return true;
  };

  /** Dragging a cue's start/end handle on the timeline. */
  const onCueEdge = (id, edge, phase, t) => {
    if (phase === "begin") {
      videoRef.current?.pause();
      setSelection({ kind: "cue", ids: [id], anchor: id });
      ed.checkpoint();
    } else if (phase === "move") {
      ed.preview((s) => {
        const cues = ed.clampCue(s.cues, id, { [edge]: toSource(clips, t) });
        return cues === s.cues ? s : { ...s, cues };
      });
      seek(t); // show the frame at the edge
    }
  };

  /**
   * Click on a subtitle (timeline or list). ⌘-click (Ctrl-click on Windows/Linux) adds or removes it;
   * Shift-click selects every subtitle from the last one picked to this one; a plain click selects just it
   * and moves the playhead there.
   */
  const pickCue = (id, e) => {
    const current = selection?.kind === "cue" ? selection : null;
    if (isMac ? e.metaKey : e.ctrlKey) {
      const ids = current?.ids.includes(id) ? current.ids.filter((x) => x !== id) : [...(current?.ids ?? []), id];
      setSelection(ids.length ? { kind: "cue", ids, anchor: id } : null);
      return;
    }
    if (e.shiftKey && current?.anchor != null) {
      const order = cueBlocks.map((c) => c.id);
      const a = order.indexOf(current.anchor);
      const b = order.indexOf(id);
      if (a !== -1 && b !== -1) {
        const range = order.slice(Math.min(a, b), Math.max(a, b) + 1);
        setSelection({ kind: "cue", ids: [...new Set([...current.ids, ...range])], anchor: current.anchor });
        return;
      }
    }
    setSelection({ kind: "cue", ids: [id], anchor: id });
    const block = cueBlocks.find((c) => c.id === id);
    if (block) seekFromTimeline(block.outStart);
  };

  // --- extra tracks (Material dropped on the timeline) ---

  const overlayDrag = useRef(null); // the clip and its track when a move/trim began
  const timelinePps = useRef(100); // the timeline's pixels per second, for snapping distance

  const dropOnTimeline = (item, t) => {
    if (!editable) return;
    let added = null;
    ed.apply((s) => {
      const result = dropMaterial(s.overlays, item, t, duration);
      added = result.clip;
      return { ...s, overlays: result.overlays };
    });
    if (added) setSelection({ kind: "overlay", ids: [added.id], anchor: added.id });
  };

  const editOverlay = (clipId, mode, phase, value) => {
    if (!editable) return;
    if (phase === "begin") {
      const found = findClip(ed.overlays, clipId);
      if (!found) return;
      videoRef.current?.pause();
      overlayDrag.current = { ...found, playhead: currentTime };
      ed.checkpoint();
      return;
    }
    if (phase !== "move" || !overlayDrag.current) {
      if (phase === "end") overlayDrag.current = null;
      return;
    }
    const { track, clip, playhead } = overlayDrag.current;
    // Snap to where the playhead was when the drag began (trimming moves the playhead along with the edge).
    const points = snapPoints(ed.overlays, clips, playhead, clipId);
    const threshold = 8 / Math.max(timelinePps.current, 1e-6); // 8 px
    const next = dragClip(track, clip, mode, value, duration, points, threshold);
    ed.preview((s) => ({ ...s, overlays: updateClip(s.overlays, clipId, () => next) }));
    if (mode !== "move") seek(mode === "start" ? next.start : clipEnd(next)); // show the frame at the edge
  };

  const toggleTrackMute = (trackId) =>
    ed.apply((s) => ({ ...s, overlays: s.overlays.map((t) => (t.id === trackId ? { ...t, muted: !t.muted } : t)) }));

  /** Right-click on a subtitle: keep a selection that includes it, otherwise select just it; then the menu. */
  const openCueMenu = (id, e) => {
    e.preventDefault();
    if (!(selection?.kind === "cue" && selection.ids.includes(id))) setSelection({ kind: "cue", ids: [id], anchor: id });
    setMenu({ x: e.clientX, y: e.clientY });
  };

  const reset = () => {
    if (!window.confirm("Reset all edits? The video goes back to full length and the subtitles to how they were imported.")) return;
    setSelection(null);
    ed.reset();
    seek(0);
  };

  // Keyboard shortcuts.
  useEffect(() => {
    if (!hasFile) return undefined;
    const onKey = (e) => {
      if (isTyping(e.target)) return;
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      if (mod && key === "z") (e.shiftKey ? ed.redo : ed.undo)();
      else if (mod && key === "a" && cueBlocks.length)
        setSelection({ kind: "cue", ids: cueBlocks.map((c) => c.id), anchor: cueBlocks[0].id });
      else if (mod && key === "y") ed.redo();
      else if (mod || e.altKey) return;
      else if (e.key === " " && !e.target.closest?.("button")) togglePlay();
      else if (e.key === "ArrowLeft") seek(currentTime - (e.shiftKey ? 5 : 1));
      else if (e.key === "ArrowRight") seek(currentTime + (e.shiftKey ? 5 : 1));
      else if (e.key === "ArrowUp") jumpCue(-1);
      else if (e.key === "ArrowDown") jumpCue(1);
      else if (key === "s") split();
      else if (e.key === "Delete" || e.key === "Backspace") deleteSelection();
      else if (e.key === "Escape") setSelection(null);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasFile, ed, togglePlay, seek, currentTime, jumpCue, split, deleteSelection, cueBlocks]);

  const replaceSrt = async (file) => {
    try {
      await videosApi.replaceSubtitles(video.id, file);
      setSubsRev((r) => r + 1);
      onChanged();
    } catch (e) {
      onError(e.message);
    }
  };

  // --- states before the video is available ------------------------------------------------------------

  if (video.status === "downloading" || (!hasFile && video.status !== "error")) {
    return (
      <Stack spacing={2} sx={{ flex: 1, alignItems: "center", justifyContent: "center", p: 4 }}>
        <CircularProgress
          variant={video.progress == null ? "indeterminate" : "determinate"}
          value={(video.progress ?? 0) * 100}
        />
        <Typography color="text.secondary">
          {video.progress == null ? video.stage || "Starting download…" : `Downloading ${Math.round(video.progress * 100)}%`}
        </Typography>
      </Stack>
    );
  }
  if (!hasFile) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {video.error || "This import failed."}
        </Alert>
      </Box>
    );
  }

  const ccPlaceholder =
    video.status === "transcribing"
      ? `${video.stage || "Claude Code is writing the subtitles…"} This can take a few minutes.`
      : video.has_subtitles
        ? "No subtitles in the kept parts of the video."
        : "No subtitles. Add an .srt file with “Add .srt”.";
  const ccLabel = video.has_subtitles
    ? [
        `${cueBlocks.length} cues`,
        video.subtitle_lang,
        video.subtitles_edited ? "edited" : SUBTITLE_SOURCE[video.subtitle_source],
      ]
        .filter(Boolean)
        .join(" · ")
    : video.status === "transcribing"
      ? "Being written…"
      : "None";
  const selectedCueIds = selection?.kind === "cue" ? selection.ids : [];
  const inspectId = selectedCueIds.length === 1 ? selectedCueIds[0] : null;
  const selectionLabel = !selection
    ? null
    : selection.kind === "clip"
      ? "video part"
      : selection.kind === "overlay"
        ? "clip"
      : selection.ids.length > 1
        ? `${selection.ids.length} subtitles`
        : "subtitle";
  const edited = clips.length > 1 || ed.overlays.length > 0 || video.subtitles_edited || (ed.segments?.[0] && (ed.segments[0].start > 0.01 || ed.segments[0].end < sourceDuration - 0.01));

  const toolbar = (
    <>
      <Tooltip title={`Undo (${MOD}Z)`}>
        <span>
          <IconButton size="small" onClick={ed.undo} disabled={!ed.canUndo || !editable}>
            <UndoIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={`Redo (${MOD}⇧Z)`}>
        <span>
          <IconButton size="small" onClick={ed.redo} disabled={!ed.canRedo || !editable}>
            <RedoIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
      <Tooltip title="Split the video at the playhead (S)">
        <span>
          <Button size="small" startIcon={<ContentCutIcon />} onClick={split} disabled={!editable}>
            Split
          </Button>
        </span>
      </Tooltip>
      <Tooltip title={selection ? `Delete the selected ${selectionLabel} (Delete)` : "Select a video part or subtitle first"}>
        <span>
          <Button size="small" startIcon={<DeleteOutlineIcon />} onClick={deleteSelection} disabled={!editable || !selection}>
            Delete
          </Button>
        </span>
      </Tooltip>
      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
      <Tooltip title="Go back to the imported video and subtitles">
        <span>
          <Button size="small" startIcon={<RestartAltIcon />} onClick={reset} disabled={!editable || !edited}>
            Reset
          </Button>
        </span>
      </Tooltip>
      <Typography
        variant="caption"
        noWrap
        sx={{ ml: 1, color: ed.saveState === "error" ? "error.main" : "text.secondary" }}
      >
        {editable ? SAVE_LABEL[ed.saveState] : "Editing is available once the import finishes"}
      </Typography>
    </>
  );

  return (
    <Stack sx={{ flex: 1, minHeight: 0 }}>
      {video.status === "transcribing" && <LinearProgress color="secondary" />}
      {video.error && (
        <Alert severity="warning" sx={{ mx: 2, mb: 1, wordBreak: "break-word" }}>
          {video.error}
        </Alert>
      )}

      {/* Player and subtitle list */}
      <Box sx={{ display: "flex", flex: 1, minHeight: 0, borderTop: 1, borderColor: "divider" }}>
        <Box
          sx={{ position: "relative", flex: 1, minWidth: 0, bgcolor: "black", display: "flex", cursor: "pointer" }}
          onClick={togglePlay}
        >
          <video
            ref={videoRef}
            src={videosApi.videoUrl(video.id)}
            preload="auto"
            muted={muted}
            onLoadedMetadata={(e) => {
              setSourceDuration(e.currentTarget.duration);
              if (clipsRef.current.length) e.currentTarget.currentTime = clipsRef.current[0].start;
            }}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onTimeUpdate={(e) => !playing && setCurrentTime(toOutput(clipsRef.current, e.currentTarget.currentTime))}
            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
          />
          {ed.overlays.map((track) =>
            track.clips.map((c) => (
              <OverlayMedia
                key={c.id}
                clip={c}
                kind={track.kind}
                muted={muted || track.muted}
                time={currentTime}
                playing={playing}
              />
            ))
          )}
          {showCC && activeCue && (
            <Box
              sx={{
                position: "absolute",
                left: "50%",
                bottom: "7%",
                transform: "translateX(-50%)",
                maxWidth: "88%",
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                bgcolor: "rgba(0,0,0,0.72)",
                color: "#fff",
                textAlign: "center",
                whiteSpace: "pre-line",
                fontSize: "clamp(14px, 2vw, 26px)",
                lineHeight: 1.35,
                pointerEvents: "none",
              }}
            >
              {activeCue.text}
            </Box>
          )}
        </Box>

        <Stack
          sx={{
            width: CUE_LIST_W,
            flexShrink: 0,
            borderLeft: 1,
            borderColor: "divider",
            display: { xs: "none", md: "flex" },
            minHeight: 0,
          }}
        >
          <Tabs
            value={panel}
            onChange={(_, v) => setPanel(v)}
            variant="fullWidth"
            sx={{ minHeight: 40, borderBottom: 1, borderColor: "divider", "& .MuiTab-root": { minHeight: 40, py: 0 } }}
          >
            <Tab value="subtitle" label="Subtitle" />
            <Tab value="material" label="Material" />
            <Tab value="export" label="Export" />
          </Tabs>
          {panel === "material" ? (
            <MaterialPanel video={video} onError={onError} />
          ) : panel === "export" ? (
            <ExportPanel
              video={video}
              hasTracks={ed.overlays.length > 0}
              flush={ed.flush}
              onError={onError}
            />
          ) : (
          <>
          <Stack direction="row" sx={{ alignItems: "center", px: 1.5, py: 1, gap: 1 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2">Subtitles</Typography>
              <Typography variant="caption" color="text.secondary" noWrap component="div">
                {ccLabel}
              </Typography>
            </Box>
            <Tooltip title={video.has_subtitles ? "Replace with an .srt file (drops subtitle edits)" : "Add an .srt file"}>
              <span>
                <Button
                  size="small"
                  startIcon={<UploadFileOutlinedIcon />}
                  disabled={busy}
                  onClick={() => srtInput.current?.click()}
                >
                  {video.has_subtitles ? "Replace" : "Add .srt"}
                </Button>
              </span>
            </Tooltip>
          </Stack>
          <Divider />
          {selectedCueIds.length > 1 && (
            <Stack
              direction="row"
              sx={{ alignItems: "center", gap: 1, px: 1.5, py: 0.75, bgcolor: "action.selected", borderBottom: 1, borderColor: "divider" }}
            >
              <Typography variant="body2" sx={{ flex: 1, fontWeight: 600 }}>
                {selectedCueIds.length} subtitles selected
              </Typography>
              <Button size="small" onClick={() => setSelection(null)}>
                Clear
              </Button>
              <Button size="small" color="error" startIcon={<DeleteOutlineIcon />} onClick={deleteSelection} disabled={!editable}>
                Delete
              </Button>
            </Stack>
          )}
          <CueList
            blocks={cueBlocks}
            activeId={activeCue?.id}
            selectedIds={selectedCueIds}
            inspectId={inspectId}
            placeholder={ccPlaceholder}
            onPick={(c, e) => pickCue(c.id, e)}
            onContextMenu={openCueMenu}
            renderInspector={(c) => (
              <CueInspector
                cue={c}
                disabled={!editable}
                onChange={(patch) => changeCue(c.id, patch)}
                onDelete={deleteSelection}
                onSplit={(text, caret) => splitCue(c.id, text, caret)}
                autoFocusText={focusCueId === c.id}
              />
            )}
          />
          </>
          )}
        </Stack>
      </Box>

      {/* Transport */}
      <Stack
        direction="row"
        spacing={0.5}
        sx={{ alignItems: "center", px: 1.5, py: 0.5, borderTop: 1, borderColor: "divider" }}
      >
        <Tooltip title="Previous subtitle (↑)">
          <span>
            <IconButton size="small" onClick={() => jumpCue(-1)} disabled={!cueBlocks.length}>
              <SkipPreviousIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Back 5 s (Shift + ←)">
          <IconButton size="small" onClick={() => seek(currentTime - 5)}>
            <Replay5Icon />
          </IconButton>
        </Tooltip>
        <Tooltip title={playing ? "Pause (Space)" : "Play (Space)"}>
          <IconButton onClick={togglePlay} color="primary">
            {playing ? <PauseIcon /> : <PlayArrowIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Forward 5 s (Shift + →)">
          <IconButton size="small" onClick={() => seek(currentTime + 5)}>
            <Forward5Icon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Next subtitle (↓)">
          <span>
            <IconButton size="small" onClick={() => jumpCue(1)} disabled={!cueBlocks.length}>
              <SkipNextIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Typography sx={{ fontFamily: "monospace", fontSize: 13, px: 1.5 }}>
          {formatTimecode(currentTime)}{" "}
          <Box component="span" sx={{ color: "text.secondary" }}>
            / {formatTimecode(duration)}
            {duration < sourceDuration - 0.05 && ` (of ${formatTimecode(sourceDuration)})`}
          </Box>
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Tooltip title={showCC ? "Hide subtitles on video" : "Show subtitles on video"}>
          <IconButton size="small" onClick={() => setShowCC((s) => !s)} color={showCC ? "primary" : "default"}>
            {showCC ? <ClosedCaptionIcon /> : <ClosedCaptionDisabledOutlinedIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip title={muted ? "Unmute" : "Mute"}>
          <IconButton size="small" onClick={() => setMuted((m) => !m)}>
            {muted ? <VolumeOffIcon /> : <VolumeUpIcon />}
          </IconButton>
        </Tooltip>
      </Stack>

      <Timeline
        duration={duration}
        currentTime={currentTime}
        clips={clips}
        cueBlocks={cueBlocks}
        activeCueId={activeCue?.id}
        selection={selection}
        onSelect={setSelection}
        onCuePick={pickCue}
        onCueContextMenu={openCueMenu}
        overlays={ed.overlays}
        onOverlaySelect={(id) => setSelection({ kind: "overlay", ids: [id], anchor: id })}
        onOverlayEdit={editOverlay}
        onTrackMute={toggleTrackMute}
        onDropMaterial={editable ? dropOnTimeline : null}
        onPps={(p) => (timelinePps.current = p)}
        onSeek={seekFromTimeline}
        onCueEdge={editable ? onCueEdge : null}
        title={video.title}
        ccPlaceholder={ccPlaceholder}
        toolbar={toolbar}
        waveform={waveform}
        audioPlaceholder={audioNote}
      />

      <Menu
        open={!!menu}
        onClose={() => setMenu(null)}
        anchorReference="anchorPosition"
        anchorPosition={menu ? { top: menu.y, left: menu.x } : undefined}
      >
        <MenuItem
          disabled={!editable}
          onClick={() => {
            setMenu(null);
            setGenerateOpen(true);
          }}
        >
          <ListItemIcon>
            <AutoAwesomeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={`Generate animation from ${selectedCueIds.length === 1 ? "this subtitle" : `${selectedCueIds.length} subtitles`}…`}
            secondary="Claude Code animates what they say"
          />
        </MenuItem>
        <MenuItem
          disabled={!editable}
          onClick={() => {
            setMenu(null);
            deleteSelection();
          }}
        >
          <ListItemIcon>
            <DeleteOutlineIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={selectedCueIds.length === 1 ? "Delete subtitle" : `Delete ${selectedCueIds.length} subtitles`} />
        </MenuItem>
      </Menu>

      <GenerateAnimationDialog
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        video={video}
        cues={cueBlocks.filter((c) => selectedCueIds.includes(c.id))}
        beforeCreate={ed.flush}
        onCreated={(anim) => {
          setGenerateOpen(false);
          setNotice({ text: "Claude Code is making the animation.", animationId: anim.id });
        }}
      />

      <Snackbar
        open={!!notice}
        autoHideDuration={8000}
        onClose={(_, reason) => reason !== "clickaway" && setNotice(null)}
        message={notice?.text}
        action={
          <Button color="primary" size="small" onClick={() => navigate(`/generated/${notice.animationId}`)}>
            View
          </Button>
        }
      />

      <input
        ref={srtInput}
        type="file"
        hidden
        accept=".srt"
        onChange={(e) => {
          const file = e.target.files[0];
          e.target.value = "";
          if (file) replaceSrt(file);
        }}
      />
    </Stack>
  );
}
