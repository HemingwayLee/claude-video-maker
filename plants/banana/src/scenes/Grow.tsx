import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, fadeOut, lerp, pop } from "../anim";
import { BananaPlant } from "../components/BananaPlant";
import { Callout, Sfx } from "../components/Manga";
import { Nutrients } from "../components/Nutrients";
import { moveCam, toScreen, World } from "../components/World";
import { budTop, LAST_HAND_Y, NODES, nodeY, RACHIS_X } from "../plant";
import { COLORS, FONT, INK, ROLE } from "../theme";
import { useLines } from "../timeline";

// Time passes: the bananas fatten, the stalk below them stretches, and
// the empty hands (空梳) and non-fruiting finger flowers (花指) show up.
export const Grow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();
  const cam = moveCam(frame, [
    [0, { x: 640, y: 1010, z: 1.15 }],
    [L[1], { x: 650, y: 1090, z: 1.2 }],
    [L[2] - 4, { x: 650, y: 1130, z: 1.25 }],
    [L[2] + 20, { x: 640, y: 1200, z: 1.55 }],
    [L[4] - 4, { x: 640, y: 1220, z: 1.55 }],
    [L[4] + 20, { x: 620, y: 1080, z: 1.2 }],
  ]);
  const g = lerp(frame, [L[0] + 4, L[1] - 4], [0, 0.55]) + lerp(frame, [L[1] + 4, L[2] - 6], [0, 0.45]);

  // Points for the labels.
  const sc = (x: number, y: number) => toScreen(cam, x, y);
  const empties = NODES.filter((n) => n.kind === "empty").map((n) => sc(RACHIS_X, nodeY(n.f, g) - 6));
  const fingers = NODES.filter((n) => n.kind === "finger").map((n) => sc(RACHIS_X, nodeY(n.f, g) + 14));
  const arrowTop = sc(RACHIS_X + 80, LAST_HAND_Y + 14);
  const arrowBottom = sc(RACHIS_X + 80, budTop(g) - 6);
  const stretchShow = fade(frame, L[1] + 4, 8) * fadeOut(frame, L[2] - 2, 8);
  const ring = (p: [number, number], color: string, show: number, r: number) =>
    show > 0 ? (
      <circle cx={p[0]} cy={p[1]} r={r * (0.9 + 0.1 * Math.sin(frame / 4))} fill="none" stroke={color} strokeWidth={8} strokeDasharray="18 10" opacity={show} />
    ) : null;
  const emptyShow = fade(frame, L[2] + 6, 8);
  const fingerShow = fade(frame, L[3] + 6, 8);

  return (
    <AbsoluteFill>
      <World
        cam={cam}
        frame={frame}
        overlay={
          <>
            <svg width={1080} height={1920} style={{ position: "absolute" }}>
              {/* stretch arrow: the stalk under the bananas gets longer */}
              <g opacity={stretchShow}>
                <line x1={arrowTop[0]} y1={arrowTop[1]} x2={arrowBottom[0]} y2={arrowBottom[1]} stroke={INK} strokeWidth={14} strokeLinecap="round" />
                <line x1={arrowTop[0]} y1={arrowTop[1]} x2={arrowBottom[0]} y2={arrowBottom[1]} stroke={COLORS.yellow} strokeWidth={7} strokeLinecap="round" />
                {[arrowTop, arrowBottom].map(([x, y], i) => (
                  <path key={i} d={i ? `M ${x - 20} ${y - 26} L ${x} ${y} L ${x + 20} ${y - 26}` : `M ${x - 20} ${y + 26} L ${x} ${y} L ${x + 20} ${y + 26}`} stroke={INK} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                ))}
              </g>
              {empties.map((p, i) => <React.Fragment key={i}>{ring(p, ROLE.empty, emptyShow, 62)}</React.Fragment>)}
              {fingers.map((p, i) => <React.Fragment key={i}>{ring(p, ROLE.finger, fingerShow, 56)}</React.Fragment>)}
            </svg>
            {stretchShow > 0 && (
              <Sfx text="越拉越長" x={arrowTop[0] + 150} y={(arrowTop[1] + arrowBottom[1]) / 2} size={62} color={COLORS.yellow} rot={8} opacity={stretchShow} scale={pop(frame, fps, L[1] + 6, 10)} />
            )}
            <Callout tx={empties[0][0] + 50} ty={empties[0][1]} lx={850} ly={empties[0][1] - 120} text="空梳" sub="沒有長出香蕉的梳" color={ROLE.empty} progress={lerp(frame, [L[2] + 10, L[2] + 28], [0, 1])} size={58} />
            <Callout tx={fingers[1][0] - 50} ty={fingers[1][1]} lx={250} ly={fingers[1][1] + 160} text="不結果的花指" sub="小花不會變成香蕉" color={ROLE.finger} progress={lerp(frame, [L[3] + 10, L[3] + 28], [0, 1])} size={52} />
            <Nutrients frame={frame - L[4]} cam={cam} bottom={budTop(g)} show={fade(frame, L[4], 8)} />
            {frame > L[4] && (
              <Sfx text="搶養分！" x={830} y={toScreen(cam, 0, budTop(g))[1] - 40} size={76} color={COLORS.red} rot={-8} scale={pop(frame, fps, L[4] + 26, 9)} />
            )}
          </>
        }
      >
        <BananaPlant frame={frame} g={g} />
      </World>
      {/* "time passes" badge */}
      <TimeBadge frame={frame} show={fade(frame, L[0], 8) * fadeOut(frame, L[2], 8)} />
    </AbsoluteFill>
  );
};

const TimeBadge: React.FC<{ frame: number; show: number }> = ({ frame, show }) => {
  if (show <= 0) return null;
  const a = frame * 12;
  return (
    <div
      style={{
        position: "absolute",
        right: 40,
        top: 200,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "10px 24px 10px 14px",
        background: "#fff",
        border: `6px solid ${INK}`,
        borderRadius: 50,
        boxShadow: `6px 6px 0 ${INK}`,
        fontFamily: FONT,
        fontSize: 44,
        fontWeight: 900,
        color: INK,
        opacity: show,
      }}
    >
      <svg width={64} height={64} viewBox="-32 -32 64 64">
        <circle r={27} fill={COLORS.yellow} stroke={INK} strokeWidth={5} />
        <line x1={0} y1={0} x2={0} y2={-17} stroke={INK} strokeWidth={5} strokeLinecap="round" transform={`rotate(${a})`} />
        <line x1={0} y1={0} x2={0} y2={-11} stroke={INK} strokeWidth={5} strokeLinecap="round" transform={`rotate(${a / 12})`} />
      </svg>
      幾個星期後⋯
    </div>
  );
};
