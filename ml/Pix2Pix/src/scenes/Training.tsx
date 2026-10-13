import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade, lerp } from "../anim";
import { Arrow, Layer, NetBlock } from "../components/Diagram";
import { PixelImage } from "../components/PixelImage";
import { Card, Label } from "../components/Text";
import { outputAt, TEST_INPUTS, TEST_TARGETS } from "../data";
import { COLORS, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

// Step 1: update D on a real and a fake pair. Step 2: update G (D frozen).
const FAKE = outputAt("both", 0, 600);

const Tag: React.FC<{ x: number; y: number; text: string; color: string; opacity?: number }> = ({ x, y, text, color, opacity = 1 }) => (
  <div style={{ position: "absolute", left: x, top: y, padding: "4px 14px", borderRadius: 10, background: color, color: COLORS.bg, fontFamily: MONO, fontWeight: 800, fontSize: 24, opacity }}>{text}</div>
);

const P1 = { x: 90, y: 170, w: 840, h: 600 };
const P2 = { x: 990, y: 170, w: 840, h: 600 };

export const Training: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();
  const s1 = fade(frame, L[1]);
  const s2 = fade(frame, L[2]);
  const pulse = 0.5 + 0.5 * Math.sin(frame / 5);
  const active1 = frame < L[2] ? 1 : 0.45;
  return (
    <AbsoluteFill>
      <Label x={960} y={140} size={30} weight={700} center color={COLORS.muted} opacity={fade(frame, L[0]) * (1 - s1)}>
        repeat: step 1, step 2, step 1, step 2, …
      </Label>
      {/* step 1 */}
      <AbsoluteFill style={{ opacity: s1 * active1 }}>
        <Card x={P1.x} y={P1.y} w={P1.w} h={P1.h} accent={ROLE.disc} />
        <Label x={P1.x + 30} y={P1.y + 22} size={34} weight={800} color={ROLE.disc}>
          Step 1 · update D
        </Label>
        <PixelImage im={TEST_INPUTS[0]} x={150} y={270} size={120} border={ROLE.input} />
        <PixelImage im={TEST_TARGETS[0]} x={290} y={270} size={120} border={ROLE.real} />
        <Tag x={430} y={310} text="real" color={ROLE.real} />
        <PixelImage im={TEST_INPUTS[0]} x={150} y={520} size={120} border={ROLE.input} />
        <PixelImage im={FAKE} x={290} y={520} size={120} border={ROLE.gen} />
        <Tag x={430} y={560} text="fake" color={ROLE.gen} />
        <Layer>
          <Arrow id="tr1" d="M 520 330 C 580 330, 600 420, 630 440" color={ROLE.real} />
          <Arrow id="tr2" d="M 520 580 C 580 580, 600 500, 630 490" color={ROLE.gen} />
          <Arrow id="tr3" d="M 830 420 L 870 360" color={ROLE.real} />
          <Arrow id="tr4" d="M 830 500 L 870 560" color={ROLE.gen} />
        </Layer>
        <NetBlock x={640} y={465} w={180} h={200} shape="shrink" color={ROLE.disc} label="D" labelSize={56} glow={frame >= L[1] && frame < L[2] ? pulse : 0} />
        <Tag x={860} y={318} text="1" color={ROLE.real} />
        <Tag x={860} y={565} text="0" color={ROLE.gen} />
        <Label x={P1.x + P1.w / 2} y={690} size={24} mono center color={COLORS.muted}>
          loss<sub>D</sub> = ½ [ −log D(x, y) − log(1 − D(x, G(x))) ]
        </Label>
      </AbsoluteFill>
      {/* step 2 */}
      <AbsoluteFill style={{ opacity: s2 }}>
        <Card x={P2.x} y={P2.y} w={P2.w} h={P2.h} accent={ROLE.gen} />
        <Label x={P2.x + 30} y={P2.y + 22} size={34} weight={800} color={ROLE.gen}>
          Step 2 · update G
        </Label>
        <PixelImage im={TEST_INPUTS[0]} x={1030} y={360} size={120} border={ROLE.input} />
        <Layer>
          <Arrow id="tr5" d="M 1160 420 L 1190 420" />
          <Arrow id="tr6" d="M 1340 420 L 1370 420" />
          <Arrow id="tr7" d="M 1500 420 L 1540 420" />
          <Arrow id="tr8" d="M 1435 490 L 1435 560" color={ROLE.l1} />
          <Arrow id="tr9" d="M 1700 470 C 1700 680, 1290 690, 1270 510" color={ROLE.gen} width={5} progress={lerp(frame, [L[2] + 40, L[2] + 70], [0, 1])} flow={frame} />
        </Layer>
        <NetBlock x={1200} y={420} w={130} h={150} shape="grow" color={ROLE.gen} label="G" labelSize={48} glow={frame >= L[2] && frame < L[3] ? pulse : 0} />
        <PixelImage im={FAKE} x={1375} y={360} size={120} border={ROLE.gen} />
        <NetBlock x={1550} y={420} w={140} h={150} shape="shrink" color={COLORS.muted} label="D" labelSize={44} opacity={0.7} />
        <Label x={1620} y={510} size={20} color={COLORS.yellow} center>
          frozen
        </Label>
        <Tag x={1700} y={300} text="say 1!" color={ROLE.disc} />
        <PixelImage im={TEST_TARGETS[0]} x={1375} y={570} size={90} border={ROLE.real} />
        <Label x={1482} y={572} size={24} weight={700} color={ROLE.l1}>
          + λ · L1 to y
        </Label>
        <Label x={P2.x + P2.w / 2} y={690} size={24} mono center color={COLORS.muted}>
          loss<sub>G</sub> = −log D(x, G(x)) + λ ||y − G(x)||<sub>1</sub>
        </Label>
      </AbsoluteFill>
      {/* settings from the paper */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 820, display: "flex", justifyContent: "center", gap: 22, opacity: fade(frame, L[3]) }}>
        {["Adam · lr 0.0002 · β₁ 0.5", "batch size 1", "facades: 400 images", "< 2 hours on 1 GPU"].map((t, i) => (
          <div key={t} style={{ padding: "12px 26px", borderRadius: 14, background: COLORS.panel, border: `2px solid ${COLORS.panelBorder}`, color: COLORS.text, fontFamily: MONO, fontSize: 26, fontWeight: 700, opacity: fade(frame, L[3] + i * 15) }}>
            {t}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
