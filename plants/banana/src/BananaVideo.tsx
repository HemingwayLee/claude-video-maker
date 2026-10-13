import React from "react";
import { AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { fade, fadeOut } from "./anim";
import { Caption, ProgressBar, SceneHeader } from "./components/Chrome";
import { Cut } from "./scenes/Cut";
import { Flower } from "./scenes/Flower";
import { Grow } from "./scenes/Grow";
import { Intro } from "./scenes/Intro";
import { Recap } from "./scenes/Recap";
import { Tree } from "./scenes/Tree";
import { COLORS, FONT } from "./theme";
import { SceneContext, type Timeline, useScene } from "./timeline";

// Scene id (from narration.json) → component that draws it.
const SCENE_COMPONENTS: Record<string, React.FC> = {
  intro: Intro,
  tree: Tree,
  flower: Flower,
  grow: Grow,
  cut: Cut,
  recap: Recap,
};

export type BananaVideoProps = { timeline: Timeline };

// Anime-style transition: a quick white flash between scenes.
const SceneFade: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { duration } = useScene();
  const flash = Math.max(fadeOut(frame, 0, 10), fade(frame, duration - 8, 8));
  return (
    <AbsoluteFill>
      {children}
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
    </AbsoluteFill>
  );
};

// The timeline: scenes back to back; inside each scene, one Sequence per
// narration line holding its caption and voice clip.
export const BananaVideo: React.FC<BananaVideoProps> = ({ timeline }) => {
  return (
    <AbsoluteFill style={{ background: COLORS.skyBottom, fontFamily: FONT, color: COLORS.text }}>
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
