import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { lerp, pop } from "../anim";
import { Backdrop } from "../components/Backdrop";
import { Label } from "../components/Label";
import { Papa } from "../components/Papa";
import { Cutting } from "../components/Plant";
import { Stage, Sticker } from "../components/Sticker";
import { Drop, Jar, Sparkle } from "../components/Things";
import { useLines } from "../timeline";

// L0 「最有效的方法，就是把它插在水裡，」 a glass fills with water and the fresh
//    cutting dips into it, splash.
// L1 「這就是「水培法」。」 the name pops up; thumbs up.
export const Water: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  const jar = pop(frame, fps, 4, 12);
  const fill = lerp(frame, [L[0] + 4, L[0] + 34], [0, 1]);
  const dipAt = L[0] + 66;
  const drop = lerp(frame, [L[0] + 34, dipAt], [760, 0]);
  const tw = (start: number, period = 40) => (frame < start ? 0 : Math.sin((((frame - start) % period) / period) * Math.PI));

  return (
    <AbsoluteFill>
      <Backdrop mood="water" />
      <Stage>
        <Sticker x={600} y={1560} scale={1.3 * jar}>
          <Jar fill={fill} frame={frame}>
            {frame >= L[0] + 34 && (
              <g transform={`translate(0 ${-90 - drop})`}>
                <Cutting length={500} sway={Math.sin(frame / 16) * 8} />
              </g>
            )}
          </Jar>
        </Sticker>
        {/* the splash as the stem goes in */}
        {frame >= dipAt - 4 &&
          frame < dipAt + 24 &&
          [-1, -0.5, 0.5, 1].map((d, i) => {
            const t = (frame - dipAt + 4) / 28;
            return (
              <Drop
                key={i}
                x={600 + d * 150 * t}
                y={1270 - Math.sin(t * Math.PI) * 120 + t * 40}
                size={24 + (i % 2) * 8}
                rotate={d * 40}
                opacity={1 - t}
              />
            );
          })}
        {/* water pouring in: drops falling */}
        {frame >= L[0] + 4 &&
          frame < L[0] + 34 &&
          [0, 1, 2].map((i) => {
            const t = ((frame - L[0] - 4 + i * 8) % 24) / 24;
            return <Drop key={`p${i}`} x={590 + i * 14} y={800 + t * 420} size={28} />;
          })}
        {frame > L[1] && (
          <>
            <Sparkle x={380} y={980} t={tw(L[1] + 6, 36)} size={44} />
            <Sparkle x={860} y={900} t={tw(L[1] + 16, 42)} size={38} />
            <Sparkle x={850} y={1300} t={tw(L[1] + 26, 46)} size={30} />
          </>
        )}
      </Stage>
      <Label x={560} y={430} at={L[1] + 2} size={140} rotate={-4} color="#2c7fc0">
        水培法
      </Label>
      <Papa poses={[[6, "point"], [L[1], "thumbs"]]} x={200} y={1870} height={560} hops={[L[0], L[1]]} />
    </AbsoluteFill>
  );
};
