import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, pop } from "../anim";
import { Slab } from "../components/Slab";
import { Label } from "../components/Text";
import { COLORS, MONO } from "../theme";
import { useLines } from "../timeline";

const T = 100; // tile size
const ink = COLORS.text;

// Little drawings of "what a neuron at this depth responds to".
const EARLY: React.ReactNode[] = [
  <line x1={50} y1={12} x2={50} y2={88} stroke={ink} strokeWidth={10} />,
  <line x1={12} y1={50} x2={88} y2={50} stroke={ink} strokeWidth={10} />,
  <line x1={15} y1={85} x2={85} y2={15} stroke={ink} strokeWidth={10} />,
  <line x1={15} y1={15} x2={85} y2={85} stroke={ink} strokeWidth={10} />,
  <rect x={0} y={0} width={100} height={100} fill="url(#g1)" />,
  <rect x={0} y={0} width={100} height={100} fill="url(#g2)" />,
];
const MIDDLE: React.ReactNode[] = [
  <g>
    <circle cx={50} cy={50} r={30} fill="none" stroke={ink} strokeWidth={7} />
    <circle cx={50} cy={50} r={11} fill={ink} />
  </g>,
  <polygon points="20,82 50,18 80,82" fill="none" stroke={ink} strokeWidth={7} strokeLinejoin="round" />,
  <g stroke={ink} strokeWidth={6}>
    {[20, 40, 60, 80].map((x) => (
      <line key={x} x1={x - 12} y1={85} x2={x + 12} y2={15} />
    ))}
  </g>,
  <path d="M 15 70 Q 50 10 85 70" fill="none" stroke={ink} strokeWidth={8} />,
  <g fill={ink}>
    {[25, 50, 75].map((x) => [25, 50, 75].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r={7} />))}
  </g>,
  <g fill="none" stroke={ink} strokeWidth={6}>
    <rect x={20} y={20} width={60} height={60} rx={8} />
    <rect x={38} y={38} width={24} height={24} />
  </g>,
];
const DEEP: React.ReactNode[] = [
  // cat
  <g fill="none" stroke={COLORS.yellow} strokeWidth={5} strokeLinejoin="round">
    <polygon points="22,40 26,12 44,30" />
    <polygon points="78,40 74,12 56,30" />
    <circle cx={50} cy={56} r={30} />
    <circle cx={39} cy={52} r={4} fill={COLORS.yellow} />
    <circle cx={61} cy={52} r={4} fill={COLORS.yellow} />
    <path d="M 44 66 L 50 70 L 56 66" />
  </g>,
  // dog
  <g fill="none" stroke={ink} strokeWidth={5} strokeLinejoin="round">
    <circle cx={50} cy={52} r={26} />
    <ellipse cx={22} cy={50} rx={9} ry={20} fill={ink} />
    <ellipse cx={78} cy={50} rx={9} ry={20} fill={ink} />
    <circle cx={50} cy={64} r={6} fill={ink} />
  </g>,
  // car
  <g fill="none" stroke={ink} strokeWidth={5} strokeLinejoin="round">
    <path d="M 10 65 L 18 45 L 35 45 L 45 30 L 70 30 L 80 45 L 90 50 L 90 65 Z" />
    <circle cx={30} cy={68} r={9} fill={COLORS.bg} />
    <circle cx={72} cy={68} r={9} fill={COLORS.bg} />
  </g>,
  // bird
  <g fill="none" stroke={ink} strokeWidth={5} strokeLinejoin="round">
    <ellipse cx={45} cy={58} rx={28} ry={18} />
    <circle cx={70} cy={38} r={12} />
    <polygon points="81,36 94,40 81,44" fill={ink} />
    <path d="M 40 52 Q 30 30 15 35" />
  </g>,
  // face
  <g fill="none" stroke={ink} strokeWidth={5}>
    <circle cx={50} cy={50} r={34} />
    <circle cx={38} cy={42} r={4} fill={ink} />
    <circle cx={62} cy={42} r={4} fill={ink} />
    <path d="M 35 62 Q 50 75 65 62" />
  </g>,
  // house
  <g fill="none" stroke={ink} strokeWidth={5} strokeLinejoin="round">
    <polygon points="15,48 50,18 85,48" />
    <rect x={25} y={48} width={50} height={36} />
    <rect x={44} y={62} width={12} height={22} />
  </g>,
];

const STAGES = [
  { title: "Early layers", sub: "edges & colors", tiles: EARLY, color: COLORS.cyan, cx: 400, dims: "112 × 112 × 64", h: 110, t: 20 },
  { title: "Middle layers", sub: "textures & shapes", tiles: MIDDLE, color: COLORS.purple, cx: 960, dims: "28 × 28 × 256", h: 70, t: 50 },
  { title: "Deep layers", sub: "whole objects", tiles: DEEP, color: COLORS.yellow, cx: 1520, dims: "7 × 7 × 512", h: 36, t: 95 },
];

const BLOCK = [
  { name: "Conv", color: COLORS.yellow },
  { name: "ReLU", color: COLORS.green },
  { name: "Pool", color: COLORS.cyan },
];

export const Hierarchy: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  return (
    <AbsoluteFill>
      <svg width={0} height={0}>
        <defs>
          <linearGradient id="g1" x1="0" x2="1">
            <stop offset="0" stopColor={COLORS.orange} />
            <stop offset="1" stopColor={COLORS.blue} />
          </linearGradient>
          <linearGradient id="g2" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={COLORS.green} />
            <stop offset="1" stopColor={COLORS.magenta} />
          </linearGradient>
        </defs>
      </svg>

      {/* conv → relu → pool, three times */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 140, display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}>
        {[0, 1, 2].map((rep) =>
          BLOCK.map((b, i) => {
            const k = rep * 3 + i;
            const p = pop(frame, fps, L[0] + 8 + k * 5);
            return (
              <React.Fragment key={k}>
                {k > 0 ? <span style={{ color: COLORS.muted, fontSize: 30, opacity: Math.min(1, p) }}>→</span> : null}
                <div
                  style={{
                    padding: "8px 18px",
                    borderRadius: 10,
                    border: `3px solid ${b.color}`,
                    color: b.color,
                    fontSize: 26,
                    fontWeight: 700,
                    transform: `scale(${p})`,
                    marginLeft: i === 0 && rep > 0 ? 24 : 0,
                  }}
                >
                  {b.name}
                </div>
              </React.Fragment>
            );
          }),
        )}
      </div>

      {STAGES.map((s, i) => {
        const start = L[i + 1];
        const show = fade(frame, start);
        return (
          <React.Fragment key={s.title}>
            <Label x={s.cx} y={250} size={36} weight={700} color={s.color} center opacity={show}>
              {s.title}
            </Label>
            <Label x={s.cx} y={296} size={26} color={COLORS.muted} center opacity={show}>
              {s.sub}
            </Label>
            {s.tiles.map((tile, k) => {
              const p = pop(frame, fps, start + 10 + k * 4);
              const col = k % 3;
              const row = Math.floor(k / 3);
              return (
                <svg
                  key={k}
                  width={T}
                  height={T}
                  viewBox="0 0 100 100"
                  style={{
                    position: "absolute",
                    left: s.cx - 1.5 * T - 16 + col * (T + 16),
                    top: 350 + row * (T + 16),
                    transform: `scale(${p})`,
                    background: COLORS.panel,
                    border: `2px solid ${COLORS.panelBorder}`,
                    borderRadius: 12,
                    overflow: "hidden",
                  }}
                >
                  {tile}
                </svg>
              );
            })}
            {/* volume: smaller maps, more channels */}
            <Slab x={s.cx - (s.t + s.h * 0.45) / 2} y={760 - s.h} h={s.h} t={s.t} color={s.color} opacity={fade(frame, L[4] + i * 12)} />
            <Label x={s.cx} y={775} size={28} mono center color={COLORS.text} opacity={fade(frame, L[4] + i * 12)}>
              {s.dims}
            </Label>
            {i < 2 ? (
              <Label x={s.cx + 280} y={430} size={50} color={COLORS.muted} center opacity={fade(frame, L[i + 2])}>
                →
              </Label>
            ) : null}
          </React.Fragment>
        );
      })}
      <Label x={960} y={835} size={28} color={COLORS.muted} center opacity={fade(frame, L[4] + 40)}>
        <span style={{ fontFamily: MONO }}>height × width</span> shrinks, <span style={{ fontFamily: MONO }}>channels</span> grow
      </Label>
    </AbsoluteFill>
  );
};
