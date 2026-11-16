import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { lerp, pop } from "../anim";
import { Backdrop } from "../components/Backdrop";
import { Papa } from "../components/Papa";
import { Cutting } from "../components/Plant";
import { Stage, Sticker } from "../components/Sticker";
import { Badge, Jar, Sparkle } from "../components/Things";
import { useLines } from "../timeline";

// The same cutting in two glasses: without water (left) and with water (right).
// L0 「這不僅能讓地瓜葉保持新鮮，」 the one in water sparkles, fresh.
// L1 「還能防止它枯萎。」 the dry one wilts (✗), the one in water stays fresh (✓).
export const Fresh: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  const right = pop(frame, fps, 4, 12);
  const left = pop(frame, fps, L[0] + 30, 12);
  const wilt = lerp(frame, [L[1] + 4, L[1] + 50], [0, 1]);
  const badges = pop(frame, fps, L[1] + 46, 10);
  const tw = (start: number, period = 40) => (frame < start ? 0 : Math.sin((((frame - start) % period) / period) * Math.PI));

  return (
    <AbsoluteFill>
      <Backdrop mood="green" />
      <Stage>
        <Sticker x={290} y={1300} scale={1.1 * left}>
          <Jar fill={0} frame={frame}>
            <g transform="translate(0 -90)">
              <Cutting length={500} wilt={wilt} />
            </g>
          </Jar>
        </Sticker>
        <Sticker x={790} y={1300} scale={1.1 * right}>
          <Jar fill={1} frame={frame}>
            <g transform="translate(0 -90)">
              <Cutting length={500} sway={Math.sin(frame / 16) * 8} />
            </g>
          </Jar>
        </Sticker>
        {frame > 20 && (
          <>
            <Sparkle x={640} y={760} t={tw(20, 34)} size={46} />
            <Sparkle x={960} y={700} t={tw(32, 40)} size={40} />
            <Sparkle x={930} y={1000} t={tw(44, 46)} size={32} />
          </>
        )}
        <Sticker x={290} y={1400} scale={badges}>
          <Badge good={false} />
        </Sticker>
        <Sticker x={790} y={1400} scale={badges}>
          <Badge good />
        </Sticker>
      </Stage>
      <Papa poses={[[8, "thumbs"], [L[1] + 50, "arms"]]} x={540} y={1900} height={440} hops={[L[0], L[1] + 50]} />
    </AbsoluteFill>
  );
};
