import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade } from "../anim";
import { PixelImage } from "../components/PixelImage";
import { Label } from "../components/Text";
import { finalOutput, TEST_TARGETS, TRACE } from "../data";
import { COLORS, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

// The trained PatchGAN (from the L1 + cGAN run) scores three kinds of
// answers for the same input, patch by patch.
const ROWS = [0, 1];
const RUN = TRACE.runs.both;
const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
const COLS = [
  { name: "real y", color: ROLE.real, im: (i: number) => TEST_TARGETS[i], p: (i: number) => RUN.patches[i].real },
  { name: "Pix2Pix output", color: ROLE.gen, im: (i: number) => finalOutput("both", i), p: (i: number) => RUN.patches[i].fake },
  { name: "L1-only output", color: ROLE.l1, im: (i: number) => finalOutput("l1", i), p: (i: number) => RUN.patchesL1![i] },
];

export const Patches: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();
  const size = 255;
  return (
    <AbsoluteFill>
      {COLS.map((c, ci) => {
        const x = 340 + ci * 430;
        const overlay = fade(frame, L[ci + 1] + 5, 15);
        return (
          <React.Fragment key={ci}>
            <Label x={x + size / 2} y={150} size={30} weight={800} center color={c.color} opacity={fade(frame, L[0] + ci * 10)}>
              {c.name}
            </Label>
            {ROWS.map((r, ri) => (
              <React.Fragment key={r}>
                <PixelImage im={c.im(r)} x={x} y={210 + ri * 330} size={size} border={c.color} patches={c.p(r)} patchOpacity={overlay} opacity={fade(frame, L[0] + ci * 10)} />
                <Label x={x + size / 2} y={210 + ri * 330 + size + 12} size={24} mono center color={COLORS.muted} opacity={overlay}>
                  mean D = {mean(c.p(r)).toFixed(2)}
                </Label>
              </React.Fragment>
            ))}
          </React.Fragment>
        );
      })}
      <div style={{ position: "absolute", left: 1700, top: 300, fontFamily: MONO, fontSize: 24, color: COLORS.text, opacity: fade(frame, L[1]) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ width: 34, height: 34, borderRadius: 6, background: "rgba(6,214,160,0.85)" }} /> real
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 6, background: "rgba(239,71,111,0.85)" }} /> fake
        </div>
        <div style={{ marginTop: 24, fontSize: 18, color: COLORS.muted, width: 190, fontFamily: "inherit" }}>one cell = one 18×18 patch</div>
      </div>
    </AbsoluteFill>
  );
};
