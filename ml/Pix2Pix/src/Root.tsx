import { Composition, staticFile } from "remotion";
import { Pix2PixVideo, type Pix2PixVideoProps } from "./Pix2PixVideo";
import { buildTimeline, FPS, type VoiceManifest } from "./timeline";

// Reads public/voice/manifest.json (written by `npm run voiceover`).
// Returns null when there is no voiceover: the video is then silent and
// each line's length is estimated from its word count.
const loadVoice = async (): Promise<VoiceManifest | null> => {
  try {
    const res = await fetch(staticFile("voice/manifest.json"));
    return res.ok ? ((await res.json()) as VoiceManifest) : null;
  } catch {
    return null;
  }
};

const fallback = buildTimeline(null);

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Pix2PixExplainer"
      component={Pix2PixVideo}
      fps={FPS}
      width={1920} // 16:9, 1080p
      height={1080}
      durationInFrames={fallback.durationInFrames}
      defaultProps={{ timeline: fallback } satisfies Pix2PixVideoProps}
      // Runs once before rendering: the length of the video depends on
      // the length of the voice clips.
      calculateMetadata={async () => {
        const timeline = buildTimeline(await loadVoice());
        return { durationInFrames: timeline.durationInFrames, props: { timeline } };
      }}
    />
  );
};
