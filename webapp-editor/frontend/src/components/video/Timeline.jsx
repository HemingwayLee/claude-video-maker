import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Box, IconButton, Slider, Stack, Tooltip, Typography } from "@mui/material";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import { formatDuration } from "../../video/format";
import Waveform from "./Waveform";

const LABEL_W = 64;
const RULER_H = 24;
const VIDEO_H = 40;
const AUDIO_H = 44;
const CC_H = 46;
const EDGE_W = 7; // grab width of a cue's start/end handle, px
const MAX_ZOOM = 60;
// Ruler label spacing, in seconds: the smallest that leaves room for a label.
const STEPS = [0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800];

const tint = (alpha) => `rgba(var(--mui-palette-primary-mainChannel) / ${alpha})`;

function TrackLabel({ height, children }) {
  return (
    <Box
      sx={{
        height,
        display: "flex",
        alignItems: "center",
        px: 1.5,
        borderBottom: 1,
        borderColor: "divider",
        fontSize: 12,
        fontWeight: 600,
        color: "text.secondary",
      }}
    >
      {children}
    </Box>
  );
}

/** A draggable start or end handle on a cue. */
function EdgeHandle({ side, onDragStart, onDrag, onDragEnd }) {
  const active = useRef(false);
  return (
    <Box
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        active.current = true;
        onDragStart();
      }}
      onPointerMove={(e) => active.current && onDrag(e.clientX)}
      onPointerUp={() => {
        if (active.current) onDragEnd();
        active.current = false;
      }}
      onPointerCancel={() => {
        if (active.current) onDragEnd();
        active.current = false;
      }}
      sx={{
        position: "absolute",
        top: 0,
        bottom: 0,
        [side]: 0,
        width: EDGE_W,
        cursor: "ew-resize",
        zIndex: 1,
        "&:hover, &:active": { bgcolor: "rgba(255,255,255,0.35)" },
      }}
    />
  );
}

/**
 * Editor timeline (output time): ruler, video clips and subtitle cues, with a playhead.
 * Click or drag on empty space to seek. Click a clip or cue to select it; drag a cue's edges to retime it.
 * Zoom with the slider or Ctrl/⌘ + scroll. `toolbar` is shown on the left of the header row.
 */
export default function Timeline({
  duration,
  currentTime,
  clips,
  cueBlocks,
  activeCueId,
  selection, // {kind: "clip" | "cue", ids: [...]}
  onSelect,
  onCuePick, // (cueId, pointerEvent): plain, ⌘/Ctrl (toggle) or Shift (range) click on a cue
  onCueContextMenu, // (cueId, mouseEvent): right-click on a cue
  onSeek,
  onCueEdge,
  title,
  ccPlaceholder,
  toolbar,
  waveform, // {peaks: Uint8Array, rate} once loaded
  audioPlaceholder, // shown in the Audio track when there's no waveform
}) {
  const scrollRef = useRef(null);
  const [viewW, setViewW] = useState(0);
  const [zoom, setZoom] = useState(1);
  const dragging = useRef(false);
  const zoomAnchor = useRef(null); // keep the time under the pointer in place while zooming

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => setViewW(el.clientWidth));
    ro.observe(el);
    setViewW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const total = duration > 0 ? duration : 1;
  const pps = ((viewW || 1) / total) * zoom; // pixels per second
  const contentW = Math.max(viewW, total * pps);
  const step = STEPS.find((s) => s * pps >= 70) ?? STEPS[STEPS.length - 1];

  // Keep the playhead in view (unless the user is dragging).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || dragging.current) return;
    const x = currentTime * pps;
    if (x < el.scrollLeft || x > el.scrollLeft + el.clientWidth - 24) el.scrollLeft = Math.max(0, x - el.clientWidth * 0.2);
  }, [currentTime, pps]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || !zoomAnchor.current) return;
    const { time, offset } = zoomAnchor.current;
    el.scrollLeft = Math.max(0, time * pps - offset);
    zoomAnchor.current = null;
  }, [pps]);

  // Ctrl/⌘ + wheel zooms around the pointer (a non-passive listener, so the page doesn't zoom).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const offset = e.clientX - el.getBoundingClientRect().left;
      zoomAnchor.current = { time: (el.scrollLeft + offset) / pps, offset };
      setZoom((z) => Math.min(MAX_ZOOM, Math.max(1, z * (e.deltaY < 0 ? 1.15 : 1 / 1.15))));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [pps]);

  const setZoomCentered = (z) => {
    const el = scrollRef.current;
    if (el) {
      const offset = Math.min(Math.max(currentTime * pps - el.scrollLeft, 0), el.clientWidth);
      zoomAnchor.current = { time: currentTime, offset };
    }
    setZoom(Math.min(MAX_ZOOM, Math.max(1, z)));
  };

  const timeAt = (clientX) => {
    const el = scrollRef.current;
    const t = (clientX - el.getBoundingClientRect().left + el.scrollLeft) / pps;
    return Math.min(Math.max(t, 0), duration || 0);
  };

  const ticks = [];
  for (let t = 0; t <= total + 1e-6; t += step) ticks.push(t);

  const isSelected = (kind, id) => selection?.kind === kind && selection.ids.includes(id);
  const hasModifier = (e) => e.metaKey || e.ctrlKey || e.shiftKey;

  return (
    <Box sx={{ borderTop: 1, borderColor: "divider", bgcolor: "background.default", userSelect: "none" }}>
      <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", px: 1, py: 0.25, minHeight: 40 }}>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", flex: 1, minWidth: 0 }}>
          {toolbar}
        </Stack>
        <Tooltip title="Zoom out">
          <span>
            <IconButton size="small" disabled={zoom <= 1} onClick={() => setZoomCentered(zoom / 1.5)}>
              <ZoomOutIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Slider
          size="small"
          value={Math.log(zoom)}
          min={0}
          max={Math.log(MAX_ZOOM)}
          step={0.01}
          onChange={(_, v) => setZoomCentered(Math.exp(v))}
          aria-label="Timeline zoom"
          sx={{ width: 110, mx: 1 }}
        />
        <Tooltip title="Zoom in (or Ctrl/⌘ + scroll)">
          <span>
            <IconButton size="small" disabled={zoom >= MAX_ZOOM} onClick={() => setZoomCentered(zoom * 1.5)}>
              <ZoomInIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      <Box sx={{ display: "flex", borderTop: 1, borderColor: "divider" }}>
        <Box sx={{ width: LABEL_W, flexShrink: 0, borderRight: 1, borderColor: "divider" }}>
          <TrackLabel height={RULER_H} />
          <TrackLabel height={VIDEO_H}>Video</TrackLabel>
          <TrackLabel height={AUDIO_H}>Audio</TrackLabel>
          <TrackLabel height={CC_H}>CC</TrackLabel>
        </Box>

        <Box
          ref={scrollRef}
          sx={{ flex: 1, minWidth: 0, overflowX: "auto", overflowY: "hidden", cursor: "text" }}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            if (!e.target.closest("[data-selectable]") && !hasModifier(e)) onSelect(null);
            dragging.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            onSeek(timeAt(e.clientX));
          }}
          onPointerMove={(e) => dragging.current && onSeek(timeAt(e.clientX))}
          onPointerUp={() => (dragging.current = false)}
          onPointerCancel={() => (dragging.current = false)}
        >
          <Box sx={{ position: "relative", width: contentW }}>
            {/* Ruler */}
            <Box sx={{ position: "relative", height: RULER_H, borderBottom: 1, borderColor: "divider", overflow: "hidden" }}>
              {ticks.map((t) => (
                <Box key={t} sx={{ position: "absolute", left: t * pps, top: 0, bottom: 0 }}>
                  <Box sx={{ position: "absolute", bottom: 0, width: "1px", height: 8, bgcolor: "text.disabled" }} />
                  <Box
                    sx={{ position: "absolute", left: (step * pps) / 2, bottom: 0, width: "1px", height: 4, bgcolor: "divider" }}
                  />
                  <Typography
                    component="span"
                    sx={{ position: "absolute", left: 4, top: 2, fontSize: 10, color: "text.secondary", whiteSpace: "nowrap" }}
                  >
                    {step < 1 ? `${formatDuration(Math.floor(t))}.${Math.round((t % 1) * 10)}` : formatDuration(t)}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Video track: one block per kept clip */}
            <Box sx={{ position: "relative", height: VIDEO_H, borderBottom: 1, borderColor: "divider" }}>
              {clips.map((c, i) => {
                const selected = isSelected("clip", c.id);
                return (
                  <Box
                    key={c.id}
                    data-selectable
                    onPointerDown={() => onSelect({ kind: "clip", ids: [c.id], anchor: c.id })}
                    sx={{
                      position: "absolute",
                      left: c.outStart * pps + (i ? 1 : 0),
                      width: Math.max((c.outEnd - c.outStart) * pps - (i ? 1 : 0) - 1, 2),
                      top: 4,
                      bottom: 4,
                      borderRadius: 1,
                      bgcolor: selected ? tint(0.4) : tint(0.18),
                      border: selected ? 2 : 1,
                      borderColor: selected ? "text.primary" : tint(0.5),
                      px: 1,
                      display: "flex",
                      alignItems: "center",
                      overflow: "hidden",
                      cursor: "pointer",
                    }}
                  >
                    <Typography noWrap sx={{ fontSize: 12 }}>
                      {clips.length > 1 ? `${i + 1}. ${title}` : title}
                    </Typography>
                  </Box>
                );
              })}
            </Box>

            {/* Audio track: the waveform of the kept parts */}
            <Box sx={{ position: "relative", height: AUDIO_H, borderBottom: 1, borderColor: "divider", overflow: "hidden" }}>
              {waveform ? (
                <Waveform
                  scrollRef={scrollRef}
                  viewW={viewW}
                  pps={pps}
                  clips={clips}
                  peaks={waveform.peaks}
                  rate={waveform.rate}
                  height={AUDIO_H - 1}
                />
              ) : (
                audioPlaceholder && (
                  <Typography
                    noWrap
                    sx={{ position: "sticky", left: 8, display: "inline-block", fontSize: 12, color: "text.secondary", lineHeight: `${AUDIO_H}px` }}
                  >
                    {audioPlaceholder}
                  </Typography>
                )
              )}
            </Box>

            {/* CC track */}
            <Box sx={{ position: "relative", height: CC_H, borderBottom: 1, borderColor: "divider" }}>
              {cueBlocks.length === 0 && ccPlaceholder && (
                <Typography
                  noWrap
                  sx={{ position: "sticky", left: 8, display: "inline-block", fontSize: 12, color: "text.secondary", lineHeight: `${CC_H}px` }}
                >
                  {ccPlaceholder}
                </Typography>
              )}
              {cueBlocks.map((c) => {
                const active = c.id === activeCueId;
                const selected = isSelected("cue", c.id);
                const width = Math.max((c.outEnd - c.outStart) * pps - 1, 3);
                return (
                  <Tooltip
                    key={c.id}
                    title={<span style={{ whiteSpace: "pre-line" }}>{c.text}</span>}
                    enterDelay={500}
                    disableInteractive
                  >
                    <Box
                      data-selectable
                      onPointerDown={(e) => {
                        if (e.button !== 0) return;
                        e.stopPropagation();
                        onCuePick(c.id, e);
                      }}
                      onContextMenu={(e) => onCueContextMenu?.(c.id, e)}
                      sx={{
                        position: "absolute",
                        left: c.outStart * pps,
                        width,
                        top: 5,
                        bottom: 5,
                        borderRadius: 1,
                        px: width > 2 * EDGE_W + 8 ? `${EDGE_W}px` : 0,
                        overflow: "hidden",
                        cursor: "pointer",
                        fontSize: 11,
                        lineHeight: 1.3,
                        display: "flex",
                        alignItems: "center",
                        bgcolor: active ? "primary.main" : tint(0.22),
                        color: active ? "primary.contrastText" : "text.primary",
                        border: selected ? 2 : 1,
                        borderColor: selected ? "text.primary" : active ? "primary.main" : tint(0.45),
                        "&:hover": { borderColor: selected ? "text.primary" : "primary.main" },
                      }}
                    >
                      <Box
                        component="span"
                        sx={{ overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
                      >
                        {c.text}
                      </Box>
                      {onCueEdge && width > 2 * EDGE_W && (
                        <>
                          <EdgeHandle
                            side="left"
                            onDragStart={() => onCueEdge(c.id, "start", "begin")}
                            onDrag={(x) => onCueEdge(c.id, "start", "move", timeAt(x))}
                            onDragEnd={() => onCueEdge(c.id, "start", "end")}
                          />
                          <EdgeHandle
                            side="right"
                            onDragStart={() => onCueEdge(c.id, "end", "begin")}
                            onDrag={(x) => onCueEdge(c.id, "end", "move", timeAt(x))}
                            onDragEnd={() => onCueEdge(c.id, "end", "end")}
                          />
                        </>
                      )}
                    </Box>
                  </Tooltip>
                );
              })}
            </Box>

            {/* Playhead */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: currentTime * pps,
                width: "2px",
                ml: "-1px",
                bgcolor: "error.main",
                pointerEvents: "none",
                zIndex: 2,
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: -4,
                  borderLeft: "5px solid transparent",
                  borderRight: "5px solid transparent",
                  borderTop: (theme) => `7px solid ${theme.palette.error.main}`,
                },
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
