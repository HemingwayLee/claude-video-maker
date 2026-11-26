import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { Link as RouterLink } from "react-router";
import { animationsApi } from "../../api";
import { labelOf } from "../../video/animationOptions";
import { formatTimecode } from "../../video/format";
import { ChoiceField } from "./AnimationOptionsFields";

// The options you can change for one animation here; the rest come from the Animation options tab.
const QUICK = ["style", "aspect", "on_screen_text", "audio"];

/**
 * "Generate animation" popup for the selected subtitles. `cues` are the selected blocks (source start/end,
 * text, and outStart/outEnd on the timeline). `beforeCreate` lets the editor save pending edits first.
 */
export default function GenerateAnimationDialog({ open, onClose, video, cues, beforeCreate, onCreated }) {
  const [prompt, setPrompt] = useState("");
  const [saved, setSaved] = useState(null);
  const [quick, setQuick] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setPrompt(cues.map((c) => c.text.trim()).join("\n"));
    setError(null);
    animationsApi
      .getOptions()
      .then(({ options }) => {
        setSaved(options);
        setQuick(Object.fromEntries(QUICK.map((k) => [k, options[k]])));
      })
      .catch((e) => setError(`Cannot load the animation options: ${e.message}`));
    // Only when it opens: the selection doesn't change while the popup is up.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const first = cues[0];
  const last = cues[cues.length - 1];
  const span = first && last ? last.outEnd - first.outStart : 0;

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      await beforeCreate?.();
      const overrides = Object.fromEntries(QUICK.filter((k) => quick[k] !== saved?.[k]).map((k) => [k, quick[k]]));
      const anim = await animationsApi.create({
        video_id: video.id,
        cues: cues.map(({ start, end, text }) => ({ start, end, text })),
        prompt: prompt.trim(),
        options: overrides,
      });
      onCreated(anim);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Generate animation</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Typography variant="body2" color="text.secondary">
            {cues.length} subtitle{cues.length === 1 ? "" : "s"} · {first && formatTimecode(first.outStart)} –{" "}
            {last && formatTimecode(last.outEnd)} ({span.toFixed(1)} s on the timeline). Claude Code animates what
            they say, in sync with the voice, and renders an MP4 to Generated videos.
          </Typography>
          <TextField
            label="Prompt"
            helperText="The selected subtitles. Add directions if you like, e.g. “show the guava tree growing by the stream”."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            multiline
            minRows={4}
            maxRows={12}
            autoFocus
          />
          {saved && (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              {QUICK.map((k) => (
                <ChoiceField
                  key={k}
                  name={k}
                  label={{ style: "Style", aspect: "Frame", on_screen_text: "On-screen text", audio: "Audio" }[k]}
                  value={quick[k]}
                  onChange={(name, value) => setQuick((q) => ({ ...q, [name]: value }))}
                />
              ))}
            </Box>
          )}
          {saved && (
            <Typography variant="caption" color="text.secondary">
              Also: {labelOf("resolution", saved.resolution)}, {saved.fps} fps,{" "}
              {saved.length === "match" ? "length of the selection" : `${saved.custom_seconds} s`},{" "}
              {saved.reference_frames ? "with reference stills" : "no reference stills"}, effort{" "}
              {labelOf("effort", saved.effort).toLowerCase()}
              {saved.max_budget_usd ? `, up to $${saved.max_budget_usd}` : ""}.{" "}
              <Link component={RouterLink} to="/animation-options">
                Change in Animation making options
              </Link>
            </Typography>
          )}
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant="contained" startIcon={<AutoAwesomeIcon />} onClick={generate} disabled={busy || !prompt.trim() || !saved}>
          {busy ? "Starting…" : "Generate"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
