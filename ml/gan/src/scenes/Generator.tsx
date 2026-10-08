import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, fadeOut, lerp, pop } from "../anim";
import { Arrow, Layer } from "../components/Diagram";
import { Face } from "../components/Face";
import { Slab } from "../components/Slab";
import { Card, Label } from "../components/Text";
import { faceFromZ, gaussian, mixZ } from "../data";
import { COLORS, diverging, ROLE } from "../theme";
import { useLines } from "../timeline";

const Z100 = gaussian("gen-z100", 100);
const MID = 470; // center line of the layer pipeline

// A DCGAN-style generator: each transposed convolution doubles the size.
const LAYERS = [
  { x: 420, h: 50, t: 56, label: "4×4×1024" },
  { x: 570, h: 90, t: 40, label: "8×8×512" },
  { x: 730, h: 150, t: 26, label: "16×16×256" },
  { x: 900, h: 230, t: 16, label: "32×32×128" },
];

// Latent space: dots are the first two of each face's 8 numbers.
const DOTS = Array.from({ length: 36 }, (_, i) => gaussian(`latent-${i}`, 8));
const PICKS = [DOTS[3], DOTS[11], DOTS[20]];
// The two ends of the walk, picked to look clearly different.
const FROM = [-1.6, -1.3, -1.5, -1, 1.2, -0.8, 1.5, -1];
const TO = [1.5, 1.5, 1.6, 1.2, -1, 1, -1.2, 1.8];
const PLANE = { x: 130, y: 210, s: 600 }; // square plot, z ∈ [-2.6, 2.6]²
const toPx = (z: number[]) => [PLANE.x + ((z[0] + 2.6) / 5.2) * PLANE.s, PLANE.y + ((2.6 - z[1]) / 5.2) * PLANE.s];
const STRIP = 6;

export const Generator: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  const partA = fadeOut(frame, L[2] - 15, 15);
  const partB = fade(frame, L[2]);

  // Part B: which z is selected.
  const pickIdx = Math.min(2, Math.max(0, Math.floor((frame - L[2] - 20) / 35)));
  const walk = lerp(frame, [L[3] + 20, L[4] - 40], [0, 1]);
  const walking = frame >= L[3];
  const z = walking ? mixZ(FROM, TO, walk) : PICKS[pickIdx];
  const [cx, cy] = toPx(z);
  const [fx, fy] = toPx(FROM);
  const [tx, ty] = toPx(TO);

  return (
    <AbsoluteFill>
      {/* ---- part A: from noise to image ---- */}
      <AbsoluteFill style={{ opacity: partA }}>
        <Label x={205} y={250} size={26} color={COLORS.muted} center opacity={fade(frame, L[0])}>
          bell curve
        </Label>
        <svg width={1920} height={1080} style={{ position: "absolute", opacity: fade(frame, L[0]) }}>
          <path
            d={Array.from({ length: 41 }, (_, i) => {
              const u = -3 + (6 * i) / 40;
              return `${i ? "L" : "M"} ${130 + i * 3.75} ${360 - 60 * Math.exp(-u * u / 2)}`;
            }).join(" ")}
            fill="none"
            stroke={ROLE.noise}
            strokeWidth={4}
          />
        </svg>
        <div style={{ position: "absolute", left: 110, top: 380, display: "grid", gridTemplateColumns: "repeat(10, 18px)", gap: 1, opacity: fade(frame, L[0] + 10) }}>
          {Z100.map((v, i) => (
            <div key={i} style={{ width: 18, height: 18, borderRadius: 3, background: diverging(v, 2), opacity: fade(frame, L[0] + 10 + i * 0.4, 6) }} />
          ))}
        </div>
        <Label x={205} y={580} size={30} weight={800} color={ROLE.noise} center opacity={fade(frame, L[0] + 20)}>
          <i>z</i>: 100 numbers
        </Label>

        {LAYERS.map((layer, i) => {
          const at = L[1] + 10 + i * 18;
          const p = pop(frame, fps, at, 15);
          return (
            <React.Fragment key={layer.label}>
              <div style={{ opacity: Math.min(1, p) }}>
                <Slab x={layer.x} y={MID - layer.h / 2} h={layer.h} t={layer.t} color={ROLE.gen} />
              </div>
              <Label x={layer.x + layer.t / 2 + layer.h * 0.2} y={MID + layer.h / 2 + 20} size={20} mono color={COLORS.muted} center opacity={fade(frame, at)}>
                {layer.label}
              </Label>
            </React.Fragment>
          );
        })}
        <Layer opacity={fade(frame, L[1])}>
          <Arrow id="ga" d={`M 320 ${MID} L 400 ${MID}`} progress={lerp(frame, [L[1], L[1] + 12], [0, 1])} />
          <Arrow id="gb" d={`M 1030 ${MID} L 1090 ${MID}`} progress={lerp(frame, [L[1] + 80, L[1] + 92], [0, 1])} />
        </Layer>
        <div style={{ position: "absolute", left: 1110, top: MID - 140, opacity: fade(frame, L[1] + 85) }}>
          <Face p={faceFromZ(Z100.slice(0, 8))} size={280} border={ROLE.gen} />
        </div>
        <Label x={1250} y={MID + 160} size={22} mono color={COLORS.muted} center opacity={fade(frame, L[1] + 85)}>
          64×64×3 image
        </Label>
        <Label x={720} y={MID + 175} size={28} weight={700} color={ROLE.gen} center opacity={fade(frame, L[1] + 40)}>
          transposed convolutions: size ×2 at every layer
        </Label>
        <Card x={1450} y={300} w={380} h={340} opacity={fade(frame, L[1] + 100)}>
          <div style={{ padding: "24px 28px", fontSize: 26, lineHeight: 1.5 }}>
            <div style={{ color: COLORS.muted }}>DCGAN generator</div>
            <div>noise → small &amp; deep</div>
            <div>→ bigger &amp; thinner</div>
            <div>→ full image</div>
            <div style={{ color: COLORS.muted, fontSize: 22, marginTop: 10 }}>The output layer uses tanh, so pixels land in [−1, 1].</div>
          </div>
        </Card>
      </AbsoluteFill>

      {/* ---- part B: latent space ---- */}
      <AbsoluteFill style={{ opacity: partB }}>
        <div style={{ position: "absolute", left: PLANE.x, top: PLANE.y, width: PLANE.s, height: PLANE.s, borderRadius: 20, background: COLORS.panel, border: `2px solid ${COLORS.panelBorder}` }} />
        <Label x={PLANE.x + PLANE.s / 2} y={PLANE.y + PLANE.s + 14} size={24} color={COLORS.muted} center>
          latent space (a 2-D slice; each dot is one z)
        </Label>
        <svg width={1920} height={1080} style={{ position: "absolute" }}>
          {DOTS.map((d, i) => {
            const [x, y] = toPx(d);
            return <circle key={i} cx={x} cy={y} r={7} fill={ROLE.noise} opacity={0.55 * fade(frame, L[2] + i * 0.6, 8)} />;
          })}
          {walking ? (
            <line x1={fx} y1={fy} x2={tx} y2={ty} stroke={COLORS.yellow} strokeWidth={3} strokeDasharray="8 8" opacity={fade(frame, L[3])} />
          ) : null}
          {/* the selected z and its link to the picture */}
          <line x1={cx} y1={cy} x2={830} y2={390} stroke={COLORS.yellow} strokeWidth={2} opacity={0.5 * fade(frame, L[2] + 20)} />
          <circle cx={cx} cy={cy} r={14} fill={COLORS.yellow} stroke="#fff" strokeWidth={3} opacity={fade(frame, L[2] + 20)} />
        </svg>
        {walking ? (
          <>
            <Label x={fx} y={fy + 16} size={26} weight={800} color={COLORS.yellow} center>
              z₁
            </Label>
            <Label x={tx} y={ty + 16} size={26} weight={800} color={COLORS.yellow} center opacity={fade(frame, L[3])}>
              z₂
            </Label>
          </>
        ) : null}

        <div style={{ position: "absolute", left: 830, top: 220, opacity: fade(frame, L[2] + 20) }}>
          <Face p={faceFromZ(z)} size={340} border={ROLE.gen} />
        </div>
        <Label x={1000} y={575} size={26} mono color={COLORS.muted} center opacity={fade(frame, L[2] + 20)}>
          G(z)
        </Label>

        {/* the walk, as a film strip */}
        <Label x={1270} y={220} size={26} color={COLORS.muted} opacity={fade(frame, L[3])}>
          walking from z₁ to z₂:
        </Label>
        {Array.from({ length: STRIP }, (_, i) => {
          const t = i / (STRIP - 1);
          const at = L[3] + 20 + t * (L[4] - 40 - (L[3] + 20)); // in step with `walk`
          return (
            <div key={i} style={{ position: "absolute", left: 1270 + (i % 3) * 175, top: 270 + Math.floor(i / 3) * 200, opacity: fade(frame, at, 10) }}>
              <Face p={faceFromZ(mixZ(FROM, TO, t))} size={155} border={COLORS.yellow} />
            </div>
          );
        })}
        <Label x={1520} y={690} size={24} color={COLORS.muted} center opacity={fade(frame, L[4] - 40)}>
          small steps in z → small changes in the picture
        </Label>
        <Label x={1000} y={630} size={22} mono color={COLORS.muted} center opacity={fade(frame, L[3])}>
          {walking ? `z = (1 − t)·z₁ + t·z₂,  t = ${walk.toFixed(2)}` : ""}
        </Label>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

