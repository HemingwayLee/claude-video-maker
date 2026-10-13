import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, fadeOut, lerp, pop } from "../anim";
import { BananaPlant } from "../components/BananaPlant";
import { Farmer } from "../components/Farmer";
import { Sparkle, SpeechBubble } from "../components/Manga";
import { FULL, moveCam, toScreen, World } from "../components/World";
import { GROUND_Y, TRUNK_X } from "../plant";
import { COLORS, FONT, INK, outline } from "../theme";
import { useLines } from "../timeline";

// Title card: the banana plant springs up, the farmer waves hello.
export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();
  const cam = moveCam(frame, [
    [0, { ...FULL, z: 1.12, y: FULL.y + 60 }],
    [L[1], FULL],
  ]);
  const grow = pop(frame, fps, 4, 12);
  const farmerIn = lerp(frame, [10, 30], [1, 0]);
  const farmerX = 880 + farmerIn * 400;
  const [hx, hy] = toScreen(cam, farmerX - 10, GROUND_Y - 470);
  const titlePop = pop(frame, fps, 12, 10);
  const subPop = pop(frame, fps, L[1] + 4, 12);
  return (
    <AbsoluteFill>
      <World cam={cam} frame={frame}>
        <g transform={`translate(${TRUNK_X} ${GROUND_Y}) scale(${grow}) translate(${-TRUNK_X} ${-GROUND_Y})`}>
          <BananaPlant frame={frame} />
        </g>
        <g transform={`translate(${farmerX} ${GROUND_Y})`}>
          <Farmer frame={frame} pose="wave" talking={frame >= L[0] && frame < L[1] - 10} />
        </g>
      </World>

      <SpeechBubble x={hx - 60} y={hy - 40} text="大家好！" scale={pop(frame, fps, L[0] + 6, 11) * fadeOut(frame, L[1], 8)} tail={[70, 90]} />

      {/* title */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 120,
          textAlign: "center",
          fontFamily: FONT,
          transform: `scale(${titlePop}) rotate(-4deg)`,
        }}
      >
        <div style={{ fontSize: 150, fontWeight: 900, color: COLORS.yellow, textShadow: `${outline(INK, 12)}, 0 14px 0 ${INK}`, letterSpacing: 6 }}>
          香蕉花
        </div>
        <div style={{ fontSize: 96, fontWeight: 900, color: "#fff", textShadow: `${outline(INK, 9)}, 0 10px 0 ${INK}`, marginTop: -10 }}>
          的秘密
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 470,
          display: "flex",
          justifyContent: "center",
          gap: 18,
          fontFamily: FONT,
          transform: `scale(${subPop})`,
        }}
      >
        {[
          ["空梳", COLORS.blue],
          ["花指", "#9b5de5"],
          ["香蕉刀", COLORS.red],
        ].map(([t, c]) => (
          <div key={t} style={{ padding: "8px 26px 12px", borderRadius: 40, background: c, border: `6px solid ${INK}`, color: "#fff", fontSize: 48, fontWeight: 900, boxShadow: `6px 6px 0 ${INK}` }}>
            {t}
          </div>
        ))}
      </div>

      <svg width={1080} height={1920} style={{ position: "absolute", opacity: fade(frame, 20, 10) }}>
        {[
          [170, 190, 34],
          [920, 160, 28],
          [880, 380, 22],
          [130, 420, 18],
        ].map(([x, y, s], i) => (
          <Sparkle key={i} x={x} y={y} size={s * (0.75 + 0.25 * Math.sin(frame / 5 + i * 2))} color={COLORS.yellow} rot={frame * 2} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};
