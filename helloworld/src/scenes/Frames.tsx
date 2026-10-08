import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const COLORS = ["#ff6b6b", "#feca57", "#48dbfb", "#1dd1a1", "#a29bfe"];
const CARD_COUNT = 5;

// Scene 2 (4–9s): explains that a video is a stack of still frames.
// Five "frame" cards slide in, and a small ball moves a bit further in each
// card, like a flip-book.
export const Frames: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
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
        gap: 70,
        fontFamily: "Helvetica, Arial, sans-serif",
        color: "white",
        opacity: fadeOut,
      }}
    >
      <div style={{ fontSize: 80, fontWeight: 700, opacity: titleOpacity }}>
        A video is just many pictures
      </div>

      <div style={{ display: "flex", gap: 40 }}>
        {new Array(CARD_COUNT).fill(true).map((_, i) => {
          const enter = spring({ frame: frame - 15 - i * 8, fps });
          return (
            <div
              key={i}
              style={{
                width: 260,
                height: 180,
                borderRadius: 16,
                border: `4px solid ${COLORS[i]}`,
                position: "relative",
                opacity: enter,
                transform: `scale(${enter})`,
              }}
            >
              {/* The ball moves right a little more in each card. */}
              <div
                style={{
                  position: "absolute",
                  top: 65,
                  left: 20 + i * 45,
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  backgroundColor: COLORS[i],
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: -50,
                  width: "100%",
                  textAlign: "center",
                  fontSize: 28,
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                frame {i + 1}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          fontSize: 44,
          marginTop: 30,
          color: "rgba(255,255,255,0.8)",
          opacity: interpolate(frame, [70, 90], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        Show {fps} of them every second → motion
      </div>
    </AbsoluteFill>
  );
};
