import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { lerp, pop } from "../anim";
import { Backdrop } from "../components/Backdrop";
import { ArcArrow, Calendar, monthAngle } from "../components/Calendar";
import { Papa } from "../components/Papa";
import { Label } from "../components/Label";
import { Pumpkin } from "../components/Pumpkin";
import { Stage, Sticker } from "../components/Sticker";
import { Leaf, Snowflake, Sparkle } from "../components/Things";
import { COLORS } from "../theme";
import { useLines } from "../timeline";

// L0 「「小黑南瓜」建議的種植季節，是秋天和冬天，」 a ring of the 12 months:
//    10 and 11 light up orange (autumn, a leaf), 12, 1, 2 blue (winter, snow).
// L1 「也就是十月，到隔年的二月。」 an arrow sweeps from 10 round to 2; the
//    months appear in words under the ring.

const CX = 540;
const CY = 820;
const ORDER = [10, 11, 12, 1, 2]; // lighting order

const at = (m: number, r: number): [number, number] => {
  const a = ((monthAngle(m) - 90) * Math.PI) / 180;
  return [CX + Math.cos(a) * r, CY + Math.sin(a) * r];
};

export const Season: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  const ring = pop(frame, fps, 4, 13);
  const lit: Record<number, number> = {};
  ORDER.forEach((m, i) => {
    // autumn months while 「秋天」 is said, winter months for 「冬天」
    const start = L[0] + 46 + i * 12 + (i >= 2 ? 18 : 0);
    lit[m] = lerp(frame, [start, start + 10], [0, 1]);
  });
  const leaf = pop(frame, fps, L[0] + 50, 10);
  const snow = pop(frame, fps, L[0] + 86, 10);
  const arrow = lerp(frame, [L[1] + 6, L[1] + 50], [0, 1]);
  const center = pop(frame, fps, 20, 10);
  const twk = (start: number, period = 40) => (frame < start ? 0 : Math.sin((((frame - start) % period) / period) * Math.PI));
  const [lx, ly] = at(10.5, 440);
  const [sx, sy] = at(1, 450);

  return (
    <AbsoluteFill>
      <Backdrop mood="autumn" />
      <Stage>
        <Sticker x={CX} y={CY} scale={ring}>
          <Calendar lit={lit} />
        </Sticker>
        <g transform={`translate(${CX} ${CY})`}>
          <ArcArrow radius={400} a0={monthAngle(9.6)} a1={monthAngle(14.4)} t={arrow} color={COLORS.autumn} />
        </g>
        <Sticker x={CX} y={CY + 10} scale={1.25 * center} rotate={Math.sin(frame / 14) * 4}>
          <Pumpkin variant="hei" face="happy" />
        </Sticker>
        <Sticker x={lx} y={ly} scale={0.7 * leaf} rotate={-40 + Math.sin(frame / 10) * 8}>
          <Leaf color={COLORS.autumn} />
        </Sticker>
        <g transform={`translate(${sx} ${sy}) rotate(${frame}) scale(${1.3 * snow})`}>
          <Snowflake color={COLORS.winter} />
        </g>
        <Sparkle x={CX + 260} y={CY - 380} t={twk(L[1] + 50, 40)} size={40} />
        <Sparkle x={CX - 270} y={CY - 360} t={twk(L[1] + 60, 46)} size={34} />
      </Stage>
      <Label x={690} y={1400} at={L[1] + 20} size={100}>
        10月 → 2月
      </Label>
      <Papa poses={[[10, "point"], [L[1] + 70, "thumbs"]]} x={frame < L[1] + 70 ? 230 : 190} y={1900} height={frame < L[1] + 70 ? 620 : 560} hops={[L[0], L[1] + 70]} />
    </AbsoluteFill>
  );
};
