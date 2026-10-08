import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, fadeOut } from "../anim";
import { COLORS, FONT } from "../theme";
import type { Timeline } from "../timeline";
import { useScene } from "../timeline";

// Things drawn around every scene: chapter header, captions, progress bar.

export const SceneHeader: React.FC = () => {
  const frame = useCurrentFrame();
  const { index, title, duration } = useScene();
  if (index === 0) return null; // the intro has its own big title
  const opacity = fade(frame, 0, 15) * fadeOut(frame, duration - 12, 12);
  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        top: 52,
        display: "flex",
        alignItems: "baseline",
        gap: 20,
        fontFamily: FONT,
        opacity,
        transform: `translateX(${(1 - opacity) * -30}px)`,
      }}
    >
      <span style={{ fontSize: 30, fontWeight: 700, color: COLORS.yellow }}>
        {String(index).padStart(2, "0")}
      </span>
      <span style={{ fontSize: 40, fontWeight: 700, color: COLORS.text }}>{title}</span>
    </div>
  );
};

// One caption line; lives inside a <Sequence> for that line.
export const Caption: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity = fade(frame, 0, 6) * fadeOut(frame, durationInFrames - 6, 6);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 46,
        display: "flex",
        justifyContent: "center",
        opacity,
      }}
    >
      <div
        style={{
          maxWidth: 1500,
          padding: "14px 30px",
          borderRadius: 14,
          background: "rgba(5, 8, 20, 0.78)",
          fontFamily: FONT,
          fontSize: 36,
          fontWeight: 500,
          lineHeight: 1.3,
          color: COLORS.text,
          textAlign: "center",
        }}
      >
        {text}
      </div>
    </div>
  );
};

// Thin bar along the bottom edge, one segment per scene.
export const ProgressBar: React.FC<{ timeline: Timeline }> = ({ timeline }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const total = timeline.durationInFrames;
  return (
    <div style={{ position: "absolute", left: 0, bottom: 0, width, height: 8, display: "flex", gap: 3 }}>
      {timeline.scenes.map((s) => {
        const filled = interpolate(frame, [s.from, s.from + s.duration], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={s.id}
            style={{ flex: s.duration / total, height: "100%", background: "rgba(255,255,255,0.08)" }}
          >
            <div style={{ width: `${filled * 100}%`, height: "100%", background: COLORS.yellow }} />
          </div>
        );
      })}
    </div>
  );
};
