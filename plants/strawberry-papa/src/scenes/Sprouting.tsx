import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { linear, pop } from "../anim";
import { Backdrop } from "../components/Backdrop";
import { Papa } from "../components/Papa";
import { Stage, Sticker } from "../components/Sticker";
import { Strawberry } from "../components/Strawberry";
import { Moon, Plate, Sparkle, Star, Sun } from "../components/Things";
import { useLines } from "../timeline";

const DAYS = 3; // day/night cycles shown while 「放久一點」

// 「如果我們把草莓，放久一點，」 the strawberry sits on a plate; the sun and
// the moon cross the sky three times, the sky goes dark and light, and the
// berry gets a little darker.
// 「就可以看到，草莓表面的小顆粒，冒出芽來喔！」 tiny green sprouts pop out of
// the bumps, one after another; he opens his arms, amazed.
export const Sprouting: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  const d0 = L[0] + 30;
  const d1 = L[1] - 6;
  // start and end with the sun at its resting spot (u = 0.78 ↔ phase 0.39)
  const days = linear(frame, [d0, d1], [0.39, 0.39 + DAYS]);
  const phase = days % 1; // 0–0.5: day (sun crosses), 0.5–1: night (moon crosses)
  const passing = frame >= d0 && frame < d1;
  const night = passing ? Math.max(0, Math.sin(phase * Math.PI * 2 - Math.PI)) : 0;
  const nightMix = Math.min(1, night * 1.6);

  // sun / moon position along an arc across the top of the screen
  const arc = (u: number) => ({ x: 80 + 920 * u, y: 470 - 300 * Math.sin(Math.PI * u) });
  const sunU = passing ? (phase < 0.5 ? phase * 2 : -1) : 0.78; // resting high on the right before and after
  const moonU = passing && phase >= 0.5 ? (phase - 0.5) * 2 : -1;
  const sunAt = sunU >= 0 ? arc(sunU) : null;
  const moonAt = moonU >= 0 ? arc(moonU) : null;

  const age = linear(frame, [d0, d1], [0, 1]);
  const sprouts = linear(frame, [L[1] + 20, L[1] + 110], [0, 1]);
  const inP = pop(frame, fps, L[0], 12);
  const tw = (start: number, period = 40) => {
    const t = ((frame - start) % period) / period;
    return frame < start ? 0 : Math.sin(t * Math.PI);
  };

  return (
    <AbsoluteFill>
      <Backdrop mood="green" to="night" mix={nightMix} />
      <Stage>
        {nightMix > 0.05 &&
          [
            [160, 220],
            [420, 140],
            [700, 260],
            [930, 180],
            [300, 420],
            [860, 430],
          ].map(([x, y], i) => <Star key={i} x={x} y={y} size={46 + (i % 3) * 10} opacity={nightMix * (0.7 + 0.3 * Math.sin(frame / 6 + i))} />)}
        {sunAt && (
          <Sticker x={sunAt.x} y={sunAt.y} scale={0.9} border={false}>
            <Sun frame={frame} />
          </Sticker>
        )}
        {moonAt && (
          <Sticker x={moonAt.x} y={moonAt.y} scale={1.1}>
            <Moon />
          </Sticker>
        )}
        <Sticker x={540} y={1250} scale={1.45 * inP}>
          <Plate />
        </Sticker>
        <Sticker x={540} y={920} scale={2.2 * inP} rotate={Math.sin(frame / 18) * 2}>
          <Strawberry face={sprouts > 0.1 ? "wow" : "smile"} blink={frame % 70 < 4 || nightMix > 0.6} age={age} sprouts={sprouts} />
        </Sticker>
        <Sparkle x={230} y={760} t={tw(L[1] + 60)} size={44} />
        <Sparkle x={860} y={720} t={tw(L[1] + 74, 46)} size={38} />
        <Sparkle x={880} y={1080} t={tw(L[1] + 88, 50)} size={32} />
      </Stage>
      {/* a soft dark veil so the night reads even over the bright stickers */}
      <AbsoluteFill style={{ background: "#1a2050", opacity: nightMix * 0.18, pointerEvents: "none" }} />
      <Papa
        poses={[[4, "squat"], [L[0] + 30, "chin"], [L[1] + 30, "arms"]]}
        x={180}
        y={1890}
        height={600}
        hops={[L[0], L[1] + 30]}
      />
    </AbsoluteFill>
  );
};
