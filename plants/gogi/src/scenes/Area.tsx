import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, fadeOut, lerp, linear, pop } from "../anim";
import { Sea } from "../components/Backdrop";
import { Sfx, Sparkle } from "../components/Manga";
import { Taiwan } from "../components/Map";
import { Ball, Pitch } from "../components/Pitch";
import { Stage } from "../components/Stage";
import { COLORS, FONT, INK, outline, ROLE } from "../theme";
import { useLines } from "../timeline";

// 0「全台灣的枸杞種植面積，」  Taiwan on the map
// 1「合計還不到十公頃，」      a counter climbs to "< 10 公頃"
// 2「大約只有十四個足球場…」  14 football pitches pop up one by one
// (a pitch is 105 × 68 m ≈ 0.71 ha, so 10 ha ≈ 14 pitches)
export const Area: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();
  const mapIn = pop(frame, fps, 4, 12);
  const mapX = lerp(frame, [L[1], L[1] + 18], [960, 560]);
  const mapOut = fadeOut(frame, L[2], 12);
  const panel = fade(frame, L[2], 12); // manga-panel background for the pitches
  const count = Math.round(linear(frame, [L[1] + 6, L[1] + 30], [0, 10]));
  const counterIn = pop(frame, fps, L[1] + 4, 12);
  const cx = lerp(frame, [L[2], L[2] + 16], [1360, 960]);
  const cy = lerp(frame, [L[2], L[2] + 16], [540, 150]);
  const cs = lerp(frame, [L[2], L[2] + 16], [1, 0.62]);
  const W = 210;
  const H = (W * 68) / 105;
  return (
    <AbsoluteFill>
      <Sea frame={frame} />
      <AbsoluteFill
        style={{
          opacity: panel,
          background: "#fff4d6",
          backgroundImage: "radial-gradient(#f2d9a6 22%, transparent 24%)",
          backgroundSize: "26px 26px",
        }}
      />
      <Stage>
        <g transform={`translate(${mapX} 540) scale(${mapIn}) rotate(${Math.sin(frame / 30) * 1.5})`} opacity={mapOut}>
          <Taiwan height={820} />
        </g>
        {/* 14 football pitches */}
        {Array.from({ length: 14 }, (_, i) => {
          const col = i % 7;
          const row = Math.floor(i / 7);
          const s = pop(frame, fps, L[2] + 10 + i * 3, 12);
          const x = 960 + (col - 3) * (W + 26);
          const y = 470 + row * (H + 30);
          return (
            <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
              <Pitch w={W} />
              <text x={0} y={14} textAnchor="middle" fontFamily={FONT} fontSize={44} fontWeight={900} fill="#fff" stroke={INK} strokeWidth={8} paintOrder="stroke">
                {i + 1}
              </text>
            </g>
          );
        })}
        <g transform={`translate(860 850) scale(${pop(frame, fps, L[2] + 60, 10)})`}>
          <Ball r={70} rot={frame * 3} />
        </g>
        {frame > L[2] + 66 && <Sparkle x={1150} y={790} size={30} color="#fff8c4" rot={frame * 3} />}
      </Stage>
      <Sfx text="× 14" x={1040} y={850} size={120} color={COLORS.yellow} rot={-4} scale={pop(frame, fps, L[2] + 62, 10)} />
      {/* the counter: < 10 公頃 */}
      <div
        style={{
          position: "absolute",
          left: cx,
          top: cy,
          transform: `translate(-50%, -50%) scale(${cs * counterIn}) rotate(-3deg)`,
          display: "flex",
          alignItems: "baseline",
          gap: 18,
          fontFamily: FONT,
          fontWeight: 900,
          color: ROLE.taiwan,
          textShadow: `${outline(INK, 12)}, 10px 14px 0 ${INK}`,
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ fontSize: 170, color: COLORS.yellow }}>&lt;</span>
        <span style={{ fontSize: 260, color: "#fff", width: 300, textAlign: "right" }}>{count}</span>
        <span style={{ fontSize: 130 }}>公頃</span>
      </div>
    </AbsoluteFill>
  );
};
