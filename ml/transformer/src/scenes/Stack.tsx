import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade, lerp } from "../anim";
import { Vector } from "../components/Diagram";
import { Chip } from "../components/Token";
import { Label } from "../components/Text";
import { gaussian } from "../data";
import { COLORS, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

const STACK = { x: 230, w: 400, bottom: 800, height: 520 };
const SENTENCE = ["We", "sat", "on", "the", "river", "bank"];

// What a deep model's vector for "bank" tends to encode at different depths (illustrative).
const DEPTHS = [
  { at: 0.12, title: "early layers", text: "the word “bank” (money? river?)" },
  { at: 0.5, title: "middle layers", text: "a noun, the place where they sat" },
  { at: 0.88, title: "deep layers", text: "the side of a river" },
];

export const Stack: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();

  // 6 blocks, then 96.
  const many = lerp(frame, [L[1] + 50, L[1] + 90], [0, 1]);
  const count = many < 0.01 ? 6 : Math.round(6 + 90 * many);
  const gap = count > 20 ? 2 : 14;
  const h = (STACK.height - gap * (count - 1)) / count;
  const refine = fade(frame, L[2]);

  return (
    <AbsoluteFill>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: STACK.x,
            top: STACK.bottom - (i + 1) * h - i * gap,
            width: STACK.w,
            height: h,
            borderRadius: Math.min(12, h / 2),
            border: count > 20 ? undefined : `3px solid ${ROLE.attn}`,
            background: count > 20 ? `${i % 2 ? ROLE.attn : ROLE.ffn}cc` : `${ROLE.attn}22`,
            opacity: fade(frame, L[0] + Math.min(i, 5) * 4, 10),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            fontWeight: 700,
            color: ROLE.attn,
          }}
        >
          {count <= 6 ? `block ${i + 1}` : null}
        </div>
      ))}
      <Label x={STACK.x + STACK.w / 2} y={STACK.bottom + 14} size={22} color={COLORS.muted} center opacity={fade(frame, L[0])}>
        word vectors in ↑
      </Label>
      <div style={{ position: "absolute", left: STACK.x, top: STACK.bottom - STACK.height - 90, width: STACK.w, textAlign: "center", opacity: fade(frame, L[1]) }}>
        <div style={{ fontFamily: MONO, fontSize: 44, fontWeight: 800, color: COLORS.yellow }}>× {count}</div>
        <div style={{ fontSize: 24, color: COLORS.muted }}>{count > 6 ? "GPT-3 (2020)" : "original Transformer (2017)"}</div>
      </div>

      {/* one word, refined layer by layer */}
      <div style={{ opacity: refine }}>
        {SENTENCE.map((w, i) => (
          <Chip key={w} x={800 + i * 150} y={220} w={136} h={50} size={24} text={w} color={w === "bank" ? ROLE.attn : ROLE.token} fill={w === "bank" ? 0.85 : 0.1} />
        ))}
        {DEPTHS.map((d, k) => {
          const on = fade(frame, L[2] + 20 + k * 40);
          const y = STACK.bottom - d.at * STACK.height - 40;
          return (
            <div key={d.title} style={{ opacity: on }}>
              <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
                <line x1={STACK.x + STACK.w + 10} y1={y + 40} x2={790} y2={y + 40} stroke={COLORS.muted} strokeWidth={2} strokeDasharray="6 6" />
              </svg>
              <Vector values={gaussian(`bank-${k}`, 8)} x={810} y={y + 18} cell={34} horizontal color={ROLE.attn} />
              <Label x={1140} y={y + 4} size={24} weight={800} color={COLORS.yellow}>
                {d.title}
              </Label>
              <Label x={1140} y={y + 38} size={28} weight={600}>
                {d.text}
              </Label>
            </div>
          );
        })}
        <Label x={800} y={850} size={20} mono color={COLORS.muted} opacity={fade(frame, L[2] + 100)}>
          (illustration: what probing studies find at different depths)
        </Label>
      </div>
    </AbsoluteFill>
  );
};
