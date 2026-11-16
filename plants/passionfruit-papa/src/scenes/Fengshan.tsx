import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { lerp, pop } from "../anim";
import { Backdrop } from "../components/Backdrop";
import { Label } from "../components/Label";
import { Papa } from "../components/Papa";
import { PassionFruit } from "../components/PassionFruit";
import { Stage, Sticker } from "../components/Sticker";
import { FENGSHAN, Pin, Sparkle, Station, Taiwan } from "../components/Things";
import { INK } from "../theme";
import { useLines } from "../timeline";

// L0 「後來，百香果來到了高雄的鳳山農業試驗所，」 Taiwan; a pin drops on
//    Fengshan (Kaohsiung), a dotted line runs out to the research station,
//    which pops up. The man walks in.
// L1 「由這裡的研究人員，繼續培育改良。」 a passion fruit rolls along the
//    line into the station; he opens his arms to present it.

const MAP = { x: 520, y: 540, s: 1.65 };
const PIN: [number, number] = [MAP.x + FENGSHAN[0] * MAP.s, MAP.y + FENGSHAN[1] * MAP.s];
const STATION: [number, number] = [1130, 700];

export const Fengshan: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  const map = pop(frame, fps, 4, 12);
  const pinT = pop(frame, fps, L[0] + 30, 9);
  const pulse = frame > L[0] + 40 ? ((frame - L[0] - 40) % 40) / 40 : -1;
  const line = lerp(frame, [L[0] + 50, L[0] + 80], [0, 1]);
  const station = pop(frame, fps, L[0] + 72, 11);
  // the dotted line (and later the fruit) goes from the pin to the station
  const roll = lerp(frame, [L[1] + 6, L[1] + 40], [0, 1]);
  const cx = (PIN[0] + STATION[0] - 60) / 2;
  const cy = Math.min(PIN[1], STATION[1]) - 260; // control point: the dotted line arcs up
  const arc = (t: number): [number, number] => [
    (1 - t) ** 2 * PIN[0] + 2 * (1 - t) * t * cx + t * t * (STATION[0] - 60),
    (1 - t) ** 2 * (PIN[1] - 70) + 2 * (1 - t) * t * cy + t * t * (STATION[1] - 120),
  ];
  const [fx, fy] = arc(roll);
  const tw = (start: number, period = 40) => (frame < start ? 0 : Math.sin((((frame - start) % period) / period) * Math.PI));

  return (
    <AbsoluteFill>
      <Backdrop mood="green" />
      <Stage>
        <Sticker x={MAP.x} y={MAP.y} scale={MAP.s * map} rotate={-3}>
          <Taiwan />
        </Sticker>
        {pulse >= 0 && <ellipse cx={PIN[0]} cy={PIN[1]} rx={20 + pulse * 70} ry={(20 + pulse * 70) * 0.5} fill="none" stroke="#ff4f5e" strokeWidth={6} opacity={1 - pulse} />}
        {/* dotted line from the pin to the station */}
        {Array.from({ length: 22 }, (_, i) => {
          const t = i / 21;
          if (t > line) return null;
          const [x, y] = arc(t);
          return <circle key={i} cx={x} cy={y} r={8} fill="#fff" stroke={INK} strokeWidth={2} />;
        })}
        <Sticker x={STATION[0]} y={STATION[1]} scale={1.25 * station}>
          <Station />
        </Sticker>
        <Sticker x={PIN[0]} y={PIN[1] - (1 - pinT) * 300} scale={pinT}>
          <Pin />
        </Sticker>
        {frame >= L[1] + 6 && roll < 1 && (
          <Sticker x={fx} y={fy} scale={0.45} rotate={roll * 540}>
            <PassionFruit face="happy" />
          </Sticker>
        )}
        <Sparkle x={STATION[0] - 260} y={STATION[1] - 330} t={tw(L[1] + 40)} size={44} />
        <Sparkle x={STATION[0] + 250} y={STATION[1] - 240} t={tw(L[1] + 52, 46)} size={34} />
      </Stage>
      <Label x={PIN[0] - 150} y={PIN[1] + 20} at={L[0] + 40} size={76} rotate={-4}>
        鳳山
      </Label>
      <Papa poses={[[L[0] + 10, "walk"], [L[1], "arms"]]} from="right" x={1660} y={1065} height={frame < L[1] ? 620 : 600} hops={[L[1]]} />
    </AbsoluteFill>
  );
};
