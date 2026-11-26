import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  LinearProgress,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import MovieFilterOutlinedIcon from "@mui/icons-material/MovieFilterOutlined";
import StopCircleOutlinedIcon from "@mui/icons-material/StopCircleOutlined";
import { Link as RouterLink, Navigate, useLocation, useNavigate } from "react-router";
import { animationsApi } from "../api";
import SplitLayout from "../layout/SplitLayout";
import { labelOf } from "../video/animationOptions";
import { formatDuration } from "../video/format";

const RUNNING = ["queued", "running"];
const STATUS = {
  queued: { label: "Waiting", color: "default" },
  running: { label: "Making", color: "secondary" },
  complete: { label: "Done", color: "success" },
  error: { label: "Failed", color: "error" },
  stopped: { label: "Stopped", color: "default" },
};

function Thumb({ anim }) {
  const box = { width: 56, height: 40, borderRadius: 1, flexShrink: 0, overflow: "hidden", bgcolor: "action.hover" };
  if (anim.has_video) {
    return <Box component="img" src={animationsApi.thumbnailUrl(anim.id)} alt="" sx={{ ...box, objectFit: "cover" }} />;
  }
  return (
    <Box sx={{ ...box, display: "flex", alignItems: "center", justifyContent: "center", color: "text.secondary" }}>
      {RUNNING.includes(anim.status) ? (
        <CircularProgress size={18} color="secondary" />
      ) : anim.status === "error" ? (
        <ErrorOutlineIcon color="error" fontSize="small" />
      ) : (
        <MovieFilterOutlinedIcon fontSize="small" />
      )}
    </Box>
  );
}

function Sidebar({ items, currentId, onSelect }) {
  return (
    <Stack sx={{ height: "100%", p: 1.5 }}>
      <Typography variant="overline" color="text.secondary" sx={{ px: 1 }}>
        Generated videos
      </Typography>
      <Box sx={{ flex: 1, overflowY: "auto", mx: -0.5 }}>
        <List dense>
          {items.map((a) => (
            <ListItemButton key={a.id} selected={a.id === currentId} onClick={() => onSelect(a.id)} sx={{ borderRadius: 1, gap: 1.25 }}>
              <Thumb anim={a} />
              <ListItemText
                primary={a.title}
                secondary={
                  RUNNING.includes(a.status)
                    ? a.stage || STATUS[a.status].label
                    : [STATUS[a.status]?.label, a.duration_s && formatDuration(a.duration_s)].filter(Boolean).join(" · ")
                }
                title={a.title}
                slotProps={{
                  primary: { noWrap: true },
                  secondary: { noWrap: true, color: a.status === "error" ? "error" : "text.secondary" },
                }}
              />
            </ListItemButton>
          ))}
        </List>
        {items.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
            None yet.
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

/** What Claude Code did: tool calls and its notes, newest at the bottom. */
function Activity({ items, live }) {
  const endRef = useRef(null);
  useEffect(() => {
    if (live) endRef.current?.scrollIntoView({ block: "nearest" });
  }, [items.length, live]);
  if (!items.length) return null;
  return (
    <Box sx={{ maxHeight: live ? 420 : 300, overflowY: "auto", fontSize: 12.5, border: 1, borderColor: "divider", borderRadius: 1 }}>
      {items.map((e, i) =>
        e.type === "tool" ? (
          <Box key={i} sx={{ px: 1.5, py: 0.5, display: "flex", gap: 1, fontFamily: "monospace", color: "text.secondary", borderBottom: 1, borderColor: "divider" }}>
            <Box component="span" sx={{ color: "primary.main", flexShrink: 0, minWidth: 44 }}>
              {e.tool}
            </Box>
            <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={e.detail}>
              {e.detail}
            </Box>
          </Box>
        ) : (
          <Box key={i} sx={{ px: 1.5, py: 1, whiteSpace: "pre-wrap", borderBottom: 1, borderColor: "divider" }}>
            {e.text}
          </Box>
        )
      )}
      <div ref={endRef} />
    </Box>
  );
}

function Detail({ id, onChanged }) {
  const [anim, setAnim] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const load = useCallback(() => animationsApi.get(id).then(setAnim).catch((e) => setError(e.message)), [id]);
  useEffect(() => {
    setAnim(null);
    load();
  }, [load]);

  const running = anim && RUNNING.includes(anim.status);
  useEffect(() => {
    if (!running) return undefined;
    const timer = setInterval(load, 2000);
    return () => clearInterval(timer);
  }, [running, load]);

  // Tell the list when this one finishes.
  const prevStatus = useRef(null);
  useEffect(() => {
    if (anim && prevStatus.current && prevStatus.current !== anim.status) onChanged();
    prevStatus.current = anim?.status ?? null;
  }, [anim, onChanged]);

  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  if (!anim) return null;

  const o = anim.options || {};
  const remove = async () => {
    if (!window.confirm(`Delete “${anim.title}” and its project files?`)) return;
    await animationsApi.remove(anim.id).catch((e) => setError(e.message));
    onChanged();
    navigate("/generated", { replace: true });
  };

  return (
    <Box sx={{ flex: 1, overflowY: "auto", px: 3, pb: 4 }}>
      <Stack spacing={2.5} sx={{ maxWidth: 1100, mx: "auto" }}>
        {running && (
          <Box>
            <LinearProgress color="secondary" />
            <Stack direction="row" sx={{ alignItems: "center", mt: 1 }}>
              <Typography sx={{ flex: 1 }}>{anim.stage || "Working…"} Claude Code usually takes a few minutes.</Typography>
              <Button color="error" startIcon={<StopCircleOutlinedIcon />} onClick={() => animationsApi.cancel(anim.id).then(load)}>
                Stop
              </Button>
            </Stack>
          </Box>
        )}
        {anim.error && <Alert severity={anim.status === "stopped" ? "info" : "error"}>{anim.error}</Alert>}

        {anim.has_video && (
          <Box sx={{ bgcolor: "black", borderRadius: 1, overflow: "hidden", display: "flex", justifyContent: "center" }}>
            <video
              key={anim.finished_at}
              src={animationsApi.videoUrl(anim.id)}
              controls
              preload="auto"
              style={{ maxWidth: "100%", maxHeight: "62vh", display: "block" }}
            />
          </Box>
        )}

        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 1 }}>
          <Chip size="small" label={STATUS[anim.status]?.label ?? anim.status} color={STATUS[anim.status]?.color} />
          {anim.duration_s != null && <Chip size="small" variant="outlined" label={formatDuration(anim.duration_s)} />}
          <Chip size="small" variant="outlined" label={labelOf("style", o.style)} />
          <Chip size="small" variant="outlined" label={`${o.aspect === "source" ? "source frame" : o.aspect} · ${o.resolution} · ${o.fps} fps`} />
          {anim.cost_usd != null && (
            <Tooltip title="As reported by Claude Code (an API-price estimate on a subscription)">
              <Chip size="small" variant="outlined" label={`$${anim.cost_usd.toFixed(2)}`} />
            </Tooltip>
          )}
          <Box sx={{ flex: 1 }} />
          {anim.has_video && (
            <Button size="small" startIcon={<DownloadOutlinedIcon />} component="a" href={animationsApi.videoUrl(anim.id, true)}>
              Download MP4
            </Button>
          )}
          <Button size="small" color="error" startIcon={<DeleteOutlineIcon />} onClick={remove}>
            Delete
          </Button>
        </Stack>

        <Box>
          <Typography variant="subtitle2">Prompt</Typography>
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 0.5 }}>
            {anim.prompt}
          </Typography>
          <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1 }}>
            From{" "}
            {anim.video_id ? (
              <RouterLink to={`/video/${anim.video_id}`} style={{ color: "inherit" }}>
                {anim.source_title}
              </RouterLink>
            ) : (
              anim.source_title
            )}{" "}
            · {formatDuration(anim.start_s)}–{formatDuration(anim.end_s)} · {anim.cues.length} subtitles · project in{" "}
            <code>workspace/{anim.project_dir}</code>
          </Typography>
        </Box>

        <Divider />
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            What Claude Code did
          </Typography>
          {anim.activity.length ? (
            <Activity items={anim.activity} live={running} />
          ) : (
            <Typography variant="body2" color="text.secondary">
              {running ? "Starting…" : "Nothing recorded."}
            </Typography>
          )}
        </Box>
      </Stack>
    </Box>
  );
}

/** The "Generated videos" tab: every animation Claude Code made, newest first. */
export default function GeneratedVideosPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const idParam = location.pathname.split("/")[2];
  const currentId = idParam ? Number(idParam) : null;

  const refresh = useCallback(() => animationsApi.list().then(setItems).catch(() => setItems((x) => x ?? [])), []);
  useEffect(() => {
    refresh();
  }, [refresh]);
  const busy = items?.some((a) => RUNNING.includes(a.status));
  useEffect(() => {
    if (!busy) return undefined;
    const timer = setInterval(refresh, 3000);
    return () => clearInterval(timer);
  }, [busy, refresh]);

  if (items?.length && !items.some((a) => a.id === currentId)) return <Navigate to={`/generated/${items[0].id}`} replace />;
  const current = items?.find((a) => a.id === currentId);

  return (
    <SplitLayout
      sidebar={<Sidebar items={items ?? []} currentId={currentId} onSelect={(id) => navigate(`/generated/${id}`)} />}
      header={
        current && (
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap title={current.title}>
            {current.title}
          </Typography>
        )
      }
    >
      {current ? (
        <Detail key={current.id} id={current.id} onChanged={refresh} />
      ) : (
        items && (
          <Stack spacing={1.5} sx={{ flex: 1, alignItems: "center", justifyContent: "center", p: 4, textAlign: "center" }}>
            <MovieFilterOutlinedIcon sx={{ fontSize: 48, color: "text.disabled" }} />
            <Typography variant="h6">No generated videos yet</Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 460 }}>
              In Video Editing, select one or more subtitles (⌘-click for several), right-click them and choose
              “Generate animation”.
            </Typography>
          </Stack>
        )
      )}
    </SplitLayout>
  );
}
