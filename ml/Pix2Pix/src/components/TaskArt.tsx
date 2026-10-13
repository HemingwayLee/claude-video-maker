import React from "react";
import { COLORS, FONT } from "../theme";

// Little illustrations of the paper's tasks. Each scene is a list of shapes
// with a "real" color. The input side is derived from it:
//   labels: every shape gets a flat label color (like a segmentation map)
//   edges:  black outlines on white (like an edge detector's output)
//   gray:   the real colors without color (for colorization)
//   day:    the day version of a day → night scene
// The output side is the "real" look (or night, for day → night).

type Shape = {
  d?: string; // a path, or…
  rect?: [number, number, number, number]; // x, y, w, h
  circle?: [number, number, number];
  real: string;
  label?: string;
  night?: string;
  stroke?: boolean; // in edges mode, draw this shape's outline
  texture?: "dots" | "bricks" | "stripes";
};
type SceneDef = { bg: string; bgLabel?: string; bgNight?: string; shapes: Shape[] };

const windows = (x0: number, y0: number, cols: number, rows: number, w: number, h: number, gx: number, gy: number, s: Omit<Shape, "rect">): Shape[] =>
  Array.from({ length: cols * rows }, (_, i) => ({ ...s, rect: [x0 + (i % cols) * gx, y0 + Math.floor(i / cols) * gy, w, h] as [number, number, number, number] }));

const SCENES: Record<string, SceneDef> = {
  facade: {
    bg: "#c79a6e",
    bgLabel: "#2a46c8",
    shapes: [
      { rect: [0, 0, 100, 10], real: "#e6d7bd", label: "#33c4d6", stroke: true },
      { rect: [0, 10, 100, 90], real: "#c79a6e", label: "#2a46c8", texture: "bricks" },
      ...windows(9, 18, 4, 3, 13, 16, 22, 24, { real: "#33475a", label: "#e8452e", stroke: true }),
      ...windows(9, 18, 4, 3, 13, 3, 22, 24, { real: "#e9e2d3", label: "#f2a7a0" }),
      { rect: [42, 82, 16, 18], real: "#5b3a22", label: "#f5a623", stroke: true },
    ],
  },
  street: {
    bg: "#8ec0ef",
    bgLabel: "#4682b4",
    shapes: [
      { rect: [0, 18, 34, 50], real: "#9b8f86", label: "#464646", stroke: true },
      { rect: [62, 10, 38, 58], real: "#b3a597", label: "#464646", stroke: true },
      ...windows(4, 24, 3, 4, 7, 7, 10, 11, { real: "#5a6f84", label: "#464646" }),
      ...windows(66, 16, 3, 5, 8, 7, 11, 10, { real: "#5a6f84", label: "#464646" }),
      { d: "M 38 68 C 40 48, 44 40, 48 40 C 52 40, 56 48, 58 68 Z", real: "#3e7d3a", label: "#6b8e23", stroke: true },
      { rect: [0, 66, 100, 8], real: "#b9b2a8", label: "#f423e8", stroke: true },
      { rect: [0, 74, 100, 26], real: "#5b5b5e", label: "#80408f", stroke: true },
      { d: "M 14 88 L 18 80 L 40 80 L 46 88 L 50 88 L 50 95 L 12 95 Z", real: "#c0392b", label: "#00008e", stroke: true },
      { circle: [20, 95, 4], real: "#222", label: "#00008e" },
      { circle: [42, 95, 4], real: "#222", label: "#00008e" },
    ],
  },
  map: {
    bg: "#58694a",
    bgLabel: "#f1eee8",
    shapes: [
      { d: "M 0 70 C 30 60, 50 85, 100 72 L 100 84 C 50 97, 30 72, 0 82 Z", real: "#27455a", label: "#aad3df" },
      { rect: [8, 8, 30, 26], real: "#3d6a2e", label: "#c8e6b0", texture: "dots" },
      { rect: [0, 40, 100, 6], real: "#8b8b84", label: "#ffffff" },
      { rect: [48, 0, 6, 100], real: "#8b8b84", label: "#ffffff" },
      ...windows(60, 6, 3, 3, 9, 8, 13, 11, { real: "#a39b92", label: "#d9cfc6" }),
      ...windows(10, 50, 3, 1, 9, 9, 12, 0, { real: "#a39b92", label: "#d9cfc6" }),
    ],
  },
  shoe: {
    bg: "#ffffff",
    shapes: [
      { d: "M 8 62 C 10 46, 22 40, 34 38 L 46 30 C 52 28, 58 32, 62 40 C 70 48, 84 52, 92 58 C 96 62, 94 70, 88 70 L 12 70 C 8 70, 7 66, 8 62 Z", real: "#d6452f", stroke: true },
      { d: "M 6 70 L 94 70 L 92 78 L 8 78 Z", real: "#f1f1f1", stroke: true },
      { d: "M 30 58 C 46 54, 60 52, 74 58", real: "none", stroke: true },
      { d: "M 44 34 L 52 44 M 48 31 L 56 41 M 40 37 L 48 47", real: "none", stroke: true },
    ],
  },
  bag: {
    bg: "#ffffff",
    shapes: [
      { d: "M 30 38 C 30 12, 70 12, 70 38", real: "none", stroke: true },
      { d: "M 14 38 L 86 38 L 92 86 L 8 86 Z", real: "#7a4a2a", stroke: true },
      { d: "M 14 38 L 86 38 L 82 58 L 18 58 Z", real: "#5e3820", stroke: true },
      { rect: [45, 54, 10, 8], real: "#e0b84a", stroke: true },
    ],
  },
  cat: {
    bg: "#ffffff",
    shapes: [
      { d: "M 22 90 C 18 60, 28 46, 50 46 C 72 46, 82 60, 78 90 Z", real: "#e8964a", stroke: true },
      { d: "M 28 50 L 26 22 L 42 36 L 58 36 L 74 22 L 72 50 C 70 64, 30 64, 28 50 Z", real: "#f0a55a", stroke: true },
      { circle: [40, 46, 4], real: "#3fa34d", stroke: true },
      { circle: [60, 46, 4], real: "#3fa34d", stroke: true },
      { d: "M 47 53 L 53 53 L 50 57 Z", real: "#e06a8c", stroke: true },
      { d: "M 34 72 L 46 70 M 54 70 L 66 72 M 36 80 L 46 78", real: "none", stroke: true },
    ],
  },
  city: {
    bg: "#8fc8f5",
    bgNight: "#141c38",
    shapes: [
      { circle: [80, 20, 9], real: "#ffd166", night: "#f1f0e0" },
      { rect: [6, 40, 22, 60], real: "#7d8fa3", night: "#273248" },
      { rect: [32, 26, 24, 74], real: "#6c7f95", night: "#222c41" },
      { rect: [60, 48, 34, 52], real: "#8a9bb0", night: "#2b364d" },
      ...windows(10, 46, 2, 5, 5, 5, 9, 10, { real: "#cfe3f2", night: "#ffd166" }),
      ...windows(36, 32, 3, 6, 4, 5, 7, 10, { real: "#cfe3f2", night: "#ffd166" }),
      ...windows(64, 54, 4, 4, 4, 5, 8, 10, { real: "#cfe3f2", night: "#ffd166" }),
    ],
  },
  landscape: {
    bg: "#8ec5ff",
    shapes: [
      { circle: [78, 22, 10], real: "#ffd166" },
      { d: "M 0 70 C 30 50, 60 56, 100 62 L 100 100 L 0 100 Z", real: "#5cab5c" },
      { rect: [22, 50, 5, 24], real: "#7a5230" },
      { circle: [24, 44, 13], real: "#2f8f3a" },
      { circle: [60, 80, 4], real: "#ff6b9a" },
      { circle: [70, 86, 4], real: "#ffb03b" },
      { circle: [50, 88, 4], real: "#c77dff" },
    ],
  },
};

export type TaskName = keyof typeof SCENES;
export type Side = "labels" | "edges" | "gray" | "real" | "day" | "night";

const gray = (hex: string) => {
  if (!hex.startsWith("#")) return hex;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const l = Math.round(0.3 * r + 0.59 * g + 0.11 * b);
  return `rgb(${l},${l},${l})`;
};

export const TaskArt: React.FC<{ task: TaskName; side: Side; size: number; x?: number; y?: number; style?: React.CSSProperties }> = ({ task, side, size, x, y, style }) => {
  const sc = SCENES[task];
  const edges = side === "edges";
  const fillOf = (s: { real: string; label?: string; night?: string }) =>
    edges ? "none" : side === "labels" ? s.label ?? s.real : side === "gray" ? gray(s.real) : side === "night" ? s.night ?? s.real : s.real;
  const bg = edges ? "#ffffff" : side === "labels" ? sc.bgLabel ?? sc.bg : side === "gray" ? gray(sc.bg) : side === "night" ? sc.bgNight ?? sc.bg : sc.bg;
  const id = `${task}-${side}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ position: x === undefined ? "relative" : "absolute", left: x, top: y, borderRadius: 8, overflow: "hidden", display: "block", ...style }}
    >
      <defs>
        <pattern id={`dots-${id}`} width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.3" fill="rgba(0,0,0,0.25)" />
        </pattern>
        <pattern id={`bricks-${id}`} width="8" height="4" patternUnits="userSpaceOnUse">
          <path d="M 0 4 H 8 M 4 0 V 2 M 0 2 H 8 M 0 2 V 4" stroke="rgba(0,0,0,0.13)" strokeWidth="0.6" fill="none" />
        </pattern>
      </defs>
      <rect width={100} height={100} fill={bg} />
      {sc.shapes.map((s, i) => {
        if (edges && !s.stroke) return null;
        const fill = s.real === "none" ? "none" : fillOf(s);
        const stroke = edges ? "#111" : s.real === "none" ? (side === "gray" ? "#ddd" : "#f5f5f5") : "none";
        const common = { fill, stroke, strokeWidth: edges ? 1.6 : 1.4, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
        const shape = s.d ? <path d={s.d} {...common} /> : s.rect ? <rect x={s.rect[0]} y={s.rect[1]} width={s.rect[2]} height={s.rect[3]} {...common} /> : <circle cx={s.circle![0]} cy={s.circle![1]} r={s.circle![2]} {...common} />;
        const tex =
          s.texture && (side === "real" || side === "gray") && s.rect ? (
            <rect x={s.rect[0]} y={s.rect[1]} width={s.rect[2]} height={s.rect[3]} fill={`url(#${s.texture}-${id})`} />
          ) : null;
        return (
          <React.Fragment key={i}>
            {shape}
            {tex}
          </React.Fragment>
        );
      })}
      {side === "night" && Array.from({ length: 9 }, (_, i) => <circle key={i} cx={(i * 37) % 100} cy={4 + ((i * 13) % 22)} r={0.7} fill="#fff" />)}
    </svg>
  );
};

// The paper's tasks: [input side, output side, name].
export const TASKS: { task: TaskName; from: Side; to: Side; name: string }[] = [
  { task: "street", from: "labels", to: "real", name: "Labels → Street scene" },
  { task: "facade", from: "labels", to: "real", name: "Labels → Facade" },
  { task: "map", from: "labels", to: "real", name: "Map → Aerial photo" },
  { task: "shoe", from: "edges", to: "real", name: "Edges → Shoe" },
  { task: "bag", from: "edges", to: "real", name: "Edges → Handbag" },
  { task: "city", from: "day", to: "night", name: "Day → Night" },
  { task: "landscape", from: "gray", to: "real", name: "B&W → Color" },
  { task: "cat", from: "edges", to: "real", name: "Edges → Cat" },
];

// One input → output pair with an arrow and a caption.
export const TaskPair: React.FC<{ index: number; x: number; y: number; size: number; opacity?: number; scale?: number; showArrow?: number }> = ({ index, x, y, size, opacity = 1, scale = 1, showArrow = 1 }) => {
  const t = TASKS[index];
  const gap = size * 0.34;
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity, transform: `scale(${scale})`, transformOrigin: "center", width: size * 2 + gap }}>
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        <TaskArt task={t.task} side={t.from} size={size} style={{ boxShadow: `0 0 0 3px ${COLORS.yellow}` }} />
        <svg width={gap} height={40} style={{ opacity: showArrow }}>
          <path d={`M 8 20 L ${gap - 12} 20`} stroke={COLORS.text} strokeWidth={4} />
          <path d={`M ${gap - 22} 10 L ${gap - 8} 20 L ${gap - 22} 30`} fill="none" stroke={COLORS.text} strokeWidth={4} />
        </svg>
        <TaskArt task={t.task} side={t.to} size={size} style={{ boxShadow: `0 0 0 3px ${COLORS.magenta}`, opacity: showArrow }} />
      </div>
      <div style={{ marginTop: 12, textAlign: "center", fontFamily: FONT, fontSize: Math.max(20, size * 0.13), fontWeight: 700, color: COLORS.text }}>{t.name}</div>
    </div>
  );
};
