import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, lerp, pop } from "../anim";
import { BananaPlant } from "../components/BananaPlant";
import { Farmer } from "../components/Farmer";
import { Sfx, Sparkle } from "../components/Manga";
import { Nutrients } from "../components/Nutrients";
import { moveCam, toScreen, World } from "../components/World";
import { GROUND_Y, HAND_Y, LAST_HAND_Y, RACHIS_X } from "../plant";
import { COLORS, FONT, INK, ROLE } from "../theme";
import { useLines } from "../timeline";

const POINTS: [string, string][] = [
  ["香蕉串的下面，有紫紅色的香蕉花", ROLE.flower],
  ["香蕉花 ＝ 苞片 ＋ 一排排小花", COLORS.orange],
  ["梗上有「空梳」和「不結果的花指」", ROLE.finger],
  ["用香蕉刀，在最後一梳下方剪除", ROLE.knife],
];

// With the flower part gone, all the food goes to the bananas. Then a recap.
export const Recap: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();
  const cam = moveCam(frame, [
    [0, { x: 650, y: 1200, z: 1.05 }],
    [30, { x: 620, y: 1020, z: 1.25 }],
    [L[2], { x: 620, y: 1020, z: 1.25 }],
    [L[2] + 24, { x: 600, y: 1150, z: 1.0 }],
  ]);
  const g = lerp(frame, [L[0] + 10, L[1] + 30], [1, 1.3]);
  const bunch = toScreen(cam, RACHIS_X, (HAND_Y[0] + LAST_HAND_Y) / 2);
  const cards = fade(frame, L[2] - 4, 10);
  return (
    <AbsoluteFill>
      <World
        cam={cam}
        frame={frame}
        overlay={
          <>
            <Nutrients frame={frame} cam={cam} bottom={LAST_HAND_Y} show={fade(frame, 10, 10) * (1 - cards)} />
            {frame >= L[1] && (
              <>
                <Sfx text="又大又漂亮！" x={540} y={bunch[1] - 420} size={104} color={COLORS.yellow} rot={-6} scale={pop(frame, fps, L[1] + 4, 9)} opacity={1 - cards} />
                <svg width={1080} height={1920} style={{ position: "absolute", opacity: 1 - cards }}>
                  {[
                    [-230, -150, 34],
                    [220, -220, 30],
                    [250, 60, 24],
                    [-200, 150, 22],
                    [60, -300, 18],
                  ].map(([dx, dy, s], i) => (
                    <Sparkle key={i} x={bunch[0] + dx} y={bunch[1] + dy} size={s * pop(frame, fps, L[1] + 4 + i * 3) * (0.7 + 0.3 * Math.sin(frame / 4 + i))} color={COLORS.yellow} rot={frame * 3} />
                  ))}
                </svg>
              </>
            )}
          </>
        }
      >
        <BananaPlant frame={frame} g={g} cut fall={1} removed />
        <g transform={`translate(880 ${GROUND_Y})`}>
          <Farmer frame={frame} pose="wave" talking={frame >= L[2] && frame < L[2] + 60} />
        </g>
      </World>

      {/* recap cards */}
      {cards > 0 && (
        <div style={{ position: "absolute", left: 40, right: 40, top: 200, fontFamily: FONT, opacity: cards }}>
          {POINTS.map(([text, color], i) => {
            const p = pop(frame, fps, L[2] + 6 + i * 12, 12);
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 22,
                  marginBottom: 22,
                  padding: "18px 26px",
                  background: "#fff",
                  border: `6px solid ${INK}`,
                  borderRadius: 28,
                  boxShadow: `8px 8px 0 ${color}`,
                  transform: `translateX(${(1 - p) * (i % 2 ? 300 : -300)}px) scale(${0.6 + 0.4 * p})`,
                  opacity: Math.min(1, p * 1.5),
                }}
              >
                <div
                  style={{
                    flex: "0 0 auto",
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    background: color,
                    border: `5px solid ${INK}`,
                    color: "#fff",
                    fontSize: 42,
                    fontWeight: 900,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ fontSize: 44, fontWeight: 900, color: INK, lineHeight: 1.3 }}>{text}</div>
              </div>
            );
          })}
        </div>
      )}
    </AbsoluteFill>
  );
};
