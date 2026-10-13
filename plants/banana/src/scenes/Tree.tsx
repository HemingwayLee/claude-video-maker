import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade, fadeOut, lerp } from "../anim";
import { BananaPlant } from "../components/BananaPlant";
import { Callout, Sparkle } from "../components/Manga";
import { FULL, moveCam, toScreen, World } from "../components/World";
import { budCenter, handFingers, HAND_Y, LAST_HAND_Y, RACHIS_X } from "../plant";
import { COLORS, INK, ROLE } from "../theme";
import { useLines } from "../timeline";

// 一串 (bunch) → 一梳 (hand) → 一根 (finger), then the banana flower below.
export const Tree: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();
  const cam = moveCam(frame, [
    [0, FULL],
    [L[1] - 6, { x: 640, y: 830, z: 1.12 }],
    [L[1] + 18, { x: 640, y: 840, z: 1.6 }],
    [L[2], { x: 640, y: 840, z: 1.6 }],
    [L[2] + 24, { x: 620, y: 1010, z: 1.25 }],
  ]);

  // Which hand and which banana we point at.
  const HAND = 2;
  const hand = handFingers(HAND, 0).filter((f) => !f.back);
  const handEdge = toScreen(cam, hand[1].tip[0] + 6, HAND_Y[HAND] - 6); // outer right banana
  const fingerTip = handFingers(1, 0).filter((f) => !f.back)[1].tip;
  const finger = toScreen(cam, fingerTip[0], fingerTip[1] + 10);
  const bud = toScreen(cam, RACHIS_X + 40, budCenter(0));
  const bunchTop = toScreen(cam, RACHIS_X + 140, HAND_Y[0] - 70);
  const bunchBottom = toScreen(cam, RACHIS_X - 140, LAST_HAND_Y + 20);

  const handGlow = lerp(frame, [L[1] + 12, L[1] + 22], [0, 1]) * fadeOut(frame, L[2], 10);
  const fingerGlow = lerp(frame, [L[1] + 50, L[1] + 60], [0, 1]) * fadeOut(frame, L[2], 10);
  const bunchBox = fade(frame, 10, 12) * fadeOut(frame, L[1] - 4, 8);

  return (
    <AbsoluteFill>
      <World
        cam={cam}
        frame={frame}
        overlay={
          <>
            {/* 一串: a dashed box around the whole bunch */}
            <svg width={1080} height={1920} style={{ position: "absolute", opacity: bunchBox }}>
              <rect
                x={bunchBottom[0]}
                y={bunchTop[1]}
                width={bunchTop[0] - bunchBottom[0]}
                height={bunchBottom[1] - bunchTop[1]}
                rx={40}
                fill="none"
                stroke={ROLE.bunch}
                strokeWidth={9}
                strokeDasharray="26 16"
                strokeDashoffset={-frame * 2}
              />
            </svg>
            <Callout tx={bunchTop[0] - 10} ty={bunchTop[1] + 120} lx={880} ly={bunchTop[1] - 70} text="一串" sub="香蕉" color={ROLE.bunch} progress={lerp(frame, [12, 28], [0, 1]) * fadeOut(frame, L[1] - 4, 8)} />
            <Callout tx={handEdge[0]} ty={handEdge[1]} lx={870} ly={handEdge[1] + 210} text="一梳" sub="一排香蕉" color={ROLE.bunch} progress={lerp(frame, [L[1] + 14, L[1] + 30], [0, 1]) * fadeOut(frame, L[2], 8)} />
            <Callout tx={finger[0]} ty={finger[1]} lx={890} ly={finger[1] - 190} text="一根" sub="一條香蕉" color={COLORS.orange} progress={lerp(frame, [L[1] + 52, L[1] + 68], [0, 1]) * fadeOut(frame, L[2], 8)} />
            <Callout tx={bud[0]} ty={bud[1]} lx={850} ly={bud[1] - 220} text="香蕉花" sub="紫紅色的大花苞" color={ROLE.flower} progress={lerp(frame, [L[2] + 34, L[2] + 52], [0, 1])} size={58} />
            <svg width={1080} height={1920} style={{ position: "absolute", opacity: fade(frame, L[2] + 40, 10) }}>
              {[
                [-130, -70, 26],
                [-110, 120, 18],
                [120, 60, 22],
              ].map(([dx, dy, s], i) => (
                <Sparkle key={i} x={bud[0] - 40 + dx} y={bud[1] + dy} size={s * (0.7 + 0.3 * Math.sin(frame / 4 + i))} color="#ffe0ef" rot={frame * 3} />
              ))}
            </svg>
          </>
        }
      >
        <BananaPlant frame={frame} highlightHand={{ hand: HAND, alpha: handGlow }} highlightFinger={{ hand: 1, alpha: fingerGlow }} />
      </World>
      {/* legend of the counting words, bottom-left during line 1 */}
      <div
        style={{
          position: "absolute",
          left: 40,
          top: 210,
          opacity: fade(frame, L[1] + 70, 10) * fadeOut(frame, L[2], 8),
          background: "#fff",
          border: `6px solid ${INK}`,
          borderRadius: 24,
          padding: "14px 26px",
          fontSize: 44,
          fontWeight: 900,
          color: INK,
          boxShadow: `8px 8px 0 ${ROLE.bunch}`,
        }}
      >
        一串 ＞ 一梳 ＞ 一根
      </div>
    </AbsoluteFill>
  );
};
