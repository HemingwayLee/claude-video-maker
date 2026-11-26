import { Box, FormControlLabel, InputAdornment, MenuItem, Stack, Switch, TextField, Typography } from "@mui/material";
import { OPTION_CHOICES } from "../../video/animationOptions";

/** A select for one of OPTION_CHOICES. */
export function ChoiceField({ name, label, value, onChange, helperText, sx }) {
  return (
    <TextField select size="small" label={label} value={value} onChange={(e) => onChange(name, e.target.value)} helperText={helperText} sx={sx} fullWidth>
      {OPTION_CHOICES[name].map((c) => (
        <MenuItem key={String(c.value)} value={c.value}>
          {c.label}
          {c.hint && (
            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              {c.hint}
            </Typography>
          )}
        </MenuItem>
      ))}
    </TextField>
  );
}

function Section({ title, description, children }) {
  return (
    <Box sx={{ py: 2.5, borderTop: 1, borderColor: "divider", display: "grid", gridTemplateColumns: { xs: "1fr", md: "240px 1fr" }, gap: 2 }}>
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        )}
      </Box>
      <Stack spacing={2}>{children}</Stack>
    </Box>
  );
}

/** Every animation option, grouped. `value` is the options object; `onChange(name, value)`. */
export default function AnimationOptionsFields({ value: o, onChange, models = [] }) {
  const set = onChange;
  return (
    <Box>
      <Section title="Look" description="How the animation is drawn. Claude Code draws everything in code (React + SVG).">
        <ChoiceField name="style" label="Style" value={o.style} onChange={set} />
        {o.style === "custom" && (
          <TextField
            size="small"
            label="Describe the style"
            placeholder="e.g. Watercolour storybook, soft pastel washes, hand-lettered titles"
            value={o.custom_style}
            onChange={(e) => set("custom_style", e.target.value)}
            multiline
            minRows={2}
          />
        )}
        <TextField
          size="small"
          label="Colours"
          placeholder="e.g. warm earthy greens and cream; or #2E7D32, #FFF3E0, #E65100"
          helperText="Leave empty to let Claude Code choose"
          value={o.palette}
          onChange={(e) => set("palette", e.target.value)}
        />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <ChoiceField name="on_screen_text" label="On-screen text" value={o.on_screen_text} onChange={set} />
          <ChoiceField name="text_language" label="Text language" value={o.text_language} onChange={set} />
        </Stack>
      </Section>

      <Section title="Format" description="Frame size, smoothness and length of the rendered MP4.">
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <ChoiceField name="aspect" label="Frame" value={o.aspect} onChange={set} />
          <ChoiceField name="resolution" label="Resolution" value={o.resolution} onChange={set} sx={{ maxWidth: { sm: 200 } }} />
          <ChoiceField name="fps" label="Frame rate" value={o.fps} onChange={set} sx={{ maxWidth: { sm: 200 } }} />
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <ChoiceField name="length" label="Length" value={o.length} onChange={set} />
          {o.length === "custom" && (
            <TextField
              size="small"
              type="number"
              label="Seconds"
              value={o.custom_seconds}
              onChange={(e) => set("custom_seconds", Number(e.target.value))}
              slotProps={{ htmlInput: { min: 1, max: 300, step: 1 } }}
              sx={{ maxWidth: { sm: 140 } }}
            />
          )}
        </Stack>
      </Section>

      <Section title="Sound">
        <ChoiceField
          name="audio"
          label="Audio"
          value={o.audio}
          onChange={set}
          helperText="The original voice keeps the animation in sync with what is said (follows your timeline cuts)."
        />
      </Section>

      <Section title="Reference">
        <FormControlLabel
          control={<Switch checked={o.reference_frames} onChange={(e) => set("reference_frames", e.target.checked)} />}
          label={
            <Box>
              <Typography variant="body2">Show Claude Code stills from the source video</Typography>
              <Typography variant="caption" color="text.secondary">
                Up to 6 frames from the selected part, so the drawings match what the video is about. They are not put
                in the animation.
              </Typography>
            </Box>
          }
          sx={{ alignItems: "flex-start", ml: -1, "& .MuiSwitch-root": { mt: -0.5 } }}
        />
      </Section>

      <Section title="Extra instructions" description="Added to every request, e.g. a recurring character or a logo to show at the end.">
        <TextField
          size="small"
          placeholder="e.g. Keep a friendly old farmer character throughout. End on the title card “土芭樂”."
          value={o.extra_instructions}
          onChange={(e) => set("extra_instructions", e.target.value)}
          multiline
          minRows={3}
        />
      </Section>

      <Section title="Claude Code" description="Which model makes the animation, how hard it tries, and limits per animation.">
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField select size="small" label="Model" value={o.model} onChange={(e) => set("model", e.target.value)} fullWidth>
            {models.map((m) => (
              <MenuItem key={m.id} value={m.id}>
                {m.name}
              </MenuItem>
            ))}
            {!models.some((m) => m.id === o.model) && <MenuItem value={o.model}>{o.model}</MenuItem>}
          </TextField>
          <ChoiceField name="effort" label="Effort" value={o.effort} onChange={set} />
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            size="small"
            type="number"
            label="Max cost per animation"
            helperText="Stops when reached; 0 = no limit"
            value={o.max_budget_usd}
            onChange={(e) => set("max_budget_usd", Number(e.target.value))}
            slotProps={{
              htmlInput: { min: 0, max: 100, step: 0.5 },
              input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
            }}
            fullWidth
          />
          <TextField
            size="small"
            type="number"
            label="Max turns"
            helperText="Claude Code's steps; 0 = no limit"
            value={o.max_turns}
            onChange={(e) => set("max_turns", Number(e.target.value))}
            slotProps={{ htmlInput: { min: 0, max: 1000, step: 10 } }}
            fullWidth
          />
        </Stack>
      </Section>
    </Box>
  );
}
