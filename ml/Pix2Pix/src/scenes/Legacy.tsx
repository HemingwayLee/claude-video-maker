import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade, fadeOut } from "../anim";
import { TaskArt } from "../components/TaskArt";
import { Card, Label } from "../components/Text";
import { COLORS, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

// Paired data → CycleGAN (unpaired); pix2pixHD and SPADE; where PatchGAN lives on.
const LINEAGE = [
  { year: "2017", name: "Pix2Pix", note: "paired, 256 × 256", color: ROLE.gen },
  { year: "2017", name: "CycleGAN", note: "unpaired (Zhu, Park, Isola, Efros)", color: ROLE.input },
  { year: "2018", name: "pix2pixHD", note: "2048 × 1024, multi-scale (NVIDIA)", color: ROLE.disc },
  { year: "2019", name: "SPADE / GauGAN", note: "label maps → landscapes (NVIDIA)", color: ROLE.real },
];

export const Legacy: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();
  const pairsShow = fade(frame, L[0]) * fadeOut(frame, L[2] - 5, 12);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: pairsShow }}>
        {/* paired */}
        <Card x={150} y={170} w={760} h={640} accent={ROLE.gen}>
          <Label x={380} y={24} size={32} weight={800} center color={ROLE.gen}>
            Pix2Pix: paired data
          </Label>
          {[0, 1, 2].map((i) => (
            <React.Fragment key={i}>
              <TaskArt task={(["facade", "street", "map"] as const)[i]} side="labels" size={140} x={130} y={90 + i * 160} />
              <TaskArt task={(["facade", "street", "map"] as const)[i]} side="real" size={140} x={490} y={90 + i * 160} />
              <svg width={200} height={20} style={{ position: "absolute", left: 280, top: 150 + i * 160 }}>
                <line x1={0} y1={10} x2={200} y2={10} stroke={ROLE.gen} strokeWidth={4} strokeDasharray="10 8" />
              </svg>
            </React.Fragment>
          ))}
          <Label x={380} y={590} size={22} center color={COLORS.muted}>
            every input needs its exact output
          </Label>
        </Card>
        {/* unpaired */}
        <Card x={1010} y={170} w={760} h={640} accent={ROLE.input} opacity={fade(frame, L[1])}>
          <Label x={380} y={24} size={32} weight={800} center color={ROLE.input}>
            CycleGAN: two separate piles
          </Label>
          {[0, 1, 2].map((i) => (
            <TaskArt key={`a${i}`} task="city" side="day" size={130} x={70 + i * 34} y={120 + i * 120} style={{ boxShadow: `0 0 0 3px ${COLORS.muted}` }} />
          ))}
          {[0, 1, 2].map((i) => (
            <TaskArt key={`b${i}`} task="city" side="night" size={130} x={500 - i * 34} y={120 + i * 120} style={{ boxShadow: `0 0 0 3px ${COLORS.muted}` }} />
          ))}
          <svg width={760} height={640} style={{ position: "absolute", left: 0, top: 0 }}>
            <path d="M 300 250 C 360 200, 420 200, 470 250" stroke={ROLE.input} strokeWidth={5} fill="none" />
            <path d="M 458 236 L 472 252 L 452 258" stroke={ROLE.input} strokeWidth={5} fill="none" />
            <path d="M 470 400 C 420 450, 360 450, 300 400" stroke={ROLE.input} strokeWidth={5} fill="none" />
            <path d="M 312 414 L 298 398 L 318 392" stroke={ROLE.input} strokeWidth={5} fill="none" />
          </svg>
          <Label x={200} y={548} size={22} center color={COLORS.muted}>
            day photos
          </Label>
          <Label x={560} y={548} size={22} center color={COLORS.muted}>
            night photos
          </Label>
          <Label x={380} y={590} size={22} center color={COLORS.muted}>
            day → night → day must come back the same
          </Label>
        </Card>
      </AbsoluteFill>
      {/* lineage */}
      <AbsoluteFill style={{ opacity: fade(frame, L[2]) }}>
        {LINEAGE.map((l, i) => (
          <Card key={l.name} x={130 + i * 420} y={230} w={380} h={260} accent={l.color} opacity={fade(frame, L[2] + i * 15)}>
            <Label x={30} y={26} size={26} mono color={COLORS.muted}>
              {l.year}
            </Label>
            <Label x={30} y={74} size={40} weight={800} color={l.color}>
              {l.name}
            </Label>
            <Label x={30} y={140} size={24} color={COLORS.text} width={320}>
              {l.note}
            </Label>
          </Card>
        ))}
        <svg width={1920} height={60} style={{ position: "absolute", left: 0, top: 520 }}>
          <line x1={130} y1={30} x2={1790} y2={30} stroke={COLORS.panelBorder} strokeWidth={4} />
        </svg>
        <div style={{ position: "absolute", left: 0, right: 0, top: 640, textAlign: "center", opacity: fade(frame, L[3]) }}>
          <Label x={960} y={0} size={32} weight={800} center color={ROLE.disc}>
            PatchGAN lives on
          </Label>
          <div style={{ position: "absolute", left: 0, right: 0, top: 70, display: "flex", justifyContent: "center", gap: 30 }}>
            {["VQGAN (2021)", "Stable Diffusion's image autoencoder (2022)"].map((t) => (
              <div key={t} style={{ padding: "14px 30px", borderRadius: 40, border: `3px solid ${ROLE.disc}`, color: COLORS.text, fontFamily: MONO, fontSize: 28, fontWeight: 700 }}>
                {t}
              </div>
            ))}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
