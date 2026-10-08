import { useCurrentFrame, useVideoConfig } from "remotion";

// Shows "frame 123 / 450 · 4.10s" in the corner, so you can see that
// a video is just a numbered series of still images.
export const FrameCounter: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  return (
    <div
      style={{
        position: "absolute",
        right: 48,
        bottom: 40,
        fontFamily: "Menlo, Consolas, monospace",
        fontSize: 28,
        color: "rgba(255,255,255,0.55)",
      }}
    >
      frame {String(frame).padStart(3, "0")} / {durationInFrames} ·{" "}
      {(frame / fps).toFixed(2)}s
    </div>
  );
};
