import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, lerp, pop } from "../anim";
import { Grid } from "../components/Grid";
import { Label } from "../components/Text";
import { POOL_IN } from "../data";
import { COLORS, MONO } from "../theme";
import { useLines } from "../timeline";

const CELL = 110;
const IN = { x: 260, y: 220 };
const OUT = { x: 1220, y: 330 };
const BLOCK_COLORS = [COLORS.cyan, COLORS.magenta, COLORS.yellow, COLORS.green];

const blockOf = (r: number, c: number) => Math.floor(r / 2) * 2 + Math.floor(c / 2);
const BLOCKS = [0, 1, 2, 3].map((b) => {
  const r0 = Math.floor(b / 2) * 2;
  const c0 = (b % 2) * 2;
  let best = { r: r0, c: c0, v: -Infinity };
  for (let r = r0; r < r0 + 2; r++) for (let c = c0; c < c0 + 2; c++) if (POOL_IN[r][c] > best.v) best = { r, c, v: POOL_IN[r][c] };
  return best;
});

const tint = (hex: string, alpha: number) =>
  `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${alpha})`;

export const Pooling: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  const blockStart = (b: number) => L[1] + 25 + b * 22;
  const isWinner = (r: number, c: number) => BLOCKS[blockOf(r, c)].r === r && BLOCKS[blockOf(r, c)].c === c;

  return (
    <AbsoluteFill>
      <Label x={IN.x} y={IN.y - 60} size={30} color={COLORS.muted} opacity={fade(frame, L[0])}>
        feature map (4 × 4)
      </Label>
      <div style={{ position: "absolute", left: IN.x, top: IN.y, transform: `scale(${pop(frame, fps, L[0])})` }}>
        <Grid
          data={POOL_IN}
          cell={CELL}
          showValues
          fontSize={44}
          color={(_, r, c) => {
            const b = blockOf(r, c);
            const on = fade(frame, blockStart(b), 8);
            const win = isWinner(r, c) ? on : 0;
            return tint(BLOCK_COLORS[b], 0.12 + 0.18 * on + 0.55 * win);
          }}
        >
          {/* block outlines */}
          {[0, 1, 2, 3].map((b) => (
            <div
              key={b}
              style={{
                position: "absolute",
                left: (b % 2) * 2 * CELL,
                top: Math.floor(b / 2) * 2 * CELL,
                width: 2 * CELL,
                height: 2 * CELL,
                border: `4px solid ${BLOCK_COLORS[b]}`,
                borderRadius: 12,
                boxSizing: "border-box",
                opacity: fade(frame, L[1] + b * 6),
              }}
            />
          ))}
        </Grid>
      </div>

      <Label x={830} y={IN.y + 170} size={34} weight={700} color={COLORS.text} opacity={fade(frame, L[1])}>
        max of each 2 × 2
      </Label>
      <Label x={900} y={IN.y + 210} size={70} color={COLORS.muted} opacity={fade(frame, L[1])}>
        ⟶
      </Label>

      {/* output */}
      <Label x={OUT.x} y={OUT.y - 60} size={30} color={COLORS.muted} opacity={fade(frame, L[1])}>
        pooled (2 × 2)
      </Label>
      <div style={{ position: "absolute", left: OUT.x, top: OUT.y, opacity: fade(frame, L[1]) }}>
        <Grid data={[[0, 0], [0, 0]]} cell={CELL} color={() => "rgba(255,255,255,0.05)"} />
      </div>
      {BLOCKS.map((best, b) => {
        // The winning value flies from its block into the output.
        const t = lerp(frame, [blockStart(b) + 6, blockStart(b) + 20], [0, 1]);
        if (t <= 0) return null;
        const from = { x: IN.x + best.c * CELL, y: IN.y + best.r * CELL };
        const to = { x: OUT.x + (b % 2) * CELL, y: OUT.y + Math.floor(b / 2) * CELL };
        return (
          <div
            key={b}
            style={{
              position: "absolute",
              left: from.x + (to.x - from.x) * t + 1,
              top: from.y + (to.y - from.y) * t + 1,
              width: CELL - 2,
              height: CELL - 2,
              borderRadius: 12,
              background: tint(BLOCK_COLORS[b], 0.8),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: MONO,
              fontSize: 44,
              fontWeight: 700,
              color: "#0b1021",
              boxShadow: `0 0 30px ${tint(BLOCK_COLORS[b], 0.6)}`,
            }}
          >
            {best.v}
          </div>
        );
      })}

      <div style={{ position: "absolute", left: 1220, top: 620, fontSize: 30, lineHeight: 1.6, color: COLORS.text, opacity: fade(frame, L[2]) }}>
        <div>
          <span style={{ fontFamily: MONO, color: COLORS.yellow }}>16 → 4</span> values (4× smaller)
        </div>
        <div style={{ opacity: fade(frame, L[2] + 30) }}>keeps the strongest responses</div>
        <div style={{ opacity: fade(frame, L[2] + 55) }}>tolerant to small shifts</div>
        <div style={{ opacity: fade(frame, L[2] + 80) }}>no weights to learn</div>
      </div>
    </AbsoluteFill>
  );
};
