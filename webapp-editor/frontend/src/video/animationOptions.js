/** Choices for the animation options (values match the backend's AnimationOptions). */
export const OPTION_CHOICES = {
  effort: [
    { value: "low", label: "Low", hint: "fastest, simplest" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High", hint: "recommended" },
    { value: "xhigh", label: "Extra high" },
    { value: "max", label: "Max", hint: "slowest, most thorough" },
  ],
  aspect: [
    { value: "source", label: "Same as the source video" },
    { value: "16:9", label: "16:9 landscape" },
    { value: "9:16", label: "9:16 vertical (Shorts, Reels)" },
    { value: "1:1", label: "1:1 square" },
  ],
  resolution: [
    { value: "1080p", label: "1080p" },
    { value: "720p", label: "720p (faster to render)" },
  ],
  fps: [
    { value: 24, label: "24 fps" },
    { value: 30, label: "30 fps" },
    { value: 60, label: "60 fps (smoother, slower to render)" },
  ],
  audio: [
    { value: "original", label: "Original voice from the selected part" },
    { value: "none", label: "Silent" },
  ],
  length: [
    { value: "match", label: "Same as the selected part (synced to the subtitles)" },
    { value: "custom", label: "Fixed length" },
  ],
  style: [
    { value: "flat", label: "Flat vector illustration" },
    { value: "sticker", label: "Cartoon stickers (thick outlines)" },
    { value: "whiteboard", label: "Whiteboard sketch" },
    { value: "infographic", label: "Infographic / diagrams" },
    { value: "kinetic", label: "Kinetic typography" },
    { value: "papercut", label: "Paper cut-out" },
    { value: "custom", label: "Custom (describe it)" },
  ],
  on_screen_text: [
    { value: "none", label: "No text, pictures only" },
    { value: "keywords", label: "Key words and labels" },
    { value: "captions", label: "Full captions (the subtitles)" },
  ],
  text_language: [
    { value: "subtitles", label: "Same as the subtitles" },
    { value: "en", label: "English" },
    { value: "zh_TW", label: "繁體中文 (Taiwan)" },
    { value: "ja", label: "日本語" },
  ],
};

export const labelOf = (key, value) => OPTION_CHOICES[key]?.find((c) => c.value === value)?.label ?? String(value);
