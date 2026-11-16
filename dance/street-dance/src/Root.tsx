import { Composition } from "remotion";
import { StreetDance } from "./StreetDance";
import { FPS, TOTAL_FRAMES } from "./beat";

// Vertical 9:16, 1080×1920, 15 s × 30 fps.
export const RemotionRoot: React.FC = () => (
  <Composition
    id="StreetDance"
    component={StreetDance}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
