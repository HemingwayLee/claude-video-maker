import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, lerp, pop } from "../anim";
import { Arrow, Layer } from "../components/Diagram";
import { MatrixView } from "../components/MatrixView";
import { Chip } from "../components/Token";
import { Label } from "../components/Text";
import { GEN_SCORES, GEN_TOKENS, MASKED_WEIGHTS, NEXT, NEXT_P } from "../data";
import { COLORS, diverging, heat, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

const CELL = 72;
const BARS = { x: 1290, y: 400, row: 62, w: 300 };
const MAX_LOGIT = Math.max(...NEXT.map((n) => n.logit));

export const Generate: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  const masked = frame >= L[1] + 40;
  const weights = fade(frame, L[1] + 70);
  const scores = fade(frame, L[2]);
  const probs = lerp(frame, [L[3], L[3] + 30], [0, 1]);
  const picked = frame >= L[3] + 50;
  const fly = lerp(frame, [L[4], L[4] + 30], [0, 1]);
  const flyFrom = { x: BARS.x - 130, y: BARS.y };
  const flyTo = { x: 160 + 5 * 150, y: 190 };

  return (
    <AbsoluteFill>
      {/* the text so far */}
      {GEN_TOKENS.map((t, i) => (
        <Chip key={i} x={160 + i * 150} y={190} w={136} text={t} opacity={fade(frame, L[0] + i * 3)} />
      ))}
      <Chip x={160 + 5 * 150} y={190} w={136} text="?" color={COLORS.yellow} opacity={fade(frame, L[0] + 20) * (fly > 0.95 ? 0 : 1)} />
      {fly > 0 ? (
        <Chip x={flyFrom.x + (flyTo.x - flyFrom.x) * fly} y={flyFrom.y + (flyTo.y - flyFrom.y) * fly} w={136} text="mat" color={COLORS.green} fill={0.85} />
      ) : null}
      <div style={{ position: "absolute", left: 1070, top: 198, fontSize: 28, fontWeight: 700, color: COLORS.green, opacity: fade(frame, L[4] + 35) }}>
        ⟳ add it, and predict again…
      </div>

      {/* causal mask */}
      <MatrixView
        m={GEN_SCORES}
        x={260}
        y={420}
        cell={CELL}
        color={(v, r, c) => (masked && c > r ? "rgb(20,24,44)" : diverging(v, 3))}
        format={(v) => v.toFixed(1)}
        showValues={(r, c) => !masked || c <= r}
        rowLabels={GEN_TOKENS}
        colLabels={GEN_TOKENS}
        title={masked ? "scores, masked" : "scores"}
        opacity={fade(frame, L[1])}
        fontSize={20}
      />
      {masked
        ? GEN_SCORES.map((row, r) =>
            row.map((_, c) =>
              c > r ? (
                <div key={`${r}-${c}`} style={{ position: "absolute", left: 260 + c * CELL, top: 420 + r * CELL, width: CELL, height: CELL, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 20, color: COLORS.red, opacity: fade(frame, L[1] + 40 + (r + c) * 2, 8) }}>
                  −∞
                </div>
              ) : null,
            ),
          )
        : null}
      <Label x={260} y={420 + 5 * CELL + 14} size={22} color={COLORS.muted} width={380} opacity={fade(frame, L[1] + 40)}>
        each word may only look at itself and earlier words
      </Label>
      <MatrixView m={MASKED_WEIGHTS} x={780} y={420} cell={CELL} color={(v) => heat(v / 0.8)} showValues={(r, c) => c <= r} colLabels={GEN_TOKENS} title="softmax" titleColor={ROLE.attn} opacity={weights} fontSize={20} />
      <Layer opacity={weights}>
        <Arrow id="m1" d={`M ${260 + 5 * CELL + 15} ${420 + 2.5 * CELL} L ${765} ${420 + 2.5 * CELL}`} width={4} />
      </Layer>

      {/* scores over the vocabulary → probabilities */}
      <Label x={BARS.x - 130} y={BARS.y - 70} size={24} weight={700} color={COLORS.text} opacity={scores} width={500}>
        last vector → a score per vocabulary token
        <div style={{ fontSize: 20, color: COLORS.muted, fontWeight: 500 }}>{probs > 0.5 ? "after softmax: probabilities" : "raw scores (logits)"} · example numbers</div>
      </Label>
      {NEXT.map((n, i) => {
        const value = n.logit / MAX_LOGIT + (NEXT_P[i] / NEXT_P[0] - n.logit / MAX_LOGIT) * probs;
        const top = picked && i === 0;
        return (
          <div key={n.token} style={{ position: "absolute", left: BARS.x - 130, top: BARS.y + i * BARS.row, display: "flex", alignItems: "center", gap: 14, opacity: fade(frame, L[2] + 10 + i * 5) }}>
            <div style={{ width: 110, textAlign: "right", fontSize: 26, fontWeight: 700, color: top ? COLORS.green : COLORS.text }}>{n.token}</div>
            <div style={{ width: BARS.w * value, height: 34, borderRadius: 6, background: top ? COLORS.green : probs > 0.5 ? ROLE.attn : COLORS.muted }} />
            <div style={{ fontFamily: MONO, fontSize: 22, color: COLORS.muted }}>{probs > 0.5 ? `${Math.round(NEXT_P[i] * 100)}%` : n.logit.toFixed(1)}</div>
          </div>
        );
      })}
      <Label x={BARS.x - 130} y={BARS.y + NEXT.length * BARS.row + 6} size={22} color={COLORS.muted} opacity={scores}>
        … and ~50,000 more tokens
      </Label>
      {picked ? (
        <div style={{ position: "absolute", left: BARS.x + 390, top: BARS.y - 2, fontSize: 26, fontWeight: 800, color: COLORS.green, transform: `scale(${pop(frame, fps, L[3] + 50, 12)})` }}>← picked</div>
      ) : null}
    </AbsoluteFill>
  );
};
