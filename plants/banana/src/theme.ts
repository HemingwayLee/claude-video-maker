// Anime ("cel") look: flat fills, one darker shade per color, thick dark
// outlines and small white highlights.

export const INK = "#3b2414"; // outline color for everything drawn

export const COLORS = {
  skyTop: "#5fb8ff",
  skyBottom: "#d6f0ff",
  cloud: "#ffffff",
  cloudShade: "#cfe4fb",
  hillFar: "#9fd8a8",
  hillNear: "#6fc07c",
  ground: "#8bc34a",
  groundShade: "#6fa33a",
  soil: "#a87b4f",

  trunk: "#7fae4a",
  trunkShade: "#5e8a34",
  trunkStripe: "#4f7a2c",
  leaf: "#4fb34a",
  leafShade: "#348f3a",
  leafRib: "#c8e86a",

  stalk: "#8cae3e",
  stalkShade: "#6b8a2c",

  bananaYoung: "#3f9a3a", // deep green, just formed
  bananaGrown: "#8ccf3f", // fat, ready-ish green
  bananaShadeYoung: "#2c7a2c",
  bananaShadeGrown: "#64a82e",
  bananaTip: "#4a3020",

  bract: "#8e2f5a", // purple-red bracts of the banana flower
  bractShade: "#6a1f44",
  bractInner: "#d8648c",
  bractHighlight: "#d47aa0",
  floret: "#fff1b8", // the small cream "finger" flowers
  floretShade: "#e8c86a",
  floretDry: "#b8935a", // withered flowers on the stalk

  text: "#3b2414",
  white: "#ffffff",
  pink: "#ff6fa5",
  yellow: "#ffd23f",
  orange: "#ff8a3d",
  red: "#ff4d4d",
  blue: "#3da5ff",
  nutrient: "#ffe066",
};

// One accent color per idea, used the same way in every scene.
export const ROLE = {
  bunch: "#ffb703", // 串 / 梳 / 根
  flower: "#ff5fa2", // 香蕉花 / 苞片 / 小花
  empty: "#3da5ff", // 空梳
  finger: "#9b5de5", // 不結果的花指
  knife: "#ff4d4d", // 香蕉刀 and the cut
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
