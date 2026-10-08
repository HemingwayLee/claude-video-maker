import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, lerp, pop } from "../anim";
import { Arrow, Layer } from "../components/Diagram";
import { Chip } from "../components/Token";
import { Label } from "../components/Text";
import { COLORS, ROLE } from "../theme";
import { useLines } from "../timeline";

const SRC = ["I", "love", "cats"];
const DEC_IN = ["<start>", "J'", "aime", "les"];
const DEC_OUT = ["J'", "aime", "les", "chats"];

const Sub: React.FC<{ x: number; y: number; w: number; text: string; color: string; glow?: number }> = ({ x, y, w, text, color, glow = 0 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: 60, borderRadius: 12, border: `3px solid ${color}`, background: `${color}22`, boxShadow: glow ? `0 0 ${26 * glow}px ${color}` : undefined, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700, color }}>
    {text}
  </div>
);

const VARIANTS = [
  { name: "BERT", kind: "encoder only", use: "understanding: search, classification", color: COLORS.cyan },
  { name: "GPT", kind: "decoder only", use: "generating text: chatbots, code", color: ROLE.attn },
  { name: "T5", kind: "encoder + decoder", use: "text in → text out: translation, summaries", color: COLORS.green },
];

export const EncDec: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();
  const pulse = 0.5 + 0.5 * Math.sin(frame / 6);

  const enc = fade(frame, L[0]);
  const dec = fade(frame, L[0] + 20);
  const encActive = frame >= L[1] && frame < L[2] ? pulse : 0;
  const cross = lerp(frame, [L[2] + 10, L[2] + 40], [0, 1]);
  const written = Math.floor(lerp(frame, [L[2] + 30, L[3] - 10], [0, DEC_OUT.length]));

  return (
    <AbsoluteFill>
      {/* encoder */}
      <div style={{ opacity: enc }}>
        <div style={{ position: "absolute", left: 200, top: 340, width: 440, height: 300, borderRadius: 20, border: `3px dashed ${COLORS.cyan}` }} />
        <Label x={420} y={290} size={32} weight={800} color={COLORS.cyan} center>
          Encoder <span style={{ fontSize: 24, color: COLORS.muted }}>× 6</span>
        </Label>
        <Sub x={240} y={540} w={360} text="Self-attention" color={ROLE.attn} glow={encActive} />
        <Sub x={240} y={410} w={360} text="Feed-forward" color={ROLE.ffn} />
        {SRC.map((w, i) => (
          <Chip key={w} x={265 + i * 110} y={720} w={100} h={50} size={24} text={w} />
        ))}
        <Label x={420} y={785} size={22} color={COLORS.muted} center>
          source: English
        </Label>
      </div>

      {/* decoder */}
      <div style={{ opacity: dec }}>
        <div style={{ position: "absolute", left: 820, top: 240, width: 500, height: 400, borderRadius: 20, border: `3px dashed ${ROLE.attn}` }} />
        <Label x={1070} y={646} size={30} weight={800} color={ROLE.attn} center>
          Decoder <span style={{ fontSize: 24, color: COLORS.muted }}>× 6</span>
        </Label>
        <Sub x={860} y={545} w={420} text="Masked self-attention" color={ROLE.attn} />
        <Sub x={860} y={445} w={420} text="Cross-attention" color={COLORS.yellow} glow={cross * pulse * (frame < L[3] ? 1 : 0)} />
        <Sub x={860} y={345} w={420} text="Feed-forward" color={ROLE.ffn} />
        {DEC_IN.map((w, i) => (
          <Chip key={w} x={830 + i * 120} y={720} w={110} h={50} size={22} text={w} opacity={i <= Math.max(written, 0) ? 1 : 0.3} />
        ))}
        <Label x={1070} y={785} size={22} color={COLORS.muted} center>
          what it has written so far
        </Label>
        {DEC_OUT.map((w, i) => {
          const p = pop(frame, fps, L[2] + 30 + (i * (L[3] - 10 - L[2] - 30)) / DEC_OUT.length, 14);
          return <Chip key={`o${i}`} x={830 + i * 120} y={170} w={110} h={50} size={24} text={w} color={COLORS.green} fill={0.8} opacity={Math.min(1, p)} style={{ transform: `scale(${Math.min(1, p)})` }} />;
        })}
      </div>

      <Layer opacity={cross}>
        <Arrow id="x1" d="M 645 400 C 740 400, 760 475, 850 475" color={COLORS.yellow} width={5} progress={cross} flow={frame} />
      </Layer>
      <Label x={655} y={495} size={22} weight={700} color={COLORS.yellow} width={170} opacity={cross}>
        keys &amp; values from the encoder
      </Label>

      {/* the three families */}
      {VARIANTS.map((v, i) => {
        const p = pop(frame, fps, L[3] + i * 18, 14);
        return (
          <div key={v.name} style={{ position: "absolute", left: 1400, top: 230 + i * 190, width: 420, padding: "18px 24px", borderRadius: 18, border: `3px solid ${v.color}`, background: COLORS.panel, opacity: Math.min(1, p), transform: `translateX(${(1 - Math.min(1, p)) * 40}px)` }}>
            <div style={{ fontSize: 40, fontWeight: 800, color: v.color }}>
              {v.name} <span style={{ fontSize: 24, color: COLORS.text, fontWeight: 600 }}>{v.kind}</span>
            </div>
            <div style={{ fontSize: 22, color: COLORS.muted, marginTop: 6 }}>{v.use}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
