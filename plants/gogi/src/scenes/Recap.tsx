import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { pop } from "../anim";
import { Field } from "../components/Backdrop";
import { GojiBush } from "../components/Goji";
import { Sparkle } from "../components/Manga";
import { Ship, Taiwan } from "../components/Map";
import { Basket, Chibi, POSES } from "../components/People";
import { Stage } from "../components/Stage";
import { COLORS, FONT, INK, outline, ROLE } from "../theme";
import { useLines } from "../timeline";

// 0「台灣可以種枸杞，但種得很少；」   card 1: a goji shrub on Taiwan + a nearly empty basket
// 1「我們吃到的枸杞，幾乎都是進口的」 card 2: a cargo ship + "> 98%"

const Card: React.FC<{ x: number; y: number; scale: number; color: string; label: string; children: React.ReactNode }> = ({
  x,
  y,
  scale,
  color,
  label,
  children,
}) => {
  if (scale <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 700,
        height: 560,
        transform: `translate(-50%, -50%) scale(${scale})`,
        background: "#fffdf6",
        border: `8px solid ${INK}`,
        borderRadius: 34,
        boxShadow: `14px 14px 0 ${color}`,
        overflow: "hidden",
      }}
    >
      <svg width={700} height={560} viewBox="-350 -280 700 560" style={{ position: "absolute" }}>
        {children}
      </svg>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 22,
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 66,
          color: "#fff",
          textShadow: `${outline(INK, 8)}, 5px 7px 0 ${INK}`,
        }}
      >
        {label}
      </div>
    </div>
  );
};

export const Recap: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();
  const card1 = pop(frame, fps, L[0] + 4, 12);
  const card2 = pop(frame, fps, L[1] + 4, 12);
  const end = frame > L[1] + 60;
  return (
    <AbsoluteFill>
      <Field frame={frame} groundY={900} />
      <Card x={530} y={420} scale={card1} color={ROLE.taiwan} label="能種，但很少">
        <g transform="translate(-160 -50) rotate(6)">
          <Taiwan height={330} fill={ROLE.taiwan} stroke={6} mountains={false} />
        </g>
        <g transform={`translate(-150 30) scale(${0.26 * pop(frame, fps, L[0] + 14, 12)})`}>
          <GojiBush frame={frame} flowers={1} maxBerries={4} />
        </g>
        <g transform="translate(160 40) scale(0.95)">
          <Basket frame={frame} count={3} />
        </g>
      </Card>
      <Card x={1390} y={420} scale={card2} color={ROLE.imported} label="幾乎都是進口">
        <rect x={-350} y={-20} width={700} height={300} fill={COLORS.sea} />
        <g transform={`translate(${-40 + Math.sin(frame / 25) * 20} 20) scale(1.2)`}>
          <Ship frame={frame} />
        </g>
        <text
          x={0}
          y={-110}
          textAnchor="middle"
          fontFamily={FONT}
          fontWeight={900}
          fontSize={150}
          fill={ROLE.imported}
          stroke={INK}
          strokeWidth={14}
          paintOrder="stroke"
        >
          &gt; 98%
        </text>
      </Card>
      <Stage>
        <g transform="translate(840 1060) scale(0.62)">
          <Chibi frame={frame} kind="farmer" flip pose={end ? POSES.wave : POSES.rest} eyes={end ? "happy" : "open"} talking={!end} />
        </g>
        <g transform="translate(1080 1060) scale(0.62)">
          <Chibi frame={frame} kind="girl" pose={end ? POSES.cheer : POSES.rest} eyes={end ? "happy" : "open"} />
        </g>
        {end &&
          [
            [700, 760],
            [1220, 740],
            [960, 700],
          ].map(([x, y], i) => <Sparkle key={i} x={x} y={y} size={26 + Math.sin(frame / 5 + i) * 8} color="#fff8c4" rot={frame * 2} />)}
      </Stage>
    </AbsoluteFill>
  );
};
