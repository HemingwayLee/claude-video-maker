import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, lerp, pop } from "../anim";
import { Arrow, Layer } from "../components/Diagram";
import { MatrixView } from "../components/MatrixView";
import { Label } from "../components/Text";
import { HEAD_TOKENS, HEADS } from "../data";
import { COLORS, heat, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

const CELL = 42;
const SIZE = CELL * HEAD_TOKENS.length;
const XS = [200, 790, 1380];
const Y = 330;
const HEAD_COLORS = [COLORS.yellow, ROLE.attn, COLORS.magenta];

export const MultiHead: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  // Line 0: just the middle head. Line 1: all three.
  const others = fade(frame, L[1]);
  const names = fade(frame, L[2]);
  const concat = fade(frame, L[3]);

  return (
    <AbsoluteFill>
      {HEADS.map((h, k) => {
        const on = k === 1 ? fade(frame, L[0]) : others;
        const p = k === 1 ? 1 : pop(frame, fps, L[1] + (k === 0 ? 0 : 10), 14);
        return (
          <div key={k} style={{ opacity: on, transform: `scale(${Math.min(1, p)})`, transformOrigin: `${XS[k] + SIZE / 2}px ${Y + SIZE / 2}px`, position: "absolute", inset: 0 }}>
            <MatrixView
              m={h.m}
              x={XS[k]}
              y={Y}
              cell={CELL}
              color={(v) => heat(v / 0.75, HEAD_COLORS[k])}
              showValues={false}
              rowLabels={HEAD_TOKENS}
              colLabels={HEAD_TOKENS.map((t) => (t.length > 4 ? t.slice(0, 4) + "." : t))}
              title={
                <span>
                  head {k + 1}
                  <span style={{ fontSize: 22, fontWeight: 600, color: COLORS.muted, opacity: names }}> · {h.name}</span>
                </span>
              }
              titleColor={HEAD_COLORS[k]}
            />
            <div style={{ position: "absolute", left: XS[k], top: Y + SIZE + 12, width: SIZE, textAlign: "center", fontFamily: MONO, fontSize: 20, color: COLORS.muted, opacity: others }}>
              own W_Q, W_K, W_V
            </div>
          </div>
        );
      })}
      <Label x={960} y={Y + SIZE + 60} size={24} color={COLORS.muted} center opacity={fade(frame, L[0] + 20) * (1 - others)}>
        one head: one pattern of who-looks-at-whom
      </Label>
      <Label x={XS[0] - 125} y={Y + SIZE + 8} size={20} color={COLORS.muted} opacity={names} width={100}>
        rows look at columns
      </Label>

      {/* concatenate and mix */}
      <Layer opacity={concat}>
        {XS.map((x, k) => (
          <Arrow key={k} id={`c${k}`} d={`M ${x + SIZE / 2} ${Y + SIZE + 45} C ${x + SIZE / 2} ${Y + SIZE + 85}, 760 ${Y + SIZE + 75}, ${760 + k * 60} ${Y + SIZE + 105}`} color={HEAD_COLORS[k]} width={3} progress={lerp(frame, [L[3], L[3] + 25], [0, 1])} />
        ))}
      </Layer>
      <div style={{ position: "absolute", left: 720, top: Y + SIZE + 115, display: "flex", alignItems: "center", gap: 14, fontSize: 28, fontWeight: 700, opacity: fade(frame, L[3] + 20) }}>
        <div style={{ display: "flex", border: `3px solid ${COLORS.muted}`, borderRadius: 8, overflow: "hidden" }}>
          {HEAD_COLORS.map((c, k) => (
            <div key={k} style={{ width: 60, height: 36, background: c }} />
          ))}
        </div>
        <span style={{ color: COLORS.muted }}>concatenate → × W_O →</span>
        <div style={{ width: 120, height: 36, borderRadius: 8, background: COLORS.text }} />
        <span style={{ color: COLORS.muted, fontSize: 22, fontWeight: 500 }}>original paper: 8 heads × 64 = 512</span>
      </div>
      <div style={{ position: "absolute", right: 110, top: 200, fontFamily: MONO, fontSize: 18, color: COLORS.muted, opacity: names }}>(typical patterns, illustrated)</div>
    </AbsoluteFill>
  );
};
