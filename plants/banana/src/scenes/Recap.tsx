import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, lerp, pop } from "../anim";
import { BananaPlant } from "../components/BananaPlant";
import { BananaKnife, Farmer } from "../components/Farmer";
import { Sfx, Sparkle } from "../components/Manga";
import { Nutrients } from "../components/Nutrients";
import { moveCam, toScreen, World } from "../components/World";
import { GROUND_Y, HAND_Y, LAST_HAND_Y, RACHIS_X } from "../plant";
import { COLORS, FONT, INK, ROLE } from "../theme";
import { useLines } from "../timeline";

// The recap panel: the two things to look for, then the tool to use.
const PILLS: [string, string][] = [
  ["空梳", ROLE.empty],
  ["花指", ROLE.finger],
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

      {/* recap: 空梳 ＋ 花指 → banana knife */}
      {cards > 0 && (
        <div
          style={{
            position: "absolute",
            left: 60,
            right: 60,
            top: 220,
            padding: "30px 20px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 22,
            fontFamily: FONT,
            opacity: cards,
            background: "#fff",
            border: `8px solid ${INK}`,
            borderRadius: 40,
            boxShadow: `12px 12px 0 ${ROLE.knife}`,
            transform: `scale(${0.8 + 0.2 * cards})`,
          }}
        >
          {PILLS.map(([text, color], i) => {
            const p = pop(frame, fps, L[2] + 6 + i * 12, 11);
            return (
              <div
                key={text}
                style={{
                  padding: "14px 34px 18px",
                  background: color,
                  border: `7px solid ${INK}`,
                  borderRadius: 50,
                  boxShadow: `8px 8px 0 ${INK}`,
                  color: "#fff",
                  fontSize: 76,
                  fontWeight: 900,
                  transform: `scale(${p})`,
                }}
              >
                {text}
              </div>
            );
          })}
          <svg width={110} height={80} viewBox="-55 -40 110 80" style={{ transform: `scale(${pop(frame, fps, L[2] + 30, 11)})` }}>
            <path d="M -45 0 L 30 0 M 8 -24 L 34 0 L 8 24" stroke={INK} strokeWidth={22} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M -45 0 L 30 0 M 8 -24 L 34 0 L 8 24" stroke={COLORS.yellow} strokeWidth={11} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <svg width={150} height={240} viewBox="-170 -590 260 690" style={{ overflow: "visible", transform: `scale(${pop(frame, fps, L[2] + 40, 10)}) rotate(${-10 + Math.sin(frame / 6) * 6}deg)` }}>
            <BananaKnife glow={0.5} />
          </svg>
        </div>
      )}
    </AbsoluteFill>
  );
};
