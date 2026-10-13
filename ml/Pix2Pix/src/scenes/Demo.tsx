import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade, fadeOut, lerp } from "../anim";
import { PixelImage } from "../components/PixelImage";
import { Card, Label } from "../components/Text";
import { type Mode, outputAt, STEPS, TEST_INPUTS, TEST_TARGETS, TRACE } from "../data";
import { COLORS, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

// The recorded runs of scripts/train-pix2pix.mjs: three generators trained
// side by side, played back over 3,000 steps.
const COLS: { key: "input" | "target" | Mode; name: string; color: string }[] = [
  { key: "input", name: "input x", color: ROLE.input },
  { key: "target", name: "target y", color: ROLE.real },
  { key: "l1", name: "L1 only", color: ROLE.l1 },
  { key: "gan", name: "cGAN only", color: ROLE.disc },
  { key: "both", name: "L1 + cGAN", color: ROLE.gen },
];
const SIZE = 150;
const GAP = 46;
const X0 = 300;
const Y0 = 230;
const colX = (c: number) => X0 + c * (SIZE + GAP) + (c >= 2 ? 50 : 0);
const rowY = (r: number) => Y0 + r * (SIZE + 24);
const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
const S = TRACE.settings;

export const Demo: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();
  const setup = fade(frame, L[0]) * fadeOut(frame, L[1] - 5, 12);
  const grid = fade(frame, L[1]);
  const step = lerp(frame, [L[2] + 10, L[3] - 25], [0, STEPS]);
  const focus = frame >= L[5] ? 4 : frame >= L[4] ? 3 : frame >= L[3] ? 2 : -1;
  return (
    <AbsoluteFill>
      {/* setup */}
      <AbsoluteFill style={{ opacity: setup }}>
        <Label x={420} y={170} size={30} weight={800} center>
          the data: outline → striped shape
        </Label>
        {[0, 1, 3].map((i, k) => (
          <React.Fragment key={i}>
            <PixelImage im={TEST_INPUTS[i]} x={200} y={250 + k * 200} size={170} border={ROLE.input} />
            <PixelImage im={TEST_TARGETS[i]} x={450} y={250 + k * 200} size={170} border={ROLE.real} />
            <Label x={410} y={315 + k * 200} size={36} center color={COLORS.muted}>
              →
            </Label>
          </React.Fragment>
        ))}
        <Label x={420} y={870} size={22} center color={COLORS.muted}>
          the stripes' position is random: the outline doesn't decide it
        </Label>
        <Card x={820} y={220} w={960} h={600}>
          <Label x={40} y={34} size={32} weight={800} color={ROLE.gen}>
            G · U-Net
          </Label>
          <Label x={40} y={84} size={24} mono color={COLORS.text}>
            32→16→8→4→2 →4→8→16→32, skip connections, {S.NGF}–{S.NGF * 4} channels
          </Label>
          <Label x={40} y={170} size={32} weight={800} color={ROLE.disc}>
            D · PatchGAN
          </Label>
          <Label x={40} y={220} size={24} mono color={COLORS.text}>
            (x, y) → 8 × 8 scores, each sees an 18 × 18 patch
          </Label>
          <Label x={40} y={306} size={32} weight={800} color={COLORS.yellow}>
            training
          </Label>
          <Label x={40} y={356} size={24} mono color={COLORS.text}>
            {STEPS.toLocaleString()} steps · batch {S.BATCH} · Adam lr {S.LR} · λ = {S.LAMBDA}
          </Label>
          <Label x={40} y={440} size={24} color={COLORS.muted} width={880}>
            Written from scratch in plain JavaScript (scripts/train-pix2pix.mjs): convolutions, backpropagation and Adam, no ML library.
          </Label>
        </Card>
      </AbsoluteFill>

      {/* the comparison grid */}
      <AbsoluteFill style={{ opacity: grid }}>
        {COLS.map((c, ci) => (
          <React.Fragment key={c.key}>
            <Label x={colX(ci) + SIZE / 2} y={Y0 - 62} size={28} weight={800} center color={c.color}>
              {c.name}
            </Label>
            {focus === ci && (
              <div style={{ position: "absolute", left: colX(ci) - 16, top: Y0 - 74, width: SIZE + 32, height: 4 * (SIZE + 24) + 70, borderRadius: 16, border: `4px solid ${c.color}`, boxShadow: `0 0 30px ${c.color}66` }} />
            )}
            {[0, 1, 2, 3].map((r) => {
              const im = c.key === "input" ? TEST_INPUTS[r] : c.key === "target" ? TEST_TARGETS[r] : outputAt(c.key, r, step);
              const dim = focus >= 2 && ci >= 2 && ci !== focus ? 0.45 : 1;
              return <PixelImage key={r} im={im} x={colX(ci)} y={rowY(r)} size={SIZE} border={c.color} opacity={dim} />;
            })}
          </React.Fragment>
        ))}
        <Label x={1700} y={Y0 - 10} size={24} color={COLORS.muted} center opacity={fade(frame, L[2])}>
          training step
        </Label>
        <Label x={1700} y={Y0 + 26} size={58} mono weight={800} center opacity={fade(frame, L[2])}>
          {Math.round(step).toLocaleString()}
        </Label>
        <div style={{ position: "absolute", left: 1600, top: Y0 + 110, width: 200, height: 10, borderRadius: 5, background: COLORS.panelBorder, opacity: fade(frame, L[2]) }}>
          <div style={{ width: `${(step / STEPS) * 100}%`, height: "100%", borderRadius: 5, background: ROLE.gen }} />
        </div>
        {/* verdicts */}
        <Label x={1700} y={420} size={26} center color={ROLE.l1} opacity={fade(frame, L[3] + 20)} width={300}>
          L1 only: stripe crispness <b style={{ fontFamily: MONO }}>{mean(TRACE.runs.l1.crisp).toFixed(2)}</b>
        </Label>
        <Label x={1700} y={540} size={26} center color={ROLE.disc} opacity={fade(frame, L[4] + 20)} width={300}>
          cGAN only: same blob for every input
        </Label>
        <Label x={1700} y={660} size={26} center color={ROLE.gen} opacity={fade(frame, L[5] + 20)} width={300}>
          L1 + cGAN: stripe crispness <b style={{ fontFamily: MONO }}>{mean(TRACE.runs.both.crisp).toFixed(2)}</b>
        </Label>
        <Label x={1700} y={780} size={20} center color={COLORS.muted} opacity={fade(frame, L[3] + 20)} width={300}>
          crispness: row-to-row contrast inside the shape, vs. the target's (1.00 = as crisp)
        </Label>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
