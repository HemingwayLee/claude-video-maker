import React from "react";
import { random } from "remotion";
import type { FaceParams } from "../data";

const SKIN = ["#f8d9c0", "#e7b48f", "#c98e64", "#9a6443", "#5e3b28"];
const HAIR = ["#1f1611", "#4b2f1d", "#8a5530", "#c99a52", "#a8a8b0"];
const SHIRT = "#3b4a8f";

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
// A color `t` (0..1) of the way along a ramp of colors.
const ramp = (colors: string[], t: number) => {
  const p = Math.max(0, Math.min(1, t)) * (colors.length - 1);
  const i = Math.min(colors.length - 2, Math.floor(p));
  const a = hex(colors[i]);
  const b = hex(colors[i + 1]);
  const f = p - i;
  return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * f)).join(",")})`;
};

const NOISE_CELLS = 12;

// A stylized face drawn from FaceParams (see faceFromZ in data.ts).
// `quality` 0..1 blends from pure noise (an untrained generator) to a clean face.
export const Face: React.FC<{
  p: FaceParams;
  size: number;
  quality?: number;
  noiseSeed?: string;
  border?: string;
  style?: React.CSSProperties;
}> = ({ p, size, quality = 1, noiseSeed = "n", border, style }) => {
  const w = p.width;
  const skin = ramp(SKIN, p.skin);
  const hair = ramp(HAIR, p.hair);
  const eyeR = 3.1 * p.eyeSize;
  const ex = 10.5 * p.eyeGap;
  const noise = 1 - quality;
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        borderRadius: size * 0.1,
        overflow: "hidden",
        background: "#1c2449",
        outline: border ? `4px solid ${border}` : undefined,
        boxShadow: border ? `0 0 24px ${border}66` : undefined,
        ...style,
      }}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} style={{ position: "absolute", filter: noise > 0.02 ? `blur(${noise * size * 0.05}px)` : undefined }}>
        {/* long hair, behind the head */}
        <path
          d={`M ${50 - 30 * w} 40 Q 50 ${2} ${50 + 30 * w} 40 L ${50 + (30 + 4 * p.hairLen) * w} ${52 + 40 * p.hairLen} L ${50 - (30 + 4 * p.hairLen) * w} ${52 + 40 * p.hairLen} Z`}
          fill={hair}
          opacity={0.25 + 0.75 * p.hairLen}
        />
        {/* shoulders */}
        <ellipse cx={50} cy={104} rx={36} ry={22} fill={SHIRT} />
        <rect x={44} y={70} width={12} height={16} fill={skin} />
        {/* ears */}
        <ellipse cx={50 - 26 * w} cy={52} rx={4} ry={6} fill={skin} />
        <ellipse cx={50 + 26 * w} cy={52} rx={4} ry={6} fill={skin} />
        {/* head */}
        <ellipse cx={50} cy={50} rx={26 * w} ry={29} fill={skin} />
        {/* fringe */}
        <path d={`M ${50 - 27.5 * w} 48 Q 50 4 ${50 + 27.5 * w} 48 Q ${50 + 12} 30 50 31 Q ${50 - 14} 30 ${50 - 27.5 * w} 48 Z`} fill={hair} />
        {/* brows */}
        <line x1={50 - ex - 4} y1={42 - 1.5 * p.brow} x2={50 - ex + 4} y2={42 + 1.5 * p.brow} stroke={hair} strokeWidth={2} strokeLinecap="round" />
        <line x1={50 + ex - 4} y1={42 + 1.5 * p.brow} x2={50 + ex + 4} y2={42 - 1.5 * p.brow} stroke={hair} strokeWidth={2} strokeLinecap="round" />
        {/* eyes */}
        {[-1, 1].map((s) => (
          <g key={s}>
            <ellipse cx={50 + s * ex} cy={50} rx={eyeR * 1.35} ry={eyeR} fill="#ffffff" />
            <circle cx={50 + s * ex} cy={50} r={eyeR * 0.62} fill="#1b1b2a" />
            <circle cx={50 + s * ex + 0.8} cy={49} r={eyeR * 0.2} fill="#ffffff" />
          </g>
        ))}
        {/* glasses */}
        <g opacity={p.glasses} stroke="#20253f" strokeWidth={1.8} fill="none">
          <circle cx={50 - ex} cy={50} r={eyeR * 1.35 + 3} />
          <circle cx={50 + ex} cy={50} r={eyeR * 1.35 + 3} />
          <line x1={50 - ex + eyeR * 1.35 + 3} y1={50} x2={50 + ex - eyeR * 1.35 - 3} y2={50} />
        </g>
        {/* nose */}
        <path d="M 50 53 Q 47 60 50.5 61" stroke="rgba(0,0,0,0.25)" strokeWidth={1.6} fill="none" strokeLinecap="round" />
        {/* cheeks */}
        <circle cx={50 - ex - 3} cy={60} r={3.5} fill="#ff7a8a" opacity={0.18} />
        <circle cx={50 + ex + 3} cy={60} r={3.5} fill="#ff7a8a" opacity={0.18} />
        {/* mouth */}
        <path d={`M 42 67 Q 50 ${67 + 7 * p.smile} 58 67`} stroke="#7a2b35" strokeWidth={2.2} fill="none" strokeLinecap="round" />
      </svg>
      {noise > 0.01 ? (
        <svg viewBox={`0 0 ${NOISE_CELLS} ${NOISE_CELLS}`} width={size} height={size} style={{ position: "absolute", opacity: Math.min(1, noise * 1.15) }} shapeRendering="crispEdges">
          {Array.from({ length: NOISE_CELLS * NOISE_CELLS }, (_, i) => {
            const r = Math.round(random(`${noiseSeed}-r${i}`) * 255);
            const g = Math.round(random(`${noiseSeed}-g${i}`) * 255);
            const b = Math.round(random(`${noiseSeed}-b${i}`) * 255);
            return <rect key={i} x={i % NOISE_CELLS} y={Math.floor(i / NOISE_CELLS)} width={1} height={1} fill={`rgb(${r},${g},${b})`} />;
          })}
        </svg>
      ) : null}
    </div>
  );
};
