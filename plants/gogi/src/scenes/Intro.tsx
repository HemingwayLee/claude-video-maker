import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, lerp, pop } from "../anim";
import { Field } from "../components/Backdrop";
import { GojiBush } from "../components/Goji";
import { FocusLines, Sfx, Sparkle, SpeechBubble } from "../components/Manga";
import { Taiwan } from "../components/Map";
import { Chibi, POSES } from "../components/People";
import { Stage } from "../components/Stage";
import { COLORS, INK } from "../theme";
import { useLines } from "../timeline";

// 「紅通通的枸杞，台灣也能種嗎？」
// A goji shrub grows and fills with red berries; a girl wonders whether
// it can grow in Taiwan.
export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();
  const zoom = lerp(frame, [0, L[1]], [1.08, 1]);
  const titleIn = pop(frame, fps, L[0] + 4, 11);
  const askIn = pop(frame, fps, L[0] + 40, 10);
  return (
    <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
      <Field frame={frame} groundY={840} />
      <FocusLines frame={frame} cx={1250} cy={560} opacity={lerp(frame, [L[0], L[0] + 10, L[0] + 40, L[0] + 60], [0, 0.5, 0.5, 0])} color="#fff" />
      <Stage>
        <g transform="translate(1250 860)">
          <GojiBush
            frame={frame}
            grow={lerp(frame, [0, 40], [0, 1])}
            leaves={lerp(frame, [10, 50], [0, 1])}
            flowers={lerp(frame, [20, 40], [0, 1])}
            berries={lerp(frame, [30, 75], [0, 1])}
          />
        </g>
        {[
          [1030, 560, 0],
          [1480, 520, 12],
          [1300, 400, 24],
          [1560, 680, 36],
        ].map(([x, y, d], i) => {
          const s = Math.max(0, Math.sin(((frame - 60 - d) / 24) * Math.PI));
          return frame > 60 + d ? <Sparkle key={i} x={x} y={y} size={30 * s} color="#fff8c4" rot={frame * 2} /> : null;
        })}
        <g transform="translate(470 900) scale(1.15)">
          <Chibi frame={frame} kind="girl" flip pose={POSES.think} talking={frame > L[0] && frame < L[0] + 85} />
        </g>
      </Stage>
      <SpeechBubble x={610} y={300} text="？" scale={askIn} tail={[-100, 130]} size={110} />
      {/* title: 枸杞 + a little Taiwan with a question mark */}
      <Sfx text="枸杞" x={830} y={150} size={150} color={COLORS.berry} rot={-4} scale={titleIn} />
      <Stage>
        <g transform={`translate(1110 150) scale(${titleIn}) rotate(8)`}>
          <Taiwan height={210} stroke={6} mountains={false} />
          <text x={70} y={70} fontSize={120} fontWeight={900} fill={COLORS.yellow} stroke={INK} strokeWidth={10} paintOrder="stroke" opacity={fade(frame, L[0] + 30, 8)}>
            ?
          </text>
        </g>
      </Stage>
    </AbsoluteFill>
  );
};
