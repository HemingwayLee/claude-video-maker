import React from "react";
import { AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { fade, fadeOut } from "./anim";
import { Caption, ProgressBar, SceneHeader } from "./components/Chrome";
import { Architecture } from "./scenes/Architecture";
import { Control } from "./scenes/Control";
import { Demo } from "./scenes/Demo";
import { Feeding } from "./scenes/Feeding";
import { Idea } from "./scenes/Idea";
import { Intro } from "./scenes/Intro";
import { Match } from "./scenes/Match";
import { Objective } from "./scenes/Objective";
import { Problem } from "./scenes/Problem";
import { Recap } from "./scenes/Recap";
import { Training } from "./scenes/Training";
import { Uses } from "./scenes/Uses";
import { COLORS, FONT } from "./theme";
import { SceneContext, type Timeline, useScene } from "./timeline";

// Scene id (from narration.json) → component that draws it.
const SCENE_COMPONENTS: Record<string, React.FC> = {
  intro: Intro,
  problem: Problem,
  idea: Idea,
  architecture: Architecture,
  feeding: Feeding,
  match: Match,
  objective: Objective,
  training: Training,
  demo: Demo,
  control: Control,
  uses: Uses,
  recap: Recap,
};

export type CganVideoProps = { timeline: Timeline };

// Fades each scene in from, and out to, the background.
const SceneFade: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { duration } = useScene();
  const opacity = fade(frame, 0, 12) * fadeOut(frame, duration - 12, 12);
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

// The timeline: scenes back to back; inside each scene, one Sequence per
// narration line holding its caption and voice clip.
export const CganVideo: React.FC<CganVideoProps> = ({ timeline }) => {
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 35%, #1f1a3a 0%, ${COLORS.bg} 70%)`,
        fontFamily: FONT,
        color: COLORS.text,
      }}
    >
      {timeline.scenes.map((scene) => {
        const Scene = SCENE_COMPONENTS[scene.id];
        return (
          <Sequence key={scene.id} from={scene.from} durationInFrames={scene.duration} name={scene.title}>
            <SceneContext.Provider value={scene}>
              <SceneFade>
                <Scene />
              </SceneFade>
              <SceneHeader />
            </SceneContext.Provider>
            {scene.lines.map((line) => (
              <Sequence key={line.key} from={line.from} durationInFrames={line.duration} name={line.key}>
                {line.audio ? <Html5Audio src={staticFile(line.audio)} /> : null}
                <Caption text={line.text} />
              </Sequence>
            ))}
          </Sequence>
        );
      })}
      <ProgressBar timeline={timeline} />
    </AbsoluteFill>
  );
};
