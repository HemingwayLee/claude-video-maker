import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade, lerp } from "../anim";
import { Arrow, Layer, NetBlock, NoiseVector } from "../components/Diagram";
import { Face } from "../components/Face";
import { Card, Label } from "../components/Text";
import { FACE_Z, faceFromZ, gaussian } from "../data";
import { COLORS, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

const FAKES = [gaussian("train-f1", 8), gaussian("train-f2", 8)].map(faceFromZ);
const REALS = [FACE_Z[1], FACE_Z[8]].map(faceFromZ);
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
const ROUND = 50; // frames per half-round in the "repeat" loop

export const Training: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();

  const s1 = fade(frame, L[1]);
  const s2 = fade(frame, L[2]);
  const back = lerp(frame, [L[3], L[3] + 40], [0, 1]);

  // During "repeat": highlight the panels in turn.
  const looping = frame >= L[4];
  const phase = looping ? Math.floor((frame - L[4]) / ROUND) : -1;
  const active1 = !looping ? (frame < L[2] ? 1 : 0.45) : phase % 2 === 0 ? 1 : 0.45;
  const active2 = !looping ? 1 : phase % 2 === 1 ? 1 : 0.45;
  const round = looping ? Math.floor(phase / 2) + 1 : 0;
  const pulse = 0.5 + 0.5 * Math.sin(frame / 5);

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
          <div key={`r${i}`} style={{ position: "absolute", left: 340 + i * 120, top: 290 }}>
            <Face p={p} size={105} border={ROLE.real} />
          </div>
        ))}
        <Tag x={590} y={325} text="1" color={ROLE.real} />
        {FAKES.map((p, i) => (
          <div key={`f${i}`} style={{ position: "absolute", left: 340 + i * 120, top: 570 }}>
            <Face p={p} size={105} quality={0.6} noiseSeed={`train-f${i}`} border={ROLE.gen} />
          </div>
        ))}
        <Tag x={590} y={605} text="0" color={ROLE.gen} />
        <Label x={460} y={410} size={22} color={ROLE.real} center>
          real
        </Label>
        <Label x={460} y={690} size={22} color={ROLE.gen} center>
          fake
        </Label>
        <Layer>
          <Arrow id="t1" d="M 290 622 L 330 622" />
          <Arrow id="t2" d="M 650 342 C 690 342, 690 440, 715 450" color={ROLE.real} />
          <Arrow id="t3" d="M 650 622 C 690 622, 690 520, 715 510" color={ROLE.gen} />
        </Layer>
        <NetBlock x={720} y={480} w={170} h={170} shape="shrink" color={ROLE.disc} label="D" labelSize={56} glow={frame < L[2] || looping ? pulse : 0} />
        <Label x={805} y={585} size={22} weight={700} color={ROLE.disc} center>
          ✎ updated
        </Label>
        <Label x={P1.x + P1.w / 2} y={760} size={24} mono color={COLORS.muted} center>
          loss<sub>D</sub> = −log D(x) − log(1 − D(G(z)))
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
          <Arrow id="t7" d="M 1790 540 C 1790 700, 1210 700, 1210 560" color={ROLE.gen} width={5} progress={back} flow={frame} />
        </Layer>
        <NetBlock x={1120} y={470} w={160} h={150} shape="grow" color={ROLE.gen} label="G" labelSize={52} glow={frame >= L[2] && (!looping || phase % 2 === 1) ? pulse : 0} />
        <Label x={1200} y={362} size={22} weight={700} color={ROLE.gen} center>
          ✎ updated
        </Label>
        <div style={{ position: "absolute", left: 1345, top: 415 }}>
          <Face p={FAKES[0]} size={105} quality={0.6} noiseSeed="train-f0" border={ROLE.gen} />
        </div>
        <Tag x={1345} y={350} text="label: 1" color={ROLE.real} opacity={fade(frame, L[2] + 30)} />
        <NetBlock x={1530} y={470} w={160} h={150} shape="shrink" color={COLORS.muted} label="D" labelSize={52} opacity={0.6} />
        <Lock x={1588} y={355} />
        <Label x={1610} y={300} size={22} color={COLORS.yellow} center>
          frozen
        </Label>
        <div style={{ position: "absolute", left: 1740, top: 452, fontFamily: MONO, fontSize: 28, fontWeight: 700, color: ROLE.disc }}>0.2</div>
        <Label x={1500} y={655} size={24} weight={700} color={ROLE.gen} center opacity={back}>
          error flows back through D into G
        </Label>
        <Label x={P2.x + P2.w / 2} y={760} size={24} mono color={COLORS.muted} center>
          loss<sub>G</sub> = −log D(G(z))
        </Label>
      </AbsoluteFill>

      {/* ---- repeat ---- */}
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
          opacity: fade(frame, L[4]),
        }}
      >
        ⟳ repeat · round {round.toLocaleString("en-US")}
      </div>
    </AbsoluteFill>
  );
};
