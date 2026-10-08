import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade, lerp } from "../anim";
import { MatrixView } from "../components/MatrixView";
import { D_K, K, MATH_TOKENS, OUTPUT, Q, SCALED, SCORES, transpose, V, WEIGHTS } from "../data";
import { COLORS, diverging, heat, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

const KT = transpose(K);
const CENTER = { x: 870, y: 340, cell: 92 };
const SMALL = 54;
const ROW = 1; // the row we follow in steps 3 and 4: "cat"
const f2 = (v: number) => v.toFixed(2);

// The formula at the top; each part lights up during its step.
const Part: React.FC<{ on: boolean; color: string; children: React.ReactNode }> = ({ on, color, children }) => (
  <span style={{ color: on ? color : COLORS.muted, textShadow: on ? `0 0 18px ${color}` : undefined }}>{children}</span>
);

export const AttentionMath: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();

  const step = frame >= L[5] ? 5 : frame >= L[4] ? 4 : frame >= L[3] ? 3 : frame >= L[2] ? 2 : frame >= L[1] ? 1 : 0;
  const all = step === 5;

  // Step 1 fills the score grid one cell at a time.
  const filled = Math.floor(lerp(frame, [L[1] + 10, L[2] - 20], [0, 16]));
  const cellIdx = Math.min(15, Math.max(0, filled - 1));
  const [ci, cj] = [Math.floor(cellIdx / 4), cellIdx % 4];
  const p2 = lerp(frame, [L[2] + 10, L[2] + 40], [0, 1]);
  const p3 = lerp(frame, [L[3] + 10, L[3] + 40], [0, 1]);
  const center = SCORES.map((row, i) =>
    row.map((s, j) => {
      const a = s + (SCALED[i][j] - s) * p2;
      return a + (WEIGHTS[i][j] - a) * p3;
    }),
  );
  const out = fade(frame, L[4] + 20);

  let calc: React.ReactNode = null;
  if (step === 1 && filled > 0) {
    calc = (
      <>
        <span style={{ color: ROLE.query }}>q_{MATH_TOKENS[ci]}</span> · <span style={{ color: ROLE.key }}>k_{MATH_TOKENS[cj]}</span> = {Q[ci].map((q, k) => `${q.toFixed(1)}×${K[cj][k].toFixed(1)}`).join(" + ")} = <b style={{ color: COLORS.text }}>{f2(SCORES[ci][cj])}</b>
      </>
    );
  } else if (step === 2) {
    calc = (
      <>
        d = {D_K}, √d = {Math.sqrt(D_K)} · e.g. {f2(SCORES[ROW][2])} / {Math.sqrt(D_K)} = <b style={{ color: COLORS.text }}>{f2(SCALED[ROW][2])}</b>
      </>
    );
  } else if (step === 3) {
    calc = (
      <>
        softmax([{SCALED[ROW].map(f2).join(", ")}]) = [<span style={{ color: ROLE.attn }}>{WEIGHTS[ROW].map(f2).join(", ")}</span>] · sum = 1
      </>
    );
  } else if (step >= 4) {
    calc = (
      <>
        cat′ = {WEIGHTS[ROW].map((w, j) => `${f2(w)}·v_${MATH_TOKENS[j]}`).join(" + ")} = [<span style={{ color: ROLE.value }}>{OUTPUT[ROW].map(f2).join(", ")}</span>]
      </>
    );
  }

  return (
    <AbsoluteFill>
      {/* the formula */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: all ? 150 : 120,
          textAlign: "center",
          fontFamily: "'Times New Roman', Georgia, serif",
          fontSize: all ? 64 : 46,
          opacity: fade(frame, L[0]),
          paddingLeft: all ? 0 : 500,
        }}
      >
        Attention(Q, K, V) = <Part on={step === 3 || all} color={ROLE.attn}>softmax</Part>(
        <Part on={step === 1 || all} color={ROLE.query}>Q</Part>
        <Part on={step === 1 || all} color={ROLE.key}>Kᵀ</Part> <Part on={step === 2 || all} color={COLORS.text}>/ √d</Part>)
        <Part on={step === 4 || all} color={ROLE.value}> V</Part>
      </div>

      <div style={{ opacity: all ? 0.25 : 1 }}>
        <MatrixView m={Q} x={200} y={CENTER.y} cell={SMALL} color={(v) => diverging(v, 1.6)} format={(v) => v.toFixed(1)} rowLabels={MATH_TOKENS} title="Q" titleColor={ROLE.query} highlightRow={step === 1 && filled > 0 ? ci : undefined} highlightColor={ROLE.query} opacity={fade(frame, L[0] + 10)} />
        <MatrixView m={KT} x={510} y={CENTER.y} cell={SMALL} color={(v) => diverging(v, 1.6)} format={(v) => v.toFixed(1)} colLabels={MATH_TOKENS} title="Kᵀ" titleColor={ROLE.key} cellOpacity={(_, c) => (step === 1 && filled > 0 && c !== cj ? 0.35 : 1)} opacity={fade(frame, L[0] + 20)} />

        <MatrixView
          m={center}
          x={CENTER.x}
          y={CENTER.y}
          cell={CENTER.cell}
          color={(v) => (p3 > 0.5 ? heat(v / 0.55) : diverging(v, 3))}
          showValues={(r, c) => step >= 2 || r * 4 + c < filled}
          cellOpacity={(r, c) => (step === 1 && r * 4 + c >= filled ? 0.25 : step >= 4 && !all && r !== ROW ? 0.35 : 1)}
          rowLabels={MATH_TOKENS}
          colLabels={MATH_TOKENS}
          highlightRow={step >= 3 && !all ? ROW : undefined}
          highlightColor={ROLE.attn}
          title={step >= 3 ? "attention weights" : step === 2 ? "scores / √d" : "scores Q·Kᵀ"}
          titleColor={step >= 3 ? ROLE.attn : COLORS.text}
          fontSize={26}
          opacity={fade(frame, L[1])}
        />
        {step >= 3
          ? WEIGHTS.map((_, r) => (
              <div key={r} style={{ position: "absolute", left: CENTER.x + 4 * CENTER.cell + 12, top: CENTER.y + r * CENTER.cell + 30, fontFamily: MONO, fontSize: 22, color: COLORS.muted, opacity: p3 }}>
                Σ=1
              </div>
            ))
          : null}

        <MatrixView m={V} x={1370} y={CENTER.y} cell={SMALL} color={(v) => diverging(v, 1.6)} format={(v) => v.toFixed(1)} title="V" titleColor={ROLE.value} opacity={fade(frame, L[4])} />
        <MatrixView
          m={OUTPUT}
          x={1620}
          y={CENTER.y}
          cell={SMALL}
          color={(v) => diverging(v, 1.2)}
          title="output"
          titleColor={ROLE.value}
          cellOpacity={(r) => (r === ROW ? 1 : 0.4)}
          highlightRow={step === 4 ? ROW : undefined}
          highlightColor={ROLE.value}
          fontSize={15}
          opacity={out}
        />
        <div style={{ position: "absolute", left: 1370, top: CENTER.y + 4 * SMALL + 14, fontSize: 22, color: COLORS.muted, opacity: out, width: 460 }}>
          one row per word: its new, context-aware vector
        </div>
      </div>

      {/* the arithmetic for the current step */}
      <div style={{ position: "absolute", left: 120, right: 120, top: 760, textAlign: "center", fontFamily: MONO, fontSize: 24, color: COLORS.muted, opacity: calc && !all ? 1 : 0 }}>{calc}</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 760, textAlign: "center", fontSize: 34, fontWeight: 600, opacity: fade(frame, L[5] + 15) }}>
        <span style={{ color: ROLE.query }}>who asks</span> · <span style={{ color: ROLE.key }}>who matches</span> · <span style={{ color: ROLE.attn }}>how much</span> · <span style={{ color: ROLE.value }}>what is passed on</span>
      </div>
    </AbsoluteFill>
  );
};
