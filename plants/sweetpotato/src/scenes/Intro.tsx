import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { pop } from "../anim";
import { Backdrop } from "../components/Backdrop";
import { Label } from "../components/Label";
import { Papa } from "../components/Papa";
import { Cutting } from "../components/Plant";
import { Stage, Sticker } from "../components/Sticker";
import { Drop, Sparkle } from "../components/Things";
import { useLines } from "../timeline";

// 「大家好！今天教大家一個保存地瓜葉的小妙招。」 the man waves; a fresh sweet
// potato leaf cutting pops up next to him; title 地瓜葉 水培法; thumbs up.
export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();
  const leaf = pop(frame, fps, L[0] + 18, 10);
  const tw = (start: number, period = 40) => (frame < start ? 0 : Math.sin((((frame - start) % period) / period) * Math.PI));

  return (
    <AbsoluteFill>
      <Backdrop mood="green" />
      <Stage>
        <Sticker x={770} y={1500} scale={1.35 * leaf} rotate={6}>
          <Cutting sway={Math.sin(frame / 16) * 12} />
        </Sticker>
        <Sparkle x={560} y={1050} t={tw(L[0] + 30)} size={44} />
        <Sparkle x={980} y={1120} t={tw(L[0] + 44, 46)} size={36} />
        {frame > L[0] + 40 &&
          [0, 1, 2].map((i) => {
            const t = ((frame - L[0] - 40 + i * 20) % 60) / 60;
            return <Drop key={i} x={[880, 940, 640][i]} y={[1330, 1240, 1300][i] + t * 40} size={26} opacity={Math.sin(t * Math.PI)} />;
          })}
      </Stage>
      <Label x={540} y={400} at={L[0] + 6} size={150} rotate={-4}>
        地瓜葉
      </Label>
      <Label x={580} y={590} at={L[0] + 26} size={96} rotate={-2} color="#2c7fc0">
        水培法
      </Label>
      <Papa poses={[[4, "wave"], [L[0] + 70, "thumbs"]]} x={300} y={1850} height={820} hops={[L[0], L[0] + 70]} />
    </AbsoluteFill>
  );
};
