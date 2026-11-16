import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { pop } from "../anim";
import { Backdrop } from "../components/Backdrop";
import { Label } from "../components/Label";
import { Papa } from "../components/Papa";
import { Cutting } from "../components/Plant";
import { Stage, Sticker } from "../components/Sticker";
import { Heart, Jar, Sparkle } from "../components/Things";
import { useLines } from "../timeline";

// 「簡單又有效，大家也來試試看吧！」 the rooted, growing cutting in its glass,
// the man with open arms, then thumbs up; the title comes back.
export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();
  const jar = pop(frame, fps, 6, 12);
  const tw = (start: number, period = 40) => (frame < start ? 0 : Math.sin((((frame - start) % period) / period) * Math.PI));

  return (
    <AbsoluteFill>
      <Backdrop mood="warm" />
      <Stage>
        <Sticker x={780} y={1640} scale={1.2 * jar}>
          <Jar fill={1} frame={frame}>
            <g transform="translate(0 -90)">
              <Cutting length={500} roots={1} grow={1} sway={Math.sin(frame / 16) * 10} />
            </g>
          </Jar>
        </Sticker>
        <Heart x={560} y={1100 - (frame % 80)} size={44} />
        <Heart x={990} y={1160 - ((frame + 40) % 80)} size={38} />
        <Sparkle x={590} y={900} t={tw(16)} size={44} />
        <Sparkle x={1000} y={880} t={tw(30, 46)} size={38} />
      </Stage>
      <Label x={540} y={360} at={L[0] + 4} size={150} rotate={-4}>
        地瓜葉
      </Label>
      <Label x={580} y={550} at={L[0] + 14} size={96} rotate={-2} color="#2c7fc0">
        水培法
      </Label>
      <Papa poses={[[4, "arms"], [L[0] + 50, "thumbs"]]} x={290} y={1880} height={720} hops={[L[0], L[0] + 50]} />
    </AbsoluteFill>
  );
};
