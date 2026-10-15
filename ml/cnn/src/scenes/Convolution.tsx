import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, lerp, linear, pop } from "../anim";
import { Grid, Window } from "../components/Grid";
import { Label } from "../components/Text";
import { BOX, convolve, KERNELS } from "../data";
import { COLORS, diverging, gray, MONO } from "../theme";
import { useLines } from "../timeline";

const K = KERNELS.vertical;
const OUT = convolve(BOX, K); // 6×6

const IN_CELL = 72;
const IN = { x: 100, y: 200 };
const K_CELL = 72;
const KER = { x: 852, y: 200 };
const OUT_CELL = 80;
const OUTP = { x: 1340, y: 200 };
const CALC = { x: 700, y: 500 };

const FIRST = { r: 1, c: 0 }; // the position we compute by hand
const firstIndex = FIRST.r * 6 + FIRST.c;

const sign = (w: number) => (w < 0 ? `(${w})` : String(w));

export const Convolution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  // Where is the kernel? Fixed at FIRST, then sweeps all 36 positions.
  const sweepStart = L[4] + 15;
  const sweepEnd = L[5] - 15;
  const sweeping = frame >= sweepStart;
  const idx = sweeping ? Math.min(35, Math.floor(linear(frame, [sweepStart, sweepEnd], [0, 36]))) : firstIndex;
  const pos = { r: Math.floor(idx / 6), c: idx % 6 };

  // How many of the 9 products are visible.
  const terms = sweeping ? 9 : Math.floor(linear(frame, [L[2] + 30, L[2] + 30 + 9 * 9], [0, 9]));
  let sum = 0;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) sum += BOX[pos.r + i][pos.c + j] * K[i][j];

  const filled = (r: number, c: number) => {
    const i = r * 6 + c;
    if (i === firstIndex) return frame >= L[3] + 30;
    return sweeping && (i <= idx || frame >= sweepEnd);
  };

  const windowOpacity = fade(frame, L[2], 12) * (frame >= sweepEnd + 10 ? 1 - fade(frame, sweepEnd + 10, 15) : 1);
  const outAppear = fade(frame, L[3], 15);
  const edges = fade(frame, L[5] + 10, 20);

  // The sum flies from the calculation to the feature map.
  const fly = lerp(frame, [L[3] + 5, L[3] + 30], [0, 1]);
  const flyFrom = { x: CALC.x + 300, y: CALC.y + 210 };
  const flyTo = { x: OUTP.x + FIRST.c * OUT_CELL + 20, y: OUTP.y + FIRST.r * OUT_CELL + 14 };

  return (
    <AbsoluteFill>
      {/* input image */}
      <Label x={IN.x} y={IN.y - 56} size={30} color={COLORS.muted} opacity={fade(frame, L[0])}>
        input image (8 × 8)
      </Label>
      <div style={{ position: "absolute", left: IN.x, top: IN.y, transform: `scale(${pop(frame, fps, L[0])})` }}>
        <Grid data={BOX} cell={IN_CELL} color={gray} showValues fontSize={26}>
          {/* where dark meets bright */}
          <div style={{ position: "absolute", left: 2 * IN_CELL - 4, top: IN_CELL, width: 8, height: 6 * IN_CELL, background: COLORS.orange, boxShadow: `0 0 24px ${COLORS.orange}`, opacity: edges }} />
          <div style={{ position: "absolute", left: 6 * IN_CELL - 4, top: IN_CELL, width: 8, height: 6 * IN_CELL, background: COLORS.blue, boxShadow: `0 0 24px ${COLORS.blue}`, opacity: edges }} />
          <Window row={pos.r} col={pos.c} size={3} cell={IN_CELL} opacity={windowOpacity} />
          {/* the kernel weights, written on the pixels they cover */}
          {K.flat().map((w, k) => (
            <div
              key={k}
              style={{
                position: "absolute",
                left: (pos.c + (k % 3)) * IN_CELL + IN_CELL - 36,
                top: (pos.r + Math.floor(k / 3)) * IN_CELL + 3,
                padding: "0 3px",
                borderRadius: 4,
                background: "rgba(11,16,33,0.85)",
                fontFamily: MONO,
                fontSize: 16,
                fontWeight: 700,
                color: COLORS.yellow,
                opacity: windowOpacity,
              }}
            >
              ×{w}
            </div>
          ))}
        </Grid>
      </div>

      {/* the kernel */}
      <Label x={KER.x + 108} y={KER.y - 56} size={30} color={COLORS.yellow} center opacity={fade(frame, L[0] + 20)}>
        kernel (3 × 3)
      </Label>
      <div style={{ position: "absolute", left: KER.x, top: KER.y, transform: `scale(${pop(frame, fps, L[0] + 20)})` }}>
        <Grid
          data={K}
          cell={K_CELL}
          color={(w) => diverging(w, 1.4)}
          showValues
          fontSize={28}
          cellOpacity={(r, c) => {
            // Line 1: count the nine weights one by one.
            const k = r * 3 + c;
            const start = L[1] + 10 + k * 5;
            return frame >= L[1] && frame < L[2] ? 0.35 + 0.65 * fade(frame, start, 6) : 1;
          }}
          style={{ outline: `4px solid ${COLORS.yellow}`, outlineOffset: 4, borderRadius: 6 }}
        />
      </div>
      <Label x={KER.x + 108} y={KER.y + 236} size={26} color={COLORS.muted} center opacity={fade(frame, L[1] + 10)}>
        9 weights
      </Label>

      {/* the arithmetic at the current position */}
      <div
        style={{
          position: "absolute",
          left: CALC.x,
          top: CALC.y,
          width: 520,
          padding: "20px 26px",
          borderRadius: 16,
          background: COLORS.panel,
          border: `2px solid ${COLORS.panelBorder}`,
          fontFamily: MONO,
          fontSize: 26,
          color: COLORS.text,
          opacity: fade(frame, L[2] + 20),
        }}
      >
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ height: 44 }}>
            {[0, 1, 2].map((j) => {
              const k = i * 3 + j;
              return (
                <span key={j} style={{ opacity: k < terms ? 1 : 0.12 }}>
                  {k > 0 ? " + " : "   "}
                  <span>{BOX[pos.r + i][pos.c + j]}</span>
                  <span style={{ color: COLORS.yellow }}>·{sign(K[i][j])}</span>
                </span>
              );
            })}
          </div>
        ))}
        <div style={{ borderTop: `2px solid ${COLORS.panelBorder}`, marginTop: 10, paddingTop: 10, fontSize: 40, fontWeight: 700, opacity: terms >= 9 ? 1 : 0 }}>
          = <span style={{ color: sum > 0 ? COLORS.orange : sum < 0 ? COLORS.blue : COLORS.text }}>{sum}</span>
        </div>
      </div>

      {/* feature map */}
      <Label x={OUTP.x} y={OUTP.y - 56} size={30} color={COLORS.orange} opacity={outAppear}>
        feature map (6 × 6)
      </Label>
      <div style={{ position: "absolute", left: OUTP.x, top: OUTP.y, opacity: outAppear }}>
        <Grid
          data={OUT}
          cell={OUT_CELL}
          color={(v, r, c) => (filled(r, c) ? diverging(v, 3) : "rgba(255,255,255,0.04)")}
          showValues={filled}
          fontSize={30}
        >
          {sweeping && frame < sweepEnd + 10 ? (
            <div style={{ position: "absolute", left: pos.c * OUT_CELL - 2, top: pos.r * OUT_CELL - 2, width: OUT_CELL + 4, height: OUT_CELL + 4, border: `4px solid ${COLORS.yellow}`, borderRadius: 8 }} />
          ) : null}
        </Grid>
      </div>
      {fly > 0 && fly < 1 ? (
        <div
          style={{
            position: "absolute",
            left: flyFrom.x + (flyTo.x - flyFrom.x) * fly,
            top: flyFrom.y + (flyTo.y - flyFrom.y) * fly - Math.sin(fly * Math.PI) * 120,
            fontFamily: MONO,
            fontSize: 44,
            fontWeight: 800,
            color: COLORS.orange,
            textShadow: `0 0 20px ${COLORS.orange}`,
          }}
        >
          {OUT[FIRST.r][FIRST.c]}
        </div>
      ) : null}

      {/* what this kernel found */}
      <div style={{ position: "absolute", left: OUTP.x, top: OUTP.y + 6 * OUT_CELL + 30, fontSize: 28, lineHeight: 1.6, opacity: edges, color: COLORS.text }}>
        <div>
          <span style={{ color: COLORS.orange, fontWeight: 700 }}>+</span> dark → bright edge
        </div>
        <div>
          <span style={{ color: COLORS.blue, fontWeight: 700 }}>−</span> bright → dark edge
        </div>
        <div>
          <span style={{ color: COLORS.muted }}>0</span> flat area, nothing found
        </div>
      </div>
    </AbsoluteFill>
  );
};
