export const COLORS = {
  bg: "#0b1021",
  panel: "#141a33",
  panelBorder: "#26305a",
  text: "#e8ecff",
  muted: "#8d97c4",
  cyan: "#4cc9f0",
  magenta: "#f72585",
  yellow: "#ffd166",
  green: "#06d6a0",
  purple: "#9b7bff",
  orange: "#ff9f43",
  red: "#ef476f",
  blue: "#4895ef",
};

// One color per role, used the same way in every scene.
export const ROLE = {
  gen: COLORS.magenta, // the generator and everything fake
  disc: COLORS.cyan, // the discriminator and its verdicts
  real: COLORS.green, // real training data
  noise: COLORS.purple, // the random input z
};

export const FONT = "'Helvetica Neue', Inter, Arial, sans-serif";
export const MONO = "Menlo, Consolas, monospace";

// Diverging colors for values: negative = blue, positive = orange.
// `max` is the value that gets full color.
export const diverging = (v: number, max: number) => {
  const t = Math.max(-1, Math.min(1, v / max));
  const base = [28, 34, 64];
  const pos = [255, 159, 67];
  const neg = [72, 149, 239];
  const target = t >= 0 ? pos : neg;
  const a = Math.abs(t);
  const mix = base.map((b, i) => Math.round(b + (target[i] - b) * a));
  return `rgb(${mix.join(",")})`;
};
