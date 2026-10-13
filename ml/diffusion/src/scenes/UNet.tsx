import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade, fadeOut, lerp } from "../anim";
import { Arrow, Layer } from "../components/Diagram";
import { PixelImage } from "../components/PixelImage";
import { Label } from "../components/Text";
import { ALPHA_BAR, decode, imageFrames } from "../data";
import { COLORS, FONT, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

// The noise predictor for images: a U-Net of residual blocks, the time step
// fed into every block, self-attention at low resolution. Then: DiT.
const LEVELS = [
  { res: "64×64", h: 160, attn: false },
  { res: "32×32", h: 130, attn: false },
  { res: "16×16", h: 100, attn: true },
  { res: "8×8", h: 76, attn: true },
];
const ex = (i: number) => 420 + i * 125;
const dx = (i: number) => 1500 - i * 125;
const ly = (i: number) => 330 + i * 95;
const BY = ly(4);
const BW = 92;
const FR = imageFrames(2);
const XT = decode(FR.find((f) => f.t === 500)!.xt);
const X0 = decode(FR.find((f) => f.t === 500)!.x0);
// The noise in that x_t (for the "out comes the noise" picture). The
// sampler recorded frame t with ᾱ = ALPHA_BAR[t].
const ab = ALPHA_BAR[500];
const EPS = Float32Array.from(XT, (v, i) => (((v / 255) * 2 - 1) - Math.sqrt(ab) * ((X0[i] / 255) * 2 - 1)) / Math.sqrt(1 - ab));

const Block: React.FC<{ x: number; y: number; h: number; color: string; attn: boolean; attnOn: number; opacity: number }> = ({ x, y, h, color, attn, attnOn, opacity }) => (
  <div style={{ position: "absolute", left: x - BW / 2, top: y - h / 2, width: BW, height: h, opacity }}>
    <div style={{ width: "100%", height: "100%", borderRadius: 10, background: `${color}30`, border: `3px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 15, color: COLORS.text, textAlign: "center" }}>
      Res
      <br />
      Block
    </div>
    {attn && (
      <div style={{ position: "absolute", left: -6, right: -6, bottom: -26, textAlign: "center", fontFamily: MONO, fontSize: 16, fontWeight: 800, color: ROLE.guide, padding: "2px 0", borderRadius: 6, background: `rgba(76,201,240,${0.15 + 0.4 * attnOn})`, boxShadow: attnOn > 0 ? `0 0 ${18 * attnOn}px ${ROLE.guide}` : undefined }}>
        + attn
      </div>
    )}
  </div>
);

export const UNet: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();
  const net = fade(frame, L[0]) * fadeOut(frame, L[5] - 5, 12);
  const time = fade(frame, L[2]);
  const attnOn = frame >= L[4] && frame < L[5] ? 0.5 + 0.5 * Math.sin(frame / 5) : 0;
  const pulse = frame >= L[2] && frame < L[4] ? 0.5 + 0.5 * Math.sin(frame / 4) : 0;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: net }}>
        <PixelImage im={{ data: XT }} x={90} y={270} size={190} border={ROLE.noise} label="noisy xₜ" labelColor={ROLE.noise} opacity={fade(frame, L[1])} />
        <PixelImage im={{ data: EPS, float: true }} x={1640} y={270} size={190} border={ROLE.net} label="predicted noise ε̂" labelColor={ROLE.net} opacity={fade(frame, L[1] + 20)} />
        <Label x={960} y={150} size={30} weight={800} center color={ROLE.net}>
          ε_θ(xₜ, t): a U-Net
        </Label>
        <Label x={960} y={195} size={24} center color={COLORS.muted} opacity={fade(frame, L[1] + 30)}>
          output = same size as input
        </Label>
        <Layer>
          <Arrow id="u1" d={`M 290 365 L ${ex(0) - BW / 2 - 8} 365`} progress={fade(frame, L[1])} />
          <Arrow id="u2" d={`M ${dx(0) + BW / 2 + 8} 365 L 1630 365`} progress={fade(frame, L[1] + 20)} />
          {LEVELS.map((_, i) => (
            <React.Fragment key={i}>
              <line x1={ex(i)} y1={ly(i)} x2={i === 3 ? 960 : ex(i + 1)} y2={i === 3 ? BY : ly(i + 1)} stroke={COLORS.muted} strokeWidth={2} />
              <line x1={dx(i)} y1={ly(i)} x2={i === 3 ? 960 : dx(i + 1)} y2={i === 3 ? BY : ly(i + 1)} stroke={COLORS.muted} strokeWidth={2} />
              <line x1={ex(i) + BW / 2 + 4} y1={ly(i) - 20} x2={dx(i) - BW / 2 - 4} y2={ly(i) - 20} stroke={ROLE.data} strokeWidth={3} strokeDasharray="10 8" strokeDashoffset={-frame * 1.2} opacity={0.7} />
            </React.Fragment>
          ))}
          {/* time embedding bus */}
          <g opacity={time}>
            <path d={`M 300 ${BY + 140} L 1620 ${BY + 140}`} stroke={ROLE.time} strokeWidth={4} />
            {[...LEVELS.map((l, i) => [ex(i), ly(i) + l.h / 2]), [960, BY + 30], ...LEVELS.map((l, i) => [dx(i), ly(i) + l.h / 2])].map(([x, y], k) => (
              <g key={k}>
                <line x1={x} y1={BY + 140} x2={x} y2={y + (LEVELS.some((l, i) => l.attn && (x === ex(i) || x === dx(i))) ? 30 : 6)} stroke={ROLE.time} strokeWidth={3} opacity={0.6 + 0.4 * pulse} />
              </g>
            ))}
          </g>
        </Layer>
        {LEVELS.map((l, i) => (
          <React.Fragment key={i}>
            <Block x={ex(i)} y={ly(i)} h={l.h} color={COLORS.blue} attn={l.attn} attnOn={attnOn} opacity={fade(frame, L[0] + i * 8)} />
            <Block x={dx(i)} y={ly(i)} h={l.h} color={COLORS.green} attn={l.attn} attnOn={attnOn} opacity={fade(frame, L[0] + 50 - i * 8)} />
            <Label x={ex(i) - BW / 2 - 12} y={ly(i) - 12} size={18} mono color={COLORS.muted} style={{ transform: "translateX(-100%)" }} opacity={fade(frame, L[0] + i * 8)}>
              {l.res}
            </Label>
          </React.Fragment>
        ))}
        <Block x={960} y={BY} h={60} color={COLORS.purple} attn attnOn={attnOn} opacity={fade(frame, L[0] + 36)} />
        {/* time step → embedding */}
        <div style={{ position: "absolute", left: 60, top: BY + 105, display: "flex", alignItems: "center", gap: 14, opacity: time, fontFamily: MONO, fontSize: 26, fontWeight: 800, color: ROLE.time }}>
          <div style={{ padding: "6px 14px", border: `3px solid ${ROLE.time}`, borderRadius: 10 }}>t</div>→
          <svg width={90} height={50}>
            {[0, 1, 2].map((k) => (
              <path key={k} d={Array.from({ length: 40 }, (_, i) => `${i ? "L" : "M"} ${i * 2.2} ${25 - 18 * Math.sin((i / 40) * Math.PI * 2 * (k + 1))}`).join(" ")} stroke={ROLE.time} strokeWidth={2} fill="none" opacity={0.5 + 0.2 * k} />
            ))}
          </svg>
        </div>
        <Label x={960} y={BY + 158} size={22} center color={ROLE.time} opacity={time}>
          time embedding (sines and cosines of t, through a small MLP) → added inside every block
        </Label>
        <div style={{ position: "absolute", left: 1550, top: 520, fontFamily: FONT, fontSize: 24, color: COLORS.text, opacity: fade(frame, L[3]), lineHeight: 1.6 }}>
          <div>
            <span style={{ color: ROLE.time, fontFamily: MONO }}>t = 950</span> → remove a lot
          </div>
          <div>
            <span style={{ color: ROLE.time, fontFamily: MONO }}>t = 20</span> → just polish
          </div>
        </div>
        <Label x={960} y={265} size={22} center color={ROLE.data} opacity={fade(frame, L[0] + 50)}>
          skip connections, as in Pix2Pix
        </Label>
      </AbsoluteFill>

      {/* DiT */}
      <AbsoluteFill style={{ opacity: fade(frame, L[5]) }}>
        <Label x={960} y={160} size={34} weight={800} center color={ROLE.net}>
          Diffusion Transformer (DiT) · Peebles & Xie, 2023
        </Label>
        <PixelImage im={{ data: XT }} x={140} y={360} size={240} border={ROLE.noise} label="noisy latent / image" labelColor={ROLE.noise} />
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
          {[0, 1, 2, 3].map((k) => (
            <line key={k} x1={140 + (k * 240) / 4} y1={360} x2={140 + (k * 240) / 4} y2={600} stroke={COLORS.bg} strokeWidth={3} />
          ))}
          {[0, 1, 2, 3].map((k) => (
            <line key={`h${k}`} x1={140} y1={360 + (k * 240) / 4} x2={380} y2={360 + (k * 240) / 4} stroke={COLORS.bg} strokeWidth={3} />
          ))}
        </svg>
        <Layer>
          <Arrow id="dit1" d="M 400 480 L 470 480" />
          <Arrow id="dit2" d="M 1430 480 L 1500 480" />
        </Layer>
        <div style={{ position: "absolute", left: 490, top: 440, display: "flex", gap: 6 }}>
          {Array.from({ length: 16 }, (_, k) => (
            <div key={k} style={{ width: 22, height: 80, borderRadius: 4, background: `${COLORS.purple}88`, border: `2px solid ${COLORS.purple}` }} />
          ))}
        </div>
        <Label x={680} y={540} size={22} center color={COLORS.muted}>
          patches → tokens
        </Label>
        <div style={{ position: "absolute", left: 960, top: 380, width: 440, height: 200, borderRadius: 16, border: `3px solid ${ROLE.net}`, background: `${ROLE.net}20`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontSize: 30, fontWeight: 800, color: ROLE.net }}>
          Transformer blocks × N
        </div>
        <Label x={1180} y={600} size={22} center color={ROLE.time}>
          + time step (and prompt) as conditioning
        </Label>
        <PixelImage im={{ data: EPS, float: true }} x={1520} y={360} size={240} border={ROLE.net} label="predicted noise" labelColor={ROLE.net} />
        <Label x={960} y={760} size={28} center color={COLORS.text}>
          used in Stable Diffusion 3 and Sora
        </Label>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
