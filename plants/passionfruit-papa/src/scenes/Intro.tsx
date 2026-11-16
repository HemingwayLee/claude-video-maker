import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { pop } from "../anim";
import { Backdrop } from "../components/Backdrop";
import { Label } from "../components/Label";
import { Papa } from "../components/Papa";
import { PassionFruit, PassionHalf } from "../components/PassionFruit";
import { Stage, Sticker } from "../components/Sticker";
import { Heart, Sparkle } from "../components/Things";
import { useLines } from "../timeline";

// L0 「大家好！你吃過百香果嗎？」 the man waves hello; a purple passion
//    fruit with a cute face bounces in, the title pops up.
// L1 「切開來，是金黃色的果肉，酸酸甜甜，香氣十足！」 the fruit splits into two
//    halves full of golden jelly and seeds; he opens his arms, hearts rise.
export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  const inP = pop(frame, fps, L[0] + 14, 9);
  const bounce = Math.abs(Math.sin((frame - L[0]) / 9)) * 40 * Math.max(0, 1 - (frame - L[0] - 14) / 60);
  const cut = L[1] + 18; // the moment it splits
  const whole = frame < cut ? inP : 0;
  const halves = pop(frame, fps, cut, 11);
  const blink = frame % 70 < 4;
  const tw = (start: number, period = 40) => (frame < start ? 0 : Math.sin((((frame - start) % period) / period) * Math.PI));

  return (
    <AbsoluteFill>
      <Backdrop mood="warm" to="purple" mix={halves * 0.6} />
      <Stage>
        <Sticker x={1300} y={620 - bounce} scale={2.4 * whole} rotate={Math.sin(frame / 14) * 5}>
          <PassionFruit face="smile" blink={blink} />
        </Sticker>
        {/* the two halves fly apart; the right one tilts to show its face */}
        <Sticker x={1300 - 190 * halves} y={660} scale={1.9 * halves} rotate={-10 * halves + Math.sin(frame / 16) * 2}>
          <PassionHalf />
        </Sticker>
        <Sticker x={1300 + 190 * halves} y={660} scale={1.9 * halves} rotate={10 * halves - Math.sin(frame / 16) * 2}>
          <PassionHalf />
        </Sticker>
        <Sparkle x={1010} y={380} t={tw(L[0] + 30)} size={46} />
        <Sparkle x={1640} y={440} t={tw(L[0] + 46, 46)} size={38} />
        <Sparkle x={1580} y={900} t={tw(L[0] + 60, 52)} size={30} />
        {frame >= cut + 10 &&
          [0, 1, 2].map((i) => {
            const t = ((frame - cut - 10 + i * 22) % 66) / 66;
            return <Heart key={i} x={[1110, 1300, 1490][i]} y={470 - t * 200} size={40 + i * 6} color={i === 1 ? "#ffb52e" : undefined} />;
          })}
      </Stage>
      <Label x={1300} y={170} at={L[0] + 26} size={140} rotate={-3}>
        百香果
      </Label>
      <Papa poses={[[4, "wave"], [L[1], "arms"]]} x={500} y={1060} height={frame < L[1] ? 860 : 780} hops={[L[0], L[1]]} />
    </AbsoluteFill>
  );
};
