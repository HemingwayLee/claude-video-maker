import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Scene 3 (9–15s): "Made with code" with a rotating gradient ring,
// then everything fades to black for the last second.
export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const pop = spring({ frame, fps, config: { damping: 10 } });
  const rotation = interpolate(frame, [0, durationInFrames], [0, 360]);
  const subtitleOpacity = interpolate(frame, [25, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeToBlack = interpolate(
    frame,
    [durationInFrames - 30, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Helvetica, Arial, sans-serif",
        color: "white",
        opacity: fadeToBlack,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 1000,
          height: 1000,
          borderRadius: "50%",
          background:
            "conic-gradient(#ff6b6b, #feca57, #48dbfb, #1dd1a1, #a29bfe, #ff6b6b)",
          transform: `rotate(${rotation}deg) scale(${pop})`,
          // Cut out the middle so only a ring remains.
          WebkitMask: "radial-gradient(circle closest-side, transparent 88%, black 89%)",
          mask: "radial-gradient(circle closest-side, transparent 88%, black 89%)",
        }}
      />
      <div
        style={{
          fontSize: 100,
          fontWeight: 800,
          transform: `scale(${pop})`,
        }}
      >
        Made with code
      </div>
      <div
        style={{
          position: "absolute",
          top: 680,
          fontSize: 40,
          color: "rgba(255,255,255,0.75)",
          opacity: subtitleOpacity,
        }}
      >
        React + Remotion → MP4
      </div>
    </AbsoluteFill>
  );
};
