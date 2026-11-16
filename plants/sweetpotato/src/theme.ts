// The look of the man's stickers: soft painted shading (gradients, not flat
// cel fills), thin dark-brown outlines, a white sticker border around every
// object and a soft shadow under it, on a blurry "bokeh" background.

export const INK = "#3a2618"; // outline color for everything drawn

export const COLORS = {
  text: "#3a2618",
  white: "#ffffff",

  // sweet potato leaves: heart-shaped, fresh green; the stem a little purple
  leaf: "#4fa83e",
  leafLight: "#8fd46a",
  leafDark: "#2c7a2e",
  leafVein: "#b8e68a",
  leafNew: "#a6e07a", // a brand-new leaf, pale and bright
  leafDry: "#c9b45a", // wilted: yellow-olive
  leafDryDark: "#8d7a36",
  stem: "#6f9a3c",
  stemPurple: "#8a5a72",
  root: "#fff8e4",
  rootShade: "#b58f5e",

  water: "#7cc8f2",
  waterDeep: "#4aa6e0",
  glass: "#e8f6ff",

  soil: "#9b6b43",
  soilDark: "#74492a",
  wood: "#d9a066",
  woodDark: "#b07a44",

  steel: "#dfe6ee",
  steelDark: "#9aa7b5",
  handle: "#ff6a4a",

  sun: "#ffcf3a",
  sunGlow: "#ff9d2e",
  moon: "#fff1a8",
  night: "#5b6bb8",
  good: "#4cc56a",
  bad: "#ff5a5a",
  pink: "#ff7aa8",
  yellow: "#ffd23f",
};

// Background colors per mood: [top, bottom, bokeh blobs...]
export const MOODS = {
  warm: ["#fff6e6", "#ffe2bf", "#ffbf80", "#ffe08a", "#c5e59a", "#ffb0a0"],
  green: ["#f0fae6", "#cfeeb8", "#9fd88a", "#ffe08a", "#b8e0ff", "#d8f5a0"],
  water: ["#eef9ff", "#c4e8ff", "#8fd0ff", "#c8f0e0", "#b0c8ff", "#ffffff"],
  dry: ["#fff4e0", "#f2d9b0", "#e0b878", "#f5d58a", "#d8c0a0", "#ffe8c0"],
  night: ["#e8ecff", "#c8d0f5", "#9fb0f0", "#d8c8ff", "#b8e0ff", "#ffffff"],
} as const;
export type Mood = keyof typeof MOODS;

// macOS ships PingFang TC (Traditional Chinese); the rest are fallbacks.
export const FONT = "'PingFang TC', 'Heiti TC', 'Hiragino Sans GB', 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";

// Thick outline around HTML text, the way sticker text looks.
export const outline = (color: string, width: number) => {
  const shadows: string[] = [];
  const steps = 16;
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    shadows.push(`${(Math.cos(a) * width).toFixed(1)}px ${(Math.sin(a) * width).toFixed(1)}px 0 ${color}`);
  }
  return shadows.join(", ");
};
