import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { lerp, pop } from "../anim";
import { Backdrop } from "../components/Backdrop";
import { Label } from "../components/Label";
import { Papa } from "../components/Papa";
import { PassionFruit } from "../components/PassionFruit";
import { Stage, Sticker } from "../components/Sticker";
import { Boat, Pot, Sparkle, Taiwan, WaveMark } from "../components/Things";
import { useLines } from "../timeline";

// L0 「你知道嗎？百香果最初，是日本人引進台灣的。」 on the sea: a little boat
//    with a Japanese flag on its sail, loaded with passion fruit, sails
//    toward Taiwan. The man points at you.
// L1 「在日治時期，日本人把百香果帶到台灣來種植。」 the boat arrives; three
//    fruits hop onto the island and turn into seedlings. Thumbs up.

// Where the fruits land on the island (screen pixels).
const LANDINGS: [number, number][] = [
  [1470, 400],
  [1430, 600],
  [1500, 760],
];

export const Arrival: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  const island = pop(frame, fps, 6, 12);
  const sail = lerp(frame, [L[0] + 6, L[1] + 10], [0, 1]); // across the sea
  const boatX = -260 + sail * 1460;
  const boatY = 470 + Math.sin(sail * Math.PI) * -60 + Math.sin(frame / 10) * 8;
  const rock = Math.sin(frame / 12) * 4;
  const hop0 = L[1] + 18; // first fruit leaves the boat

  return (
    <AbsoluteFill>
      <Backdrop mood="sea" />
      <Stage>
        {/* waves drifting on the sea */}
        {Array.from({ length: 12 }, (_, i) => {
          const x = ((i * 337 + frame * (0.6 + (i % 3) * 0.2)) % 2100) - 90;
          const y = 120 + ((i * 211) % 900);
          return (
            <g key={i} transform={`translate(${x} ${y + Math.sin(frame / 15 + i) * 6}) scale(${0.7 + (i % 3) * 0.25})`}>
              <WaveMark opacity={0.7} />
            </g>
          );
        })}
        <Sticker x={1500} y={560} scale={1.75 * island} rotate={-4}>
          <Taiwan />
        </Sticker>
        {/* the boat's wake */}
        {sail > 0.02 &&
          Array.from({ length: 10 }, (_, i) => {
            const t = sail - i * 0.03;
            if (t < 0) return null;
            const x = -260 + t * 1460 - 150;
            const y = 470 + Math.sin(t * Math.PI) * -60 + 10;
            return <circle key={i} cx={x} cy={y} r={9 - i * 0.6} fill="#fff" opacity={0.8 - i * 0.07} />;
          })}
        <Sticker x={boatX} y={boatY} scale={0.95} rotate={rock}>
          <Boat cargo={frame < hop0 ? 3 : 3 - Math.min(3, Math.floor((frame - hop0) / 10) + 1)} />
        </Sticker>
        {/* the fruits hop from the boat onto Taiwan, then sprout */}
        {LANDINGS.map(([x, y], i) => {
          const start = hop0 + i * 10;
          if (frame < start) return null;
          const t = lerp(frame, [start, start + 20], [0, 1]);
          const fx = boatX - 40 + (x - boatX + 40) * t;
          const fy = boatY - 80 + (y - boatY + 80) * t - Math.sin(t * Math.PI) * 220;
          const sprout = pop(frame, fps, start + 26, 12);
          return (
            <g key={i}>
              {sprout < 0.05 ? (
                <Sticker x={fx} y={fy} scale={0.4} rotate={t * 360}>
                  <PassionFruit />
                </Sticker>
              ) : (
                <Sticker x={x} y={y + 20} scale={0.6 * sprout}>
                  <Pot grow={sprout} frame={frame} />
                </Sticker>
              )}
              <Sparkle x={x + 50} y={y - 70} t={frame >= start + 22 && frame < start + 40 ? Math.sin(((frame - start - 22) / 18) * Math.PI) : 0} size={40} />
            </g>
          );
        })}
      </Stage>
      <Label x={1700} y={170} at={14} size={78} rotate={4}>
        台灣
      </Label>
      <Papa poses={[[8, "point"], [L[1], "thumbs"]]} x={300} y={1065} height={600} hops={[L[0], L[1]]} />
    </AbsoluteFill>
  );
};
