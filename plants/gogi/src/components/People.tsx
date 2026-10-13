import React from "react";
import { COLORS, INK } from "../theme";

// Two chibi characters built from the same body: the farmer (bamboo hat,
// 斗笠) and a curious girl (twin pigtails). Feet at (0, 0), about 420 px
// tall, drawn facing left; `flip` mirrors them to face right.
// Hands are placed with `front` / `back` points (body coordinates).

type Pt = [number, number];

const SKIN = "#ffd9b8";
const SKIN_SHADE = "#f2b78f";

export type Pose = { front: Pt; back: Pt };

// A few ready-made hand positions.
export const POSES = {
  rest: { front: [-60, -110], back: [62, -110] },
  wave: { front: [-150, -260], back: [62, -110] },
  cheer: { front: [-120, -330], back: [110, -330] },
  think: { front: [-34, -214], back: [62, -110] }, // hand on the chin
  point: { front: [-190, -200], back: [62, -110] },
  hold: { front: [-70, -150], back: [50, -150] }, // both hands in front (holding something)
} satisfies Record<string, Pose>;

const Arm: React.FC<{ from: Pt; to: Pt; sleeve: string }> = ({ from, to, sleeve }) => (
  <g>
    <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={INK} strokeWidth={30} strokeLinecap="round" />
    <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={sleeve} strokeWidth={21} strokeLinecap="round" />
    <circle cx={to[0]} cy={to[1]} r={15} fill={SKIN} stroke={INK} strokeWidth={4} />
  </g>
);

// Blue teardrop on the side of the head (anime "nervous" mark).
export const SweatDrop: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <path
    d="M 0 -30 Q 22 0 14 14 Q 0 28 -14 14 Q -22 0 0 -30 Z"
    transform={`translate(${x} ${y}) scale(${s})`}
    fill={COLORS.sweat}
    stroke={INK}
    strokeWidth={4}
    strokeLinejoin="round"
  />
);

export type ChibiProps = {
  frame: number;
  kind: "farmer" | "girl";
  pose?: Pose;
  eyes?: "open" | "happy" | "sad";
  talking?: boolean;
  sweat?: number; // 0 → 1
  gloom?: number; // 0 → 1: vertical "depressed" lines over the head
  flip?: boolean;
};

export const Chibi: React.FC<ChibiProps> = ({ frame, kind, pose = POSES.rest, eyes = "open", talking = false, sweat = 0, gloom = 0, flip = false }) => {
  const bob = Math.sin(frame / 8) * 3;
  const blink = eyes === "open" && frame % 96 > 90;
  const mouthOpen = talking && Math.sin(frame / 2.2) > -0.2;
  const shirt = kind === "farmer" ? "#9bd3f2" : "#ffb3c8";
  const shirtShade = kind === "farmer" ? "#7ec3e8" : "#ff94b0";
  const pants = kind === "farmer" ? "#3d5a99" : "#ffe07a";
  const hair = kind === "farmer" ? "#3b2a20" : "#6b3a22";
  return (
    <g transform={flip ? "scale(-1 1)" : undefined}>
      <ellipse cx={0} cy={4} rx={80} ry={14} fill="#000" opacity={0.15} />
      <g transform={`translate(0 ${bob * 0.3})`}>
        {/* legs and shoes */}
        <rect x={-38} y={-95} width={30} height={84} rx={12} fill={kind === "farmer" ? pants : SKIN} stroke={INK} strokeWidth={5} />
        <rect x={8} y={-95} width={30} height={84} rx={12} fill={kind === "farmer" ? pants : SKIN} stroke={INK} strokeWidth={5} />
        <rect x={-50} y={-26} width={44} height={26} rx={10} fill={kind === "farmer" ? "#3a3a3a" : "#c2414b"} stroke={INK} strokeWidth={5} />
        <rect x={4} y={-26} width={44} height={26} rx={10} fill={kind === "farmer" ? "#3a3a3a" : "#c2414b"} stroke={INK} strokeWidth={5} />
        {/* body (the girl wears a dress) */}
        {kind === "farmer" ? (
          <>
            <rect x={-58} y={-200} width={116} height={118} rx={36} fill={shirt} stroke={INK} strokeWidth={6} />
            <rect x={10} y={-190} width={40} height={100} rx={20} fill={shirtShade} />
            <rect x={-58} y={-110} width={116} height={20} fill={pants} stroke={INK} strokeWidth={5} />
          </>
        ) : (
          <>
            <path d="M -48 -200 L 48 -200 L 78 -76 L -78 -76 Z" fill={shirt} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
            <path d="M 20 -196 L 48 -200 L 78 -76 L 40 -76 Z" fill={shirtShade} />
            <path d="M -66 -100 L 66 -100" stroke="#fff" strokeWidth={6} strokeDasharray="10 10" />
          </>
        )}
        <Arm from={[38, -176]} to={pose.back} sleeve={shirtShade} />
      </g>
      <g transform={`translate(0 ${bob})`}>
        {kind === "girl" && (
          // pigtails, behind the head
          <>
            <path d="M -80 -300 Q -150 -270 -128 -190 Q -110 -220 -78 -250 Z" fill={hair} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <path d="M 66 -300 Q 140 -270 118 -190 Q 100 -220 64 -250 Z" fill={hair} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <circle cx={-80} cy={-298} r={12} fill={COLORS.berry} stroke={INK} strokeWidth={4} />
            <circle cx={68} cy={-298} r={12} fill={COLORS.berry} stroke={INK} strokeWidth={4} />
          </>
        )}
        {/* head */}
        <circle cx={-6} cy={-272} r={80} fill={SKIN} stroke={INK} strokeWidth={6} />
        <path d="M 40 -300 A 80 80 0 0 1 60 -230 Q 40 -200 20 -205 Z" fill={SKIN_SHADE} />
        {/* fringe */}
        <path
          d="M -84 -282 Q -80 -330 -30 -342 Q 30 -348 66 -300 Q 30 -316 -6 -300 Q -30 -320 -46 -292 Q -60 -306 -84 -282 Z"
          fill={hair}
          stroke={INK}
          strokeWidth={4}
        />
        {/* eyes */}
        {[-46, 6].map((x) =>
          blink ? (
            <path key={x} d={`M ${x - 16} -262 Q ${x} -254 ${x + 16} -262`} stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
          ) : eyes === "happy" ? (
            <path key={x} d={`M ${x - 16} -258 Q ${x} -282 ${x + 16} -258`} stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" />
          ) : (
            <g key={x}>
              <ellipse cx={x} cy={-262} rx={16} ry={22} fill="#2a1a12" />
              <ellipse cx={x} cy={-252} rx={11} ry={10} fill="#6b3e26" />
              <circle cx={x - 5} cy={-270} r={6.5} fill="#fff" />
              <circle cx={x + 6} cy={-252} r={3} fill="#fff" />
              {eyes === "sad" && <path d={`M ${x - 18} ${x < 0 ? -296 : -290} L ${x + 16} ${x < 0 ? -290 : -296}`} stroke={INK} strokeWidth={6} strokeLinecap="round" />}
            </g>
          ),
        )}
        {/* blush */}
        <ellipse cx={-70} cy={-232} rx={14} ry={8} fill={COLORS.pink} opacity={0.55} />
        <ellipse cx={34} cy={-232} rx={14} ry={8} fill={COLORS.pink} opacity={0.55} />
        {/* mouth */}
        {mouthOpen ? (
          <path d="M -32 -224 Q -20 -200 -8 -224 Z" fill="#c2414b" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        ) : eyes === "sad" ? (
          <path d="M -32 -214 Q -20 -226 -8 -214" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
        ) : (
          <path d="M -32 -224 Q -20 -212 -8 -224" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
        )}
        {kind === "farmer" && (
          <>
            {/* towel */}
            <path d="M -60 -200 Q -6 -180 52 -200 L 50 -186 Q -6 -166 -60 -186 Z" fill={COLORS.red} stroke={INK} strokeWidth={4} />
            {/* bamboo hat (斗笠) */}
            <path d="M -150 -316 L -6 -420 L 140 -316 Q -6 -296 -150 -316 Z" fill="#f2cf6b" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
            <path d="M -6 -420 L 140 -316 Q 80 -306 40 -304 Z" fill="#d9ad45" />
            {[-100, -52, 40, 90].map((x) => (
              <line key={x} x1={-6} y1={-414} x2={x} y2={-310} stroke="#b88a2e" strokeWidth={3} />
            ))}
          </>
        )}
        {sweat > 0 && (
          <g opacity={sweat}>
            <SweatDrop x={70} y={-300 + (1 - sweat) * -20 + ((frame / 2) % 10)} s={1.3} />
            <SweatDrop x={86} y={-238} s={0.8} />
          </g>
        )}
        {gloom > 0 && (
          <g opacity={gloom}>
            {[-66, -42, -18, 6, 30].map((x, i) => (
              <line key={x} x1={x} y1={-310} x2={x} y2={-290 + (i % 2) * 6} stroke="#6a5a8a" strokeWidth={5} strokeLinecap="round" />
            ))}
          </g>
        )}
      </g>
      <g transform={`translate(0 ${bob * 0.3})`}>
        <Arm from={[-36, -176]} to={pose.front} sleeve={shirtShade} />
      </g>
    </g>
  );
};

// Wicker basket, base at (0, 0), about 300 px wide, with `count` berries in it.
export const Basket: React.FC<{ frame: number; count: number; jiggle?: number }> = ({ frame, count, jiggle = 0 }) => {
  const spots: Pt[] = [
    [-50, -86],
    [20, -90],
    [-10, -100],
    [70, -84],
    [-90, -82],
    [40, -108],
    [-60, -110],
    [100, -96],
    [0, -120],
  ];
  return (
    <g>
      <ellipse cx={0} cy={4} rx={170} ry={18} fill="#000" opacity={0.15} />
      {/* back rim */}
      <ellipse cx={0} cy={-90} rx={150} ry={34} fill={COLORS.woodShade} stroke={INK} strokeWidth={6} />
      {spots.slice(0, count).map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y + Math.abs(Math.sin(frame / 3 + i)) * -10 * jiggle}) rotate(${70 + i * 30})`}>
          <ellipse rx={13} ry={26} fill={COLORS.berry} stroke={INK} strokeWidth={4} />
          <ellipse cx={-4} cy={-8} rx={4} ry={7} fill={COLORS.berryShine} />
        </g>
      ))}
      {/* body */}
      <path d="M -150 -90 Q -140 0 -100 0 L 100 0 Q 140 0 150 -90 Q 0 -50 -150 -90 Z" fill={COLORS.wood} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      {[-60, -30].map((y) => (
        <path key={y} d={`M -140 ${y - 20} Q 0 ${y + 20} 140 ${y - 20}`} stroke={COLORS.woodShade} strokeWidth={5} fill="none" />
      ))}
      {[-90, -30, 30, 90].map((x) => (
        <line key={x} x1={x} y1={-64} x2={x * 0.8} y2={-4} stroke={COLORS.woodShade} strokeWidth={5} />
      ))}
    </g>
  );
};
