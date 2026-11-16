import React from "react";
import { AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { fade, fadeOut } from "./anim";
import { StickerDefs } from "./components/Sticker";
import { Arrival } from "./scenes/Arrival";
import { Breed } from "./scenes/Breed";
import { Fengshan } from "./scenes/Fengshan";
import { Intro } from "./scenes/Intro";
import { Today } from "./scenes/Today";
import { COLORS, FONT } from "./theme";
import { SceneContext, type Timeline, useScene } from "./timeline";

// Scene id (from narration.json) → component that draws it.
const SCENE_COMPONENTS: Record<string, React.FC> = {
  intro: Intro,
  arrival: Arrival,
  fengshan: Fengshan,
  breed: Breed,
  today: Today,
};

export type PassionFruitVideoProps = { timeline: Timeline };

// A soft white dissolve between scenes.
const SceneFade: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { duration } = useScene();
  const flash = Math.max(fadeOut(frame, 0, 12), fade(frame, duration - 10, 10));
  return (
    <AbsoluteFill>
      {children}
      <AbsoluteFill style={{ background: "#fffaf2", opacity: flash }} />
    </AbsoluteFill>
  );
};

// The timeline: scenes back to back; inside each scene, one Sequence per
// narration line holding its voice clip. There are deliberately no
// subtitles, chapter badges or progress bar: the pictures carry the story.
export const PassionFruitVideo: React.FC<PassionFruitVideoProps> = ({ timeline }) => {
  return (
    <AbsoluteFill style={{ background: "#fff3e2", fontFamily: FONT, color: COLORS.text }}>
      <StickerDefs />
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
