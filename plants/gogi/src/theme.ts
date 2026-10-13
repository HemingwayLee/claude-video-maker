// Anime ("cel") look: flat fills, one darker shade per color, thick dark
// outlines and small white highlights.

export const INK = "#3b2414"; // outline color for everything drawn

export const COLORS = {
  skyTop: "#62b9ff",
  skyBottom: "#dff3ff",
  cloud: "#ffffff",
  cloudShade: "#cfe4fb",
  hillFar: "#a6dbab",
  hillNear: "#78c483",
  ground: "#8bc34a",
  groundShade: "#6fa33a",
  soil: "#a87b4f",
  soilShade: "#86603a",

  sea: "#7cc8f0",
  seaShade: "#5fb0dd",
  seaLine: "#b6e3fa",
  land: "#9ad37f",
  landShade: "#7ab862",
  landFar: "#e8d7a8", // the far coast in the import scene
  landFarShade: "#d1bd86",

  branch: "#9a7a4a", // goji stems are pale, woody and thin
  branchShade: "#76592f",
  leaf: "#5bb04f",
  leafShade: "#3f8c3c",
  flower: "#9b6bd6", // small purple goji flowers
  flowerShade: "#7448b0",
  berry: "#ee3a2c",
  berryShade: "#b9201b",
  berryShine: "#ffb3a6",
  calyx: "#4f8f3a",

  wood: "#d39b5a", // crates and baskets
  woodShade: "#a8733a",
  pitch: "#5cbf5a", // football pitch
  pitchStripe: "#4fae4e",

  text: "#3b2414",
  white: "#ffffff",
  pink: "#ff6fa5",
  yellow: "#ffd23f",
  orange: "#ff8a3d",
  red: "#ff4d4d",
  blue: "#3da5ff",
  sweat: "#8fd3ff",
};

// One accent color per idea, used the same way in every scene.
export const ROLE = {
  taiwan: "#2fbf71", // grown in Taiwan
  imported: "#ff8a3d", // imported
  hard: "#3da5ff", // difficulty / small harvest
};

// macOS ships PingFang TC (Traditional Chinese); the rest are fallbacks.
export const FONT = "'PingFang TC', 'Heiti TC', 'Hiragino Sans GB', 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";

// Thick outline around HTML text, the way manga/anime titles look.
export const outline = (color: string, width: number) => {
  const shadows: string[] = [];
  const steps = 16;
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    shadows.push(`${(Math.cos(a) * width).toFixed(1)}px ${(Math.sin(a) * width).toFixed(1)}px 0 ${color}`);
  }
  return shadows.join(", ");
};
