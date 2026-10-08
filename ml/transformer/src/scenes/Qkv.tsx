import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade, lerp } from "../anim";
import { Arrow, Layer, Vector } from "../components/Diagram";
import { Chip } from "../components/Token";
import { Card, Label } from "../components/Text";
import { embedding, gaussian } from "../data";
import { COLORS, diverging, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

const X_VEC = embedding("it");
const ROWS = [
  { key: "q", name: "query", W: "W_Q", color: ROLE.query, y: 250, question: "What am I looking for?" },
  { key: "k", name: "key", W: "W_K", color: ROLE.key, y: 470, question: "What do I contain?" },
  { key: "v", name: "value", W: "W_V", color: ROLE.value, y: 690, question: "What will I pass on?" },
];

// A learned weight matrix, drawn as a small grid of colored cells.
const WeightMatrix: React.FC<{ x: number; y: number; color: string; seed: string; glow: number; label: string }> = ({ x, y, color, seed, glow, label }) => {
  const vals = gaussian(seed, 36);
  return (
    <div style={{ position: "absolute", left: x, top: y, padding: 6, borderRadius: 10, border: `3px solid ${color}`, background: COLORS.panel, boxShadow: glow > 0 ? `0 0 ${30 * glow}px ${color}` : undefined }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 16px)", gap: 2 }}>
        {vals.map((v, i) => (
          <div key={i} style={{ width: 16, height: 16, borderRadius: 2, background: diverging(v, 1.5) }} />
        ))}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: -36, textAlign: "center", fontFamily: MONO, fontSize: 24, fontWeight: 700, color }}>{label}</div>
    </div>
  );
};

const SCORES = [
  { word: "animal", note: "a noun · a living thing", score: 2.9 },
  { word: "street", note: "a noun · a place", score: 1.3 },
  { word: "tired", note: "describes a state", score: 0.6 },
  { word: "the", note: "a little word", score: 0.1 },
];

export const Qkv: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();

  const matrices = fade(frame, L[4]);
  const glow = frame >= L[4] && frame < L[5] ? 0.5 + 0.5 * Math.sin(frame / 6) : 0;
  const search = fade(frame, L[5]);

  return (
    <AbsoluteFill>
      <Chip x={110} y={445} w={100} text="it" color={ROLE.attn} fill={0.85} opacity={fade(frame, L[0])} />
      <Vector values={X_VEC} x={250} y={360} cell={30} color={ROLE.token} label="embedding x" opacity={fade(frame, L[0] + 10)} />

      {ROWS.map((r, i) => {
        const on = fade(frame, L[i + 1]);
        const vals = gaussian(`qkv-${r.key}`, 6);
        return (
          <React.Fragment key={r.key}>
            <Layer opacity={on}>
              <Arrow id={`x${r.key}`} d={`M 300 ${470} C 360 ${470}, 360 ${r.y + 50}, 420 ${r.y + 50}`} color={r.color} width={4} progress={lerp(frame, [L[i + 1], L[i + 1] + 15], [0, 1])} />
              <Arrow id={`o${r.key}`} d={`M 568 ${r.y + 50} L 645 ${r.y + 50}`} color={r.color} width={4} progress={lerp(frame, [L[i + 1] + 10, L[i + 1] + 25], [0, 1])} />
            </Layer>
            <div style={{ opacity: on }}>
              <WeightMatrix x={430} y={r.y} color={r.color} seed={`w-${r.key}`} glow={glow} label={r.W} />
            </div>
            <Vector values={vals} x={660} y={r.y + 32} cell={36} horizontal color={r.color} opacity={on} />
            <Label x={660} y={r.y - 14} size={28} weight={800} color={r.color} opacity={on}>
              {r.name} <span style={{ fontFamily: MONO }}>{r.key}</span>
            </Label>
            <Label x={920} y={r.y + 32} size={30} weight={600} color={COLORS.text} opacity={fade(frame, L[i + 1] + 15)}>
              “{r.question}”
            </Label>
            <Label x={660} y={r.y + 80} size={22} mono color={COLORS.muted} opacity={matrices}>
              {r.key} = x · {r.W}
            </Label>
          </React.Fragment>
        );
      })}
      <Label x={430} y={850} size={22} color={COLORS.muted} opacity={matrices}>
        the W matrices are learned in training, and shared by every word
      </Label>

      {/* the search analogy */}
      <Card x={1330} y={190} w={500} h={660} accent={ROLE.query} opacity={search}>
        <div style={{ padding: "22px 26px" }}>
          <div style={{ fontSize: 24, color: COLORS.muted }}>query from “it”</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: ROLE.query, marginBottom: 22 }}>“a noun that can be tired”</div>
          <div style={{ fontSize: 24, color: COLORS.muted, marginBottom: 8 }}>keys of the other words → score q·k</div>
          {SCORES.map((s, i) => {
            const on = fade(frame, L[5] + 20 + i * 10);
            return (
              <div key={s.word} style={{ marginBottom: 16, opacity: on }}>
                <div style={{ fontSize: 26, fontWeight: 700 }}>
                  {s.word} <span style={{ fontSize: 20, fontWeight: 500, color: ROLE.key }}>{s.note}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
                  <div style={{ width: 110 * s.score * on, height: 20, borderRadius: 4, background: ROLE.attn }} />
                  <span style={{ fontFamily: MONO, fontSize: 22, color: COLORS.muted }}>{s.score.toFixed(1)}</span>
                </div>
              </div>
            );
          })}
          <div style={{ fontSize: 20, color: COLORS.muted, marginTop: 6 }}>(the labels are a human reading; real vectors are just numbers)</div>
        </div>
      </Card>
    </AbsoluteFill>
  );
};
