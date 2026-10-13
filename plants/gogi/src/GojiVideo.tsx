import React from "react";
import { AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { fade, fadeOut } from "./anim";
import { Answer } from "./scenes/Answer";
import { Area } from "./scenes/Area";
import { Import } from "./scenes/Import";
import { Intro } from "./scenes/Intro";
import { Recap } from "./scenes/Recap";
import { COLORS, FONT } from "./theme";
import { SceneContext, type Timeline, useScene } from "./timeline";

// Scene id (from narration.json) → component that draws it.
const SCENE_COMPONENTS: Record<string, React.FC> = {
  intro: Intro,
  answer: Answer,
  area: Area,
  import: Import,
  recap: Recap,
};

export type GojiVideoProps = { timeline: Timeline };

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
// narration line holding its voice clip. There are deliberately no
// subtitles and no progress bar: the pictures carry the story.
export const GojiVideo: React.FC<GojiVideoProps> = ({ timeline }) => {
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
            </SceneContext.Provider>
            {scene.lines.map((line) =>
              line.audio ? (
                <Sequence key={line.key} from={line.from} durationInFrames={line.duration} name={line.key}>
                  <Html5Audio src={staticFile(line.audio)} />
                </Sequence>
              ) : null,
            )}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
