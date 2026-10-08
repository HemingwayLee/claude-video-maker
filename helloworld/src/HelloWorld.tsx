import { AbsoluteFill, Sequence } from "remotion";
import { FrameCounter } from "./FrameCounter";
import { Intro } from "./scenes/Intro";
import { Frames } from "./scenes/Frames";
import { Outro } from "./scenes/Outro";

// The timeline. Each <Sequence> starts at `from` and lasts `durationInFrames`.
// Inside a Sequence, useCurrentFrame() restarts at 0, so each scene can be
// written as if it were its own little video.
//
//   0s ──────── 4s ──────────── 9s ───────────── 15s
//   |  Intro    |   Frames      |   Outro        |
//   0          120             270              450   (frames @ 30fps)
export const HelloWorld: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b1021" }}>
      <Sequence from={0} durationInFrames={120} name="Intro">
        <Intro />
      </Sequence>
      <Sequence from={120} durationInFrames={150} name="Frames">
        <Frames />
      </Sequence>
      <Sequence from={270} durationInFrames={180} name="Outro">
        <Outro />
      </Sequence>
      {/* Not inside a Sequence, so it is visible for the whole video. */}
      <FrameCounter />
    </AbsoluteFill>
  );
};
