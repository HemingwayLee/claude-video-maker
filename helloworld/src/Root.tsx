import { Composition } from "remotion";
import { HelloWorld } from "./HelloWorld";

// Video settings live here. 15 seconds × 30 frames per second = 450 frames.
export const FPS = 30;
export const DURATION_IN_SECONDS = 15;

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="HelloWorld"
      component={HelloWorld}
      durationInFrames={DURATION_IN_SECONDS * FPS}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
