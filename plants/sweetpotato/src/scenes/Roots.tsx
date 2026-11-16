import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { lerp, pop } from "../anim";
import { Backdrop } from "../components/Backdrop";
import { Papa } from "../components/Papa";
import { Cutting } from "../components/Plant";
import { Stage, Sticker } from "../components/Sticker";
import { Jar, Moon, Sparkle, Sun } from "../components/Things";
import { useLines } from "../timeline";

// L0 「過了幾天，它甚至會開始發根，」 sun, moon, sun, moon… cross the sky (days
//    pass) while white roots grow out of the stem in the water.
// L1 「還會長出新的葉子，繼續生長！」 the tip grows on and unfolds new leaves.

const CYCLE = 36; // frames per half day

export const Roots: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  const jar = pop(frame, fps, 0, 14);
  const daysEnd = L[1] - 6;
  const roots = lerp(frame, [L[0] + 10, L[0] + 100], [0, 1]);
  const grow = lerp(frame, [L[1] + 4, L[1] + 64], [0, 1]);

  // the sky: alternate sun and moon along an arc while the days pass
  const t = Math.max(0, frame - L[0]);
  const half = Math.floor(t / CYCLE);
  const k = (t % CYCLE) / CYCLE;
  const isNight = frame < daysEnd && half % 2 === 1;
  const sx = 120 + k * 840;
  const sy = 420 - Math.sin(k * Math.PI) * 220;
  const nightMix = frame < daysEnd ? (isNight ? Math.sin(k * Math.PI) * 0.8 : 0) : 0;
  const tw = (start: number, period = 40) => (frame < start ? 0 : Math.sin((((frame - start) % period) / period) * Math.PI));

  return (
    <AbsoluteFill>
      <Backdrop mood="water" to="night" mix={nightMix} />
      <Stage>
        {frame < daysEnd ? (
          <Sticker x={sx} y={sy} scale={0.9}>
            {isNight ? <Moon /> : <Sun frame={frame} />}
          </Sticker>
        ) : (
          <Sticker x={880} y={300} scale={0.9 * pop(frame, fps, daysEnd, 12)}>
            <Sun frame={frame} />
          </Sticker>
        )}
        <Sticker x={600} y={1600} scale={1.45 * jar}>
          <Jar fill={1} frame={frame}>
            <g transform="translate(0 -90)">
              <Cutting length={500} roots={roots} grow={grow} sway={Math.sin(frame / 16) * 8} />
            </g>
          </Jar>
        </Sticker>
        {grow > 0.5 && (
          <>
            <Sparkle x={400} y={640} t={tw(L[1] + 30, 36)} size={46} />
            <Sparkle x={830} y={560} t={tw(L[1] + 40, 42)} size={40} />
          </>
        )}
        {roots > 0.6 && frame < L[1] && <Sparkle x={820} y={1480} t={tw(L[0] + 70, 40)} size={36} color="#ffffff" />}
      </Stage>
      <Papa poses={[[6, "scratch"], [L[1] + 30, "cheer"]]} x={170} y={1890} height={frame < L[1] + 30 ? 520 : 480} hops={[L[0], L[1] + 30]} />
    </AbsoluteFill>
  );
};
