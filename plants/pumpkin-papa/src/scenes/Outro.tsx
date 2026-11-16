import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { pop } from "../anim";
import { Backdrop } from "../components/Backdrop";
import { Papa } from "../components/Papa";
import { Label } from "../components/Label";
import { Pumpkin } from "../components/Pumpkin";
import { Stage, Sticker } from "../components/Sticker";
import { Heart, Leaf, Sparkle } from "../components/Things";
import { COLORS } from "../theme";
import { useLines } from "../timeline";

// 「秋冬到了，一起來種「小黑南瓜」吧！」 autumn leaves fall, the man cheers
// behind a pile of happy 小黑 pumpkins, the title comes back.
export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  const pile = [
    { x: 300, y: 1690, s: 1.35, d: 16, face: "happy" as const, shades: false },
    { x: 780, y: 1700, s: 1.4, d: 24, face: "smile" as const, shades: true },
    { x: 540, y: 1760, s: 1.6, d: 32, face: "happy" as const, shades: false },
  ];
  const twk = (start: number, period = 40) => (frame < start ? 0 : Math.sin((((frame - start) % period) / period) * Math.PI));

  return (
    <AbsoluteFill>
      <Backdrop mood="autumn" />
      <Stage>
        {Array.from({ length: 10 }, (_, i) => {
          const x = ((i * 233) % 980) + 50 + Math.sin(frame / 16 + i) * 50;
          const y = ((frame * (3 + (i % 3)) + i * 211) % 2100) - 120;
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${frame * 3 + i * 40}) scale(${0.32 + (i % 3) * 0.08})`} opacity={0.9}>
              <Leaf color={[COLORS.autumn, COLORS.yellow, "#e8603a"][i % 3]} />
            </g>
          );
        })}
      </Stage>
      <Papa poses={[[6, "cheer"]]} x={540} y={1620} height={880} hops={[L[0] + 30, L[0] + 60]} />
      <Stage>
        {pile.map((p, i) => (
          <Sticker key={i} x={p.x} y={p.y - Math.abs(Math.sin((frame + i * 10) / 8)) * 14} scale={p.s * pop(frame, fps, p.d, 9)}>
            <Pumpkin variant="hei" face={p.face} shades={p.shades} blink={(frame + i * 25) % 75 < 4} />
          </Sticker>
        ))}
        <Heart x={180} y={1300 - (frame % 80)} size={46} />
        <Heart x={900} y={1250 - ((frame + 40) % 80)} size={40} />
        <Sparkle x={170} y={620} t={twk(20)} size={46} />
        <Sparkle x={920} y={700} t={twk(34, 46)} size={40} />
      </Stage>
      <Label x={540} y={360} at={L[0] + 6} size={150} rotate={-4}>
        「小黑」
      </Label>
      <Label x={560} y={540} at={L[0] + 14} size={92} rotate={-2}>
        南瓜
      </Label>
    </AbsoluteFill>
  );
};
