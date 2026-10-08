import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade, lerp, linear } from "../anim";
import { Arrow, Layer } from "../components/Diagram";
import { Chip } from "../components/Token";
import { Label } from "../components/Text";
import { COLORS, ROLE } from "../theme";
import { useLines } from "../timeline";

const WORDS = ["the", "cat", "that", "chased", "the", "mouse", "was", "tired"];
const STEP = 170;
const X0 = 330;
const cx = (i: number) => X0 + i * STEP + 60;
const RNN_WORD_Y = 200;
const CELL_Y = 300;
const TF_Y = 790;

export const Before: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();

  const rnn = fade(frame, L[0]);
  // The RNN reads one word per 14 frames, starting with line 0, looping.
  const t = linear(frame, [L[0] + 15, L[0] + 15 + 14 * WORDS.length], [0, WORDS.length]);
  const current = Math.min(WORDS.length - 1, Math.floor(t));
  const memory = fade(frame, L[1]);
  const fading = fade(frame, L[2] + 20, 30);
  const tf = fade(frame, L[3]);
  const arcs = lerp(frame, [L[3] + 15, L[3] + 60], [0, 1]);

  return (
    <AbsoluteFill>
      {/* ---- recurrent network ---- */}
      <Label x={80} y={CELL_Y + 10} size={30} weight={800} color={COLORS.muted} opacity={rnn} width={230}>
        Recurrent network
        <div style={{ fontSize: 22, fontWeight: 500 }}>one word at a time</div>
      </Label>
      {WORDS.map((w, i) => {
        const done = t >= i;
        // Early words fade from memory as the sequence goes on.
        const faded = 1 - fading * Math.max(0, 0.75 - i * 0.12);
        return (
          <React.Fragment key={`r${i}`}>
            <Chip x={X0 + i * STEP} y={RNN_WORD_Y} w={120} h={50} size={24} text={w} opacity={rnn * (done ? faded : 0.35)} fill={i === current && frame < L[3] ? 0.8 : 0.15} />
            <div
              style={{
                position: "absolute",
                left: X0 + i * STEP + 10,
                top: CELL_Y,
                width: 100,
                height: 80,
                borderRadius: 14,
                border: `3px solid ${COLORS.blue}`,
                background: i === current && frame < L[3] ? `${COLORS.blue}55` : COLORS.panel,
                opacity: rnn * (done ? 1 : 0.35),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                color: COLORS.blue,
                fontWeight: 700,
              }}
            >
              RNN
            </div>
          </React.Fragment>
        );
      })}
      <Layer opacity={rnn}>
        {WORDS.map((_, i) => (
          <React.Fragment key={i}>
            <Arrow id={`up${i}`} d={`M ${cx(i)} ${RNN_WORD_Y + 54} L ${cx(i)} ${CELL_Y - 6}`} width={3} progress={t >= i ? 1 : 0} />
            {i < WORDS.length - 1 ? <Arrow id={`h${i}`} d={`M ${cx(i) + 52} ${CELL_Y + 40} L ${cx(i + 1) - 56} ${CELL_Y + 40}`} color={COLORS.yellow} width={4} progress={lerp(t, [i + 0.4, i + 1], [0, 1])} /> : null}
          </React.Fragment>
        ))}
      </Layer>
      <Label x={cx(0) + 85} y={CELL_Y + 95} size={22} color={COLORS.yellow} center opacity={memory}>
        memory h
      </Label>
      {/* the memory vector, carried along */}
      <div style={{ position: "absolute", left: cx(current) - 50, top: CELL_Y + 130, display: "flex", gap: 4, opacity: memory }}>
        {Array.from({ length: 6 }, (_, k) => (
          <div key={k} style={{ width: 14, height: 40, borderRadius: 3, background: COLORS.yellow, opacity: 0.35 + 0.6 * Math.abs(Math.sin(k * 1.7 + current)) }} />
        ))}
      </div>
      <Label x={cx(current) - 50} y={CELL_Y + 180} size={20} color={COLORS.yellow} opacity={memory}>
        everything so far, in one vector
      </Label>
      <div style={{ position: "absolute", left: 330, top: 545, display: "flex", gap: 30, fontSize: 28, fontWeight: 700, opacity: fade(frame, L[2]) }}>
        <span style={{ color: COLORS.red }}>✗ slow: step 8 waits for step 7</span>
        <span style={{ color: COLORS.red, opacity: fading }}>✗ “cat” is fading by the time we read “tired”</span>
      </div>

      {/* ---- transformer ---- */}
      <Label x={80} y={TF_Y - 10} size={30} weight={800} color={ROLE.attn} opacity={tf} width={230}>
        Transformer
        <div style={{ fontSize: 22, fontWeight: 500, color: COLORS.muted }}>all words at once</div>
      </Label>
      <svg width={1920} height={1080} style={{ position: "absolute", opacity: tf }}>
        {WORDS.flatMap((_, i) =>
          WORDS.map((__, j) => {
            if (j <= i) return null;
            const h = 30 + (j - i) * 16;
            const strong = (i === 1 && j === 7) || (i === 5 && j === 3);
            return (
              <path
                key={`${i}-${j}`}
                d={`M ${cx(i)} ${TF_Y - 4} C ${cx(i)} ${TF_Y - h * 1.3}, ${cx(j)} ${TF_Y - h * 1.3}, ${cx(j)} ${TF_Y - 4}`}
                fill="none"
                stroke={ROLE.attn}
                strokeWidth={strong ? 5 : 2}
                strokeOpacity={(strong ? 0.95 : 0.35) * arcs}
              />
            );
          }),
        )}
      </svg>
      {WORDS.map((w, i) => (
        <Chip key={`t${i}`} x={X0 + i * STEP} y={TF_Y} w={120} h={50} size={24} text={w} color={ROLE.attn} fill={0.25} opacity={tf} />
      ))}
    </AbsoluteFill>
  );
};
