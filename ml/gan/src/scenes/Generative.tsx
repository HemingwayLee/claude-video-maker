import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, lerp, pop } from "../anim";
import { Arrow, Layer, NetBlock, NoiseVector } from "../components/Diagram";
import { Face } from "../components/Face";
import { Card, Label } from "../components/Text";
import { FACE_Z, faceFromZ, gaussian } from "../data";
import { COLORS, ROLE } from "../theme";
import { useLines } from "../timeline";

const Z = gaussian("generative-z", 8);
const NEW_FACE = faceFromZ(gaussian("generative-new", 8));
const TRAIN = FACE_Z.slice(0, 6);

const ROW1 = 330; // center lines of the two rows
const ROW2 = 650;

export const Generative: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  const row1 = fade(frame, L[0]);
  const row2 = fade(frame, L[1]);
  const made = lerp(frame, [L[1] + 30, L[1] + 75], [0, 1]);
  const panel = fade(frame, L[2]);
  const question = pop(frame, fps, L[3] + 10, 10);
  const judge = pop(frame, fps, L[4], 14);

  return (
    <AbsoluteFill>
      {/* classifier: image in, label out */}
      <Label x={110} y={ROW1 - 150} size={30} weight={700} color={COLORS.muted} opacity={row1}>
        classifier
      </Label>
      <div style={{ position: "absolute", left: 110, top: ROW1 - 80, opacity: row1 }}>
        <Face p={faceFromZ(FACE_Z[3])} size={160} border={ROLE.real} />
      </div>
      <Layer opacity={row1}>
        <Arrow id="g1" d={`M 290 ${ROW1} L 370 ${ROW1}`} progress={lerp(frame, [L[0] + 5, L[0] + 20], [0, 1])} />
        <Arrow id="g2" d={`M 660 ${ROW1} L 740 ${ROW1}`} progress={lerp(frame, [L[0] + 25, L[0] + 40], [0, 1])} />
      </Layer>
      <NetBlock x={390} y={ROW1} w={250} h={190} shape="shrink" color={COLORS.blue} label="network" labelSize={40} opacity={row1} />
      <div
        style={{
          position: "absolute",
          left: 760,
          top: ROW1 - 34,
          padding: "10px 26px",
          borderRadius: 14,
          border: `3px solid ${COLORS.blue}`,
          fontSize: 34,
          fontWeight: 700,
          opacity: fade(frame, L[0] + 35),
        }}
      >
        "smiling"
      </div>

      {/* generative model: noise in, data out */}
      <Label x={110} y={ROW2 - 190} size={30} weight={700} color={ROLE.gen} opacity={row2}>
        generative model
      </Label>
      <NoiseVector values={Z} x={160} y={ROW2 - 130} cell={30} opacity={row2} />
      <Layer opacity={row2}>
        <Arrow id="g3" d={`M 290 ${ROW2} L 370 ${ROW2}`} progress={lerp(frame, [L[1] + 5, L[1] + 20], [0, 1])} />
        <Arrow id="g4" d={`M 660 ${ROW2} L 740 ${ROW2}`} progress={lerp(frame, [L[1] + 25, L[1] + 40], [0, 1])} />
      </Layer>
      <NetBlock x={390} y={ROW2} w={250} h={190} shape="grow" color={ROLE.gen} label="network" labelSize={40} opacity={row2} />
      <div style={{ position: "absolute", left: 760, top: ROW2 - 80, opacity: fade(frame, L[1] + 30) }}>
        <Face p={NEW_FACE} size={160} quality={made} noiseSeed="gen-new" border={ROLE.gen} />
      </div>
      <Label x={840} y={ROW2 + 95} size={24} color={ROLE.gen} center opacity={fade(frame, L[1] + 60)}>
        new, made-up sample
      </Label>

      {/* training data and the scoring problem */}
      <Card x={1060} y={180} w={760} h={660} opacity={panel} />
      <Label x={1100} y={205} size={28} weight={700} color={ROLE.real} opacity={panel}>
        training data
      </Label>
      {TRAIN.map((z, i) => (
        <div key={i} style={{ position: "absolute", left: 1100 + i * 116, top: 255, opacity: fade(frame, L[2] + i * 4) }}>
          <Face p={faceFromZ(z)} size={100} border={ROLE.real} />
        </div>
      ))}
      <Label x={1440} y={400} size={34} weight={700} center opacity={fade(frame, L[2] + 25)}>
        <span style={{ color: ROLE.gen }}>new sample</span> should look like it belongs here
      </Label>

      <div style={{ position: "absolute", left: 1110, top: 490, opacity: fade(frame, L[3]) }}>
        <Face p={NEW_FACE} size={140} border={ROLE.gen} />
      </div>
      <div style={{ position: "absolute", left: 1290, top: 500, opacity: fade(frame, L[3]) }}>
        <div style={{ fontSize: 30, color: COLORS.muted }}>its score:</div>
        <div style={{ fontSize: 70, fontWeight: 800, color: COLORS.red, transform: `scale(${Math.max(0.01, question)})`, transformOrigin: "left center" }}>
          ???
        </div>
        <div style={{ fontSize: 24, color: COLORS.muted, opacity: fade(frame, L[3] + 30) }}>no "correct answer" to compare with</div>
      </div>

      {/* the GAN's answer */}
      <div
        style={{
          position: "absolute",
          left: 1110,
          top: 690,
          width: 670,
          padding: "16px 22px",
          borderRadius: 16,
          border: `3px solid ${ROLE.disc}`,
          background: `${ROLE.disc}18`,
          fontSize: 30,
          fontWeight: 600,
          opacity: Math.min(1, judge),
          transform: `scale(${judge})`,
        }}
      >
        <span style={{ color: ROLE.disc, fontWeight: 800 }}>a second network</span> learns to judge: real or fake?
      </div>
    </AbsoluteFill>
  );
};
