// The look of the man's stickers: soft painted shading (gradients, not flat
// cel fills), thin dark-brown outlines, a white sticker border around every
// object and a soft shadow under it, on a blurry "bokeh" background.

export const INK = "#3a2618"; // outline color for everything drawn

export const COLORS = {
  text: "#3a2618",
  white: "#ffffff",

  // passion fruit: deep purple skin with pale freckles
  skin: "#6e2a63",
  skinLight: "#b0619c",
  skinDark: "#3b1035",
  speck: "#e7b9dc",
  pith: "#fff3df", // the white layer under the skin
  pulp: "#ffc21f", // the golden jelly
  pulpLight: "#ffe27a",
  pulpDeep: "#f39a0e",
  seed: "#2b1a12",
  calyx: "#7aa548",

  // passion flower
  petal: "#fbf6ff",
  petalShade: "#ddd0f0",
  corona: "#6b3fa8",
  coronaTip: "#ffffff",

  leaf: "#5aa548",
  leafLight: "#8fd06c",
  leafDark: "#2f7432",
  wood: "#b07a46",
  woodDark: "#7a4e26",
  soil: "#9b6b43",
  pot: "#d9774a",
  potDark: "#a8532e",

  sea: "#5ab8e8",
  seaDark: "#2f88c4",
  hull: "#c8743c",
  hullDark: "#8a4a22",
  sail: "#fffdf6",
  flagRed: "#d6283a",
  land: "#8fcf72",
  landDark: "#5aa548",
  roof: "#e0623e",
  roofDark: "#a84028",
  wall: "#fff3dc",
  glass: "#bfe8ff",
  pin: "#ff4f5e",

  sun: "#ffcf3a",
  sunGlow: "#ff9d2e",
  water: "#8fd3ff",
  pink: "#ff7aa8",
  yellow: "#ffd23f",
};

// Background colors per mood: [top, bottom, bokeh blobs...]
export const MOODS = {
  warm: ["#fff3e2", "#ffd9b8", "#ffb27a", "#ffd36b", "#e7a8e0", "#c5e59a"],
  sea: ["#e8f7ff", "#a9dcf7", "#7fc8f0", "#c8f0e0", "#ffe7a8", "#ffffff"],
  green: ["#f0fae6", "#cfeeb8", "#9fd88a", "#ffe08a", "#d8c4ff", "#ffc49a"],
  purple: ["#fbf0ff", "#efd3f2", "#d7a8e8", "#ffd36b", "#ffb0c8", "#c5e59a"],
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
