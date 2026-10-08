import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, fadeOut, lerp, pop } from "../anim";
import { Grid, Window } from "../components/Grid";
import { Label } from "../components/Text";
import { BOX, CAT, convolve, KERNELS, maxAbs } from "../data";
import { COLORS, diverging, gray, MONO } from "../theme";
import { useLines } from "../timeline";

const SPOTS = [
  { r: 0, c: 0 },
  { r: 0, c: 5 },
  { r: 3, c: 2 },
  { r: 5, c: 4 },
];
const CELL = 56;
const KER = { x: 860, y: 330, cell: 64 };

const FILTERS = [
  { name: "vertical edges", kernel: KERNELS.vertical, color: COLORS.orange },
  { name: "horizontal edges", kernel: KERNELS.horizontal, color: COLORS.green },
  { name: "diagonal edges", kernel: KERNELS.diagonal, color: COLORS.purple },
].map((f) => {
  const map = convolve(CAT, f.kernel);
  return { ...f, map, max: maxAbs(map) };
});
const MAP_CELL = 16; // 14 × 16 = 224 px

export const Filters: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  const phaseA = fadeOut(frame, L[2] - 5, 15);
  const phaseB = fade(frame, L[2] + 5, 15);
  const stack = lerp(frame, [L[3] + 10, L[3] + 45], [0, 1]);

  return (
    <AbsoluteFill>
      {/* ── weight sharing ── */}
      <AbsoluteFill style={{ opacity: phaseA }}>
        <div style={{ position: "absolute", left: 150, top: 220 }}>
          <Grid data={BOX} cell={CELL} color={gray}>
            {SPOTS.map((s, i) => (
              <Window key={i} row={s.r} col={s.c} size={3} cell={CELL} opacity={fade(frame, L[0] + 10 + i * 12)} />
            ))}
          </Grid>
        </div>
        <svg width={1920} height={1080} style={{ position: "absolute" }}>
          {SPOTS.map((s, i) => (
            <line
              key={i}
              x1={150 + (s.c + 1.5) * CELL}
              y1={220 + (s.r + 1.5) * CELL}
              x2={KER.x}
              y2={KER.y + 96}
              stroke={COLORS.yellow}
              strokeWidth={3}
              strokeDasharray="10 8"
              opacity={fade(frame, L[0] + 20 + i * 12) * 0.8}
            />
          ))}
        </svg>
        <div style={{ position: "absolute", left: KER.x, top: KER.y, transform: `scale(${pop(frame, fps, L[0])})` }}>
          <Grid data={KERNELS.vertical} cell={KER.cell} color={(w) => diverging(w, 1.4)} showValues fontSize={24} style={{ outline: `4px solid ${COLORS.yellow}`, outlineOffset: 4, borderRadius: 6 }} />
        </div>
        <Label x={KER.x + 96} y={KER.y + 220} size={28} color={COLORS.yellow} center opacity={fade(frame, L[0] + 60)}>
          one kernel, reused everywhere
        </Label>

        {/* weight count comparison */}
        <div style={{ position: "absolute", left: 1220, top: 260, width: 600, opacity: fade(frame, L[1]) }}>
          <div style={{ fontSize: 28, color: COLORS.muted }}>dense layer (from before)</div>
          <div style={{ height: 40, marginTop: 10, width: 600 * lerp(frame, [L[1], L[1] + 25], [0, 1]), background: COLORS.magenta, borderRadius: 6 }} />
          <div style={{ fontFamily: MONO, fontSize: 34, color: COLORS.magenta, marginTop: 8 }}>150,528,000 weights</div>

          <div style={{ fontSize: 28, color: COLORS.muted, marginTop: 50, opacity: fade(frame, L[1] + 20) }}>one 3 × 3 conv filter</div>
          <div style={{ height: 40, marginTop: 10, width: 6, background: COLORS.yellow, borderRadius: 3, opacity: fade(frame, L[1] + 20) }} />
          <div style={{ fontFamily: MONO, fontSize: 34, color: COLORS.yellow, marginTop: 8, opacity: fade(frame, L[1] + 20) }}>9 weights (+ 1 bias)</div>
        </div>
        <Label x={1220} y={680} size={30} weight={600} color={COLORS.green} opacity={fade(frame, L[1] + 50)} width={600}>
          Same detector at every position: a cat is found wherever it is.
        </Label>
      </AbsoluteFill>

      {/* ── many filters ── */}
      <AbsoluteFill style={{ opacity: phaseB }}>
        <Label x={120} y={250} size={28} color={COLORS.muted}>
          input
        </Label>
        <div style={{ position: "absolute", left: 120, top: 300 }}>
          <Grid data={CAT} cell={22} color={gray} gap={1} />
        </div>
        {FILTERS.map((f, i) => {
          const rowY = 150 + i * 250;
          const show = fade(frame, L[2] + 10 + i * 15);
          // Line 3: the maps slide together into a stacked volume.
          // The first filter ends up at the back, the last one in front.
          const x = 920 + stack * (1060 + (2 - i) * 80 - 920);
          const y = rowY + stack * (200 + i * 80 - rowY);
          return (
            <React.Fragment key={f.name}>
              <svg width={1920} height={1080} style={{ position: "absolute", opacity: show * (1 - stack) }}>
                <line x1={480} y1={476} x2={600} y2={rowY + 112} stroke={f.color} strokeWidth={3} />
                <line x1={740} y1={rowY + 112} x2={900} y2={rowY + 112} stroke={f.color} strokeWidth={3} />
              </svg>
              <div style={{ position: "absolute", left: 610, top: rowY + 50, opacity: show * (1 - stack) }}>
                <Grid data={f.kernel} cell={40} color={(w) => diverging(w, 1.4)} showValues fontSize={17} style={{ outline: `3px solid ${f.color}`, outlineOffset: 3, borderRadius: 4 }} />
              </div>
              <div style={{ position: "absolute", left: x, top: y, opacity: show, transform: `scale(${1 + 0.5 * stack})`, transformOrigin: "top left", boxShadow: "0 10px 40px rgba(0,0,0,0.7)" }}>
                <Grid data={f.map} cell={MAP_CELL} color={(v) => diverging(v, f.max)} gap={0} style={{ outline: `3px solid ${f.color}` }} />
              </div>
              <Label x={1170} y={rowY + 92} size={30} weight={600} color={f.color} opacity={show * (1 - stack)}>
                {f.name}
              </Label>
            </React.Fragment>
          );
        })}
        <Label x={160} y={680} size={30} color={COLORS.text} opacity={fade(frame, L[3] + 40)} width={760} style={{ lineHeight: 1.5 }}>
          3 filters → a <span style={{ color: COLORS.yellow, fontFamily: MONO }}>14 × 14 × 3</span> volume.
          <br />
          Real layers use 32, 64, 512… filters, so the output has that many channels.
        </Label>
        <Label x={1310} y={735} size={28} color={COLORS.muted} center opacity={fade(frame, L[3] + 40)}>
          one channel per filter
        </Label>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
