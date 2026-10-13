import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, fadeOut, pop } from "../anim";
import { TaskPair } from "../components/TaskArt";
import { Card, Label } from "../components/Text";
import { COLORS, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

// The tasks from the paper, the human-judge test, and #edges2cats.
const GRID = [0, 1, 2, 3, 4, 5].map((index, k) => ({ index, x: 178 + (k % 3) * 560, y: 170 + Math.floor(k / 3) * 330 }));

export const Results: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();
  const step = (L[1] - L[0]) / 7;
  const dimOthers = frame >= L[1] && frame < L[2];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: fadeOut(frame, L[2] - 5, 12) }}>
        {GRID.map((g, k) => (
          <TaskPair key={k} index={g.index} x={g.x} y={g.y} size={190} scale={pop(frame, fps, L[0] + k * step, 14)} opacity={dimOthers && g.index !== 2 ? 0.25 : 1} />
        ))}
        <Card x={560} y={820} w={800} h={110} accent={ROLE.disc} opacity={fade(frame, L[1] + 10)}>
          <Label x={400} y={22} size={30} center>
            human judges took its aerial photos for real in <b style={{ color: ROLE.disc, fontFamily: MONO }}>18.9 %</b> of trials
          </Label>
          <Label x={400} y={68} size={20} center color={COLORS.muted}>
            Amazon Mechanical Turk perceptual study, map → aerial photo (Isola et al. 2017)
          </Label>
        </Card>
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: fade(frame, L[2]) }}>
        <TaskPair index={7} x={620} y={260} size={300} scale={pop(frame, fps, L[2] + 5, 14)} />
        <Label x={960} y={740} size={40} weight={800} center color={ROLE.input}>
          #edges2cats
        </Label>
        <Label x={960} y={800} size={24} center color={COLORS.muted}>
          an interactive demo built on the released code by Christopher Hesse (2017)
        </Label>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
