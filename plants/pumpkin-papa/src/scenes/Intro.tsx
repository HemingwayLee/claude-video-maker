import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { pop } from "../anim";
import { Backdrop } from "../components/Backdrop";
import { Papa } from "../components/Papa";
import { Label } from "../components/Label";
import { Pumpkin } from "../components/Pumpkin";
import { Stage, Sticker } from "../components/Sticker";
import { Heart, Sparkle } from "../components/Things";
import { useLines } from "../timeline";

// 「大家好！今天要介紹一種很可愛的南瓜，」 the man waves hello; a little
// dark-green pumpkin bounces in. 「它的名字叫做「小黑」！」 the title pops up
// and she cheers.
export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  const inP = pop(frame, fps, L[0] + 30, 9);
  const bounce = Math.abs(Math.sin((frame - L[0]) / 9)) * 30 * Math.max(0, 1 - (frame - L[0] - 30) / 60);
  const blink = frame % 70 < 4;
  const tw = (start: number, period = 40) => {
    const t = ((frame - start) % period) / period;
    return frame < start ? 0 : Math.sin(t * Math.PI);
  };

  return (
    <AbsoluteFill>
      <Backdrop mood="warm" />
      <Stage>
        <Sticker x={740} y={1180 - bounce} scale={1.9 * inP} rotate={Math.sin(frame / 14) * 4}>
          <Pumpkin variant="hei" face={frame >= L[1] ? "happy" : "smile"} blink={blink} />
        </Sticker>
        <Sparkle x={560} y={940} t={tw(L[0] + 40)} size={46} />
        <Sparkle x={940} y={990} t={tw(L[0] + 55, 46)} size={36} />
        <Sparkle x={900} y={1420} t={tw(L[0] + 70, 52)} size={30} />
        {frame > L[1] + 10 && <Heart x={930} y={880 - ((frame - L[1]) % 60)} size={44} />}
      </Stage>
      <Label x={540} y={420} at={L[1] + 4} size={150} rotate={-4}>
        「小黑」
      </Label>
      <Label x={560} y={600} at={L[1] + 12} size={92} rotate={-2}>
        南瓜
      </Label>
      <Papa poses={[[4, "wave"], [L[1], "cheer"]]} x={300} y={1830} height={880} hops={[L[0], L[1]]} />
    </AbsoluteFill>
  );
};
