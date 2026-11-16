// The look of the man's stickers: soft painted shading (gradients, not flat
// cel fills), thin dark-brown outlines, a white sticker border around every
// object and a soft shadow under it, on a blurry "bokeh" background.

export const INK = "#3a2618"; // outline color for everything drawn

export const COLORS = {
  text: "#3a2618",
  white: "#ffffff",

  // 小黑: dark green, almost black, with pale speckles
  heiSkin: "#2c4a2e",
  heiLight: "#55804c",
  heiDark: "#16281a",
  heiSpeck: "#a7c48e",
  // 貝貝: a little lighter green, with faint stripes
  beiSkin: "#3f7039",
  beiLight: "#76a85e",
  beiDark: "#24461f",
  beiSpeck: "#c4dca4",

  stem: "#8a6a3a",
  stemDark: "#5c4220",
  flesh: "#ffb52e",
  fleshLight: "#ffd768",
  fleshDeep: "#f08a12",
  seed: "#fff4d6",

  chestnut: "#8a4a22",
  chestnutDark: "#5a2a10",
  chestnutBase: "#e3bd86",

  leaf: "#5aa548",
  leafLight: "#8fd06c",
  leafDark: "#2f7432",
  leafDry: "#b59a4a",
  soil: "#9b6b43",
  soilDark: "#74492a",

  sun: "#ffcf3a",
  sunGlow: "#ff9d2e",
  snow: "#ffffff",
  cold: "#5fb4ff",
  hot: "#ff5a36",
  land: "#8fcf72",
  landDark: "#5aa548",

  autumn: "#ff8a3d",
  winter: "#6fbfff",
  pink: "#ff7aa8",
  yellow: "#ffd23f",
};

// Background colors per mood: [top, bottom, bokeh blobs...]
export const MOODS = {
  warm: ["#fff3e2", "#ffd9b8", "#ffb27a", "#ffd36b", "#ff9fb0", "#c5e59a"],
  green: ["#f0fae6", "#cfeeb8", "#9fd88a", "#ffe08a", "#b8e0ff", "#ffc49a"],
  cold: ["#eaf6ff", "#bfe2ff", "#8fc8ff", "#d8ecff", "#b0b8ff", "#ffffff"],
  hot: ["#fff0d8", "#ffb98a", "#ff8a5c", "#ffd04a", "#ff6a6a", "#ffe08a"],
  autumn: ["#fff4e4", "#ffd7b0", "#ff9d5c", "#ffd36b", "#9fd0ff", "#ffb0a0"],
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
