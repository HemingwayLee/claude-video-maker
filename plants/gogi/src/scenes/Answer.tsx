import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, fadeOut, lerp, pop } from "../anim";
import { Burst, Field } from "../components/Backdrop";
import { GojiBush } from "../components/Goji";
import { Maru, Sfx, SpeechBubble, Star } from "../components/Manga";
import { Taiwan } from "../components/Map";
import { Basket, Chibi, POSES } from "../components/People";
import { Stage } from "../components/Stage";
import { COLORS, INK, ROLE } from "../theme";
import { useLines } from "../timeline";

// 0「答案是：可以種！」        a big red 〇 around a goji shrub in a Taiwan field
// 1「…有一定的難度，」          the farmer sweats; a difficulty meter shows 4 of 5 stars
// 2「而且產量極少。」            the harvest basket holds only three berries
export const Answer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();
  const yes = fade(frame, L[0] + 20, 6) * fadeOut(frame, L[1] - 6, 10);
  const hard = fade(frame, L[1], 10) * fadeOut(frame, L[2], 10);
  const few = fade(frame, L[2], 10);
  const pose = frame < L[1] ? POSES.cheer : frame < L[2] ? POSES.think : POSES.hold;
  const eyes = frame < L[1] ? "happy" : "sad";
  const meterIn = pop(frame, fps, L[1] + 8, 12) * fadeOut(frame, L[2], 8);
  const basketIn = pop(frame, fps, L[2] + 4, 11);
  return (
    <AbsoluteFill>
      <Field frame={frame} groundY={840} />
      <Burst frame={frame} cx={1200} cy={560} colors={["#fff3b0", "#ffe27a"]} opacity={yes * 0.9} />
      <Stage>
        {/* signpost with Taiwan on it: this field is in Taiwan */}
        <g transform="translate(1660 860)">
          <rect x={-10} y={-260} width={20} height={260} fill={COLORS.wood} stroke={INK} strokeWidth={5} />
          <rect x={-110} y={-400} width={220} height={170} rx={16} fill="#fff8e6" stroke={INK} strokeWidth={6} />
          <g transform="translate(0 -315) rotate(6)">
            <Taiwan height={140} stroke={4} fill={ROLE.taiwan} mountains={false} />
          </g>
        </g>
        <g transform="translate(1200 860)">
          <GojiBush frame={frame} flowers={1} berries={lerp(frame, [0, 20], [0.4, 1])} maxBerries={5} wobble={hard} />
        </g>
        <Maru x={1200} y={560} r={330} progress={lerp(frame, [L[0] + 20, L[0] + 38], [0, 1]) * fadeOut(frame, L[1] - 6, 10)} />
        <g transform={`translate(560 900) scale(1.15)`}>
          <Chibi frame={frame} kind="farmer" flip pose={pose} eyes={eyes} sweat={hard} gloom={few} talking={false} />
        </g>
        {/* the small harvest */}
        <g transform={`translate(860 1000) scale(${basketIn})`}>
          <Basket frame={frame} count={3} jiggle={1 - fade(frame, L[2] + 20, 20)} />
        </g>
        {/* difficulty meter: 4 of 5 stars */}
        <g transform={`translate(960 140) scale(${meterIn})`}>
          <rect x={-330} y={-70} width={660} height={140} rx={70} fill="#fff" stroke={INK} strokeWidth={7} />
          {Array.from({ length: 5 }, (_, i) => {
            const lit = frame > L[1] + 14 + i * 5 && i < 4;
            return (
              <g key={i} transform={`translate(${-120 + i * 100} 0) scale(${lit ? 1.05 : 0.9})`}>
                <Star r={40} fill={lit ? COLORS.yellow : "#e6e0d6"} />
              </g>
            );
          })}
        </g>
      </Stage>
      <Sfx text="難度" x={720} y={140} size={56} color={ROLE.hard} rot={0} scale={meterIn} />
      <Sfx text="叮咚♪" x={1560} y={190} size={90} color={COLORS.yellow} rot={10} scale={pop(frame, fps, L[0] + 24, 9) * yes} />
      <SpeechBubble x={760} y={330} text="……" scale={pop(frame, fps, L[2] + 16, 12)} tail={[-120, 120]} size={70} />
    </AbsoluteFill>
  );
};
