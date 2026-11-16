import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { lerp, linear, pop } from "../anim";
import { Backdrop } from "../components/Backdrop";
import { Papa } from "../components/Papa";
import { PassionFruit } from "../components/PassionFruit";
import { Stage, Sticker } from "../components/Sticker";
import { Drop, Heart, Pot, Sparkle, Sun, Trellis, WateringCan } from "../components/Things";
import { useLines } from "../timeline";

// L0 「他們細心照顧，一次又一次地試驗，」 a row of seedlings in pots is
//    watered and grows; one is planted by the trellis and its vine climbs
//    it. The man squats and watches.
// L1 「終於培育出適合在台灣種植的好百香果！」 passion flowers open, then
//    turn into hanging fruit with happy faces; the sun shines; he cheers,
//    holding up a passion fruit.
export const Breed: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  const trellis = pop(frame, fps, 4, 13);
  const grow = lerp(frame, [L[0] + 10, L[1] + 4], [0, 1]);
  const pots = lerp(frame, [L[0] + 10, L[0] + 60], [0, 1]);
  const can = pop(frame, fps, L[0] + 4, 12) * (1 - pop(frame, fps, L[1] - 6, 200));
  const bloom = lerp(frame, [L[0] + 60, L[1] + 4], [0, 1]);
  const fruit = lerp(frame, [L[1] + 14, L[1] + 50], [0, 1]);
  const sun = pop(frame, fps, L[1] + 8, 12);
  const tw = (start: number, period = 40) => (frame < start ? 0 : Math.sin((((frame - start) % period) / period) * Math.PI));
  const canTilt = 20 + Math.sin(frame / 8) * 6;

  return (
    <AbsoluteFill>
      <Backdrop mood="green" to="warm" mix={sun * 0.7} />
      <Stage>
        <Sticker x={1680} y={180} scale={0.8 * sun}>
          <Sun frame={frame} />
        </Sticker>
        <Sticker x={1150} y={930} scale={1.05 * trellis}>
          <Trellis grow={grow} bloom={bloom} fruit={fruit} frame={frame} faces />
        </Sticker>
        {/* the seedlings in a row in front */}
        {[0, 1, 2].map((i) => (
          <Sticker key={i} x={860 + i * 150} y={1030} scale={0.62 * trellis}>
            <Pot grow={Math.min(1, Math.max(0, pots * 1.5 - i * 0.25))} frame={frame + i * 20} />
          </Sticker>
        ))}
        {/* the watering can pours over them */}
        <Sticker x={720 + linear(frame, [L[0] + 4, L[1]], [0, 320])} y={720} scale={0.8 * can} rotate={canTilt}>
          <WateringCan />
        </Sticker>
        {can > 0.5 &&
          Array.from({ length: 6 }, (_, i) => {
            const t = ((frame + i * 6) % 24) / 24;
            const x0 = 720 + linear(frame, [L[0] + 4, L[1]], [0, 320]) + 120;
            return <Drop key={i} x={x0 + (i % 3) * 16 + t * 10} y={690 + t * 200} size={18} opacity={1 - t} />;
          })}
        {fruit > 0.6 && (
          <>
            <Sparkle x={820} y={540} t={tw(L[1] + 40)} size={46} />
            <Sparkle x={1500} y={500} t={tw(L[1] + 54, 46)} size={38} />
            <Sparkle x={1160} y={460} t={tw(L[1] + 66, 52)} size={32} />
            <Heart x={1300} y={420 - ((frame - L[1]) % 60)} size={40} />
          </>
        )}
      </Stage>
      <Papa
        poses={[[6, "squat"], [L[0] + 70, "chin"], [L[1] + 20, "cheer"]]}
        x={330}
        y={1065}
        height={frame < L[1] + 20 ? 560 : 700}
        hops={[L[0], L[1] + 20]}
        prop={
          <g transform="translate(12 -92) rotate(12) scale(0.6)">
            <PassionFruit face="happy" />
          </g>
        }
      />
    </AbsoluteFill>
  );
};
