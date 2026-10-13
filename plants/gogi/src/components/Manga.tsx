import React from "react";
import { useVideoConfig } from "remotion";
import { COLORS, FONT, INK, outline } from "../theme";

// Manga / anime effects, all in screen coordinates.

// Deterministic pseudo-random numbers (same video on every render).
const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// 集中線: radial "focus lines" that point at (cx, cy). They flicker a little.
export const FocusLines: React.FC<{ frame: number; cx: number; cy: number; opacity: number; color?: string }> = ({
  frame,
  cx,
  cy,
  opacity,
  color = INK,
}) => {
  const { width, height } = useVideoConfig();
  if (opacity <= 0) return null;
  const n = 90;
  const R = Math.hypot(width, height);
  const seed = Math.floor(frame / 3) * 7;
  return (
    <svg width={width} height={height} style={{ position: "absolute", opacity }}>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 + rand(i + seed) * 0.05;
        const inner = 430 + rand(i * 3 + seed) * 220;
        const w = 4 + rand(i * 5 + seed) * 14;
        const ux = Math.cos(a);
        const uy = Math.sin(a);
        const px = -uy * w;
        const py = ux * w;
        const x1 = cx + ux * inner;
        const y1 = cy + uy * inner;
        const x2 = cx + ux * R;
        const y2 = cy + uy * R;
        return <path key={i} d={`M ${x1} ${y1} L ${x2 + px} ${y2 + py} L ${x2 - px} ${y2 - py} Z`} fill={color} opacity={0.75} />;
      })}
    </svg>
  );
};

// A four-pointed anime sparkle.
export const Sparkle: React.FC<{ x: number; y: number; size: number; color?: string; rot?: number }> = ({ x, y, size, color = "#fff", rot = 0 }) => {
  const s = size;
  const k = s * 0.22;
  return (
    <path
      d={`M 0 ${-s} Q ${k} ${-k} ${s} 0 Q ${k} ${k} 0 ${s} Q ${-k} ${k} ${-s} 0 Q ${-k} ${-k} 0 ${-s} Z`}
      transform={`translate(${x} ${y}) rotate(${rot})`}
      fill={color}
      stroke={INK}
      strokeWidth={3}
    />
  );
};

// Big tilted sound-effect text (擬聲語), e.g. 咔嚓！
export const Sfx: React.FC<{ text: string; x: number; y: number; size: number; color: string; rot?: number; opacity?: number; scale?: number }> = ({
  text,
  x,
  y,
  size,
  color,
  rot = -8,
  opacity = 1,
  scale = 1,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${scale})`,
      fontFamily: FONT,
      fontWeight: 900,
      fontSize: size,
      color,
      textShadow: `${outline(INK, size * 0.09)}, ${size * 0.06}px ${size * 0.08}px 0 ${INK}`,
      whiteSpace: "nowrap",
      opacity,
      letterSpacing: 4,
    }}
  >
    {text}
  </div>
);

// Round speech bubble with a tail pointing to (tx, ty) relative to its center.
export const SpeechBubble: React.FC<{ x: number; y: number; text: string; scale: number; tail: [number, number]; size?: number }> = ({
  x,
  y,
  text,
  scale,
  tail,
  size = 54,
}) => {
  if (scale <= 0) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${scale})` }}>
      <svg width={40} height={40} style={{ position: "absolute", left: "50%", top: "50%", overflow: "visible" }}>
        <path d={`M -26 0 L ${tail[0]} ${tail[1]} L 26 0 Z`} fill="#fff" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      </svg>
      <div
        style={{
          position: "relative",
          padding: "22px 40px",
          background: "#fff",
          border: `6px solid ${INK}`,
          borderRadius: 60,
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: size,
          color: COLORS.text,
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </div>
    </div>
  );
};

// A label that points at something: a dot on the target, a line, and a pill.
// (tx, ty) = the target, (lx, ly) = the center of the label. All in screen px.
export const Callout: React.FC<{
  tx: number;
  ty: number;
  lx: number;
  ly: number;
  text: string;
  sub?: string;
  color: string;
  progress: number; // 0 → 1: the line draws, then the label pops
  size?: number;
}> = ({ tx, ty, lx, ly, text, sub, color, progress, size = 50 }) => {
  const { width, height } = useVideoConfig();
  if (progress <= 0) return null;
  const line = Math.min(1, progress * 2);
  const pop = Math.max(0, Math.min(1, progress * 2 - 1));
  const back = pop < 1 ? 1 + Math.sin(pop * Math.PI) * 0.15 : 1; // little overshoot
  const ex = tx + (lx - tx) * line;
  const ey = ty + (ly - ty) * line;
  return (
    <>
      <svg width={width} height={height} style={{ position: "absolute" }}>
        <line x1={tx} y1={ty} x2={ex} y2={ey} stroke={INK} strokeWidth={10} strokeLinecap="round" />
        <line x1={tx} y1={ty} x2={ex} y2={ey} stroke={color} strokeWidth={5} strokeLinecap="round" />
        <circle cx={tx} cy={ty} r={13} fill={color} stroke={INK} strokeWidth={5} />
      </svg>
      {pop > 0 && (
        <div
          style={{
            position: "absolute",
            left: lx,
            top: ly,
            transform: `translate(-50%, -50%) scale(${pop * back})`,
            background: "#fff",
            border: `6px solid ${INK}`,
            borderRadius: 26,
            boxShadow: `8px 8px 0 ${color}`,
            padding: "10px 28px 12px",
            fontFamily: FONT,
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          <div style={{ fontSize: size, fontWeight: 900, color: INK, lineHeight: 1.15 }}>{text}</div>
          {sub && <div style={{ fontSize: size * 0.56, fontWeight: 700, color, marginTop: 2 }}>{sub}</div>}
        </div>
      )}
    </>
  );
};

// 〇 (maru): the big red "correct!" circle from Japanese quiz shows, drawn
// like a brush stroke. `progress` 0 → 1 draws it.
export const Maru: React.FC<{ x: number; y: number; r: number; progress: number; color?: string }> = ({ x, y, r, progress, color = "#ff3b3b" }) => {
  if (progress <= 0) return null;
  const c = 2 * Math.PI * r;
  return (
    <g transform={`translate(${x} ${y}) rotate(-100)`}>
      <circle r={r} fill="none" stroke={INK} strokeWidth={r * 0.26} strokeDasharray={`${c * progress * 1.04} ${c * 2}`} strokeLinecap="round" />
      <circle r={r} fill="none" stroke={color} strokeWidth={r * 0.18} strokeDasharray={`${c * progress * 1.04} ${c * 2}`} strokeLinecap="round" />
    </g>
  );
};

// A five-pointed star centered on (0, 0).
export const Star: React.FC<{ r: number; fill: string }> = ({ r, fill }) => (
  <path
    d={
      Array.from({ length: 10 }, (_, i) => {
        const a = ((i * 36 - 90) * Math.PI) / 180;
        const rr = i % 2 ? r * 0.45 : r;
        return `${i ? "L" : "M"} ${(Math.cos(a) * rr).toFixed(1)} ${(Math.sin(a) * rr).toFixed(1)}`;
      }).join(" ") + " Z"
    }
    fill={fill}
    stroke={INK}
    strokeWidth={r * 0.14}
    strokeLinejoin="round"
  />
);
