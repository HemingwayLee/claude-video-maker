import { useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  LinearProgress,
  MenuItem,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import ClosedCaptionOutlinedIcon from "@mui/icons-material/ClosedCaptionOutlined";
import MovieOutlinedIcon from "@mui/icons-material/MovieOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { videosApi } from "../../api";
import { LANGUAGES, formatBytes } from "../../video/format";

const VIDEO_ACCEPT = ".mp4,.mov,.m4v,.mkv,.webm,.avi,video/*";

/** A file picker that is also a drop target. */
export function FileDrop({ label, hint, accept, file, onFile, icon, disabled }) {
  const inputRef = useRef(null);
  const [over, setOver] = useState(false);
  return (
    <Box
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (!disabled && e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]);
      }}
      sx={{
        border: 1.5,
        borderStyle: "dashed",
        borderColor: over ? "primary.main" : "divider",
        bgcolor: over ? "action.hover" : "transparent",
        borderRadius: 2,
        p: 2,
        cursor: disabled ? "default" : "pointer",
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        "&:hover": disabled ? {} : { borderColor: "primary.main" },
      }}
    >
      <Box sx={{ color: file ? "primary.main" : "text.secondary", display: "flex" }}>{icon}</Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
          {file ? file.name : label}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {file ? formatBytes(file.size) : hint}
        </Typography>
      </Box>
      {file && !disabled && (
        <Button
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onFile(null);
          }}
        >
          Clear
        </Button>
      )}
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={accept}
        onChange={(e) => {
          if (e.target.files[0]) onFile(e.target.files[0]);
          e.target.value = "";
        }}
      />
    </Box>
  );
}

/** "Import video" popup: upload a video (+ .srt), or get one from a YouTube link. Calls onImported(video). */
export default function ImportDialog({ open, onClose, onImported }) {
  const [tab, setTab] = useState("upload");
  const [video, setVideo] = useState(null);
  const [srt, setSrt] = useState(null);
  const [progress, setProgress] = useState(null); // upload progress 0..1 while uploading
  const [url, setUrl] = useState("");
  const [lang, setLang] = useState("en");
  const [generate, setGenerate] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const reset = () => {
    setVideo(null);
    setSrt(null);
    setUrl("");
    setError(null);
  };

  const close = () => {
    abortRef.current?.abort();
    setError(null);
    onClose();
  };

  const submit = async (e) => {
    e?.preventDefault();
    setError(null);
    setBusy(true);
    try {
      let created;
      if (tab === "upload") {
        setProgress(0);
        abortRef.current = new AbortController();
        created = await videosApi.upload(video, srt, { onProgress: setProgress, signal: abortRef.current.signal });
      } else {
        created = await videosApi.importYouTube(url.trim(), { subtitleLang: lang, generateSubtitles: generate });
      }
      reset();
      onImported(created);
    } catch (err) {
      if (err.name !== "AbortError") setError(err.message);
    } finally {
      setBusy(false);
      setProgress(null);
      abortRef.current = null;
    }
  };

  const uploading = progress !== null;
  const canSubmit = !busy && (tab === "upload" ? !!video : !!url.trim());

  return (
    <Dialog open={open} onClose={busy ? undefined : close} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pb: 0 }}>Import video</DialogTitle>
      <Tabs value={tab} onChange={(_, v) => !busy && setTab(v)} sx={{ px: 3 }}>
        <Tab value="upload" icon={<UploadFileOutlinedIcon />} iconPosition="start" label="Upload files" />
        <Tab value="youtube" icon={<YouTubeIcon />} iconPosition="start" label="YouTube URL" />
      </Tabs>
      {/* DialogContent can't render as a <form> itself, so the form wraps the content and the buttons. */}
      <Box component="form" onSubmit={submit} sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
        <DialogContent dividers sx={{ minHeight: 300 }}>
          {tab === "upload" ? (
            <Stack spacing={2}>
              <FileDrop
                label="Choose a video, or drop it here"
                hint="MP4, MOV, MKV, WebM, AVI"
                accept={VIDEO_ACCEPT}
                file={video}
                onFile={setVideo}
                icon={<MovieOutlinedIcon />}
                disabled={busy}
              />
              <FileDrop
                label="Subtitles (.srt), optional"
                hint="Closed captions for the video. You can add them later too."
                accept=".srt"
                file={srt}
                onFile={setSrt}
                icon={<ClosedCaptionOutlinedIcon />}
                disabled={busy}
              />
              {uploading && (
                <Box>
                  <LinearProgress variant="determinate" value={progress * 100} />
                  <Typography variant="caption" color="text.secondary">
                    Uploading {Math.round(progress * 100)}%
                  </Typography>
                </Box>
              )}
            </Stack>
          ) : (
            <Stack spacing={2.5}>
              <TextField
                autoFocus
                label="YouTube link"
                placeholder="https://www.youtube.com/watch?v=…"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                size="small"
                fullWidth
              />
              <TextField
                select
                label="Subtitle language"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                size="small"
                sx={{ width: 240 }}
              >
                {LANGUAGES.map((l) => (
                  <MenuItem key={l.value} value={l.value}>
                    <Box component="span" sx={{ fontFamily: "monospace", mr: 1.5, color: "text.secondary" }}>
                      {l.value}
                    </Box>
                    {l.label}
                  </MenuItem>
                ))}
              </TextField>
              <FormControlLabel
                control={<Switch checked={generate} onChange={(e) => setGenerate(e.target.checked)} />}
                label={<Typography variant="body2">If there are no captions, have Claude Code write them</Typography>}
                sx={{ ml: -1 }}
              />
              <Typography variant="caption" color="text.secondary">
                Downloads the video (MP4) and the author&apos;s captions in that language. With the switch on and no
                captions, Claude Code transcribes the speech (Whisper), then corrects, translates and times the
                subtitles. It keeps going in the background; you can close this.
              </Typography>
            </Stack>
          )}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>{uploading ? "Cancel upload" : "Cancel"}</Button>
          <Button type="submit" variant="contained" disabled={!canSubmit}>
            {tab === "upload" ? (uploading ? "Uploading…" : "Upload") : "Import"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
