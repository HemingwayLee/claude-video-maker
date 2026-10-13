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
  gen: COLORS.magenta, // the generator and everything it makes
  disc: COLORS.cyan, // the discriminator and its verdicts
  real: COLORS.green, // real training data (the true output y)
  input: COLORS.yellow, // the input image x (the condition)
  l1: COLORS.orange, // the L1 loss
  noise: COLORS.purple, // the noise z (which Pix2Pix drops)
};

export const FONT = "'Helvetica Neue', Inter, Arial, sans-serif";
export const MONO = "Menlo, Consolas, monospace";
