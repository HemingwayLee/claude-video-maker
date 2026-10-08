import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade, lerp } from "../anim";
import { Arrow, Layer, NetBlock, NoiseVector } from "../components/Diagram";
import { Face } from "../components/Face";
import { YTag } from "../components/Cond";
import { Card, Label } from "../components/Text";
import { FACE_LABELS, FACE_Z, faceFromZY, gaussian } from "../data";
import { COLORS, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

// Real faces come with their true labels; fakes are made for randomly chosen labels.
const REAL_Y = [2, 0];
const FAKE_Y = [1, 2];
const REALS = [FACE_Z[1], FACE_Z[8]].map((z, i) => faceFromZY(z, REAL_Y[i]));
const FAKES = [gaussian("train-f1", 8), gaussian("train-f2", 8)].map((z, i) => faceFromZY(z, FAKE_Y[i]));
const G_FAKE = faceFromZY(gaussian("train-f1", 8), 2);
const Z = gaussian("train-z", 6);

const Lock: React.FC<{ x: number; y: number; opacity?: number }> = ({ x, y, opacity = 1 }) => (
  <svg width={44} height={52} viewBox="0 0 44 52" style={{ position: "absolute", left: x, top: y, opacity }}>
    <path d="M 10 22 V 14 a 12 12 0 0 1 24 0 V 22" fill="none" stroke={COLORS.yellow} strokeWidth={5} />
    <rect x={3} y={22} width={38} height={28} rx={6} fill={COLORS.yellow} />
    <circle cx={22} cy={35} r={4} fill={COLORS.bg} />
  </svg>
);

const Tag: React.FC<{ x: number; y: number; text: string; color: string; opacity?: number }> = ({ x, y, text, color, opacity = 1 }) => (
  <div style={{ position: "absolute", left: x, top: y, padding: "4px 14px", borderRadius: 10, background: color, color: COLORS.bg, fontFamily: MONO, fontWeight: 800, fontSize: 24, opacity }}>{text}</div>
);

const P1 = { x: 90, y: 180, w: 840, h: 660 };
const P2 = { x: 990, y: 180, w: 840, h: 660 };

export const Training: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();

  const s1 = fade(frame, L[1]);
  const s2 = fade(frame, L[2]);
  const back = lerp(frame, [L[2] + 60, L[2] + 100], [0, 1]);
  const travels = frame >= L[3];
  const active1 = frame < L[2] || travels ? 1 : 0.45;
  const active2 = 1;
  const pulse = 0.5 + 0.5 * Math.sin(frame / 5);
  // The labels glow while "the label always travels with its image" is said.
  const tagGlow = travels ? { boxShadow: `0 0 ${10 + 20 * pulse}px ${ROLE.label}` } : undefined;

  return (
    <AbsoluteFill>
      {/* ---- step 1: train D ---- */}
      <AbsoluteFill style={{ opacity: s1 * active1 }}>
        <Card x={P1.x} y={P1.y} w={P1.w} h={P1.h} accent={ROLE.disc} />
        <Label x={P1.x + 30} y={P1.y + 22} size={34} weight={800} color={ROLE.disc}>
          Step 1 · train D
        </Label>
        <NetBlock x={130} y={620} w={150} h={130} shape="grow" color={COLORS.muted} label="G" labelSize={48} opacity={0.6} />
        <Lock x={183} y={510} />
        <Label x={205} y={700} size={22} color={COLORS.yellow} center>
          frozen
        </Label>
        {REALS.map((p, i) => (
          <div key={`r${i}`} style={{ position: "absolute", left: 340 + i * 120, top: 270 }}>
            <Face p={p} size={105} border={ROLE.real} />
            <YTag x={0} y={112} text={FACE_LABELS[REAL_Y[i]]} size={16} style={tagGlow} />
          </div>
        ))}
        <Tag x={590} y={305} text="1" color={ROLE.real} />
        {FAKES.map((p, i) => (
          <div key={`f${i}`} style={{ position: "absolute", left: 340 + i * 120, top: 570 }}>
            <Face p={p} size={105} quality={0.6} noiseSeed={`train-f${i}`} border={ROLE.gen} />
            <YTag x={0} y={112} text={FACE_LABELS[FAKE_Y[i]]} size={16} style={tagGlow} />
          </div>
        ))}
        <Tag x={590} y={605} text="0" color={ROLE.gen} />
        <Label x={600} y={240} size={22} color={ROLE.real}>
          real image + its true label
        </Label>
        <Label x={460} y={535} size={22} color={ROLE.gen} center>
          fakes for random labels
        </Label>
        <Layer>
          <Arrow id="t1" d="M 290 622 L 330 622" />
          <Arrow id="t2" d="M 650 322 C 690 322, 690 440, 715 450" color={ROLE.real} />
          <Arrow id="t3" d="M 650 622 C 690 622, 690 520, 715 510" color={ROLE.gen} />
        </Layer>
        <NetBlock x={720} y={480} w={170} h={170} shape="shrink" color={ROLE.disc} label="D" labelSize={56} glow={frame >= L[1] && frame < L[2] ? pulse : 0} />
        <Label x={805} y={585} size={22} weight={700} color={ROLE.disc} center>
          ✎ updated
        </Label>
        <Label x={P1.x + P1.w / 2} y={760} size={24} mono color={COLORS.muted} center>
          loss<sub>D</sub> = −log D(x | y) − log(1 − D(G(z | y) | y))
        </Label>
      </AbsoluteFill>

      {/* ---- step 2: train G ---- */}
      <AbsoluteFill style={{ opacity: s2 * active2 }}>
        <Card x={P2.x} y={P2.y} w={P2.w} h={P2.h} accent={ROLE.gen} />
        <Label x={P2.x + 30} y={P2.y + 22} size={34} weight={800} color={ROLE.gen}>
          Step 2 · train G
        </Label>
        <NoiseVector values={Z} x={1030} y={390} cell={28} />
        <Layer>
          <Arrow id="t4" d="M 1080 470 L 1110 470" />
          <Arrow id="t5" d="M 1290 470 L 1330 470" />
          <Arrow id="t6" d="M 1460 470 L 1520 470" />
          <Arrow id="t8" d="M 1700 470 L 1730 470" />
          <Arrow id="t7" d="M 1790 540 C 1790 745, 1300 745, 1265 548" color={ROLE.gen} width={5} progress={back} flow={frame} />
        </Layer>
        <NetBlock x={1120} y={470} w={160} h={150} shape="grow" color={ROLE.gen} label="G" labelSize={52} glow={frame >= L[2] && frame < L[3] ? pulse : 0} />
        <Label x={1200} y={362} size={22} weight={700} color={ROLE.gen} center>
          ✎ updated
        </Label>
        <div style={{ position: "absolute", left: 1345, top: 415 }}>
          <Face p={G_FAKE} size={105} quality={0.6} noiseSeed="train-f0" border={ROLE.gen} />
        </div>
        <YTag x={1130} y={600} text="glasses" size={18} style={tagGlow} />
        <YTag x={1530} y={600} text="glasses" size={18} style={tagGlow} />
        <Label x={1130} y={640} size={18} color={COLORS.muted}>
          G is asked for
        </Label>
        <Label x={1530} y={640} size={18} color={COLORS.muted}>
          D checks the same label
        </Label>
        <Tag x={1345} y={350} text="target: 1" color={ROLE.real} opacity={fade(frame, L[2] + 30)} />
        <NetBlock x={1530} y={470} w={160} h={150} shape="shrink" color={COLORS.muted} label="D" labelSize={52} opacity={0.6} />
        <Lock x={1588} y={355} />
        <Label x={1610} y={300} size={22} color={COLORS.yellow} center>
          frozen
        </Label>
        <div style={{ position: "absolute", left: 1740, top: 452, fontFamily: MONO, fontSize: 28, fontWeight: 700, color: ROLE.disc }}>0.2</div>
        <Label x={1500} y={712} size={24} weight={700} color={ROLE.gen} center opacity={back}>
          error flows back through D into G
        </Label>
        <Label x={P2.x + P2.w / 2} y={760} size={24} mono color={COLORS.muted} center>
          loss<sub>G</sub> = −log D(G(z | y) | y)
        </Label>
      </AbsoluteFill>

      {/* ---- the label travels with its image ---- */}
      <div
        style={{
          position: "absolute",
          left: 960,
          top: 112,
          transform: "translateX(-50%)",
          padding: "8px 28px",
          borderRadius: 30,
          border: `3px solid ${COLORS.yellow}`,
          background: COLORS.bg,
          color: COLORS.yellow,
          fontSize: 30,
          fontWeight: 800,
          whiteSpace: "nowrap",
          opacity: fade(frame, L[3]),
        }}
      >
        the label always travels with its image
      </div>
    </AbsoluteFill>
  );
};
