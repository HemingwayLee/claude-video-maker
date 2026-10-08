import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, fadeOut, lerp, linear, pop } from "../anim";
import { Grid } from "../components/Grid";
import { Label } from "../components/Text";
import { CAT, type Matrix } from "../data";
import { COLORS, gray, MONO } from "../theme";
import { useLines } from "../timeline";

// 6×6 crop of the cat (its left eye and ear).
const SMALL: Matrix = CAT.slice(2, 8).map((row) => row.slice(1, 7));
const N = 36;
const NEURONS = 8;

// The cat placed on a 24×24 canvas at two positions.
const place = (dr: number, dc: number): Matrix =>
  Array.from({ length: 24 }, (_, r) =>
    Array.from({ length: 24 }, (_, c) => CAT[r - dr]?.[c - dc] ?? 0),
  );
const CORNER = place(0, 0);
const CENTER = place(4, 4);

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

const Barcode: React.FC<{ data: Matrix; width: number; height: number; reveal: number }> = ({ data, width, height, reveal }) => {
  const flat = data.flat();
  const w = width / flat.length;
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <rect width={width} height={height} fill={gray(0)} />
      {flat.map((v, i) =>
        v > 0 && i / flat.length <= reveal ? <rect key={i} x={i * w} y={0} width={w + 0.3} height={height} fill={gray(v)} /> : null,
      )}
    </svg>
  );
};

export const Dense: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  const phaseA = fadeOut(frame, L[3], 15);
  const phaseB = fade(frame, L[3] + 10, 15);

  // Cells fly from the grid into one column.
  const cellPos = (i: number) => {
    const r = Math.floor(i / 6);
    const c = i % 6;
    const t = lerp(frame, [L[0] + 25 + i * 1.5, L[0] + 55 + i * 1.5], [0, 1]);
    const x0 = 160 + c * 50;
    const y0 = 330 + r * 50;
    const x1 = 640;
    const y1 = 160 + i * 19;
    return { x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t, size: 46 - 28 * t };
  };
  const linesIn = fade(frame, L[0] + 100, 40);
  const neuronY = (j: number) => 220 + j * 82;

  const inputs = linear(frame, [L[1] + 20, L[1] + 60], [0, 150528]);
  const weights = linear(frame, [L[2] + 20, L[2] + 70], [0, 150528000]);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: phaseA }}>
        <Label x={160} y={270} size={28} color={COLORS.muted} opacity={fadeOut(frame, L[0] + 25, 10)}>
          image (6 × 6)
        </Label>
        {/* connections */}
        <svg width={1920} height={1080} style={{ position: "absolute", opacity: linesIn * 0.5 }}>
          {Array.from({ length: N }).map((_, i) =>
            Array.from({ length: NEURONS }).map((__, j) => (
              <line key={`${i}-${j}`} x1={649} y1={169 + i * 19} x2={1040} y2={neuronY(j)} stroke={COLORS.magenta} strokeWidth={1} />
            )),
          )}
        </svg>
        {/* pixels → column */}
        {SMALL.flat().map((v, i) => {
          const p = cellPos(i);
          return (
            <div
              key={i}
              style={{ position: "absolute", left: p.x, top: p.y, width: p.size, height: p.size, borderRadius: 4, background: gray(v), border: "1px solid #39406a" }}
            />
          );
        })}
        <Label x={600} y={858} size={26} color={COLORS.muted} opacity={fade(frame, L[0] + 70)}>
          36 inputs
        </Label>
        {/* dense layer */}
        {Array.from({ length: NEURONS }).map((_, j) => {
          const p = pop(frame, fps, L[0] + 80 + j * 3);
          return (
            <div
              key={j}
              style={{
                position: "absolute",
                left: 1040 - 26,
                top: neuronY(j) - 26,
                width: 52,
                height: 52,
                borderRadius: 26,
                background: COLORS.panel,
                border: `4px solid ${COLORS.magenta}`,
                transform: `scale(${p})`,
              }}
            />
          );
        })}
        <Label x={1040} y={858} size={26} color={COLORS.muted} center opacity={linesIn}>
          dense layer: every input → every neuron
        </Label>

        {/* the numbers for a real photo */}
        <div style={{ position: "absolute", left: 1240, top: 260, fontFamily: MONO, color: COLORS.text }}>
          <div style={{ opacity: fade(frame, L[1]), fontSize: 40 }}>224 × 224 × 3</div>
          <div style={{ opacity: fade(frame, L[1] + 15), fontSize: 56, fontWeight: 700, color: COLORS.cyan, marginTop: 8 }}>
            = {fmt(inputs)}
          </div>
          <div style={{ opacity: fade(frame, L[1] + 15), fontSize: 28, color: COLORS.muted }}>inputs</div>
          <div style={{ opacity: fade(frame, L[2]), fontSize: 40, marginTop: 50 }}>× 1,000 neurons</div>
          <div style={{ opacity: fade(frame, L[2] + 15), fontSize: 56, fontWeight: 700, color: COLORS.magenta, marginTop: 8 }}>
            = {fmt(weights)}
          </div>
          <div style={{ opacity: fade(frame, L[2] + 15), fontSize: 28, color: COLORS.muted }}>weights, in layer one alone</div>
        </div>
      </AbsoluteFill>

      {/* the same cat, two positions → unrelated vectors */}
      <AbsoluteFill style={{ opacity: phaseB }}>
        {[
          { img: CORNER, x: 420, label: "cat in the corner", color: COLORS.cyan },
          { img: CENTER, x: 1200, label: "cat in the center", color: COLORS.yellow },
        ].map((v) => (
          <div key={v.label} style={{ position: "absolute", left: v.x, top: 150 }}>
            <Grid data={v.img} cell={12} color={gray} gap={0} style={{ border: `3px solid ${v.color}`, boxSizing: "content-box" }} />
            <Label x={144} y={300} size={30} color={v.color} center weight={600}>
              {v.label}
            </Label>
          </div>
        ))}
        <Label x={960} y={240} size={110} weight={800} color={COLORS.red} center opacity={fade(frame, L[3] + 70)}>
          ≠
        </Label>
        {[
          { img: CORNER, y: 560, color: COLORS.cyan },
          { img: CENTER, y: 680, color: COLORS.yellow },
        ].map((v) => (
          <div key={v.y} style={{ position: "absolute", left: 160, top: v.y, border: `3px solid ${v.color}`, borderRadius: 6, overflow: "hidden" }}>
            <Barcode data={v.img} width={1600} height={70} reveal={linear(frame, [L[3] + 25, L[3] + 70], [0, 1])} />
          </div>
        ))}
        <Label x={960} y={780} size={30} color={COLORS.muted} center opacity={fade(frame, L[3] + 70)}>
          same cat, just shifted: a completely different list of 576 numbers
        </Label>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
