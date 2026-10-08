import React from "react";
import { AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { fade, fadeOut } from "./anim";
import { Caption, ProgressBar, SceneHeader } from "./components/Chrome";
import { AttentionMath } from "./scenes/AttentionMath";
import { Before } from "./scenes/Before";
import { Block } from "./scenes/Block";
import { EncDec } from "./scenes/EncDec";
import { Generate } from "./scenes/Generate";
import { Idea } from "./scenes/Idea";
import { Intro } from "./scenes/Intro";
import { MultiHead } from "./scenes/MultiHead";
import { Position } from "./scenes/Position";
import { Qkv } from "./scenes/Qkv";
import { Recap } from "./scenes/Recap";
import { Stack } from "./scenes/Stack";
import { Tokens } from "./scenes/Tokens";
import { Why } from "./scenes/Why";
import { COLORS, FONT } from "./theme";
import { SceneContext, type Timeline, useScene } from "./timeline";

// Scene id (from narration.json) → component that draws it.
const SCENE_COMPONENTS: Record<string, React.FC> = {
  intro: Intro,
  before: Before,
  tokens: Tokens,
  position: Position,
  idea: Idea,
  qkv: Qkv,
  math: AttentionMath,
  multihead: MultiHead,
  block: Block,
  stack: Stack,
  encdec: EncDec,
  generate: Generate,
  why: Why,
  recap: Recap,
};

export type TransformerVideoProps = { timeline: Timeline };

// Fades each scene in from, and out to, the background.
const SceneFade: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { duration } = useScene();
  const opacity = fade(frame, 0, 12) * fadeOut(frame, duration - 12, 12);
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

// The timeline: scenes back to back; inside each scene, one Sequence per
// narration line holding its caption and voice clip.
export const TransformerVideo: React.FC<TransformerVideoProps> = ({ timeline }) => {
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 35%, #132042 0%, ${COLORS.bg} 70%)`,
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
