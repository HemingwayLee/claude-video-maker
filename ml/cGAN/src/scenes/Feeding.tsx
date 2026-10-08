import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade, lerp } from "../anim";
import { Arrow, Layer, NetBlock } from "../components/Diagram";
import { OneHot } from "../components/Cond";
import { Face } from "../components/Face";
import { Card, Label } from "../components/Text";
import { FACE_LABELS, FACE_Z, faceFromZY, gaussian } from "../data";
import { COLORS, diverging, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

const Z = gaussian("feed-z", 8);
const HOT = 2; // "glasses"
const CELL = 40;

export const Feeding: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();

  const concat = lerp(frame, [L[1] + 10, L[1] + 45], [0, 1]);
  const planes = fade(frame, L[2]);
  const modern = fade(frame, L[3]);

  return (
    <AbsoluteFill>
      {/* one-hot */}
      <Label x={120} y={190} size={28} weight={800} color={ROLE.label} opacity={fade(frame, L[0])}>
        one-hot label
      </Label>
      <OneHot x={130} y={240} n={3} hot={HOT} cell={40} labels={FACE_LABELS} opacity={fade(frame, L[0] + 10)} />
      <Label x={120} y={385} size={22} color={COLORS.muted} width={330} opacity={fade(frame, L[0] + 30)}>
        one slot per class; a 1 in the chosen one
      </Label>

      {/* generator input: [z | y] */}
      <Label x={560} y={190} size={28} weight={800} color={ROLE.gen} opacity={fade(frame, L[1])}>
        generator input
      </Label>
      <div style={{ position: "absolute", left: 560, top: 250, display: "flex", gap: 3, opacity: fade(frame, L[1]) }}>
        {Z.map((v, i) => (
          <div key={i} style={{ width: CELL, height: CELL, borderRadius: 5, background: diverging(v, 1.3), border: `2px solid ${ROLE.noise}99` }} />
        ))}
        {[0, 1, 2].map((i) => (
          <div
            key={`y${i}`}
            style={{
              width: CELL,
              height: CELL,
              borderRadius: 5,
              marginLeft: i === 0 ? 12 * (1 - concat) + 6 : 0,
              transform: `translateY(${(1 - concat) * 90}px)`,
              background: i === HOT ? ROLE.label : COLORS.panel,
              border: `2px solid ${ROLE.label}`,
              fontFamily: MONO,
              fontSize: 20,
              fontWeight: 700,
              color: i === HOT ? COLORS.bg : COLORS.muted,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {i === HOT ? 1 : 0}
          </div>
        ))}
      </div>
      <Label x={560 + 4 * 43} y={302} size={24} weight={700} color={ROLE.noise} center opacity={fade(frame, L[1])}>
        noise z (8)
      </Label>
      <Label x={560 + 8 * 43 + 70} y={302} size={24} weight={700} color={ROLE.label} center opacity={concat}>
        + y (3)
      </Label>
      <Layer opacity={concat}>
        <Arrow id="f1" d="M 1060 270 L 1180 270" progress={concat} />
      </Layer>
      <NetBlock x={1195} y={270} w={200} h={150} shape="grow" color={ROLE.gen} label="G" labelSize={52} opacity={concat} />
      <Label x={1430} y={250} size={24} color={COLORS.muted} width={400} opacity={concat}>
        just a longer input vector: 8 + 3 = 11 numbers
      </Label>

      {/* discriminator input for images: label planes */}
      <Label x={120} y={480} size={28} weight={800} color={ROLE.disc} opacity={planes}>
        image discriminator input
      </Label>
      <div style={{ position: "absolute", left: 130, top: 540, opacity: planes }}>
        <Face p={faceFromZY(FACE_Z[3], HOT)} size={180} border={ROLE.real} />
      </div>
      <Label x={220} y={730} size={22} color={COLORS.muted} center opacity={planes}>
        image: 3 color channels
      </Label>
      <Label x={345} y={600} size={50} color={COLORS.muted} opacity={planes}>
        +
      </Label>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 420 + i * 34,
            top: 540 + i * 18,
            width: 150,
            height: 150,
            borderRadius: 10,
            border: `3px solid ${ROLE.label}`,
            background: i === HOT ? ROLE.label : COLORS.panel,
            opacity: planes,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "flex-end",
            padding: 8,
            boxSizing: "border-box",
            fontFamily: MONO,
            fontSize: 22,
            fontWeight: 700,
            color: i === HOT ? COLORS.bg : COLORS.muted,
          }}
        >
          {i === HOT ? "all 1s" : "all 0s"}
        </div>
      ))}
      <Label x={560} y={730} size={22} color={ROLE.label} center opacity={planes}>
        one plane per class
      </Label>
      <Layer opacity={planes}>
        <Arrow id="f2" d="M 660 640 L 730 640" progress={planes} />
      </Layer>
      <NetBlock x={745} y={640} w={200} h={160} shape="shrink" color={ROLE.disc} label="D" labelSize={52} opacity={planes} />

      {/* modern alternatives */}
      <Card x={1040} y={470} w={790} h={380} accent={COLORS.purple} opacity={modern}>
        <div style={{ padding: "22px 28px", fontSize: 26, lineHeight: 1.45 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.purple, marginBottom: 10 }}>in modern models</div>
          <div>
            <b>Label embedding</b>: a learned lookup table turns y into a vector (like word embeddings).
          </div>
          <div style={{ marginTop: 14 }}>
            <b>Projection discriminator</b> (Miyato &amp; Koyama, 2018):
          </div>
          <div style={{ fontFamily: MONO, fontSize: 24, color: COLORS.text, marginTop: 6 }}>
            D(x, y) = ψ(φ(x)) + <span style={{ color: ROLE.label }}>embed(y)</span> · φ(x)
          </div>
          <div style={{ fontSize: 22, color: COLORS.muted, marginTop: 6 }}>φ(x): image features. The dot product scores how well they fit the label. Used in BigGAN.</div>
        </div>
      </Card>
    </AbsoluteFill>
  );
};
