import React from "react";
import { AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { fade, fadeOut } from "./anim";
import { Caption, ProgressBar, SceneHeader } from "./components/Chrome";
import { Architecture } from "./scenes/Architecture";
import { Convolution } from "./scenes/Convolution";
import { Dense } from "./scenes/Dense";
import { Filters } from "./scenes/Filters";
import { Hierarchy } from "./scenes/Hierarchy";
import { History } from "./scenes/History";
import { Intro } from "./scenes/Intro";
import { Pixels } from "./scenes/Pixels";
import { Pooling } from "./scenes/Pooling";
import { Recap } from "./scenes/Recap";
import { Relu } from "./scenes/Relu";
import { Stride } from "./scenes/Stride";
import { Training } from "./scenes/Training";
import { COLORS, FONT } from "./theme";
import { SceneContext, type Timeline, useScene } from "./timeline";

// Scene id (from narration.json) → component that draws it.
const SCENE_COMPONENTS: Record<string, React.FC> = {
  intro: Intro,
  pixels: Pixels,
  dense: Dense,
  convolution: Convolution,
  filters: Filters,
  stride: Stride,
  relu: Relu,
  pooling: Pooling,
  hierarchy: Hierarchy,
  architecture: Architecture,
  training: Training,
  history: History,
  recap: Recap,
};

export type CnnVideoProps = { timeline: Timeline };

// Fades each scene in from, and out to, the background.
const SceneFade: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { duration } = useScene();
  const opacity = fade(frame, 0, 12) * fadeOut(frame, duration - 12, 12);
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

// The timeline: scenes back to back; inside each scene, one Sequence per
// narration line holding its caption and voice clip.
export const CnnVideo: React.FC<CnnVideoProps> = ({ timeline }) => {
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 35%, #151c3d 0%, ${COLORS.bg} 70%)`,
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
