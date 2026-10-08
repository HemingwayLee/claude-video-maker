import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade } from "../anim";
import { Arrow, Layer } from "../components/Diagram";
import { YTag } from "../components/Cond";
import { Face } from "../components/Face";
import { Card, Label } from "../components/Text";
import { FACE_Z, faceFromZ } from "../data";
import { COLORS, ROLE } from "../theme";
import { useLines } from "../timeline";

const W = 840;
const H = 330;
const POS = [
  [90, 165],
  [990, 165],
  [90, 525],
  [990, 525],
];

const Goldfish = () => (
  <svg width={200} height={150} viewBox="0 0 200 150">
    <ellipse cx={90} cy={75} rx={60} ry={38} fill="#ff9f43" />
    <polygon points="145,75 190,40 190,110" fill="#ff7b1c" />
    <polygon points="70,40 100,15 115,45" fill="#ff7b1c" />
    <circle cx={60} cy={68} r={8} fill="#fff" />
    <circle cx={58} cy={68} r={4} fill="#111" />
  </svg>
);

const House: React.FC<{ filled: boolean }> = ({ filled }) => (
  <svg width={180} height={160} viewBox="0 0 180 160">
    <polygon points="20,75 90,15 160,75" fill={filled ? "#c0392b" : "none"} stroke={filled ? "#7b241c" : COLORS.text} strokeWidth={4} />
    <rect x={35} y={75} width={110} height={75} fill={filled ? "#f3d9a4" : "none"} stroke={filled ? "#8a6d3b" : COLORS.text} strokeWidth={4} />
    <rect x={78} y={105} width={26} height={45} fill={filled ? "#6e4b2a" : "none"} stroke={filled ? "#4a3018" : COLORS.text} strokeWidth={3} />
    <rect x={48} y={90} width={22} height={20} fill={filled ? "#9fd3f5" : "none"} stroke={filled ? "#4a6b85" : COLORS.text} strokeWidth={3} />
    <rect x={112} y={90} width={22} height={20} fill={filled ? "#9fd3f5" : "none"} stroke={filled ? "#4a6b85" : COLORS.text} strokeWidth={3} />
    {filled ? <rect x={0} y={150} width={180} height={10} fill="#5cae5c" /> : null}
  </svg>
);

const Bird = () => (
  <svg width={190} height={150} viewBox="0 0 190 150">
    <line x1={20} y1={128} x2={170} y2={128} stroke="#7a5230" strokeWidth={6} />
    <ellipse cx={95} cy={88} rx={45} ry={32} fill="#ffd166" />
    <circle cx={135} cy={62} r={22} fill="#ffd166" />
    <polygon points="155,60 172,66 155,70" fill="#f08c00" />
    <circle cx={140} cy={57} r={4} fill="#111" />
    <path d="M 60 80 Q 95 60 120 90 Q 90 110 60 80" fill="#1b1b1b" />
    <polygon points="52,90 15,80 25,105" fill="#1b1b1b" />
    <line x1={90} y1={118} x2={86} y2={128} stroke="#f08c00" strokeWidth={3} />
    <line x1={105} y1={118} x2={109} y2={128} stroke="#f08c00" strokeWidth={3} />
  </svg>
);

const CARDS = [
  { name: "BigGAN", year: 2018, kind: "condition: a class (1 of 1,000)" },
  { name: "Pix2Pix", year: 2016, kind: "condition: a whole image" },
  { name: "SRGAN", year: 2016, kind: "condition: a low-resolution image" },
  { name: "Text-to-image GAN", year: 2016, kind: "condition: a sentence" },
];

export const Uses: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();
  const on = (i: number) => fade(frame, L[i + 1]);
  const face = faceFromZ(FACE_Z[4]);

  return (
    <AbsoluteFill>
      {CARDS.map((c, i) => (
        <React.Fragment key={c.name}>
          <Card x={POS[i][0]} y={POS[i][1]} w={W} h={H} opacity={on(i)} accent={frame >= L[i + 1] && frame < L[i + 2] ? ROLE.label : undefined} />
          <Label x={POS[i][0] + 30} y={POS[i][1] + 20} size={32} weight={800} color={COLORS.text} opacity={on(i)}>
            {c.name} <span style={{ fontSize: 22, color: COLORS.muted, fontWeight: 500 }}>{c.year}</span>
          </Label>
          <Label x={POS[i][0] + 30} y={POS[i][1] + 62} size={22} color={ROLE.label} opacity={on(i)}>
            {c.kind}
          </Label>
          <Layer opacity={on(i)}>
            <Arrow id={`u${i}`} d={`M ${POS[i][0] + 380} ${POS[i][1] + 210} L ${POS[i][0] + 470} ${POS[i][1] + 210}`} width={5} />
          </Layer>
        </React.Fragment>
      ))}

      {/* 1. class → image */}
      <div style={{ opacity: on(0) }}>
        <YTag x={POS[0][0] + 60} y={POS[0][1] + 185} text="goldfish" />
        <div style={{ position: "absolute", left: POS[0][0] + 520, top: POS[0][1] + 130 }}>
          <Goldfish />
        </div>
      </div>
      {/* 2. sketch → photo */}
      <div style={{ opacity: on(1) }}>
        <div style={{ position: "absolute", left: POS[1][0] + 120, top: POS[1][1] + 125 }}>
          <House filled={false} />
        </div>
        <div style={{ position: "absolute", left: POS[1][0] + 530, top: POS[1][1] + 125 }}>
          <House filled />
        </div>
        <Label x={POS[1][0] + 210} y={POS[1][1] + 292} size={20} color={COLORS.muted} center>
          y = an edge sketch
        </Label>
      </div>
      {/* 3. low-res → high-res */}
      <div style={{ opacity: on(2) }}>
        <div style={{ position: "absolute", left: POS[2][0] + 130, top: POS[2][1] + 120, filter: "blur(6px)", overflow: "hidden", borderRadius: 14 }}>
          <Face p={face} size={170} />
        </div>
        <div style={{ position: "absolute", left: POS[2][0] + 530, top: POS[2][1] + 120 }}>
          <Face p={face} size={170} />
        </div>
      </div>
      {/* 4. text → image */}
      <div style={{ opacity: on(3) }}>
        <div style={{ position: "absolute", left: POS[3][0] + 40, top: POS[3][1] + 140, width: 320, fontSize: 26, fontStyle: "italic", color: COLORS.text, padding: "12px 16px", borderRadius: 12, border: `3px solid ${ROLE.label}`, background: `${ROLE.label}18` }}>
          “a small yellow bird with black wings”
        </div>
        <div style={{ position: "absolute", left: POS[3][0] + 520, top: POS[3][1] + 130 }}>
          <Bird />
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 866, textAlign: "center", fontSize: 18, color: COLORS.muted, fontFamily: "Menlo, monospace", opacity: on(0) }}>
        (simple drawings of the idea, not model outputs)
      </div>
    </AbsoluteFill>
  );
};
