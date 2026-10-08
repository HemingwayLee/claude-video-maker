import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade, lerp } from "../anim";
import { Arrow, Layer, NetBlock, NoiseVector } from "../components/Diagram";
import { YTag } from "../components/Cond";
import { Face } from "../components/Face";
import { Label } from "../components/Text";
import { FACE_LABELS, FACE_Z, faceFromZY, gaussian } from "../data";
import { COLORS, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

const Z = gaussian("arch-z", 8);
const G_ROW = 660;
const R_ROW = 300;
const D_Y = 480;
const SAMPLE_X = 640;
const D_X = 960;
const CYCLE = 60;

export const Architecture: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();

  const gIn = fade(frame, L[0]);
  const real = fade(frame, L[1]);
  const dIn = fade(frame, L[2]);

  // Line 3: the label cycles through every class; both rows follow it.
  const label = frame < L[3] ? 2 : Math.floor((frame - L[3]) / 45) % 3;
  const fake = faceFromZY(Z, label);
  const realFace = faceFromZY(FACE_Z[5], label);

  // From line 2: alternate real / fake pairs going into D.
  const feeding = frame >= L[2] + 20;
  const t = feeding ? (frame - (L[2] + 20)) % CYCLE : 0;
  const isReal = feeding && Math.floor((frame - (L[2] + 20)) / CYCLE) % 2 === 0;
  const travel = lerp(t, [0, 30], [0, 1]);
  const fromY = isReal ? R_ROW : G_ROW;
  const tokenX = SAMPLE_X + 170 + (D_X - SAMPLE_X - 170) * travel;
  const tokenY = fromY + (D_Y - fromY) * travel;
  const answer = isReal ? 0.9 : 0.12;
  const shown = feeding ? (t >= 30 ? answer : null) : null;

  return (
    <AbsoluteFill>
      {/* generator row */}
      <NoiseVector values={Z} x={110} y={G_ROW - 130} cell={30} opacity={gIn} />
      <YTag x={250} y={G_ROW + 140} text={FACE_LABELS[label]} opacity={gIn} />
      <NetBlock x={260} y={G_ROW} w={250} h={200} shape="grow" color={ROLE.gen} label="G" sub="generator" opacity={gIn} />
      <div style={{ position: "absolute", left: SAMPLE_X, top: G_ROW - 75, opacity: gIn }}>
        <Face p={fake} size={150} quality={0.8} noiseSeed="arch-fake" border={ROLE.gen} />
      </div>
      <Label x={SAMPLE_X + 75} y={G_ROW + 88} size={24} weight={700} color={ROLE.gen} center opacity={gIn}>
        fake: G(z | y)
      </Label>
      <YTag x={SAMPLE_X - 20} y={G_ROW + 125} text={FACE_LABELS[label]} size={22} opacity={gIn} />

      {/* real pairs */}
      <div style={{ position: "absolute", left: SAMPLE_X, top: R_ROW - 75, opacity: real }}>
        <Face p={realFace} size={150} border={ROLE.real} />
      </div>
      <Label x={SAMPLE_X + 75} y={R_ROW + 88} size={24} weight={700} color={ROLE.real} center opacity={real}>
        real image x
      </Label>
      <YTag x={SAMPLE_X - 20} y={R_ROW - 135} text={FACE_LABELS[label]} size={22} opacity={real} />
      <Label x={SAMPLE_X - 300} y={R_ROW - 20} size={26} color={ROLE.real} opacity={real} width={260}>
        training set: image + its true label →
      </Label>

      <Layer>
        <Arrow id="a1" d={`M 190 ${G_ROW} L 250 ${G_ROW}`} progress={gIn} />
        <Arrow id="a1y" d={`M 330 ${G_ROW + 135} L 340 ${G_ROW + 90}`} color={ROLE.label} progress={gIn} />
        <Arrow id="a2" d={`M 520 ${G_ROW} L 620 ${G_ROW}`} progress={lerp(frame, [L[0] + 20, L[0] + 35], [0, 1])} />
        <Arrow id="a3" d={`M ${SAMPLE_X + 175} ${R_ROW} C 900 ${R_ROW}, 880 ${D_Y - 60}, ${D_X - 10} ${D_Y - 40}`} color={ROLE.real} progress={lerp(frame, [L[2], L[2] + 20], [0, 1])} />
        <Arrow id="a4" d={`M ${SAMPLE_X + 175} ${G_ROW} C 900 ${G_ROW}, 880 ${D_Y + 60}, ${D_X - 10} ${D_Y + 40}`} color={ROLE.gen} progress={lerp(frame, [L[2] + 10, L[2] + 30], [0, 1])} />
        <Arrow id="a5" d={`M ${D_X + 270} ${D_Y} L ${D_X + 340} ${D_Y}`} progress={lerp(frame, [L[2] + 20, L[2] + 35], [0, 1])} />
      </Layer>

      {/* a pair travelling into D */}
      {feeding && travel < 1 ? (
        <div style={{ position: "absolute", left: tokenX - 30, top: tokenY - 30, opacity: 1 - travel * 0.5 }}>
          <Face p={isReal ? realFace : fake} size={60} quality={isReal ? 1 : 0.8} noiseSeed="arch-fake" border={isReal ? ROLE.real : ROLE.gen} />
          <div style={{ position: "absolute", left: 64, top: 14, fontSize: 22, fontWeight: 800, color: ROLE.label, fontStyle: "italic" }}>+y</div>
        </div>
      ) : null}

      <NetBlock x={D_X} y={D_Y} w={260} h={220} shape="shrink" color={ROLE.disc} label="D" sub="discriminator" opacity={fade(frame, L[0] + 10)} />

      <div style={{ position: "absolute", left: D_X + 355, top: D_Y - 110, width: 460, padding: "18px 26px", borderRadius: 18, border: `3px solid ${ROLE.disc}`, background: COLORS.panel, opacity: dIn }}>
        <div style={{ fontSize: 26, color: COLORS.muted }}>
          D(x | <i style={{ color: ROLE.label }}>y</i>) = chance this is a <b style={{ color: COLORS.text }}>real image of y</b>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 12 }}>
          <div style={{ fontFamily: MONO, fontSize: 56, fontWeight: 800, color: ROLE.disc, width: 140 }}>{shown === null ? "–" : shown.toFixed(2)}</div>
          <div style={{ flex: 1, height: 22, borderRadius: 11, background: "rgba(255,255,255,0.08)" }}>
            <div style={{ width: `${(shown ?? 0) * 100}%`, height: "100%", borderRadius: 11, background: ROLE.disc }} />
          </div>
        </div>
      </div>

      <Label x={D_X + 355} y={D_Y + 140} size={26} weight={700} color={ROLE.label} width={460} opacity={fade(frame, L[3])}>
        same game, for every label: y = {FACE_LABELS.join(", ")}
      </Label>
    </AbsoluteFill>
  );
};
