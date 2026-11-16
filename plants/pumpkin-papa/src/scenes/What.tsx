import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fadeOut, lerp, pop } from "../anim";
import { Backdrop } from "../components/Backdrop";
import { Papa } from "../components/Papa";
import { Pumpkin, PumpkinHalf } from "../components/Pumpkin";
import { Stage, Sticker } from "../components/Sticker";
import { Chestnut, Heart, Island, Sparkle } from "../components/Things";
import { Label } from "../components/Label";
import { INK } from "../theme";
import { useLines } from "../timeline";

// L0 「「小黑」是台灣育種的，小型栗子南瓜品種。」 Taiwan, with 小黑 sprouting on it.
// L1 「它小小一顆，切開是金黃色的果肉，」 a small pumpkin, sliced open: golden.
// L2 「吃起來鬆鬆綿綿，有栗子的香味，…」 golden flesh ≈ chestnut.
export const What: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  const island = pop(frame, fps, L[0] + 4, 12) * fadeOut(frame, L[1] - 4, 12);
  const onIsland = pop(frame, fps, L[0] + 26, 9);

  // L1: the pumpkin moves from Taiwan to the middle, then is cut.
  const toCenter = lerp(frame, [L[1] - 6, L[1] + 18], [0, 1]);
  const cutAt = L[1] + 50;
  const slash = frame >= cutAt - 8 && frame < cutAt + 6 ? lerp(frame, [cutAt - 8, cutAt], [0, 1]) : 0;
  const half = pop(frame, fps, cutAt, 10);
  const px = lerp(frame, [L[1] - 6, L[1] + 18], [690, 560]) + lerp(frame, [L[2], L[2] + 20], [0, -170]);
  const py = lerp(frame, [L[1] - 6, L[1] + 18], [820, 880]) + lerp(frame, [L[2], L[2] + 20], [0, -40]);
  const ps = frame < L[1] - 6 ? 0.7 * onIsland : lerp(frame, [L[1] - 6, L[1] + 18], [0.7, 2.1]) - lerp(frame, [L[2], L[2] + 20], [0, 0.55]);

  const chestnut = pop(frame, fps, L[2] + 30, 10);
  const approx = pop(frame, fps, L[2] + 18, 12);
  const tw = (start: number, period = 40) => (frame < start ? 0 : Math.sin((((frame - start) % period) / period) * Math.PI));

  return (
    <AbsoluteFill>
      <Backdrop mood="green" />
      <Stage>
        <Sticker x={690} y={900} scale={1.35 * island} rotate={-6}>
          <Island which="taiwan" />
        </Sticker>
        {frame < cutAt ? (
          <Sticker x={px} y={py} scale={ps} rotate={Math.sin(frame / 15) * 3}>
            <Pumpkin variant="hei" face={toCenter > 0.5 ? "none" : "smile"} />
          </Sticker>
        ) : (
          <Sticker x={px} y={py} scale={ps * (0.8 + 0.2 * half)}>
            <PumpkinHalf />
          </Sticker>
        )}
        {/* the knife flash */}
        {slash > 0 && (
          <path
            d={`M${560 - 260},${980} L${560 - 260 + 520 * slash},${780}`}
            stroke="#fff"
            strokeWidth={22}
            strokeLinecap="round"
            opacity={fadeOut(frame, cutAt, 6)}
          />
        )}
        {frame >= cutAt && frame < L[2] + 10 && (
          <>
            <Sparkle x={360} y={700} t={tw(cutAt, 36)} size={44} />
            <Sparkle x={780} y={1050} t={tw(cutAt + 12, 40)} size={36} />
            <Sparkle x={790} y={690} t={tw(cutAt + 20, 44)} size={30} />
          </>
        )}
        {/* ≈ */}
        <g opacity={approx} transform={`translate(640 860) scale(${approx})`}>
          {[-16, 16].map((dy) => (
            <path key={dy} d={`M-34,${dy} q17,-16 34,0 q17,16 34,0`} fill="none" stroke="#fff" strokeWidth={22} strokeLinecap="round" />
          ))}
          {[-16, 16].map((dy) => (
            <path key={`i${dy}`} d={`M-34,${dy} q17,-16 34,0 q17,16 34,0`} fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" />
          ))}
        </g>
        <Sticker x={840} y={850} scale={1.45 * chestnut} rotate={8 + Math.sin(frame / 12) * 4}>
          <Chestnut />
        </Sticker>
        {frame > L[2] + 40 && (
          <>
            <Heart x={700} y={680 - ((frame - L[2]) % 70) * 0.8} size={40} />
            <Sparkle x={960} y={700} t={tw(L[2] + 40)} size={40} />
          </>
        )}
      </Stage>
      <Label x={720} y={500} at={L[0] + 12} size={80} until={L[1] - 4}>
        台灣
      </Label>
      <Papa
        poses={[[6, "point"], [L[1], "arms"], [L[2], "chin"]]}
        x={frame < L[1] ? 230 : frame < L[2] ? 300 : 540}
        y={frame < L[2] ? 1840 : 1860}
        height={frame < L[1] ? 820 : frame < L[2] ? 700 : 640}
        hops={[L[0], L[1]]}
      />
    </AbsoluteFill>
  );
};
