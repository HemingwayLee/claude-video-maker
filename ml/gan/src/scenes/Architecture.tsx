import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade, lerp } from "../anim";
import { Arrow, Layer, NetBlock, NoiseVector } from "../components/Diagram";
import { Face } from "../components/Face";
import { Label } from "../components/Text";
import { FACE_Z, faceFromZ, gaussian } from "../data";
import { COLORS, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

const Z = gaussian("arch-z", 8);
const FAKE = faceFromZ(Z);
const REALS = [FACE_Z[5], FACE_Z[7], FACE_Z[9]].map(faceFromZ);

const G_ROW = 660; // center line of the generator row
const R_ROW = 300; // center line of the real-data row
const D_Y = 480; // discriminator center
const SAMPLE_X = 640; // left edge of the samples column
const D_X = 930;

// While samples are fed to D: which one (real or fake), and D's answer.
const CYCLE = 60;

export const Architecture: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();

  const gIn = fade(frame, L[1]);
  const dIn = fade(frame, L[2]);
  const out = fade(frame, L[3]);
  const feedback = lerp(frame, [L[4], L[4] + 40], [0, 1]);

  // Feeding: from line 2 on, alternate real / fake samples into D.
  const feeding = frame >= L[2] + 20;
  const t = feeding ? (frame - (L[2] + 20)) % CYCLE : 0;
  const isReal = feeding && Math.floor((frame - (L[2] + 20)) / CYCLE) % 2 === 0;
  const travel = lerp(t, [0, 30], [0, 1]);
  const fromY = isReal ? R_ROW : G_ROW;
  const tokenX = SAMPLE_X + 170 + (D_X - SAMPLE_X - 170) * travel;
  const tokenY = fromY + (D_Y - fromY) * travel;
  const answer = isReal ? 0.91 : 0.07;
  const shown = frame >= L[3] && feeding ? (t >= 30 ? answer : 0.5) : null;

  return (
    <AbsoluteFill>
      {/* the generator row */}
      <NoiseVector values={Z} x={110} y={G_ROW - 130} cell={30} opacity={gIn} />
      <Label x={125} y={G_ROW + 150} size={22} color={COLORS.muted} center opacity={gIn}>
        random noise
      </Label>
      <NetBlock x={260} y={G_ROW} w={250} h={200} shape="grow" color={ROLE.gen} label="G" sub="generator" opacity={fade(frame, L[0])} glow={feedback * (0.5 + 0.5 * Math.sin(frame / 6))} />
      <div style={{ position: "absolute", left: SAMPLE_X, top: G_ROW - 75, opacity: gIn }}>
        <Face p={FAKE} size={150} quality={0.75} noiseSeed="arch-fake" border={ROLE.gen} />
      </div>
      <Label x={SAMPLE_X + 75} y={G_ROW + 90} size={26} weight={700} color={ROLE.gen} center opacity={gIn}>
        fake: G(z)
      </Label>

      {/* the real data row */}
      {REALS.map((p, i) => (
        <div key={i} style={{ position: "absolute", left: SAMPLE_X + 20 - i * 14, top: R_ROW - 75 - i * 14, opacity: dIn, zIndex: -i }}>
          <Face p={p} size={150} border={ROLE.real} />
        </div>
      ))}
      <Label x={SAMPLE_X + 75} y={R_ROW + 90} size={26} weight={700} color={ROLE.real} center opacity={dIn}>
        real: x
      </Label>
      <Label x={SAMPLE_X - 270} y={R_ROW - 20} size={28} color={ROLE.real} opacity={dIn}>
        training set →
      </Label>

      <Layer>
        <Arrow id="a1" d={`M 190 ${G_ROW} L 250 ${G_ROW}`} progress={lerp(frame, [L[1] + 5, L[1] + 20], [0, 1])} />
        <Arrow id="a2" d={`M 520 ${G_ROW} L 620 ${G_ROW}`} progress={lerp(frame, [L[1] + 20, L[1] + 35], [0, 1])} />
        <Arrow id="a3" d={`M ${SAMPLE_X + 175} ${R_ROW} C 880 ${R_ROW}, 860 ${D_Y - 60}, ${D_X - 10} ${D_Y - 40}`} color={ROLE.real} progress={lerp(frame, [L[2], L[2] + 20], [0, 1])} />
        <Arrow id="a4" d={`M ${SAMPLE_X + 175} ${G_ROW} C 880 ${G_ROW}, 860 ${D_Y + 60}, ${D_X - 10} ${D_Y + 40}`} color={ROLE.gen} progress={lerp(frame, [L[2] + 10, L[2] + 30], [0, 1])} />
        <Arrow id="a5" d={`M ${D_X + 270} ${D_Y} L ${D_X + 350} ${D_Y}`} progress={lerp(frame, [L[3], L[3] + 15], [0, 1])} />
        {/* the feedback path: D's verdict → back into G */}
        <Arrow
          id="a6"
          d={`M ${D_X + 130} ${D_Y + 110} C ${D_X + 130} 900, 400 900, 390 ${G_ROW + 110}`}
          color={ROLE.gen}
          width={5}
          progress={feedback}
          flow={frame}
        />
      </Layer>

      {/* a sample travelling into D */}
      {feeding && travel < 1 ? (
        <div style={{ position: "absolute", left: tokenX - 30, top: tokenY - 30, opacity: Math.min(dIn, 1 - travel * 0.6) }}>
          <Face p={isReal ? REALS[0] : FAKE} size={60} quality={isReal ? 1 : 0.75} noiseSeed="arch-fake" border={isReal ? ROLE.real : ROLE.gen} />
        </div>
      ) : null}

      {/* the discriminator */}
      <NetBlock x={D_X} y={D_Y} w={260} h={220} shape="shrink" color={ROLE.disc} label="D" sub="discriminator" opacity={fade(frame, L[0] + 10)} />

      {/* the verdict */}
      <div
        style={{
          position: "absolute",
          left: D_X + 370,
          top: D_Y - 95,
          width: 420,
          padding: "18px 26px",
          borderRadius: 18,
          border: `3px solid ${ROLE.disc}`,
          background: COLORS.panel,
          opacity: out,
        }}
      >
        <div style={{ fontSize: 26, color: COLORS.muted }}>D(input) = probability it's real</div>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 12 }}>
          <div style={{ fontFamily: MONO, fontSize: 56, fontWeight: 800, color: ROLE.disc, width: 140 }}>{shown === null ? "–" : shown.toFixed(2)}</div>
          <div style={{ flex: 1, height: 22, borderRadius: 11, background: "rgba(255,255,255,0.08)" }}>
            <div style={{ width: `${(shown ?? 0) * 100}%`, height: "100%", borderRadius: 11, background: ROLE.disc }} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: COLORS.muted, marginTop: 6, paddingLeft: 158 }}>
          <span>0 fake</span>
          <span>1 real</span>
        </div>
      </div>

      <Label x={D_X + 170} y={680} size={28} weight={700} color={ROLE.gen} opacity={feedback} width={560}>
        feedback to G: "how to look more real"
        <div style={{ fontSize: 22, fontWeight: 500, color: COLORS.muted, marginTop: 6 }}>(gradients flowing back through D)</div>
      </Label>
    </AbsoluteFill>
  );
};
