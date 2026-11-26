export const LANGUAGES = [
  { value: "en", label: "English", bcp47: "en" },
  { value: "zh_TW", label: "繁體中文 (Taiwan)", bcp47: "zh-TW" },
  { value: "ja", label: "日本語", bcp47: "ja" },
];

export const SUBTITLE_SOURCE = { upload: "from .srt", youtube: "from YouTube", claude: "by Claude Code" };

export function formatBytes(n) {
  if (n == null) return null;
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  while (n >= 1024 && i < units.length - 1) (n /= 1024), i++;
  return `${n.toFixed(i ? 1 : 0)} ${units[i]}`;
}

/** 83 -> "1:23", 3723 -> "1:02:03". */
export function formatDuration(s) {
  if (s == null || !Number.isFinite(s)) return null;
  s = Math.round(s);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

/** Editor timecode with tenths: 83.46 -> "01:23.4". */
export function formatTimecode(s) {
  if (!Number.isFinite(s)) s = 0;
  const tenths = Math.floor(s * 10);
  const h = Math.floor(tenths / 36000);
  const m = Math.floor((tenths % 36000) / 600);
  const sec = Math.floor((tenths % 600) / 10);
  const base = `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${tenths % 10}`;
  return h ? `${h}:${base}` : base;
}

/** The list item's one-line status. */
export function videoSummary(v) {
  if (v.status === "downloading") return v.progress == null ? "Starting download…" : `Downloading ${Math.round(v.progress * 100)}%`;
  if (v.status === "transcribing") return "Claude Code is writing subtitles…";
  if (v.status === "error") return "Import failed";
  const cc = v.has_subtitles ? `CC ${v.subtitle_lang ?? ""}`.trim() : "No CC";
  return [formatDuration(v.duration_s), cc].filter(Boolean).join(" · ");
}
