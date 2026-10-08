import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const TEXT = "Hello, World!";

// Scene 1 (0–4s): each letter springs up one after another.
export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Fade the whole scene out during its last 15 frames.
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: fadeOut,
      }}
    >
      <div
        style={{
          fontFamily: "Helvetica, Arial, sans-serif",
          fontSize: 180,
          fontWeight: 800,
          color: "white",
          display: "flex",
        }}
      >
        {TEXT.split("").map((char, i) => {
          // spring() goes from 0 to 1 with a natural bounce.
          // Delaying by 3 frames per letter makes them pop in one at a time.
          const progress = spring({
            frame: frame - i * 3,
            fps,
            config: { damping: 12 },
          });
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                whiteSpace: "pre",
                opacity: progress,
                transform: `translateY(${(1 - progress) * 120}px)`,
              }}
            >
              {char}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
