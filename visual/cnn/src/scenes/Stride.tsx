import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade } from "../anim";
import { Grid, Window } from "../components/Grid";
import { Card, Label } from "../components/Text";
import { CAT, type Matrix } from "../data";
import { COLORS, gray, MONO } from "../theme";
import { useLines } from "../timeline";

const CELL = 54;
const STRIDE_IN: Matrix = CAT.slice(3, 10).map((row) => row.slice(3, 10)); // 7×7
const PAD_CORE: Matrix = CAT.slice(5, 10).map((row) => row.slice(5, 10)); // 5×5
const PADDED: Matrix = Array.from({ length: 7 }, (_, r) =>
  Array.from({ length: 7 }, (_, c) => (r === 0 || c === 0 || r === 6 || c === 6 ? 0 : PAD_CORE[r - 1][c - 1])),
);
const isPad = (r: number, c: number) => r === 0 || c === 0 || r === 6 || c === 6;

// Index of the current kernel position, looping, one step every `every` frames.
const stepAt = (frame: number, start: number, every: number, count: number) =>
  frame < start ? -1 : Math.floor((frame - start) / every) % count;
const visited = (frame: number, start: number, every: number, count: number) =>
  frame < start ? 0 : Math.min(count, Math.floor((frame - start) / every) + 1);

export const Stride: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();

  // stride 2 on 7×7 → 3×3 positions
  const s = stepAt(frame, L[1] + 25, 14, 9);
  const sDone = visited(frame, L[1] + 25, 14, 9);
  const sPos = { r: Math.floor(Math.max(0, s) / 3) * 2, c: (Math.max(0, s) % 3) * 2 };

  // padding 1 on 5×5 (7×7 with the border) → 5×5 positions
  const p = stepAt(frame, L[2] + 25, 6, 25);
  const pDone = visited(frame, L[2] + 25, 6, 25);
  const pPos = { r: Math.floor(Math.max(0, p) / 5), c: Math.max(0, p) % 5 };

  const left = fade(frame, L[1]);
  const right = fade(frame, L[2]);

  return (
    <AbsoluteFill>
      {/* ── stride ── */}
      <Card x={110} y={150} w={830} h={600} opacity={left} accent={COLORS.cyan} />
      <AbsoluteFill style={{ opacity: left }}>
        <Label x={150} y={175} size={38} weight={700} color={COLORS.cyan}>
          Stride = 2
        </Label>
        <Label x={150} y={225} size={26} color={COLORS.muted}>
          jump 2 pixels each step
        </Label>
        <div style={{ position: "absolute", left: 150, top: 300 }}>
          <Grid data={STRIDE_IN} cell={CELL} color={gray}>
            {s >= 0 ? <Window row={sPos.r} col={sPos.c} size={3} cell={CELL} color={COLORS.cyan} /> : null}
          </Grid>
        </div>
        <Label x={590} y={460} size={44} color={COLORS.muted}>
          →
        </Label>
        <div style={{ position: "absolute", left: 670, top: 390 }}>
          <Grid data={[[0, 0, 0], [0, 0, 0], [0, 0, 0]]} cell={CELL} color={(_, r, c) => (r * 3 + c < sDone ? COLORS.cyan : "rgba(255,255,255,0.06)")} />
        </div>
        <Label x={150} y={690} size={30} mono>
          7 × 7 → <span style={{ color: COLORS.cyan }}>3 × 3</span>
        </Label>
      </AbsoluteFill>

      {/* ── padding ── */}
      <Card x={980} y={150} w={830} h={600} opacity={right} accent={COLORS.green} />
      <AbsoluteFill style={{ opacity: right }}>
        <Label x={1020} y={175} size={38} weight={700} color={COLORS.green}>
          Padding = 1
        </Label>
        <Label x={1020} y={225} size={26} color={COLORS.muted}>
          a border of zeros around the image
        </Label>
        <div style={{ position: "absolute", left: 1020, top: 300 }}>
          <Grid
            data={PADDED}
            cell={CELL}
            color={(v, r, c) => (isPad(r, c) ? "rgba(6,214,160,0.10)" : gray(v))}
            showValues={isPad}
            fontSize={20}
          >
            <div style={{ position: "absolute", left: CELL, top: CELL, width: 5 * CELL, height: 5 * CELL, border: "2px dashed rgba(255,255,255,0.5)", boxSizing: "border-box" }} />
            {p >= 0 ? <Window row={pPos.r} col={pPos.c} size={3} cell={CELL} color={COLORS.green} /> : null}
          </Grid>
        </div>
        <Label x={1440} y={460} size={44} color={COLORS.muted}>
          →
        </Label>
        <div style={{ position: "absolute", left: 1510, top: 380 }}>
          <Grid data={Array.from({ length: 5 }, () => [0, 0, 0, 0, 0])} cell={44} color={(_, r, c) => (r * 5 + c < pDone ? COLORS.green : "rgba(255,255,255,0.06)")} />
        </div>
        <Label x={1020} y={690} size={30} mono>
          5 × 5 → <span style={{ color: COLORS.green }}>5 × 5</span> (same size)
        </Label>
      </AbsoluteFill>

      {/* the rule behind both */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 790,
          textAlign: "center",
          fontFamily: MONO,
          fontSize: 40,
          color: COLORS.text,
          opacity: fade(frame, L[0] + 10),
        }}
      >
        output = (<span style={{ color: COLORS.muted }}>input</span> + 2·<span style={{ color: COLORS.green }}>padding</span> − <span style={{ color: COLORS.yellow }}>kernel</span>) / <span style={{ color: COLORS.cyan }}>stride</span> + 1
      </div>
    </AbsoluteFill>
  );
};
