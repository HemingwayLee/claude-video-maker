import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { animationsApi } from "../api";
import AnimationOptionsFields from "../components/video/AnimationOptionsFields";

/** The "Animation making options" tab: what Claude Code uses when it makes an animation. */
export default function AnimationOptionsPage() {
  const [saved, setSaved] = useState(null);
  const [draft, setDraft] = useState(null);
  const [defaults, setDefaults] = useState(null);
  const [models, setModels] = useState([]);
  const [status, setStatus] = useState(null); // {severity, text}
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    animationsApi
      .getOptions()
      .then(({ options, defaults, models }) => {
        setSaved(options);
        setDraft(options);
        setDefaults(defaults);
        setModels(models);
      })
      .catch((e) => setStatus({ severity: "error", text: `Cannot load the options: ${e.message}` }));
  }, []);

  const dirty = useMemo(() => JSON.stringify(saved) !== JSON.stringify(draft), [saved, draft]);
  const isDefault = useMemo(() => JSON.stringify(draft) === JSON.stringify(defaults), [draft, defaults]);

  const save = async () => {
    setBusy(true);
    try {
      const result = await animationsApi.saveOptions(draft);
      setSaved(result);
      setDraft(result);
      setStatus({ severity: "success", text: "Saved. New animations use these options." });
    } catch (e) {
      setStatus({ severity: "error", text: e.message });
    } finally {
      setBusy(false);
    }
  };

  if (!draft) {
    return status ? (
      <Alert severity={status.severity} sx={{ m: 2 }}>
        {status.text}
      </Alert>
    ) : null;
  }

  return (
    <Box sx={{ flex: 1, overflowY: "auto" }}>
      <Box sx={{ maxWidth: 960, mx: "auto", px: 3, pb: 12 }}>
        <Box sx={{ pt: 3, pb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Animation making options
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 680 }}>
            In Video Editing, select one or more subtitles, right-click, and choose “Generate animation”. Claude Code
            writes a Remotion (React) animation of what those subtitles say, using these options, and renders it to
            an MP4 in Generated videos. You can still change a few of them per animation.
          </Typography>
        </Box>

        <AnimationOptionsFields
          value={draft}
          models={models}
          onChange={(name, value) => {
            setStatus(null);
            setDraft((d) => ({ ...d, [name]: value }));
          }}
        />
      </Box>

      {/* Save bar */}
      <Box
        sx={{
          position: "sticky",
          bottom: 0,
          borderTop: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          px: 3,
          py: 1.5,
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ maxWidth: 960, mx: "auto", alignItems: "center" }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {status ? (
              <Alert severity={status.severity} sx={{ py: 0 }}>
                {status.text}
              </Alert>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {dirty ? "You have unsaved changes." : "These options are saved."}
              </Typography>
            )}
          </Box>
          <Button onClick={() => setDraft(defaults)} disabled={busy || isDefault}>
            Reset to defaults
          </Button>
          <Button onClick={() => setDraft(saved)} disabled={busy || !dirty}>
            Discard
          </Button>
          <Button variant="contained" onClick={save} disabled={busy || !dirty}>
            Save
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
