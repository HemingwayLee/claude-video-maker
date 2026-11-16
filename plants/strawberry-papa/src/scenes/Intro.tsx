import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, pop } from "../anim";
import { Backdrop } from "../components/Backdrop";
import { Papa } from "../components/Papa";
import { Stage, Sticker } from "../components/Sticker";
import { Strawberry } from "../components/Strawberry";
import { Heart, Question, Sparkle } from "../components/Things";
import { useLines } from "../timeline";

// 「大家好！你看，這是一顆紅通通的草莓。」 the man waves; a strawberry with a
// cute face bounces in. 「你知道，草莓的種子在哪裡嗎？」 a big question mark
// pops up, the strawberry goes "wow?" and he scratches his head.
export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  const inP = pop(frame, fps, L[0] + 24, 9);
  const bounce = Math.abs(Math.sin((frame - L[0]) / 9)) * 34 * Math.max(0, 1 - (frame - L[0] - 24) / 60);
  const blink = frame % 70 < 4;
  const q = pop(frame, fps, L[1] + 20, 8);
  const tw = (start: number, period = 40) => {
    const t = ((frame - start) % period) / period;
    return frame < start ? 0 : Math.sin(t * Math.PI);
  };

  return (
    <AbsoluteFill>
      <Backdrop mood="warm" to="pink" mix={fade(frame, L[1], 30)} />
      <Stage>
        <Sticker x={600} y={740 - bounce} scale={2.35 * inP} rotate={Math.sin(frame / 14) * 4}>
          <Strawberry face={frame >= L[1] + 20 ? "wow" : "smile"} blink={blink} />
        </Sticker>
        <Sticker x={900} y={330 + Math.sin(frame / 8) * 10} scale={1.5 * q} rotate={12 + Math.sin(frame / 10) * 8}>
          <Question />
        </Sticker>
        <Sticker x={250} y={420 + Math.sin(frame / 9) * 8} scale={0.9 * pop(frame, fps, L[1] + 32, 8)} rotate={-14}>
          <Question />
        </Sticker>
        <Sparkle x={300} y={700} t={tw(L[0] + 40)} size={46} />
        <Sparkle x={930} y={640} t={tw(L[0] + 55, 46)} size={36} />
        <Sparkle x={960} y={1040} t={tw(L[0] + 70, 52)} size={30} />
        {frame > L[0] + 40 && frame < L[1] && <Heart x={880} y={520 - ((frame - L[0]) % 60)} size={44} />}
      </Stage>
      <Papa poses={[[4, "wave"], [L[1] + 10, "scratch"]]} x={250} y={1880} height={760} hops={[L[0], L[1]]} />
    </AbsoluteFill>
  );
};
