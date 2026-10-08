import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, fadeOut, lerp, pop } from "../anim";
import { Arrow, Layer, Vector } from "../components/Diagram";
import { Chip } from "../components/Token";
import { Label } from "../components/Text";
import { embedding, TOKEN_IDS, TOKEN_SENTENCE } from "../data";
import { COLORS, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

const STEP = 200;
const X0 = 270;
const CHIP_Y = 300;

// Embedding space, squashed to 2-D (illustration): words used alike sit together.
const CLUSTERS = [
  { color: COLORS.green, label: "animals", words: [["cat", 0, 0], ["dog", 60, 40], ["mouse", -50, 70], ["horse", 40, -45]] },
  { color: COLORS.yellow, label: "furniture", words: [["mat", 0, 0], ["sofa", 70, 30], ["table", -40, 60], ["chair", 30, -50]] },
  { color: COLORS.cyan, label: "actions", words: [["sat", 0, 0], ["ran", 60, 40], ["slept", -60, 50], ["jumped", 50, -45]] },
  { color: COLORS.magenta, label: "little words", words: [["the", 0, 0], ["a", 50, 40], ["on", -45, 45], ["of", 40, -40]] },
] as const;
const CENTERS = [
  [520, 600],
  [1000, 720],
  [1420, 560],
  [920, 480],
];

export const Tokens: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  const split = lerp(frame, [L[0] + 10, L[0] + 45], [0, 1]);
  const vectors = fadeOut(frame, L[3] - 10, 20);
  const space = fade(frame, L[3] + 10);

  return (
    <AbsoluteFill>
      {/* raw text */}
      <Label x={960} y={180} size={48} weight={600} center opacity={fade(frame, L[0]) * (1 - split * 0.6)}>
        “The cat sat on the mat.”
      </Label>
      {TOKEN_SENTENCE.map((t, i) => {
        const p = pop(frame, fps, L[0] + 20 + i * 4, 14);
        return <Chip key={i} x={X0 + i * STEP} y={CHIP_Y - (1 - Math.min(1, p)) * 60} w={150} text={t} opacity={Math.min(1, p)} />;
      })}
      <Label x={130} y={CHIP_Y + 14} size={24} color={COLORS.muted} opacity={split}>
        tokens
      </Label>

      {/* token IDs */}
      <Label x={130} y={395} size={24} color={COLORS.muted} opacity={fade(frame, L[1])}>
        IDs
      </Label>
      {TOKEN_IDS.map((id, i) => (
        <Label key={i} x={X0 + i * STEP + 75} y={392} size={30} mono weight={700} color={COLORS.yellow} center opacity={fade(frame, L[1] + i * 4)}>
          {id}
        </Label>
      ))}

      {/* embeddings */}
      <AbsoluteFill style={{ opacity: vectors }}>
        <Label x={130} y={560} size={24} color={COLORS.muted} width={120} opacity={fade(frame, L[2])}>
          vectors
        </Label>
        <Layer opacity={fade(frame, L[2])}>
          {TOKEN_SENTENCE.map((_, i) => (
            <Arrow key={i} id={`e${i}`} d={`M ${X0 + i * STEP + 75} 440 L ${X0 + i * STEP + 75} 470`} width={3} progress={lerp(frame, [L[2] + i * 5, L[2] + i * 5 + 10], [0, 1])} />
          ))}
        </Layer>
        {TOKEN_SENTENCE.map((t, i) => (
          <Vector key={i} values={embedding(t)} x={X0 + i * STEP + 61} y={485} cell={28} color={ROLE.token} opacity={fade(frame, L[2] + 8 + i * 5)} />
        ))}
        <Label x={960} y={760} size={26} color={ROLE.token} center opacity={fade(frame, L[2] + 50)}>
          each vector: 512 numbers (8 shown) · both “the”s get the same vector
        </Label>
      </AbsoluteFill>

      {/* embedding space */}
      <AbsoluteFill style={{ opacity: space }}>
        <div style={{ position: "absolute", left: 300, top: 430, width: 1320, height: 400, borderRadius: 20, background: COLORS.panel, border: `2px solid ${COLORS.panelBorder}` }} />
        {CLUSTERS.map((c, k) =>
          c.words.map(([w, dx, dy], i) => (
            <div
              key={w}
              style={{
                position: "absolute",
                left: CENTERS[k][0] + dx * 1.3,
                top: CENTERS[k][1] + dy * 1.1,
                transform: "translate(-50%, -50%)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 26,
                fontWeight: 600,
                color: c.color,
                opacity: fade(frame, L[3] + 10 + k * 8 + i * 3),
              }}
            >
              <div style={{ width: 12, height: 12, borderRadius: 6, background: c.color }} />
              {w}
            </div>
          )),
        )}
        <Label x={320} y={445} size={22} color={COLORS.muted}>
          embedding space, squashed to 2-D (illustration)
        </Label>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 1640, top: 392, fontFamily: MONO, fontSize: 20, color: COLORS.muted, opacity: fade(frame, L[1] + 30) }}>(example IDs)</div>
    </AbsoluteFill>
  );
};
