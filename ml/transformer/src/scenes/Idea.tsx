import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, lerp, pop } from "../anim";
import { Chip } from "../components/Token";
import { Label } from "../components/Text";
import { IT_INDEX, IT_SENTENCE, IT_TIRED, IT_WIDE } from "../data";
import { COLORS, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

const Y = 560;
const GAP = 12;
const widthOf = (w: string) => 34 + w.length * 17;
const WIDTHS = IT_SENTENCE.map((w) => Math.max(widthOf(w), widthOf("tired")));
const TOTAL = WIDTHS.reduce((a, b) => a + b, 0) + GAP * (WIDTHS.length - 1);
const XS = WIDTHS.reduce<number[]>((acc, w, i) => [...acc, i === 0 ? (1920 - TOTAL) / 2 : acc[i - 1] + WIDTHS[i - 1] + GAP], []);
const center = (i: number) => XS[i] + WIDTHS[i] / 2;
const SEGMENT_COLORS = [COLORS.purple, COLORS.green, COLORS.blue, COLORS.cyan, COLORS.purple, COLORS.yellow, COLORS.blue, ROLE.attn, COLORS.cyan, COLORS.purple, COLORS.magenta];

export const Idea: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  const swap = lerp(frame, [L[3] + 10, L[3] + 45], [0, 1]);
  const weights = IT_TIRED.map((w, i) => w + (IT_WIDE[i] - w) * swap);
  const lastWord = frame >= L[3] + 10 ? "wide" : "tired";
  const arcs = lerp(frame, [L[2], L[2] + 40], [0, 1]);
  const question = pop(frame, fps, L[0] + 30, 10);
  const mix = fade(frame, L[4]);

  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        {IT_SENTENCE.map((_, j) => {
          if (j === IT_INDEX) return null;
          const a = center(IT_INDEX);
          const b = center(j);
          const h = 70 + Math.abs(b - a) * 0.32;
          const w = weights[j];
          return (
            <path
              key={j}
              d={`M ${a} ${Y - 6} C ${a} ${Y - h}, ${b} ${Y - h}, ${b} ${Y - 6}`}
              fill="none"
              stroke={ROLE.attn}
              strokeWidth={2 + 40 * w}
              strokeOpacity={(0.25 + 0.75 * Math.min(1, w * 2.5)) * arcs}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      {IT_SENTENCE.map((w, i) => (
        <React.Fragment key={i}>
          <Chip
            x={XS[i]}
            y={Y}
            w={WIDTHS[i]}
            text={i === IT_SENTENCE.length - 1 ? lastWord : w}
            color={i === IT_INDEX ? ROLE.attn : ROLE.token}
            fill={i === IT_INDEX ? 0.85 : 0.1 + 0.8 * weights[i] * arcs}
            opacity={fade(frame, L[0] + i * 3)}
          />
          {i !== IT_INDEX ? (
            <Label x={center(i)} y={Y + 70} size={22} mono color={weights[i] > 0.15 ? ROLE.attn : COLORS.muted} weight={700} center opacity={arcs}>
              {Math.round(weights[i] * 100)}%
            </Label>
          ) : null}
        </React.Fragment>
      ))}
      <Label x={center(IT_INDEX)} y={Y - 110} size={70} weight={800} color={COLORS.yellow} center opacity={Math.min(1, question) * (1 - arcs)} style={{ transform: `translateX(-50%) scale(${question})` }}>
        ?
      </Label>
      <Label x={960} y={200} size={34} weight={600} center opacity={fade(frame, L[1])}>
        “it” = the <span style={{ color: lastWord === "tired" ? COLORS.green : COLORS.muted }}>animal</span>, because animals get <i>tired</i>
      </Label>
      <Label x={960} y={250} size={34} weight={600} center opacity={fade(frame, L[3] + 30)}>
        …but with <i>wide</i>, “it” = the <span style={{ color: COLORS.yellow }}>street</span>
      </Label>

      {/* the new vector for "it" as a weighted mix */}
      <Label x={XS[0]} y={720} size={28} weight={700} color={ROLE.attn} opacity={mix}>
        new “it” =
      </Label>
      <div style={{ position: "absolute", left: XS[0] + 170, top: 715, width: TOTAL - 170, height: 50, display: "flex", borderRadius: 10, overflow: "hidden", opacity: mix }}>
        {weights.map((w, i) => (
          <div key={i} style={{ width: `${w * 100}%`, height: "100%", background: SEGMENT_COLORS[i], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: COLORS.bg, borderRight: `2px solid ${COLORS.bg}` }}>
            {w > 0.12 ? (i === IT_SENTENCE.length - 1 ? lastWord : IT_SENTENCE[i]) : ""}
          </div>
        ))}
      </div>
      <Label x={XS[0] + 170} y={780} size={22} color={COLORS.muted} opacity={mix}>
        a mix of every word's vector, in proportion to the attention weights
      </Label>
      <div style={{ position: "absolute", right: 110, top: 840, fontFamily: MONO, fontSize: 18, color: COLORS.muted, opacity: fade(frame, L[2] + 40) }}>
        (illustration of a pattern trained models learn)
      </div>
    </AbsoluteFill>
  );
};
