import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Divider,
  FormControlLabel,
  LinearProgress,
  MenuItem,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import AudiotrackOutlinedIcon from "@mui/icons-material/AudiotrackOutlined";
import ClosedCaptionOutlinedIcon from "@mui/icons-material/ClosedCaptionOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import MovieOutlinedIcon from "@mui/icons-material/MovieOutlined";
import { exportsApi } from "../../api";
import { formatBytes, formatDuration } from "../../video/format";

const RUNNING = ["queued", "running"];

function Section({ icon, title, subtitle, children }) {
  return (
    <Box sx={{ px: 1.5, py: 1.5 }}>
      <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: 0.25 }}>
        {icon}
        <Typography variant="subtitle2">{title}</Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 1 }}>
        {subtitle}
      </Typography>
      <Stack sx={{ gap: 1 }}>{children}</Stack>
    </Box>
  );
}

/** Progress of one render (video or audio); when it finishes, the browser downloads it. */
function RenderStatus({ status, sent, label, onStart, onCancel, onDownload, disabled }) {
  const running = RUNNING.includes(status?.status);
  const ready = status?.status === "ready"; // finished but not downloaded (e.g. the page was closed meanwhile)
  return (
    <>
      {running ? (
        <Stack sx={{ gap: 0.5 }}>
          <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
              {status.progress == null ? status.stage : `Rendering ${Math.round(status.progress * 100)}%`}
            </Typography>
            <Button size="small" color="inherit" onClick={onCancel}>
              Stop
            </Button>
          </Stack>
          <LinearProgress
            variant={status.progress == null ? "indeterminate" : "determinate"}
            value={(status.progress || 0) * 100}
          />
        </Stack>
      ) : ready ? (
        <Button variant="contained" startIcon={<DownloadOutlinedIcon />} onClick={onDownload}>
          Download {status.filename}
        </Button>
      ) : (
        <Button variant="contained" onClick={onStart} disabled={disabled}>
          {label}
        </Button>
      )}
      {status?.status === "error" && <Alert severity="error">{status.error}</Alert>}
      {sent && !running && !ready && (
        <Alert severity="success" sx={{ py: 0 }}>
          Downloaded {sent.filename} ({formatDuration(sent.duration_s)}, {formatBytes(sent.size_bytes)}) to your
          browser's downloads.
          {sent.notes?.map((n) => ` ${n}`)}
        </Alert>
      )}
    </>
  );
}

/**
 * The editor's Export tab: the edited video (kept parts + extra tracks, optionally with subtitles burnt in),
 * its audio alone, and the subtitles. Renders use what is saved, so pending edits are saved first. The server keeps a render only until the
 * browser has downloaded it.
 */
export default function ExportPanel({ video, hasTracks, flush, onError }) {
  const [status, setStatus] = useState(null); // {video: {...}, audio: {...}}
  const [sent, setSent] = useState({}); // kind -> the render last downloaded
  const [burn, setBurn] = useState(false);
  const [videoTracks, setVideoTracks] = useState(true);
  const [audioTracks, setAudioTracks] = useState(true);
  const [audioFormat, setAudioFormat] = useState("mp3");
  const [timing, setTiming] = useState("edited");
  const [subFormat, setSubFormat] = useState("srt");
  const editable = video.status === "ready";

  const refresh = useCallback(async () => {
    try {
      setStatus(await exportsApi.status(video.id));
    } catch (e) {
      onError(`Couldn't load the exports: ${e.message}`);
    }
  }, [video.id, onError]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const running = ["video", "audio"].some((k) => RUNNING.includes(status?.[k]?.status));
  useEffect(() => {
    if (!running) return undefined;
    const timer = setInterval(refresh, 1000);
    return () => clearInterval(timer);
  }, [running, refresh]);

  const download = useCallback(
    (kind, info) => {
      const a = document.createElement("a");
      a.href = exportsApi.fileUrl(video.id, kind, info.created_at);
      a.download = info.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setSent((s) => ({ ...s, [kind]: info }));
      setStatus((prev) => ({ ...prev, [kind]: { status: "none" } }));
    },
    [video.id]
  );

  // A render this page started downloads as soon as it's done.
  const [waiting, setWaiting] = useState({}); // kind -> true while this page waits for its render
  useEffect(() => {
    for (const kind of ["video", "audio"]) {
      if (waiting[kind] && status?.[kind]?.status === "ready") {
        setWaiting((w) => ({ ...w, [kind]: false }));
        download(kind, status[kind]);
      } else if (waiting[kind] && status?.[kind] && !RUNNING.includes(status[kind].status)) {
        setWaiting((w) => ({ ...w, [kind]: false }));
      }
    }
  }, [status, waiting, download]);

  const start = async (body) => {
    try {
      await flush();
      const s = await exportsApi.start(video.id, body);
      setSent((prev) => ({ ...prev, [body.kind]: null }));
      setWaiting((w) => ({ ...w, [body.kind]: true }));
      setStatus((prev) => ({ ...prev, [body.kind]: s }));
    } catch (e) {
      onError(`Couldn't start the export: ${e.message}`);
    }
  };

  const cancel = async (kind) => {
    try {
      await exportsApi.cancel(video.id, kind);
      refresh();
    } catch (e) {
      onError(e.message);
    }
  };

  const tracksSwitch = (checked, set) =>
    hasTracks && (
      <FormControlLabel
        control={<Switch size="small" checked={checked} onChange={(e) => set(e.target.checked)} />}
        label={<Typography variant="body2">Include extra tracks from the timeline</Typography>}
      />
    );

  return (
    <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
      <Section
        icon={<MovieOutlinedIcon fontSize="small" color="action" />}
        title="Edited video"
        subtitle="MP4 with sound: the kept parts joined, with your extra tracks mixed in."
      >
        {tracksSwitch(videoTracks, setVideoTracks)}
        <FormControlLabel
          disabled={!video.has_subtitles}
          control={<Switch size="small" checked={burn && video.has_subtitles} onChange={(e) => setBurn(e.target.checked)} />}
          label={<Typography variant="body2">Burn in subtitles</Typography>}
        />
        <RenderStatus
          sent={sent.video}
          onDownload={() => download("video", status.video)}
          label="Export video"
          status={status?.video}
          disabled={!editable || !status}
          onStart={() =>
            start({ kind: "video", include_tracks: videoTracks, burn_subtitles: burn && video.has_subtitles })
          }
          onCancel={() => cancel("video")}
        />
      </Section>
      <Divider />

      <Section
        icon={<AudiotrackOutlinedIcon fontSize="small" color="action" />}
        title="Audio only"
        subtitle="The edited timeline's sound, without the picture."
      >
        {tracksSwitch(audioTracks, setAudioTracks)}
        <TextField
          select
          size="small"
          label="Format"
          value={audioFormat}
          onChange={(e) => setAudioFormat(e.target.value)}
          sx={{ mt: 0.5 }}
        >
          <MenuItem value="mp3">MP3</MenuItem>
          <MenuItem value="m4a">M4A (AAC)</MenuItem>
          <MenuItem value="wav">WAV (uncompressed)</MenuItem>
        </TextField>
        <RenderStatus
          sent={sent.audio}
          onDownload={() => download("audio", status.audio)}
          label="Export audio"
          status={status?.audio}
          disabled={!editable || !status}
          onStart={() => start({ kind: "audio", include_tracks: audioTracks, audio_format: audioFormat })}
          onCancel={() => cancel("audio")}
        />
      </Section>
      <Divider />

      <Section
        icon={<ClosedCaptionOutlinedIcon fontSize="small" color="action" />}
        title="Subtitles"
        subtitle={
          video.has_subtitles
            ? timing === "edited"
              ? "Timed to the edited video: subtitles in cut parts are left out."
              : "Timed to the original, uncut video."
            : "This video has no subtitles yet."
        }
      >
        <ToggleButtonGroup
          exclusive
          size="small"
          fullWidth
          value={timing}
          onChange={(_, v) => v && setTiming(v)}
          disabled={!video.has_subtitles}
        >
          <ToggleButton value="edited">Edited timing</ToggleButton>
          <ToggleButton value="source">Original timing</ToggleButton>
        </ToggleButtonGroup>
        <Stack direction="row" sx={{ gap: 1 }}>
          <TextField
            select
            size="small"
            label="Format"
            value={subFormat}
            onChange={(e) => setSubFormat(e.target.value)}
            disabled={!video.has_subtitles}
            sx={{ flex: 1 }}
          >
            <MenuItem value="srt">SRT</MenuItem>
            <MenuItem value="vtt">WebVTT</MenuItem>
          </TextField>
          <Button
            variant="contained"
            startIcon={<DownloadOutlinedIcon />}
            disabled={!video.has_subtitles}
            onClick={async () => {
              await flush().catch(() => {});
              window.location.href = exportsApi.subtitlesUrl(video.id, timing, subFormat);
            }}
          >
            Download
          </Button>
        </Stack>
      </Section>
    </Box>
  );
}
