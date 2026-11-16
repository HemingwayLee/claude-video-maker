import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { lerp, pop } from "../anim";
import { Backdrop } from "../components/Backdrop";
import { Papa } from "../components/Papa";
import { Pumpkin } from "../components/Pumpkin";
import { Stage, Sticker } from "../components/Sticker";
import { Chestnut, Plant, Sparkle, Sun } from "../components/Things";
import { useLines } from "../timeline";

// L0 「但是「小黑南瓜」，有針對台灣炎熱的氣候做改良，」 under the hot sun, 小黑
//    puts on sunglasses: ready for the heat.
// L1 「所以種植成功的機率，會比較高一些！」 two rows of four plants in the sun:
//    other chestnut pumpkins (top) give 1 pumpkin, 小黑 (bottom) gives 3.

const ROW_X = [320, 520, 720, 920];
const ROW_A = { y: 960, wins: [false, false, true, false] }; // ordinary chestnut pumpkin
const ROW_B = { y: 1370, wins: [true, true, false, true] }; // 小黑

export const Improved: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  const big = pop(frame, fps, 4, 10);
  const shades = lerp(frame, [L[0] + 40, L[0] + 52], [0, 1]);
  // 小黑 shrinks into the icon of the second row
  const fly = lerp(frame, [L[1] - 4, L[1] + 18], [0, 1]);
  const hx = 540 + (110 - 540) * fly;
  const hy = 980 + (ROW_B.y - 60 - 980) * fly;
  const hs = 2.6 + (0.62 - 2.6) * fly;
  const iconA = pop(frame, fps, L[1] + 6, 11);
  const resultAt = L[1] + 50;
  const twk = (start: number, period = 40) => (frame < start ? 0 : Math.sin((((frame - start) % period) / period) * Math.PI));

  const row = (r: typeof ROW_A, variant: "hei" | "bei", delay: number) =>
    ROW_X.map((x, i) => {
      const g = lerp(frame, [L[1] + delay + i * 5, L[1] + delay + i * 5 + 24], [0, 1]);
      if (g <= 0) return null;
      const win = r.wins[i];
      const wilt = win ? 0 : lerp(frame, [resultAt, resultAt + 20], [0, 0.6]);
      const fruit = win ? pop(frame, fps, resultAt + i * 4, 9) : 0;
      return (
        <Sticker key={`${r.y}-${i}`} x={x} y={r.y} scale={0.78} border={false}>
          <Plant
            grow={g}
            wilt={wilt}
            frame={frame}
            fruit={
              fruit > 0 ? (
                <g transform={`translate(40 -18) scale(${0.8 * fruit})`}>
                  <Pumpkin variant={variant} face="happy" />
                </g>
              ) : null
            }
          />
        </Sticker>
      );
    });

  return (
    <AbsoluteFill>
      <Backdrop mood="hot" to="green" mix={lerp(frame, [L[0] + 40, L[0] + 70], [0, 0.6])} />
      <Stage>
        <Sticker x={860} y={300} scale={pop(frame, fps, 0, 14) * 0.9}>
          <Sun frame={frame} heat={1 - fly * 0.6} />
        </Sticker>

        {/* the two rows */}
        {fly > 0 && (
          <g opacity={fly}>
            <rect x={200} y={ROW_A.y - 10} width={810} height={34} rx={17} fill="#9b6b43" opacity={0.35} />
            <rect x={200} y={ROW_B.y - 10} width={810} height={34} rx={17} fill="#9b6b43" opacity={0.35} />
          </g>
        )}
        {row(ROW_A, "bei", 10)}
        {row(ROW_B, "hei", 18)}
        <Sticker x={110} y={ROW_A.y - 60} scale={0.85 * iconA} rotate={-8}>
          <Chestnut />
        </Sticker>

        <Sticker x={hx} y={hy} scale={hs * big} rotate={Math.sin(frame / 14) * 4}>
          <Pumpkin variant="hei" face={shades > 0.5 ? "none" : "hot"} shades={shades > 0.5} />
        </Sticker>
        {/* the sunglasses slide down onto 小黑 */}
        {shades > 0 && shades < 1 && (
          <g transform={`translate(540 ${980 - (1 - shades) * 300}) scale(2.6)`} opacity={shades}>
            <path d="M-54,-10 L54,-10 L50,8 Q30,22 6,8 L-6,8 Q-30,22 -50,8 Z" fill="#14141c" stroke="#fff" strokeWidth={3} />
          </g>
        )}
        {frame > L[0] + 52 && frame < L[1] + 4 && (
          <>
            <Sparkle x={250} y={820} t={twk(L[0] + 52, 34)} size={50} />
            <Sparkle x={850} y={860} t={twk(L[0] + 62, 40)} size={42} />
            <Sparkle x={780} y={1180} t={twk(L[0] + 70, 44)} size={34} />
          </>
        )}
        {/* score: a check under the rows' winners */}
        {frame > resultAt + 20 &&
          [ROW_A, ROW_B].map((r) =>
            r.wins.map((w, i) =>
              w ? (
                <g key={`${r.y}c${i}`} transform={`translate(${ROW_X[i] + 70} ${r.y - 150}) scale(${pop(frame, fps, resultAt + 20 + i * 3, 10)})`}>
                  <circle r={24} fill="#4cc56a" stroke="#fff" strokeWidth={5} />
                  <path d="M-11,1 L-3,9 L12,-8" fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
                </g>
              ) : null,
            ),
          )}
      </Stage>
      <Papa poses={[[8, "fist"], [L[1] + 66, "cheer"]]} x={frame < L[1] + 66 ? 260 : 540} y={frame < L[1] + 66 ? 1990 : 1930} height={frame < L[1] + 66 ? 560 : 520} hops={[L[0] + 52, L[1] + 66]} />
    </AbsoluteFill>
  );
};
