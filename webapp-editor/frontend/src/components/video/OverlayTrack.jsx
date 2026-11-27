import { useRef } from "react";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import AudiotrackOutlinedIcon from "@mui/icons-material/AudiotrackOutlined";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import { animationsApi, materialsApi } from "../../api";

export const OVERLAY_H = 38;
const EDGE_W = 7;
const CLICK_PX = 3; // less movement than this is a click, not a drag

const colour = (kind, alpha) =>
  `rgba(var(--mui-palette-${kind === "video" ? "secondary" : "success"}-mainChannel) / ${alpha})`;

export const thumbnailOf = (source) =>
  source.type === "animation" ? animationsApi.thumbnailUrl(source.id) : materialsApi.thumbnailUrl(source.id);

/** Left-column label for an extra track: its name and a mute switch. */
export function OverlayTrackLabel({ track, name, onToggleMute }) {
  return (
    <Box
      sx={{
        height: OVERLAY_H,
        display: "flex",
        alignItems: "center",
        pl: 1.5,
        pr: 0.25,
        borderBottom: 1,
        borderColor: "divider",
        fontSize: 12,
        fontWeight: 600,
        color: "text.secondary",
        bgcolor: colour(track.kind, 0.06),
      }}
    >
      <Box sx={{ flex: 1 }}>{name}</Box>
      <Tooltip title={track.muted ? "Unmute this track" : "Mute this track"}>
        <IconButton size="small" onClick={onToggleMute} sx={{ p: 0.25 }}>
          {track.muted ? <VolumeOffIcon sx={{ fontSize: 16 }} /> : <VolumeUpIcon sx={{ fontSize: 16 }} />}
        </IconButton>
      </Tooltip>
    </Box>
  );
}

/** A trim handle on a clip edge. */
function Edge({ side, onDrag }) {
  const active = useRef(false);
  return (
    <Box
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        active.current = true;
        onDrag("begin", e.clientX);
      }}
      onPointerMove={(e) => active.current && onDrag("move", e.clientX)}
      onPointerUp={(e) => {
        if (active.current) onDrag("end", e.clientX);
        active.current = false;
      }}
      onPointerCancel={(e) => {
        if (active.current) onDrag("end", e.clientX);
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
        borderRadius: side === "left" ? "4px 0 0 4px" : "0 4px 4px 0",
        "&:hover, &:active": { bgcolor: "rgba(255,255,255,0.45)" },
      }}
    />
  );
}

/**
 * One extra track's row of clips. Drag a clip to move it (also up/down onto another track), drag its edges to
 * trim; click selects it. `onEdit(clipId, mode: "move" | "start" | "end", phase: "begin" | "move" | "end", value,
 * clientY)` where value is the drag distance in seconds for "move" and the edge's time for "start"/"end".
 */
export function OverlayTrackRow({ track, pps, timeAt, selectedIds, onSelect, onEdit }) {
  return (
    <Box
      data-drop-row={track.id}
      data-drop-kind={track.kind}
      sx={{ position: "relative", height: OVERLAY_H, borderBottom: 1, borderColor: "divider", bgcolor: colour(track.kind, 0.04) }}
    >
      {track.clips.map((c) => (
        <OverlayClip
          key={c.id}
          clip={c}
          kind={track.kind}
          muted={track.muted}
          pps={pps}
          timeAt={timeAt}
          selected={selectedIds.includes(c.id)}
          onSelect={onSelect}
          onEdit={onEdit}
        />
      ))}
    </Box>
  );
}

function OverlayClip({ clip, kind, muted, pps, timeAt, selected, onSelect, onEdit }) {
  const width = Math.max(clip.duration * pps - 1, 3);
  return (
    <Box
      data-selectable
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        onSelect(clip.id);
        // Follow the drag on the window: moving to another track re-mounts this clip in that track's row.
        const d = { x: e.clientX, t: timeAt(e.clientX), moved: false };
        const move = (ev) => {
          if (!d.moved && Math.abs(ev.clientX - d.x) < CLICK_PX && Math.abs(ev.clientY - e.clientY) < CLICK_PX) return;
          if (!d.moved) {
            d.moved = true;
            onEdit(clip.id, "move", "begin", 0);
          }
          onEdit(clip.id, "move", "move", timeAt(ev.clientX) - d.t, ev.clientY);
        };
        const up = () => {
          if (d.moved) onEdit(clip.id, "move", "end", 0);
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
          window.removeEventListener("pointercancel", up);
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
        window.addEventListener("pointercancel", up);
      }}
      title={clip.name}
      sx={{
        position: "absolute",
        left: clip.start * pps,
        width,
        top: 3,
        bottom: 3,
        borderRadius: 1,
        overflow: "hidden",
        cursor: "grab",
        "&:active": { cursor: "grabbing" },
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        px: width > 2 * EDGE_W + 8 ? `${EDGE_W}px` : 0,
        bgcolor: colour(kind, selected ? 0.45 : 0.25),
        border: selected ? 2 : 1,
        borderColor: selected ? "text.primary" : colour(kind, 0.7),
        opacity: muted && kind === "audio" ? 0.6 : 1,
        touchAction: "none",
      }}
    >
      {kind === "video" ? (
        width > 60 && (
          <Box
            component="img"
            src={thumbnailOf(clip.source)}
            alt=""
            draggable={false}
            onError={(e) => (e.currentTarget.style.display = "none")}
            sx={{ height: "100%", maxHeight: 28, aspectRatio: "auto", borderRadius: 0.5, flexShrink: 0, pointerEvents: "none" }}
          />
        )
      ) : (
        <AudiotrackOutlinedIcon sx={{ fontSize: 16, flexShrink: 0 }} />
      )}
      <Typography noWrap sx={{ fontSize: 11.5, pointerEvents: "none" }}>
        {clip.name}
      </Typography>
      {width > 2 * EDGE_W + 4 && (
        <>
          <Edge side="left" onDrag={(phase, x) => onEdit(clip.id, "start", phase, timeAt(x))} />
          <Edge side="right" onDrag={(phase, x) => onEdit(clip.id, "end", phase, timeAt(x))} />
        </>
      )}
    </Box>
  );
}
