import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, fadeOut } from "../anim";
import { COLORS, FONT, INK, outline } from "../theme";
import type { Timeline } from "../timeline";
import { useScene } from "../timeline";

// Things drawn around every scene: chapter badge, captions, progress bar.
// Captions sit above the bottom ~250 px, which phone apps (Shorts, Reels,
// TikTok) cover with their own buttons.

export const SceneHeader: React.FC = () => {
  const frame = useCurrentFrame();
  const { index, title, duration } = useScene();
  if (index === 0) return null; // the intro has its own big title
  const opacity = fade(frame, 0, 12) * fadeOut(frame, duration - 12, 12);
  return (
    <div
      style={{
        position: "absolute",
        left: 48,
        top: 70,
        display: "flex",
        alignItems: "center",
        gap: 18,
        fontFamily: FONT,
        opacity,
        transform: `translateX(${(1 - opacity) * -40}px) rotate(-2deg)`,
      }}
    >
      <div
        style={{
          width: 86,
          height: 86,
          borderRadius: 43,
          background: COLORS.yellow,
          border: `6px solid ${INK}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 46,
          fontWeight: 900,
          color: INK,
        }}
      >
        {index}
      </div>
      <div
        style={{
          padding: "10px 30px 14px",
          background: "#fff",
          border: `6px solid ${INK}`,
          borderRadius: 20,
          boxShadow: `8px 8px 0 ${INK}`,
          fontSize: 54,
          fontWeight: 900,
          color: INK,
        }}
      >
        {title}
      </div>
    </div>
  );
};

// One caption line; lives inside a <Sequence> for that line.
export const Caption: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity = fade(frame, 0, 5) * fadeOut(frame, durationInFrames - 5, 5);
  return (
    <div
      style={{
        position: "absolute",
        left: 50,
        right: 50,
        bottom: 300,
        display: "flex",
        justifyContent: "center",
        opacity,
        transform: `translateY(${(1 - fade(frame, 0, 6)) * 14}px)`,
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontSize: 62,
          fontWeight: 900,
          lineHeight: 1.35,
          color: "#fff",
          textAlign: "center",
          textShadow: `${outline(INK, 7)}, 0 8px 0 ${INK}`,
          letterSpacing: 2,
          textWrap: "balance",
        }}
      >
        {text}
      </div>
    </div>
  );
};

// Bar along the top edge, one segment per scene.
export const ProgressBar: React.FC<{ timeline: Timeline }> = ({ timeline }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const total = timeline.durationInFrames;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width, height: 14, display: "flex", gap: 4, background: INK }}>
      {timeline.scenes.map((s) => {
        const filled = interpolate(frame, [s.from, s.from + s.duration], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div key={s.id} style={{ flex: s.duration / total, height: "100%", background: "rgba(255,255,255,0.25)" }}>
            <div style={{ width: `${filled * 100}%`, height: "100%", background: COLORS.yellow }} />
          </div>
        );
      })}
    </div>
  );
};
