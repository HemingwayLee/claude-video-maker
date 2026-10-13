import React from "react";
import { COLORS, INK } from "../theme";

// A chibi banana farmer in a bamboo hat (斗笠), facing left, feet at (0, 0).
// In the "hold" pose both hands grip the banana knife at HAND; the knife
// turns around that point by `knifeAngle` (degrees, 0 = straight up).

export const HAND: [number, number] = [-50, -200];
export const KNIFE_LEN = 430; // hand → where the blade starts

const SKIN = "#ffd9b8";
const SKIN_SHADE = "#f2b78f";

// The banana knife (香蕉刀): a long wooden handle with a hooked blade.
export const BananaKnife: React.FC<{ glow?: number }> = ({ glow = 0 }) => (
  <g>
    {glow > 0 && (
      <path d={`M 0 60 L 0 ${-KNIFE_LEN} M 4 ${-KNIFE_LEN + 4} C -20 ${-KNIFE_LEN - 60}, -90 ${-KNIFE_LEN - 70}, -120 ${-KNIFE_LEN - 20}`} stroke="#fff6a8" strokeWidth={40} strokeLinecap="round" fill="none" opacity={glow} />
    )}
    {/* handle */}
    <rect x={-8} y={-KNIFE_LEN} width={16} height={KNIFE_LEN + 60} rx={8} fill="#b07a3c" stroke={INK} strokeWidth={4} />
    <rect x={-3} y={-KNIFE_LEN + 10} width={4} height={KNIFE_LEN + 40} fill="#d29a55" />
    {/* ferrule */}
    <rect x={-11} y={-KNIFE_LEN - 4} width={22} height={26} rx={4} fill="#8a8f98" stroke={INK} strokeWidth={4} />
    {/* hooked blade, sharp edge on the inside of the hook */}
    <path
      d={`M 6 ${-KNIFE_LEN} C 10 ${-KNIFE_LEN - 50}, -60 ${-KNIFE_LEN - 96}, -128 ${-KNIFE_LEN - 30} C -96 ${-KNIFE_LEN - 52}, -40 ${-KNIFE_LEN - 46}, -10 ${-KNIFE_LEN + 8} Z`}
      fill="#dfe6ee"
      stroke={INK}
      strokeWidth={5}
      strokeLinejoin="round"
    />
    <path d={`M -12 ${-KNIFE_LEN - 8} C -40 ${-KNIFE_LEN - 40}, -90 ${-KNIFE_LEN - 46}, -118 ${-KNIFE_LEN - 30}`} stroke="#ffffff" strokeWidth={4} fill="none" strokeLinecap="round" />
  </g>
);

const Arm: React.FC<{ from: [number, number]; to: [number, number] }> = ({ from, to }) => (
  <g>
    <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={INK} strokeWidth={30} strokeLinecap="round" />
    <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke="#7ec3e8" strokeWidth={21} strokeLinecap="round" />
    <circle cx={to[0]} cy={to[1]} r={14} fill={SKIN} stroke={INK} strokeWidth={4} />
  </g>
);

export type FarmerProps = {
  frame: number;
  pose?: "wave" | "hold";
  knifeAngle?: number;
  talking?: boolean;
  face?: "happy" | "determined";
  knifeGlow?: number;
};

export const Farmer: React.FC<FarmerProps> = ({ frame, pose = "hold", knifeAngle = -10, talking = false, face = "happy", knifeGlow = 0 }) => {
  const bob = Math.sin(frame / 8) * 3;
  const blink = frame % 96 > 90; // a quick blink every ~3 s
  const mouthOpen = talking && Math.sin(frame / 2.2) > -0.2;
  const a = (knifeAngle * Math.PI) / 180;
  // The second hand holds the handle a bit lower down.
  const hand2: [number, number] = [HAND[0] - Math.sin(a) * 55, HAND[1] + Math.cos(a) * 55];
  const wave = Math.sin(frame / 4) * 18;
  return (
    <g>
      <ellipse cx={0} cy={4} rx={80} ry={14} fill="#000" opacity={0.15} />
      <g transform={`translate(0 ${bob * 0.3})`}>
        {/* legs and boots */}
        <rect x={-38} y={-95} width={30} height={84} rx={12} fill="#3d5a99" stroke={INK} strokeWidth={5} />
        <rect x={8} y={-95} width={30} height={84} rx={12} fill="#3d5a99" stroke={INK} strokeWidth={5} />
        <rect x={-50} y={-26} width={44} height={26} rx={10} fill="#3a3a3a" stroke={INK} strokeWidth={5} />
        <rect x={4} y={-26} width={44} height={26} rx={10} fill="#3a3a3a" stroke={INK} strokeWidth={5} />
        {/* body */}
        <rect x={-58} y={-200} width={116} height={118} rx={36} fill="#9bd3f2" stroke={INK} strokeWidth={6} />
        <rect x={10} y={-190} width={40} height={100} rx={20} fill="#7ec3e8" />
        <rect x={-58} y={-110} width={116} height={20} fill="#3d5a99" stroke={INK} strokeWidth={5} />
        {/* back arm (behind the head) */}
        {pose === "hold" ? <Arm from={[34, -176]} to={hand2} /> : <Arm from={[40, -176]} to={[66, -110]} />}
      </g>
      <g transform={`translate(0 ${bob})`}>
        {/* head */}
        <circle cx={-6} cy={-272} r={80} fill={SKIN} stroke={INK} strokeWidth={6} />
        <path d="M 40 -300 A 80 80 0 0 1 60 -230 Q 40 -200 20 -205 Z" fill={SKIN_SHADE} />
        {/* hair */}
        <path d="M -84 -282 Q -80 -330 -30 -342 Q 30 -348 66 -300 Q 30 -316 -6 -300 Q -30 -320 -46 -292 Q -60 -306 -84 -282 Z" fill="#3b2a20" stroke={INK} strokeWidth={4} />
        {/* eyes */}
        {[-46, 6].map((x) =>
          blink ? (
            <path key={x} d={`M ${x - 16} -262 Q ${x} -254 ${x + 16} -262`} stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
          ) : (
            <g key={x}>
              <ellipse cx={x} cy={-262} rx={16} ry={22} fill="#2a1a12" />
              <ellipse cx={x} cy={-252} rx={11} ry={10} fill="#6b3e26" />
              <circle cx={x - 5} cy={-270} r={6.5} fill="#fff" />
              <circle cx={x + 6} cy={-252} r={3} fill="#fff" />
              {face === "determined" && <path d={`M ${x - 18} -294 L ${x + 16} ${x < 0 ? -286 : -290}`} stroke={INK} strokeWidth={6} strokeLinecap="round" />}
            </g>
          ),
        )}
        {/* blush */}
        <ellipse cx={-70} cy={-232} rx={14} ry={8} fill={COLORS.pink} opacity={0.55} />
        <ellipse cx={34} cy={-232} rx={14} ry={8} fill={COLORS.pink} opacity={0.55} />
        {/* mouth */}
        {mouthOpen ? (
          <path d="M -32 -224 Q -20 -200 -8 -224 Z" fill="#c2414b" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        ) : (
          <path d="M -32 -224 Q -20 -212 -8 -224" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
        )}
        {/* towel */}
        <path d="M -60 -200 Q -6 -180 52 -200 L 50 -186 Q -6 -166 -60 -186 Z" fill={COLORS.red} stroke={INK} strokeWidth={4} />
        {/* bamboo hat (斗笠) */}
        <path d="M -150 -316 L -6 -420 L 140 -316 Q -6 -296 -150 -316 Z" fill="#f2cf6b" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d="M -6 -420 L 140 -316 Q 80 -306 40 -304 Z" fill="#d9ad45" />
        {[-100, -52, 40, 90].map((x) => (
          <line key={x} x1={-6} y1={-414} x2={x} y2={-310} stroke="#b88a2e" strokeWidth={3} />
        ))}
      </g>
      {/* front arm and the knife */}
      <g transform={`translate(0 ${bob * 0.3})`}>
        {pose === "hold" ? (
          <>
            <g transform={`translate(${HAND[0]} ${HAND[1]}) rotate(${knifeAngle})`}>
              <BananaKnife glow={knifeGlow} />
            </g>
            <Arm from={[-36, -176]} to={HAND} />
          </>
        ) : (
          <Arm from={[-40, -180]} to={[-150 + wave * 0.4, -250 - Math.abs(wave) * 0.4]} />
        )}
      </g>
    </g>
  );
};
