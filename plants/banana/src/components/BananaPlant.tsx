import React from "react";
import { COLORS, INK } from "../theme";
import {
  budScale,
  budTop,
  CROWN_Y,
  CUT_Y,
  GROUND_Y,
  handFingers,
  HAND_COUNT,
  HAND_Y,
  LAST_HAND_Y,
  LEAVES_BACK,
  LEAVES_FRONT,
  type LeafDef,
  leafShape,
  NODES,
  nodeY,
  RACHIS_X,
  TRUNK_X,
} from "../plant";
import { BananaBud } from "./BananaBud";

// The whole banana plant, in world coordinates (see plant.ts).

export type PlantProps = {
  frame: number; // for the gentle sway
  g?: number; // growth 0 → 1
  open?: number; // banana flower bracts lifted, 0 → 2
  // The cut: once `cut` > 0 the part below CUT_Y is a separate piece that
  // falls: `fall` 0 → 1 drops it to the ground.
  cut?: boolean;
  fall?: number;
  removed?: boolean; // the cut-off piece has been carried away

  // Optional overlays drawn right on top of the plant.
  highlightHand?: { hand: number; alpha: number };
  highlightFinger?: { hand: number; alpha: number };
};

const mixColor = (a: string, b: string, t0: number) => {
  const t = Math.max(0, Math.min(1, t0));
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(",")})`;
};

const Leaf: React.FC<{ leaf: LeafDef; sway: number }> = ({ leaf, sway }) => {
  const s = leafShape([TRUNK_X + 5, CROWN_Y + 10], leaf, sway);
  const fill = leaf.old ? "#c9b25a" : COLORS.leaf;
  const shade = leaf.old ? "#a68a3c" : COLORS.leafShade;
  return (
    <g>
      <path d={s.outline} fill={fill} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d={s.lower} fill={shade} />
      <path d={s.outline} fill="none" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d={s.rib} fill="none" stroke={leaf.old ? "#e6d48a" : COLORS.leafRib} strokeWidth={6} strokeLinecap="round" />
    </g>
  );
};

const Trunk: React.FC = () => {
  const x = TRUNK_X;
  return (
    <g>
      {/* a baby banana plant (sucker) at the base */}
      <path d={`M ${x + 90} ${GROUND_Y} C ${x + 86} ${GROUND_Y - 60}, ${x + 96} ${GROUND_Y - 90}, ${x + 100} ${GROUND_Y - 110} C ${x + 108} ${GROUND_Y - 90}, ${x + 116} ${GROUND_Y - 60}, ${x + 112} ${GROUND_Y} Z`} fill={COLORS.trunk} stroke={INK} strokeWidth={4} />
      <path d={`M ${x + 100} ${GROUND_Y - 105} C ${x + 120} ${GROUND_Y - 170}, ${x + 160} ${GROUND_Y - 180}, ${x + 170} ${GROUND_Y - 190} C ${x + 150} ${GROUND_Y - 150}, ${x + 130} ${GROUND_Y - 120}, ${x + 104} ${GROUND_Y - 100} Z`} fill={COLORS.leaf} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      {/* pseudostem */}
      <path
        d={`M ${x - 70} ${GROUND_Y + 6} C ${x - 60} ${GROUND_Y - 400}, ${x - 46} ${CROWN_Y + 300}, ${x - 40} ${CROWN_Y} L ${x + 44} ${CROWN_Y} C ${x + 50} ${CROWN_Y + 300}, ${x + 62} ${GROUND_Y - 400}, ${x + 72} ${GROUND_Y + 6} Z`}
        fill={COLORS.trunk}
        stroke={INK}
        strokeWidth={6}
        strokeLinejoin="round"
      />
      <path d={`M ${x + 20} ${CROWN_Y} C ${x + 28} ${CROWN_Y + 300}, ${x + 40} ${GROUND_Y - 400}, ${x + 46} ${GROUND_Y + 4} L ${x + 72} ${GROUND_Y + 4} C ${x + 62} ${GROUND_Y - 400}, ${x + 50} ${CROWN_Y + 300}, ${x + 44} ${CROWN_Y} Z`} fill={COLORS.trunkShade} />
      {/* leaf-sheath stripes and old brown patches */}
      {[-30, -8, 14].map((dx, i) => (
        <path key={dx} d={`M ${x + dx} ${CROWN_Y + 40 + i * 30} C ${x + dx * 1.1} ${CROWN_Y + 400}, ${x + dx * 1.3} ${GROUND_Y - 300}, ${x + dx * 1.5} ${GROUND_Y - 30}`} stroke={COLORS.trunkStripe} strokeWidth={4} fill="none" opacity={0.6} />
      ))}
      <path d={`M ${x - 56} ${GROUND_Y - 260} q 30 -40 50 -10 q -10 60 -52 70 Z`} fill="#9a7a45" stroke={INK} strokeWidth={3} opacity={0.9} />
      <path d={`M ${x + 10} ${GROUND_Y - 520} q 28 -30 40 0 q -12 40 -38 40 Z`} fill="#9a7a45" stroke={INK} strokeWidth={3} opacity={0.8} />
      {/* highlight */}
      <path d={`M ${x - 32} ${CROWN_Y + 60} C ${x - 40} ${CROWN_Y + 400}, ${x - 46} ${GROUND_Y - 400}, ${x - 50} ${GROUND_Y - 120}`} stroke="#b9dc7a" strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.8} />
    </g>
  );
};

const Banana: React.FC<{ d: string; thick: number; tip: [number, number]; color: string; shade: string; back: boolean }> = ({ d, thick, tip, color, shade, back }) => (
  <g>
    <path d={d} stroke={INK} strokeWidth={thick + 8} strokeLinecap="round" fill="none" />
    <path d={d} stroke={back ? shade : color} strokeWidth={thick} strokeLinecap="round" fill="none" />
    {!back && <path d={d} stroke={shade} strokeWidth={thick * 0.35} strokeLinecap="round" fill="none" transform={`translate(${thick * 0.22} 0)`} />}
    {!back && <path d={d} stroke="#ffffff" strokeWidth={Math.max(2, thick * 0.14)} strokeLinecap="round" fill="none" opacity={0.45} transform={`translate(${-thick * 0.22} ${thick * 0.1})`} />}
    <circle cx={tip[0]} cy={tip[1]} r={thick * 0.32} fill={COLORS.bananaTip} />
  </g>
);

const Bunch: React.FC<{ g: number; highlightHand?: PlantProps["highlightHand"]; highlightFinger?: PlantProps["highlightFinger"] }> = ({ g, highlightHand, highlightFinger }) => {
  const color = mixColor(COLORS.bananaYoung, COLORS.bananaGrown, g);
  const shade = mixColor(COLORS.bananaShadeYoung, COLORS.bananaShadeGrown, g);
  return (
    <g>
      {Array.from({ length: HAND_COUNT }, (_, h) => {
        const fingers = handFingers(h, g);
        const glow = highlightHand && highlightHand.hand === h ? highlightHand.alpha : 0;
        return (
          <g key={h}>
            {glow > 0 &&
              fingers.map((f, i) => (
                <path key={i} d={f.d} stroke="#fff6a8" strokeWidth={f.thick + 26} strokeLinecap="round" fill="none" opacity={glow} />
              ))}
            {fingers.map((f, i) => (
              <Banana key={i} {...f} color={color} shade={shade} />
            ))}
            {/* crown where the hand joins the stalk */}
            <ellipse cx={RACHIS_X} cy={HAND_Y[h] + 6} rx={20} ry={9} fill={COLORS.stalkShade} stroke={INK} strokeWidth={3} />
          </g>
        );
      })}
      {highlightFinger &&
        highlightFinger.alpha > 0 &&
        (() => {
          const f = handFingers(highlightFinger.hand, g).filter((x) => !x.back)[1]; // the right-most front banana
          return (
            <g opacity={highlightFinger.alpha}>
              <path d={f.d} stroke="#ffffff" strokeWidth={f.thick + 22} strokeLinecap="round" fill="none" />
              <Banana {...f} color={color} shade={shade} />
            </g>
          );
        })()}
    </g>
  );
};

// A hand that never formed bananas: tiny stubs, pale and dry-tipped.
const EmptyHand: React.FC<{ y: number; side: number; alpha: number }> = ({ y, side, alpha }) => (
  <g opacity={alpha}>
    <path d={`M ${RACHIS_X - 22 * side} ${y + 4} q ${-12 * side} -14 ${-6 * side} -26`} stroke={COLORS.bractShade} strokeWidth={5} fill="none" strokeLinecap="round" />
    {[-2, -1, 0, 1, 2].map((j) => {
      const bx = RACHIS_X + j * 7;
      const tx = RACHIS_X + j * 21;
      const ty = y - 30 + Math.abs(j) * 5;
      return (
        <g key={j}>
          <path d={`M ${bx} ${y} Q ${RACHIS_X + j * 18} ${y + 2} ${tx} ${ty}`} stroke={INK} strokeWidth={17} strokeLinecap="round" fill="none" />
          <path d={`M ${bx} ${y} Q ${RACHIS_X + j * 18} ${y + 2} ${tx} ${ty}`} stroke="#b5c96a" strokeWidth={9} strokeLinecap="round" fill="none" />
          <circle cx={tx} cy={ty} r={3.5} fill={COLORS.floretDry} />
        </g>
      );
    })}
    <ellipse cx={RACHIS_X} cy={y + 3} rx={14} ry={6} fill={COLORS.stalkShade} stroke={INK} strokeWidth={2.5} />
  </g>
);

// Withered flowers that will never set fruit (花指), plus the scar of their bract.
const FingerFlowers: React.FC<{ y: number; side: number; alpha: number }> = ({ y, side, alpha }) => (
  <g opacity={alpha}>
    {[-2, -1, 0, 1, 2].map((j) => (
      <g key={j} transform={`translate(${RACHIS_X + j * 8} ${y}) rotate(${j * 26 + side * 8})`}>
        <rect x={-5} y={0} width={10} height={40} rx={5} fill={COLORS.floret} stroke={INK} strokeWidth={3} />
        <ellipse cx={0} cy={40} rx={5.5} ry={5} fill={COLORS.floretDry} stroke={INK} strokeWidth={2} />
      </g>
    ))}
    <path d={`M ${RACHIS_X - 10 * side} ${y - 2} q ${-16 * side} 4 ${-20 * side} 18`} stroke={COLORS.bractShade} strokeWidth={5} fill="none" strokeLinecap="round" />
  </g>
);

// Everything below the cut: the bare stalk, its nodes, and the flower.
const LowerPart: React.FC<{ g: number; open: number; sway: number; fromY: number }> = ({ g, open, sway, fromY }) => {
  const top = budTop(g);
  const s = budScale(g);
  const nodeAlpha = (f: number) => Math.max(0, Math.min(1, (g - f * 0.5) / 0.25));
  return (
    <g>
      <line x1={RACHIS_X} y1={fromY} x2={RACHIS_X} y2={top + 4} stroke={INK} strokeWidth={24} strokeLinecap="round" />
      <line x1={RACHIS_X} y1={fromY} x2={RACHIS_X} y2={top + 4} stroke={COLORS.stalk} strokeWidth={15} strokeLinecap="round" />
      <line x1={RACHIS_X + 3} y1={fromY} x2={RACHIS_X + 3} y2={top} stroke={COLORS.stalkShade} strokeWidth={5} />
      {NODES.map((n, i) => {
        const y = nodeY(n.f, g);
        if (y < fromY + 4) return null;
        return n.kind === "empty" ? (
          <EmptyHand key={i} y={y} side={n.side} alpha={nodeAlpha(n.f)} />
        ) : (
          <FingerFlowers key={i} y={y} side={n.side} alpha={nodeAlpha(n.f)} />
        );
      })}
      <g transform={`translate(${RACHIS_X} ${top}) scale(${s})`}>
        <BananaBud open={open} sway={sway} />
      </g>
    </g>
  );
};

export const BananaPlant: React.FC<PlantProps> = ({ frame, g = 0, open = 0, cut = false, fall = 0, removed = false, highlightHand, highlightFinger }) => {
  const sway = Math.sin(frame / 22) * 6;
  const budSway = Math.sin(frame / 30) * 1.5;
  // The cut-off piece: drops with gravity and tips over to lie flat on
  // the ground, pointing left.
  const drop = (GROUND_Y - CUT_Y - 22) * fall * fall;
  const tilt = 90 * Math.min(1, fall * 1.15);
  const restShift = 170 * fall;
  return (
    <g>
      {LEAVES_BACK.map((l, i) => (
        <Leaf key={i} leaf={l} sway={sway * (i % 2 ? -1 : 1)} />
      ))}
      <Trunk />
      {/* the stalk that carries the bunch: out of the crown, arching over */}
      <path d={`M ${TRUNK_X + 5} ${CROWN_Y + 15} C ${TRUNK_X + 60} ${CROWN_Y - 90}, ${RACHIS_X - 40} ${CROWN_Y - 70}, ${RACHIS_X} ${HAND_Y[0] - 30} L ${RACHIS_X} ${cut ? CUT_Y : LAST_HAND_Y + 10}`} stroke={INK} strokeWidth={34} fill="none" strokeLinecap="round" />
      <path d={`M ${TRUNK_X + 5} ${CROWN_Y + 15} C ${TRUNK_X + 60} ${CROWN_Y - 90}, ${RACHIS_X - 40} ${CROWN_Y - 70}, ${RACHIS_X} ${HAND_Y[0] - 30} L ${RACHIS_X} ${cut ? CUT_Y : LAST_HAND_Y + 10}`} stroke={COLORS.stalk} strokeWidth={24} fill="none" strokeLinecap="round" />
      {LEAVES_FRONT.map((l, i) => (
        <Leaf key={i} leaf={l} sway={sway * (i % 2 ? 1 : -1) * 0.8} />
      ))}
      {cut ? (
        <>
          {/* clean cut face on the stub that stays on the plant */}
          <ellipse cx={RACHIS_X} cy={CUT_Y} rx={12} ry={5} fill="#e9f5c8" stroke={INK} strokeWidth={3} />
          <g transform={`translate(${restShift} ${drop}) rotate(${tilt} ${RACHIS_X} ${CUT_Y})`} opacity={removed ? 0 : 1}>
            <LowerPart g={g} open={open} sway={0} fromY={CUT_Y} />
            <ellipse cx={RACHIS_X} cy={CUT_Y} rx={12} ry={5} fill="#e9f5c8" stroke={INK} strokeWidth={3} />
          </g>
        </>
      ) : (
        <LowerPart g={g} open={open} sway={budSway} fromY={LAST_HAND_Y} />
      )}
      <Bunch g={g} highlightHand={highlightHand} highlightFinger={highlightFinger} />
    </g>
  );
};
