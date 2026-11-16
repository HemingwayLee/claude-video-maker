import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { pop } from "../anim";
import { Backdrop } from "../components/Backdrop";
import { Papa } from "../components/Papa";
import { Label } from "../components/Label";
import { Pumpkin } from "../components/Pumpkin";
import { Stage, Sticker } from "../components/Sticker";
import { Chestnut, Sparkle } from "../components/Things";
import { INK } from "../theme";
import { useLines } from "../timeline";

// L0 「它跟中國的「貝貝南瓜」十分相似，」 小黑 and 貝貝 side by side, ≈ between them.
// L1 「「貝貝南瓜」也是一種栗子南瓜。」 a chestnut pops over each: same family.
export const Similar: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  const hei = pop(frame, fps, 6, 10);
  const bei = pop(frame, fps, L[0] + 24, 10);
  const approx = pop(frame, fps, L[0] + 50, 12);
  const nut1 = pop(frame, fps, L[1] + 20, 10);
  const nut2 = pop(frame, fps, L[1] + 30, 10);
  const join = pop(frame, fps, L[1] + 44, 14);
  const blink = (o: number) => (frame + o) % 80 < 4;
  const tw = (start: number, period = 40) => (frame < start ? 0 : Math.sin((((frame - start) % period) / period) * Math.PI));
  // the two look at each other, rocking in turn
  const rock = (o: number) => Math.sin(frame / 12 + o) * 5;

  return (
    <AbsoluteFill>
      <Backdrop mood="warm" />
      <Stage>
        {/* the chestnut-pumpkin "family" ribbon behind both */}
        <g opacity={join}>
          <rect x={90} y={520} width={900} height={620} rx={110} fill="#fff" opacity={0.55} stroke="#fff" strokeWidth={10} />
          <rect x={90} y={520} width={900} height={620} rx={110} fill="none" stroke={INK} strokeWidth={4} strokeDasharray="22 16" opacity={0.6} />
        </g>
        <Sticker x={300} y={900} scale={1.6 * hei} rotate={rock(0)}>
          <Pumpkin variant="hei" face="smile" blink={blink(0)} />
        </Sticker>
        <Sticker x={780} y={910} scale={1.5 * bei} rotate={rock(2)}>
          <Pumpkin variant="bei" face="smile" blink={blink(30)} />
        </Sticker>
        <g opacity={approx} transform={`translate(540 890) scale(${approx})`}>
          {[-16, 16].map((dy) => (
            <path key={dy} d={`M-34,${dy} q17,-16 34,0 q17,16 34,0`} fill="none" stroke="#fff" strokeWidth={22} strokeLinecap="round" />
          ))}
          {[-16, 16].map((dy) => (
            <path key={`i${dy}`} d={`M-34,${dy} q17,-16 34,0 q17,16 34,0`} fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" />
          ))}
        </g>
        <Sticker x={300} y={650} scale={0.8 * nut1} rotate={-10}>
          <Chestnut />
        </Sticker>
        <Sticker x={780} y={650} scale={0.8 * nut2} rotate={10}>
          <Chestnut />
        </Sticker>
        <Sparkle x={160} y={600} t={tw(L[1] + 40)} size={36} />
        <Sparkle x={930} y={610} t={tw(L[1] + 52, 44)} size={40} />
      </Stage>
      <Label x={300} y={1095} at={14} size={84}>
        小黑
      </Label>
      <Label x={780} y={1095} at={L[0] + 30} size={84}>
        貝貝
      </Label>
      <Papa poses={[[8, "chin"], [L[1] + 40, "thumbs"]]} x={540} y={frame < L[1] + 40 ? 1980 : 1890} height={frame < L[1] + 40 ? 760 : 700} hops={[L[1] + 40]} />
    </AbsoluteFill>
  );
};
