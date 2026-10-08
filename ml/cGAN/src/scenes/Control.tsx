import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade } from "../anim";
import { YTag } from "../components/Cond";
import { Face } from "../components/Face";
import { Label } from "../components/Text";
import { FACE_LABELS, FACE_Z, faceFromZY } from "../data";
import { COLORS, ROLE } from "../theme";
import { useLines } from "../timeline";

const COLS = [0, 3, 5, 7, 10]; // which noise vectors z to use
const SIZE = 130;
const STEP_X = 155;
const STEP_Y = 165;
const X0 = 640;
const Y0 = 240;
const HL_ROW = 2; // the row highlighted for "fix y"
const HL_COL = 2; // the column highlighted for "fix z"

export const Control: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();

  const rowOn = frame >= L[1] && frame < L[2];
  const colOn = frame >= L[2] && frame < L[3];
  const dim = (r: number, c: number) => (rowOn ? (r === HL_ROW ? 1 : 0.25) : colOn ? (c === HL_COL ? 1 : 0.25) : 1);

  return (
    <AbsoluteFill>
      {FACE_LABELS.map((lab, r) => (
        <YTag key={lab} x={X0 - 230} y={Y0 + r * STEP_Y + 42} text={lab} opacity={fade(frame, L[0] + r * 6)} />
      ))}
      {COLS.map((_, c) => (
        <Label key={c} x={X0 + c * STEP_X + SIZE / 2} y={Y0 - 50} size={30} weight={800} color={ROLE.noise} center opacity={fade(frame, L[0])}>
          <i>z</i>
          <sub style={{ fontSize: 18 }}>{c + 1}</sub>
        </Label>
      ))}
      {FACE_LABELS.map((_, r) =>
        COLS.map((zi, c) => (
          <div key={`${r}-${c}`} style={{ position: "absolute", left: X0 + c * STEP_X, top: Y0 + r * STEP_Y, opacity: fade(frame, L[0] + 5 + (r + c) * 3) * dim(r, c) }}>
            <Face p={faceFromZY(FACE_Z[zi], r)} size={SIZE} border={(rowOn && r === HL_ROW) || (colOn && c === HL_COL) ? COLORS.yellow : undefined} />
          </div>
        )),
      )}
      {/* highlight frames */}
      <div style={{ position: "absolute", left: X0 - 12, top: Y0 + HL_ROW * STEP_Y - 12, width: COLS.length * STEP_X - STEP_X + SIZE + 24, height: SIZE + 24, borderRadius: 18, border: `4px solid ${ROLE.label}`, opacity: rowOn ? 1 : 0 }} />
      <div style={{ position: "absolute", left: X0 + HL_COL * STEP_X - 12, top: Y0 - 12, width: SIZE + 24, height: 2 * STEP_Y + SIZE + 24, borderRadius: 18, border: `4px solid ${ROLE.noise}`, opacity: colOn ? 1 : 0 }} />

      <div style={{ position: "absolute", left: 1450, top: 260, width: 400, fontSize: 30, lineHeight: 1.4 }}>
        <div style={{ opacity: fade(frame, L[1]), marginBottom: 30 }}>
          <b style={{ color: ROLE.label }}>fix y, vary z</b>
          <div style={{ fontSize: 24, color: COLORS.muted }}>same kind, different people</div>
        </div>
        <div style={{ opacity: fade(frame, L[2]), marginBottom: 30 }}>
          <b style={{ color: ROLE.noise }}>fix z, vary y</b>
          <div style={{ fontSize: 24, color: COLORS.muted }}>same person, the attribute you asked for</div>
        </div>
        <div style={{ opacity: fade(frame, L[3]), fontSize: 26 }}>
          <span style={{ color: ROLE.label }}>y</span>: what you asked for
          <br />
          <span style={{ color: ROLE.noise }}>z</span>: everything else
        </div>
      </div>
      <Label x={X0} y={Y0 + 3 * STEP_Y + 4} size={20} color={COLORS.muted} opacity={fade(frame, L[0] + 30)}>
        (stylized faces; in a trained image cGAN the split is learned, and not always this clean)
      </Label>
    </AbsoluteFill>
  );
};
