import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { pop } from "../anim";
import { Backdrop } from "../components/Backdrop";
import { Label } from "../components/Label";
import { Papa } from "../components/Papa";
import { Stage, Sticker } from "../components/Sticker";
import { Sprout, Strawberry } from "../components/Strawberry";
import { AcheneBig, Arrow, Heart, Seed, Sparkle } from "../components/Things";
import { COLORS, INK } from "../theme";
import { useLines } from "../timeline";

// 「所以，草莓的種子，就藏在每一粒瘦果的裡面！」 a recap in pictures, in a
// Z shape: strawberry → achene (瘦果) ↓ seed (種子) → sprout.
// 「下次吃草莓的時候，記得仔細看一看喔！」 he cheers holding up a strawberry,
// hearts float up.
export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  const step = (i: number) => pop(frame, fps, L[0] + 8 + i * 14, 11);
  const bob = (i: number) => Math.sin(frame / 12 + i) * 6;
  const tw = (start: number, period = 40) => {
    const t = ((frame - start) % period) / period;
    return frame < start ? 0 : Math.sin(t * Math.PI);
  };

  // the strawberry he holds up: its tip in his fist
  const held = (
    <g transform="translate(4 -116) scale(0.8) rotate(-8)">
      <Strawberry face="happy" />
    </g>
  );

  return (
    <AbsoluteFill>
      <Backdrop mood="warm" to="pink" mix={0.4} />
      <Stage>
        {/* row 1: strawberry → achene */}
        <Sticker x={270} y={390 + bob(0)} scale={1.05 * step(0)}>
          <Strawberry face="smile" blink={frame % 70 < 4} />
        </Sticker>
        <Sticker x={540} y={400} scale={0.7 * step(1)}>
          <Arrow />
        </Sticker>
        <Sticker x={810} y={390 + bob(1)} scale={0.95 * step(2)} rotate={8}>
          <AcheneBig open={0.18} seedGlow={0} />
        </Sticker>
        {/* down */}
        <Sticker x={810} y={680} scale={0.7 * step(3)} rotate={90}>
          <Arrow />
        </Sticker>
        {/* row 2: seed ← sprout, read right to left */}
        <Sticker x={810} y={950 + bob(2)} scale={1.3 * step(4)} rotate={-6}>
          <circle r={95} fill="#fff6a0" opacity={0.5} />
          <Seed />
        </Sticker>
        <Sticker x={540} y={960} scale={0.7 * step(5)} rotate={180}>
          <Arrow />
        </Sticker>
        <Sticker x={270} y={990 + bob(3)} scale={1.25 * step(6)}>
          <ellipse cx={0} cy={36} rx={110} ry={38} fill={COLORS.soil} stroke={INK} strokeWidth={3.5} />
          <Sprout x={0} y={34} grow={Math.min(1, Math.max(0.05, (frame - L[0] - 90) / 30))} size={4} />
        </Sticker>
        <Sparkle x={930} y={850} t={tw(L[0] + 70, 36)} size={40} />
        <Sparkle x={690} y={1060} t={tw(L[0] + 84, 44)} size={32} />
        {frame > L[1] &&
          [0, 1, 2].map((i) => {
            const t = (frame - L[1] - i * 18) % 70;
            return t >= 0 ? <Heart key={i} x={[640, 880, 760][i]} y={1500 - t * 4} size={40 + i * 6} /> : null;
          })}
      </Stage>
      <Label x={810} y={590} at={L[0] + 40} size={64} color={COLORS.acheneDark}>
        瘦果
      </Label>
      <Label x={810} y={1140} at={L[0] + 70} size={64}>
        種子
      </Label>
      <Papa
        poses={[[4, "point"], [L[1], "cheer"]]}
        x={420}
        y={1890}
        height={680}
        hops={[L[0], L[1], L[1] + 40]}
        prop={held}
      />
    </AbsoluteFill>
  );
};
