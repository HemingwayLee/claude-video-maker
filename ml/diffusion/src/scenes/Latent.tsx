import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade, lerp } from "../anim";
import { Arrow, Layer, NetBlock } from "../components/Diagram";
import { PixelImage } from "../components/PixelImage";
import { Label } from "../components/Text";
import { ICONS } from "../data";
import { COLORS, FONT, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

// Stable Diffusion: encoder → diffusion in a small latent → decoder, with the
// prompt read through cross-attention.
const Latent4: React.FC<{ x: number; y: number; opacity: number; noisy?: boolean }> = ({ x, y, opacity, noisy }) => (
  <div style={{ position: "absolute", left: x, top: y, opacity }}>
    {[0, 1, 2, 3].map((k) => (
      <div
        key={k}
        style={{
          position: "absolute",
          left: k * 14,
          top: k * 14,
          width: 110,
          height: 110,
          borderRadius: 8,
          border: `3px solid ${ROLE.latent}`,
          background: noisy ? `repeating-linear-gradient(45deg, ${COLORS.purple}55 0 6px, ${ROLE.latent}33 6px 12px)` : `${ROLE.latent}${["44", "33", "22", "18"][k]}`,
        }}
      />
    ))}
  </div>
);

export const Latent: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();
  const spin = frame * 3;
  return (
    <AbsoluteFill>
      <Label x={960} y={140} size={32} weight={800} center color={ROLE.latent} opacity={fade(frame, L[0])}>
        Latent Diffusion · Rombach et al., CVPR 2022
      </Label>
      {/* pixels → latent */}
      <PixelImage im={{ data: ICONS[5] }} x={80} y={360} size={220} border={ROLE.data} label="512×512×3 image" labelColor={ROLE.data} opacity={fade(frame, L[0] + 20)} />
      <Layer opacity={fade(frame, L[1])}>
        <Arrow id="l1" d="M 315 470 L 360 470" />
        <Arrow id="l2" d="M 545 470 L 590 470" />
      </Layer>
      <NetBlock x={370} y={470} w={170} h={180} shape="shrink" color={ROLE.latent} label="E" labelSize={52} sub="encoder" opacity={fade(frame, L[1])} />
      <Latent4 x={610} y={400} opacity={fade(frame, L[1] + 15)} />
      <Label x={690} y={570} size={22} mono center color={ROLE.latent} opacity={fade(frame, L[1] + 15)}>
        64×64×4 latent
      </Label>
      <Label x={690} y={620} size={24} mono center color={COLORS.text} opacity={fade(frame, L[1] + 40)}>
        786,432 → 16,384 numbers · 48× fewer
      </Label>
      {/* diffusion in latent space */}
      <Layer opacity={fade(frame, L[2])}>
        <Arrow id="l3" d="M 780 470 L 860 470" />
        <Arrow id="l4" d="M 1160 470 L 1240 470" />
        <Arrow id="l5" d="M 1395 470 L 1440 470" />
        <Arrow id="l6" d="M 1625 470 L 1665 470" />
      </Layer>
      <div style={{ position: "absolute", left: 870, top: 370, width: 280, height: 200, borderRadius: 18, border: `3px solid ${ROLE.net}`, background: `${ROLE.net}1c`, opacity: fade(frame, L[2]), fontFamily: FONT, textAlign: "center", color: ROLE.net }}>
        <div style={{ fontSize: 30, fontWeight: 800, marginTop: 40 }}>U-Net ε_θ</div>
        <div style={{ fontSize: 22, color: COLORS.text, marginTop: 10 }}>denoise × ~50 steps</div>
        <svg width={60} height={60} style={{ position: "absolute", right: 10, top: 8 }}>
          <g transform={`rotate(${spin} 30 30)`}>
            <path d="M 30 8 A 22 22 0 1 1 9 24" stroke={ROLE.net} strokeWidth={4} fill="none" />
            <path d="M 3 18 L 9 26 L 16 18" stroke={ROLE.net} strokeWidth={4} fill="none" />
          </g>
        </svg>
      </div>
      <Latent4 x={1255} y={400} opacity={fade(frame, L[2] + 20)} />
      <NetBlock x={1450} y={470} w={170} h={180} shape="grow" color={ROLE.latent} label="D" labelSize={52} sub="decoder" opacity={fade(frame, L[2] + 40)} />
      <PixelImage im={{ data: ICONS[5] }} x={1680} y={360} size={200} border={ROLE.net} label="new 512×512 image" labelColor={ROLE.net} opacity={fade(frame, L[2] + 60)} />
      {/* the prompt */}
      <div style={{ position: "absolute", left: 790, top: 190, display: "flex", alignItems: "center", gap: 18, opacity: fade(frame, L[3]), fontFamily: MONO, fontSize: 24 }}>
        <div style={{ padding: "8px 16px", borderRadius: 10, border: `3px solid ${ROLE.guide}`, color: ROLE.guide }}>"a red house"</div>
        <span style={{ color: COLORS.muted }}>→</span>
        <div style={{ padding: "8px 16px", borderRadius: 10, background: `${ROLE.guide}22`, border: `3px solid ${ROLE.guide}`, color: COLORS.text }}>text encoder (CLIP)</div>
      </div>
      <Layer opacity={fade(frame, L[3] + 15)}>
        <Arrow id="l7" d="M 1010 250 L 1010 360" color={ROLE.guide} width={5} progress={lerp(frame, [L[3] + 15, L[3] + 35], [0, 1])} />
      </Layer>
      <Label x={1030} y={290} size={22} color={ROLE.guide} opacity={fade(frame, L[3] + 30)}>
        cross-attention
      </Label>
      <Label x={960} y={800} size={40} weight={900} center color={COLORS.text} opacity={fade(frame, L[3] + 50)}>
        = Stable Diffusion
      </Label>
    </AbsoluteFill>
  );
};
