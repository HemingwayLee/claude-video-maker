import { Composition, staticFile } from "remotion";
import { SweetPotatoVideo, type SweetPotatoVideoProps } from "./SweetPotatoVideo";
import { buildTimeline, FPS, type VoiceManifest } from "./timeline";

// Reads public/voice/manifest.json (written by `npm run voiceover`).
// Returns null when there is no voiceover: the video is then silent and
// each line's length is estimated from its number of characters.
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
      id="SweetPotatoLeaves"
      component={SweetPotatoVideo}
      fps={FPS}
      width={1080} // 9:16, vertical 1080p (Shorts / Reels / TikTok)
      height={1920}
      durationInFrames={fallback.durationInFrames}
      defaultProps={{ timeline: fallback } satisfies SweetPotatoVideoProps}
      // Runs once before rendering: the length of the video depends on
      // the length of the voice clips.
      calculateMetadata={async () => {
        const timeline = buildTimeline(await loadVoice());
        return { durationInFrames: timeline.durationInFrames, props: { timeline } };
      }}
    />
  );
};
