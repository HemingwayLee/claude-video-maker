import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { lerp, pop } from "../anim";
import { Backdrop } from "../components/Backdrop";
import { Papa } from "../components/Papa";
import { Label } from "../components/Label";
import { Pumpkin } from "../components/Pumpkin";
import { Stage, Sticker } from "../components/Sticker";
import { HeatWaves, Island, Snowflake, Sparkle, Sun, Sweat, Thermometer } from "../components/Things";
import { useLines } from "../timeline";

// L0 「栗子南瓜，是在北海道培育的品種，」 Hokkaido, snow falling, a chestnut pumpkin on it.
// L1 「所以比較適合冷涼的氣候。」 the thermometer is low and the pumpkin is happy.
// L2 「在炎熱的台灣，就不太容易種植成功。」 swap to Taiwan under a blazing sun:
//    the thermometer shoots up, the pumpkin sweats, the man sulks.
export const Climate: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  const swap = lerp(frame, [L[2] - 4, L[2] + 20], [0, 1]); // Hokkaido → Taiwan
  const hok = pop(frame, fps, 6, 12);
  const tw = pop(frame, fps, L[2] + 6, 12);
  const thermo = pop(frame, fps, L[1] + 4, 11);
  const level = frame < L[2] ? 0.12 : lerp(frame, [L[2] + 14, L[2] + 50], [0.12, 0.96]);
  const sun = pop(frame, fps, L[2] + 10, 12);
  const hot = frame >= L[2] + 20;
  const pump = pop(frame, fps, 22, 10);
  const twk = (start: number, period = 40) => (frame < start ? 0 : Math.sin((((frame - start) % period) / period) * Math.PI));

  return (
    <AbsoluteFill>
      <Backdrop mood="cold" to="hot" mix={swap} />
      <Stage>
        {/* snow (Hokkaido only) */}
        {swap < 1 &&
          Array.from({ length: 16 }, (_, i) => {
            const x = ((i * 271) % 1000) + 40 + Math.sin(frame / 20 + i) * 30;
            const y = (((frame * (2.2 + (i % 3) * 0.6) + i * 157) % 2000) - 60);
            return (
              <g key={i} transform={`translate(${x} ${y}) rotate(${frame * 2 + i * 20}) scale(${0.5 + (i % 4) * 0.2})`} opacity={(1 - swap) * 0.9}>
                <Snowflake color="#ffffff" />
              </g>
            );
          })}
        <Sticker x={560 - swap * 900} y={820} scale={1.45 * hok} rotate={-4}>
          <Island which="hokkaido" />
        </Sticker>
        <Sticker x={560 + (1 - swap) * 900} y={860} scale={1.3 * tw} rotate={-6}>
          <Island which="taiwan" tint="#ff9a5c" tintMix={0.35 * swap} />
        </Sticker>
        <Sticker x={880} y={300} scale={sun}>
          <Sun frame={frame} heat={swap} />
        </Sticker>
        <HeatWaves x={540} y={1240} frame={frame} opacity={hot ? lerp(frame, [L[2] + 20, L[2] + 40], [0, 1]) : 0} />

        {/* the chestnut pumpkin rides along on top */}
        <Sticker x={frame < L[2] ? 560 - swap * 900 : 540} y={frame < L[2] ? 860 : 900} scale={0.95 * pump * (frame < L[2] ? 1 : tw)} rotate={Math.sin(frame / (hot ? 5 : 14)) * (hot ? 3 : 5)}>
          <Pumpkin variant="bei" face={hot ? "hot" : frame >= L[1] ? "happy" : "smile"} />
        </Sticker>
        {frame >= L[1] + 10 && frame < L[2] && (
          <>
            <Sparkle x={420} y={720} t={twk(L[1] + 10)} size={40} color="#bfe6ff" />
            <Sparkle x={700} y={760} t={twk(L[1] + 24, 46)} size={34} color="#bfe6ff" />
          </>
        )}
        {hot &&
          [0, 1, 2].map((i) => {
            const t = ((frame - L[2] - 20 + i * 14) % 40) / 40;
            return <Sweat key={i} x={[430, 650, 470][i]} y={[830, 840, 880][i] + t * 60} size={26} opacity={1 - t} />;
          })}
        <Sticker x={920} y={1240} scale={0.9 * thermo}>
          <Thermometer level={level} />
        </Sticker>
      </Stage>
      <Label x={560} y={470} at={14} size={84} until={L[2] - 6}>
        北海道
      </Label>
      <Label x={520} y={430} at={L[2] + 14} size={84}>
        台灣
      </Label>
      <Papa poses={[[10, "arms"], [L[2] + 16, "scratch"]]} x={frame < L[2] + 16 ? 300 : 290} y={1850} height={frame < L[2] + 16 ? 640 : 470} hops={[L[0], L[1]]} />
    </AbsoluteFill>
  );
};
