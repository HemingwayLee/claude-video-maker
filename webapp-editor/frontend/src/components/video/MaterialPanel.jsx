import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  IconButton,
  LinearProgress,
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import AudiotrackOutlinedIcon from "@mui/icons-material/AudiotrackOutlined";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import MovieFilterOutlinedIcon from "@mui/icons-material/MovieFilterOutlined";
import MovieOutlinedIcon from "@mui/icons-material/MovieOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { useNavigate } from "react-router";
import { animationsApi, materialsApi } from "../../api";
import { formatBytes, formatDuration } from "../../video/format";
import { materialDrag } from "../../video/overlays";

/** Props that let a Material item be dragged onto the timeline. */
const draggableAs = (item) => ({
  draggable: true,
  onDragStart: (e) => {
    materialDrag.current = item;
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("text/plain", item.name);
  },
  onDragEnd: () => {
    materialDrag.current = null;
  },
});

const ACCEPT = "video/*,audio/*,.mp4,.mov,.m4v,.mkv,.webm,.avi,.mp3,.wav,.m4a,.aac,.ogg,.oga,.opus,.flac";
const RUNNING = ["queued", "running"];

function Thumb({ src, icon, busy, failed }) {
  return (
    <Box
      sx={{
        width: 64,
        height: 40,
        flexShrink: 0,
        borderRadius: 1,
        overflow: "hidden",
        bgcolor: "action.hover",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "text.secondary",
      }}
    >
      {src ? (
        <Box component="img" src={src} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : busy ? (
        <CircularProgress size={16} color="secondary" />
      ) : failed ? (
        <ErrorOutlineIcon color="error" fontSize="small" />
      ) : (
        icon
      )}
    </Box>
  );
}

/**
 * The editor's Material tab: animations generated from this video (or all videos), and video/audio files
 * uploaded from disk. Click an item to preview it at the top.
 */
export default function MaterialPanel({ video, onError }) {
  const [animations, setAnimations] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [allVideos, setAllVideos] = useState(false);
  const [preview, setPreview] = useState(null); // {kind: "video" | "audio", src, name}
  const [uploading, setUploading] = useState(null); // {name, progress, left}
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const refresh = useCallback(async () => {
    try {
      const [anims, mats] = await Promise.all([animationsApi.list(), materialsApi.list(video.id)]);
      setAnimations(anims);
      setUploads(mats);
    } catch (e) {
      onError(`Couldn't load the material: ${e.message}`);
    }
  }, [video.id, onError]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Keep animations that are still being made up to date.
  const making = animations.some((a) => RUNNING.includes(a.status));
  useEffect(() => {
    if (!making) return undefined;
    const timer = setInterval(refresh, 4000);
    return () => clearInterval(timer);
  }, [making, refresh]);

  const upload = async (files) => {
    const list = [...files];
    for (let i = 0; i < list.length; i++) {
      setUploading({ name: list[i].name, progress: 0, left: list.length - i - 1 });
      try {
        const m = await materialsApi.upload(video.id, list[i], {
          onProgress: (p) => setUploading((u) => u && { ...u, progress: p }),
        });
        setUploads((u) => [m, ...u]);
      } catch (e) {
        onError(`Couldn't upload ${list[i].name}: ${e.message}`);
      }
    }
    setUploading(null);
  };

  const removeUpload = async (m) => {
    if (!window.confirm(`Remove “${m.name}” from the material?`)) return;
    try {
      await materialsApi.remove(m.id);
      if (preview?.key === `m${m.id}`) setPreview(null);
      setUploads((u) => u.filter((x) => x.id !== m.id));
    } catch (e) {
      onError(e.message);
    }
  };

  const shownAnimations = allVideos ? animations : animations.filter((a) => a.video_id === video.id);

  return (
    <Stack
      sx={{ flex: 1, minHeight: 0, position: "relative" }}
      onDragOver={(e) => {
        if (![...e.dataTransfer.types].includes("Files")) return;
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget) && setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
      }}
    >
      <Stack direction="row" sx={{ alignItems: "center", px: 1.5, py: 1, gap: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1, minWidth: 0 }}>
          Drag onto the timeline to use
        </Typography>
        <Button size="small" variant="outlined" startIcon={<UploadFileOutlinedIcon />} onClick={() => inputRef.current?.click()} disabled={!!uploading}>
          Upload
        </Button>
        <input
          ref={inputRef}
          type="file"
          hidden
          multiple
          accept={ACCEPT}
          onChange={(e) => {
            const files = [...e.target.files];
            e.target.value = "";
            if (files.length) upload(files);
          }}
        />
      </Stack>
      {uploading && (
        <Box sx={{ px: 1.5, pb: 1 }}>
          <LinearProgress variant="determinate" value={uploading.progress * 100} />
          <Typography variant="caption" color="text.secondary" noWrap component="div">
            Uploading {uploading.name} · {Math.round(uploading.progress * 100)}%{uploading.left ? ` · ${uploading.left} more` : ""}
          </Typography>
        </Box>
      )}

      {preview && (
        <Box sx={{ position: "relative", bgcolor: "black", borderTop: 1, borderBottom: 1, borderColor: "divider" }}>
          {preview.kind === "video" ? (
            <video key={preview.src} src={preview.src} controls autoPlay style={{ width: "100%", maxHeight: 260, display: "block" }} />
          ) : (
            <Box sx={{ p: 1.5, pt: 4 }}>
              <audio key={preview.src} src={preview.src} controls autoPlay style={{ width: "100%" }} />
            </Box>
          )}
          <Typography
            noWrap
            sx={{ position: "absolute", top: 4, left: 8, right: 36, fontSize: 12, color: "#fff", textShadow: "0 1px 2px #000", pointerEvents: "none" }}
          >
            {preview.name}
          </Typography>
          <IconButton size="small" onClick={() => setPreview(null)} sx={{ position: "absolute", top: 0, right: 0, color: "#fff" }} aria-label="Close preview">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      <Box sx={{ flex: 1, overflowY: "auto" }}>
        <List dense disablePadding>
          <ListSubheader sx={{ display: "flex", alignItems: "center", lineHeight: "36px", bgcolor: "background.paper" }}>
            <Box sx={{ flex: 1 }}>Generated animations</Box>
            <FormControlLabel
              control={<Switch size="small" checked={allVideos} onChange={(e) => setAllVideos(e.target.checked)} />}
              label={<Typography variant="caption">All videos</Typography>}
              sx={{ mr: 0 }}
            />
          </ListSubheader>
          {shownAnimations.map((a) => {
            const busy = RUNNING.includes(a.status);
            return (
              <ListItemButton
                key={`a${a.id}`}
                {...(a.has_video
                  ? draggableAs({ source: { type: "animation", id: a.id }, name: a.title, kind: "video", duration: a.duration_s })
                  : {})}
                selected={preview?.key === `a${a.id}`}
                disabled={!a.has_video && !busy && a.status !== "error"}
                onClick={() =>
                  a.has_video
                    ? setPreview({ key: `a${a.id}`, kind: "video", src: animationsApi.videoUrl(a.id), name: a.title })
                    : navigate(`/generated/${a.id}`)
                }
                sx={{ gap: 1.25, "&:hover .actions": { visibility: "visible" } }}
              >
                <Thumb
                  src={a.has_video ? animationsApi.thumbnailUrl(a.id) : null}
                  icon={<MovieFilterOutlinedIcon fontSize="small" />}
                  busy={busy}
                  failed={a.status === "error"}
                />
                <ListItemText
                  primary={a.title}
                  secondary={
                    busy
                      ? a.stage || "Being made…"
                      : a.status === "complete"
                        ? [formatDuration(a.duration_s), allVideos && a.video_id !== video.id ? a.source_title : null].filter(Boolean).join(" · ")
                        : a.status === "error"
                          ? "Failed"
                          : "Stopped"
                  }
                  slotProps={{ primary: { noWrap: true, title: a.title }, secondary: { noWrap: true } }}
                />
                <Tooltip title="Open in Generated videos">
                  <IconButton
                    className="actions"
                    size="small"
                    sx={{ visibility: "hidden" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/generated/${a.id}`);
                    }}
                  >
                    <OpenInNewIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </ListItemButton>
            );
          })}
          {shownAnimations.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1 }}>
              None yet. Select subtitles, right-click, and choose “Generate animation”.
            </Typography>
          )}

          <ListSubheader sx={{ lineHeight: "36px", bgcolor: "background.paper", borderTop: 1, borderColor: "divider", mt: 1 }}>
            Uploaded
          </ListSubheader>
          {uploads.map((m) => (
            <ListItemButton
              key={`m${m.id}`}
              {...draggableAs({ source: { type: "material", id: m.id }, name: m.name, kind: m.kind, duration: m.duration_s })}
              selected={preview?.key === `m${m.id}`}
              onClick={() => setPreview({ key: `m${m.id}`, kind: m.kind, src: materialsApi.fileUrl(m.id), name: m.name })}
              sx={{ gap: 1.25, "&:hover .actions": { visibility: "visible" } }}
            >
              <Thumb
                src={m.has_thumbnail ? materialsApi.thumbnailUrl(m.id) : null}
                icon={m.kind === "audio" ? <AudiotrackOutlinedIcon fontSize="small" /> : <MovieOutlinedIcon fontSize="small" />}
              />
              <ListItemText
                primary={m.name}
                secondary={[m.kind === "audio" ? "Audio" : "Video", formatDuration(m.duration_s), formatBytes(m.size_bytes)].filter(Boolean).join(" · ")}
                slotProps={{ primary: { noWrap: true, title: m.name }, secondary: { noWrap: true } }}
              />
              <Box className="actions" sx={{ display: "flex", visibility: "hidden" }}>
                <Tooltip title="Download">
                  <IconButton size="small" component="a" href={materialsApi.fileUrl(m.id, true)} onClick={(e) => e.stopPropagation()}>
                    <DownloadOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Remove">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeUpload(m);
                    }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </ListItemButton>
          ))}
          {uploads.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1 }}>
              No files yet. Use Upload, or drop video and audio files here.
            </Typography>
          )}
        </List>
      </Box>

      {dragOver && (
        <Box
          sx={{
            position: "absolute",
            inset: 4,
            border: 2,
            borderStyle: "dashed",
            borderColor: "primary.main",
            borderRadius: 2,
            bgcolor: "rgba(var(--mui-palette-primary-mainChannel) / 0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 2,
          }}
        >
          <Typography sx={{ fontWeight: 600 }}>Drop video or audio files to upload</Typography>
        </Box>
      )}
    </Stack>
  );
}
