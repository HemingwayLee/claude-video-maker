import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, lerp, pop } from "../anim";
import { Backdrop } from "../components/Backdrop";
import { Label } from "../components/Label";
import { Papa } from "../components/Papa";
import { Stage, Sticker } from "../components/Sticker";
import { ACHENES, Strawberry } from "../components/Strawberry";
import { AcheneBig, Sparkle } from "../components/Things";
import { useLines } from "../timeline";
import { POINTED } from "./Achene";

// 「我們拿一粒瘦果，放大來看看。」 one bump pops off the strawberry, flies to
// the middle and grows huge; the strawberry moves to a corner.
// 「原來，每一粒瘦果的裡面，」 the achene's shell splits in two…
// 「才包裹著真正的「種子」！」 …and the real seed inside shines: 種子.
export const SeedInside: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  // the strawberry: center → top-left corner
  const move = lerp(frame, [L[0] + 10, L[0] + 50], [0, 1]);
  const bx = 540 + (190 - 540) * move;
  const by = 760 + (330 - 760) * move;
  const bs = 2.2 + (0.95 - 2.2) * move;

  // the plucked achene: from its place on the berry to the middle, growing
  const pluck = L[0] + 18;
  const fly = spring({ frame: frame - pluck, fps, config: { damping: 15 }, durationInFrames: 45 });
  const [ax, ay] = ACHENES[POINTED];
  const startX = 540 + ax * 2.2;
  const startY = 760 + ay * 2.2;
  const cx = startX + (560 - startX) * fly;
  const cy = startY + (860 - startY) * fly - Math.sin(fly * Math.PI) * 160;
  const cs = 0.06 + (2.3 - 0.06) * fly;

  const open = spring({ frame: frame - (L[1] + 14), fps, config: { damping: 12 }, durationInFrames: 30 });
  const seedGlow = fade(frame, L[2] + 6, 16);
  const tw = (start: number, period = 40) => {
    const t = ((frame - start) % period) / period;
    return frame < start ? 0 : Math.sin(t * Math.PI);
  };

  return (
    <AbsoluteFill>
      <Backdrop mood="pink" to="gold" mix={fade(frame, L[1] + 10, 30)} />
      <Stage>
        <Sticker x={bx} y={by} scale={bs} rotate={-8 * move}>
          <Strawberry face={frame >= pluck ? "wow" : "smile"} blink={frame % 70 < 4} hide={frame >= pluck ? POINTED : -1} />
        </Sticker>
        {frame >= pluck && (
          <Sticker x={cx} y={cy} scale={cs} rotate={(1 - fly) * 160 + Math.sin(frame / 16) * 2 * fly}>
            <AcheneBig open={open} seedGlow={seedGlow} frame={frame} />
          </Sticker>
        )}
        {/* little "zoom" lines while it flies */}
        {fly > 0.05 && fly < 0.95 &&
          [0, 1, 2].map((i) => (
            <line
              key={i}
              x1={cx - 160 - i * 40}
              y1={cy - 40 + i * 40}
              x2={cx - 240 - i * 40}
              y2={cy - 60 + i * 40}
              stroke="#fff"
              strokeWidth={10}
              strokeLinecap="round"
              opacity={Math.sin(fly * Math.PI)}
            />
          ))}
        <Sparkle x={560} y={540} t={tw(L[2] + 6, 30)} size={54} />
        <Sparkle x={330} y={760} t={tw(L[2] + 14, 36)} size={40} />
        <Sparkle x={790} y={1000} t={tw(L[2] + 22, 34)} size={44} />
        <Sparkle x={800} y={690} t={tw(L[2] + 30, 42)} size={30} />
      </Stage>
      {/* the shell (瘦果) and what's inside (種子) */}
      <Label x={880} y={1260} at={L[1] + 30} size={90} rotate={5} color="#b07a1a">
        瘦果
      </Label>
      <Label x={560} y={430} at={L[2] + 10} size={130} rotate={-3}>
        種子
      </Label>
      <Papa
        poses={[[4, "squat"], [L[1], "chin"], [L[2] + 6, "arms"]]}
        x={220}
        y={1890}
        height={620}
        hops={[L[0], L[2] + 6]}
      />
      <Pulse at={L[2] + 6} />
    </AbsoluteFill>
  );
};

// A soft white flash when the seed is revealed.
const Pulse: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = pop(frame, fps, at, 30);
  if (frame < at || p > 0.99) return null;
  return <AbsoluteFill style={{ background: "#fffbe0", opacity: 0.35 * (1 - p) }} />;
};
