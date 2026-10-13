import React from "react";
import { AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { fade, fadeOut } from "./anim";
import { Caption, ProgressBar, SceneHeader } from "./components/Chrome";
import { Compare } from "./scenes/Compare";
import { Ddim } from "./scenes/Ddim";
import { Demo } from "./scenes/Demo";
import { Denoiser } from "./scenes/Denoiser";
import { Forward } from "./scenes/Forward";
import { Guidance } from "./scenes/Guidance";
import { Idea } from "./scenes/Idea";
import { Intro } from "./scenes/Intro";
import { Latent } from "./scenes/Latent";
import { Recap } from "./scenes/Recap";
import { Sampling } from "./scenes/Sampling";
import { Training } from "./scenes/Training";
import { UNet } from "./scenes/UNet";
import { COLORS, FONT } from "./theme";
import { SceneContext, type Timeline, useScene } from "./timeline";

// Scene id (from narration.json) → component that draws it.
const SCENE_COMPONENTS: Record<string, React.FC> = {
  intro: Intro,
  idea: Idea,
  forward: Forward,
  denoiser: Denoiser,
  training: Training,
  sampling: Sampling,
  unet: UNet,
  demo: Demo,
  ddim: Ddim,
  guidance: Guidance,
  latent: Latent,
  compare: Compare,
  recap: Recap,
};

export type DiffusionVideoProps = { timeline: Timeline };

// Fades each scene in from, and out to, the background.
const SceneFade: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { duration } = useScene();
  const opacity = fade(frame, 0, 12) * fadeOut(frame, duration - 12, 12);
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

// The timeline: scenes back to back; inside each scene, one Sequence per
// narration line holding its caption and voice clip.
export const DiffusionVideo: React.FC<DiffusionVideoProps> = ({ timeline }) => {
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
