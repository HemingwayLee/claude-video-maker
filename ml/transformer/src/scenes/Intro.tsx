import React from "react";
import { AbsoluteFill, random, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, pop } from "../anim";
import { Chip } from "../components/Token";
import { COLORS, ROLE } from "../theme";
import { useLines } from "../timeline";

const WORDS = ["Attention", "is", "all", "you", "need"];
const CHIP_W = [170, 70, 80, 90, 110];
const GAP = 14;
const X0 = 140;
const Y = 640;
const xs = CHIP_W.reduce<number[]>((acc, w, i) => [...acc, i === 0 ? X0 : acc[i - 1] + CHIP_W[i - 1] + GAP], []);
const center = (i: number) => xs[i] + CHIP_W[i] / 2;

const BLOCKS = [
  { text: "Embeddings", color: ROLE.token },
  { text: "Attention", color: ROLE.attn },
  { text: "Feed-forward", color: ROLE.ffn },
  { text: "Stacking", color: COLORS.green },
];

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  const title = pop(frame, fps, L[1], 16);
  const arcs = fade(frame, L[0] + 30, 25);

  return (
    <AbsoluteFill>
      {/* a sentence, every word attending to every other */}
      <svg width={1920} height={1080} style={{ position: "absolute", opacity: arcs }}>
        {WORDS.flatMap((_, i) =>
          WORDS.map((__, j) => {
            if (j <= i) return null;
            const a = center(i);
            const b = center(j);
            const h = 60 + (b - a) * 0.7;
            const w = 0.5 + 0.5 * Math.sin(frame / 18 + random(`arc-${i}-${j}`) * 6.28);
            return <path key={`${i}-${j}`} d={`M ${a} ${Y - 6} C ${a} ${Y - h}, ${b} ${Y - h}, ${b} ${Y - 6}`} fill="none" stroke={ROLE.attn} strokeWidth={2 + 7 * w} strokeOpacity={0.25 + 0.6 * w} />;
          }),
        )}
      </svg>
      {WORDS.map((w, i) => (
        <Chip key={w} x={xs[i]} y={Y} w={CHIP_W[i]} text={w} opacity={fade(frame, L[0] + i * 5)} />
      ))}
      <div style={{ position: "absolute", left: X0, top: Y + 90, fontSize: 26, color: COLORS.muted, opacity: arcs }}>every word looks at every other word</div>

      {/* the title */}
      <div style={{ position: "absolute", left: 920, top: 250, opacity: title, transform: `translateY(${(1 - title) * 40}px)` }}>
        <div style={{ fontSize: 32, fontWeight: 600, color: ROLE.attn, letterSpacing: 6 }}>THE ARCHITECTURE BEHIND MODERN AI</div>
        <div style={{ fontSize: 130, fontWeight: 800, color: COLORS.text, lineHeight: 1.04, marginTop: 16 }}>Transformers</div>
        <div style={{ fontSize: 36, fontWeight: 600, color: COLORS.muted, marginTop: 18 }}>
          “Attention Is All You Need” · <span style={{ color: COLORS.yellow }}>2017</span>
        </div>
      </div>

      <div style={{ position: "absolute", left: 920, top: 640, display: "flex", gap: 16 }}>
        {BLOCKS.map((b, i) => {
          const p = pop(frame, fps, L[2] + i * 8);
          return (
            <div key={b.text} style={{ padding: "12px 24px", borderRadius: 40, border: `3px solid ${b.color}`, color: b.color, fontSize: 30, fontWeight: 700, opacity: Math.min(1, p), transform: `scale(${p})` }}>
              {b.text}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
