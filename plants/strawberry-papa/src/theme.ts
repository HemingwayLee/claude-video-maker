// The look of the man's stickers: soft painted shading (gradients, not flat
// cel fills), thin dark-brown outlines, a white sticker border around every
// object and a soft shadow under it, on a blurry "bokeh" background.

export const INK = "#3a2618"; // outline color for everything drawn

export const COLORS = {
  text: "#3a2618",
  white: "#ffffff",

  // the strawberry
  berryLight: "#ff7a72",
  berry: "#e8283a",
  berryDark: "#a3101f",
  berryOld: "#9c2a2a", // an overripe strawberry, a little dull
  dimple: "#b81a2a",
  // the achenes (瘦果) on its skin
  achene: "#f2c94c",
  acheneLight: "#fff0a0",
  acheneDark: "#b07a1a",
  // the seed inside an achene
  seed: "#fff4d6",
  seedLight: "#ffffff",
  seedDark: "#e8c98a",

  leaf: "#5aa548",
  leafLight: "#8fd06c",
  leafDark: "#2f7432",
  stem: "#6a9a3a",
  soil: "#9b6b43",

  sun: "#ffcf3a",
  sunGlow: "#ff9d2e",
  moon: "#fff3b0",
  pink: "#ff7aa8",
  yellow: "#ffd23f",
  plate: "#ffffff",
  plateRim: "#8fc8ff",
  glass: "#dff3ff",
  handle: "#8a4a22",
};

// Background colors per mood: [top, bottom, bokeh blobs...]
export const MOODS = {
  warm: ["#fff3e2", "#ffd9b8", "#ffb27a", "#ffd36b", "#ff9fb0", "#c5e59a"],
  pink: ["#fff0f2", "#ffd0d8", "#ff9fb0", "#ffd36b", "#ffb0c8", "#c5e59a"],
  gold: ["#fffbe6", "#ffe9a8", "#ffd36b", "#ffb27a", "#fff2b0", "#c5e59a"],
  green: ["#f0fae6", "#cfeeb8", "#9fd88a", "#ffe08a", "#b8e0ff", "#ffc49a"],
  night: ["#2a3366", "#4a4f8f", "#6a6fc0", "#3a4aa0", "#9a8fe0", "#ffe9a0"],
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
