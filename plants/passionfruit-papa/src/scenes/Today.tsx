import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { pop } from "../anim";
import { Backdrop } from "../components/Backdrop";
import { Label } from "../components/Label";
import { Papa } from "../components/Papa";
import { PassionFruit } from "../components/PassionFruit";
import { Stage, Sticker } from "../components/Sticker";
import { Arrow, Boat, FARM_SPOTS, Heart, Sparkle, Station, Taiwan } from "../components/Things";
import { useLines } from "../timeline";

// The recap, as a row of three stickers:
// L0 「所以說，百香果最初是日本人引進台灣，」 the boat pops in.
// L1 「由鳳山農業試驗所培育而成。」 → the station → a passion fruit.
// L2 「現在，在台灣到處都吃得到香甜的百香果喔！」 the row flies away; Taiwan
//    fills up with happy passion fruits; the man cheers with one in his
//    fist and the title comes back.

const MAP = { x: 1300, y: 600, s: 1.45 };

export const Today: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  const away = pop(frame, fps, L[2] - 4, 200); // the recap row leaves
  const rowY = 560 - away * 900;
  const boat = pop(frame, fps, L[0] + 10, 11);
  const arrow1 = pop(frame, fps, L[1] - 6, 12);
  const station = pop(frame, fps, L[1] + 6, 11);
  const arrow2 = pop(frame, fps, L[1] + 34, 12);
  const fruit = pop(frame, fps, L[1] + 44, 9);
  const map = pop(frame, fps, L[2] + 6, 12);
  const blink = frame % 64 < 4;
  const tw = (start: number, period = 40) => (frame < start ? 0 : Math.sin((((frame - start) % period) / period) * Math.PI));

  return (
    <AbsoluteFill>
      <Backdrop mood="purple" to="warm" mix={map} />
      <Stage>
        {away < 0.98 && (
          <>
            <Sticker x={640} y={rowY + 140} scale={0.75 * boat} rotate={Math.sin(frame / 12) * 4}>
              <Boat />
            </Sticker>
            <Sticker x={910} y={rowY} scale={0.8 * arrow1}>
              <Arrow />
            </Sticker>
            <Sticker x={1210} y={rowY + 130} scale={0.72 * station}>
              <Station />
            </Sticker>
            <Sticker x={1500} y={rowY} scale={0.8 * arrow2}>
              <Arrow />
            </Sticker>
            <Sticker x={1700} y={rowY} scale={1.0 * fruit} rotate={Math.sin(frame / 14) * 6}>
              <PassionFruit face="happy" />
            </Sticker>
          </>
        )}
        <Sticker x={MAP.x} y={MAP.y} scale={MAP.s * map} rotate={-3}>
          <Taiwan />
        </Sticker>
        {FARM_SPOTS.map(([x, y], i) => {
          const s = pop(frame, fps, L[2] + 20 + i * 5, 10);
          const bob = Math.sin(frame / 10 + i) * 5;
          return (
            <Sticker key={i} x={MAP.x + x * MAP.s} y={MAP.y + y * MAP.s + bob} scale={0.42 * s} rotate={Math.sin(frame / 15 + i) * 8}>
              <PassionFruit face={i % 2 ? "happy" : "smile"} blink={blink && i % 2 === 0} />
            </Sticker>
          );
        })}
        {map > 0.5 && (
          <>
            <Sparkle x={1020} y={300} t={tw(L[2] + 50)} size={46} />
            <Sparkle x={1620} y={420} t={tw(L[2] + 62, 46)} size={38} />
            <Sparkle x={1560} y={900} t={tw(L[2] + 74, 52)} size={32} />
            {[0, 1].map((i) => (
              <Heart key={i} x={[1040, 1580][i]} y={760 - ((frame - L[2] + i * 30) % 70) * 2.4} size={42} />
            ))}
          </>
        )}
      </Stage>
      <Label x={1300} y={110} at={L[2] + 30} size={110} rotate={-3}>
        百香果
      </Label>
      <Papa
        poses={[[4, "thumbs"], [L[1], "point"], [L[2] + 10, "cheer"]]}
        x={frame < L[2] + 10 ? 280 : 500}
        y={1065}
        height={frame < L[2] + 10 ? 560 : 760}
        hops={[L[0], L[1], L[2] + 10]}
        prop={
          <g transform="translate(12 -96) rotate(12) scale(0.62)">
            <PassionFruit face="happy" />
          </g>
        }
      />
    </AbsoluteFill>
  );
};
