import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, pop } from "../anim";
import { COLORS, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

// The whole pipeline, bottom to top, one step per chip.
const STEPS = [
  { text: "tokens", color: ROLE.token, line: 0 },
  { text: "embedding + position", color: ROLE.pos, line: 0 },
  { text: "multi-head attention (Q · K · V)", color: ROLE.attn, line: 1, block: true },
  { text: "add & norm", color: COLORS.green, line: 2, block: true },
  { text: "feed-forward", color: ROLE.ffn, line: 2, block: true },
  { text: "add & norm", color: COLORS.green, line: 2, block: true },
  { text: "next-token probabilities", color: COLORS.yellow, line: 2 },
];

const ROW_H = 84;
const BOTTOM = 800;

export const Recap: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();
  const firstBlock = STEPS.findIndex((s) => s.block);
  const lastBlock = STEPS.length - 1 - [...STEPS].reverse().findIndex((s) => s.block);

  return (
    <AbsoluteFill>
      {STEPS.map((s, i) => {
        const p = pop(frame, fps, L[s.line] + 10 + i * 8, 14);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 560,
              top: BOTTOM - (i + 1) * ROW_H,
              width: 800,
              height: ROW_H - 18,
              borderRadius: 14,
              border: `3px solid ${s.color}`,
              background: `${s.color}22`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              fontWeight: 800,
              color: s.color,
              opacity: Math.min(1, p),
              transform: `scale(${0.9 + 0.1 * Math.min(1, p)})`,
            }}
          >
            {s.text}
          </div>
        );
      })}
      {/* the repeated block */}
      <div
        style={{
          position: "absolute",
          left: 530,
          top: BOTTOM - (lastBlock + 1) * ROW_H - 14,
          width: 860,
          height: (lastBlock - firstBlock + 1) * ROW_H + 10,
          borderRadius: 20,
          border: `3px dashed ${COLORS.muted}`,
          opacity: fade(frame, L[2] + 50),
        }}
      />
      <div style={{ position: "absolute", left: 1410, top: BOTTOM - (lastBlock + 1) * ROW_H + 110, fontFamily: MONO, fontSize: 48, fontWeight: 800, color: COLORS.yellow, opacity: fade(frame, L[2] + 50) }}>× N</div>
      <div style={{ position: "absolute", left: 120, top: 380, width: 380, fontSize: 30, lineHeight: 1.5, opacity: fade(frame, L[1] + 20) }}>
        Attention:
        <br />
        <span style={{ color: ROLE.query }}>query</span> asks,
        <br />
        <span style={{ color: ROLE.key }}>key</span> matches,
        <br />
        <span style={{ color: ROLE.value }}>value</span> is passed on.
      </div>
      <div style={{ position: "absolute", left: 1410, top: 250, width: 420, fontSize: 26, color: COLORS.muted, opacity: fade(frame, L[2] + 70) }}>
        softmax(QKᵀ/√d)·V
        <br />
        the one line at the heart of it
      </div>
    </AbsoluteFill>
  );
};
