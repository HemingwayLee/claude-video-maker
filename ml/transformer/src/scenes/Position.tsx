import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade, fadeOut } from "../anim";
import { Vector } from "../components/Diagram";
import { Chip } from "../components/Token";
import { Label } from "../components/Text";
import { embedding, positionalEncoding } from "../data";
import { COLORS, diverging, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

const DIMS = 48; // columns shown in the heatmap (d = 48 here, so the waves fit)
const POSITIONS = 32;
const CELL = 12;
const HEAT = { x: 140, y: 460 };
const SLOW_DIM = 14;
const FAST_DIM = 0;

const PE_ROW = (pos: number, n = 8) => Array.from({ length: n }, (_, i) => positionalEncoding(pos, i, DIMS));

export const Position: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();

  const bag = fade(frame, L[1] + 30);
  const heat = fade(frame, L[2]);
  const waves = fade(frame, L[3]);
  const rowsShown = Math.min(POSITIONS, Math.max(0, Math.floor((frame - L[2]) / 1.5)));

  const wavePath = (dim: number, y0: number) =>
    Array.from({ length: POSITIONS }, (_, p) => `${p ? "L" : "M"} ${1080 + p * 22} ${y0 - 40 * positionalEncoding(p, dim, DIMS)}`).join(" ");

  return (
    <AbsoluteFill>
      {/* word order matters, but attention alone can't see it */}
      {["dog", "bites", "man"].map((w, i) => (
        <Chip key={`a${i}`} x={160 + i * 150} y={190} w={130} text={w} opacity={fade(frame, L[1] + i * 4)} />
      ))}
      {["man", "bites", "dog"].map((w, i) => (
        <Chip key={`b${i}`} x={160 + i * 150} y={270} w={130} text={w} opacity={fade(frame, L[1] + 12 + i * 4)} />
      ))}
      <Label x={640} y={235} size={44} color={COLORS.muted} opacity={bag}>
        →
      </Label>
      <div style={{ position: "absolute", left: 720, top: 205, padding: "18px 28px", borderRadius: 18, border: `3px dashed ${COLORS.muted}`, fontSize: 32, fontWeight: 700, opacity: bag }}>
        {"{ bites, dog, man }"}
        <div style={{ fontSize: 22, fontWeight: 500, color: COLORS.muted, marginTop: 6 }}>the same set of vectors either way</div>
      </div>
      <Label x={1240} y={235} size={30} weight={800} color={COLORS.red} opacity={fade(frame, L[1] + 50)}>
        ✗ order is lost
      </Label>

      {/* the positional encoding: one row per position */}
      <div style={{ position: "absolute", left: HEAT.x, top: HEAT.y, opacity: heat }}>
        {Array.from({ length: rowsShown }, (_, p) =>
          Array.from({ length: DIMS }, (_, i) => (
            <div key={`${p}-${i}`} style={{ position: "absolute", left: i * CELL, top: p * CELL, width: CELL - 1, height: CELL - 1, background: diverging(positionalEncoding(p, i, DIMS), 1) }} />
          )),
        )}
        {[FAST_DIM, SLOW_DIM].map((d) => (
          <div key={d} style={{ position: "absolute", left: d * CELL - 2, top: -4, width: CELL + 2, height: POSITIONS * CELL + 6, border: `3px solid ${COLORS.yellow}`, borderRadius: 4, opacity: waves }} />
        ))}
      </div>
      <Label x={HEAT.x} y={HEAT.y - 40} size={24} color={ROLE.pos} weight={700} opacity={heat}>
        positional encoding: one row per position
      </Label>
      <Label x={HEAT.x - 10} y={HEAT.y + POSITIONS * CELL + 6} size={20} color={COLORS.muted} opacity={heat}>
        position 0 at the top · dimensions →
      </Label>

      {/* embedding + position */}
      <div style={{ position: "absolute", left: 780, top: 450, display: "flex", alignItems: "center", gap: 18, opacity: fade(frame, L[2] + 30) * fadeOut(frame, L[3] - 15) }}>
        <div style={{ position: "relative", width: 60, height: 260 }}>
          <Vector values={embedding("cat")} x={0} y={0} cell={28} color={ROLE.token} label="“cat”" />
        </div>
        <div style={{ fontSize: 44, color: COLORS.muted }}>+</div>
        <div style={{ position: "relative", width: 90, height: 260 }}>
          <Vector values={PE_ROW(1)} x={0} y={0} cell={28} color={ROLE.pos} label="position 1" max={1} />
        </div>
        <div style={{ fontSize: 44, color: COLORS.muted }}>=</div>
        <div style={{ position: "relative", width: 60, height: 260 }}>
          <Vector values={embedding("cat").map((v, i) => v + PE_ROW(1)[i])} x={0} y={0} cell={28} color={COLORS.text} label="input" />
        </div>
      </div>

      {/* the waves */}
      <svg width={1920} height={1080} style={{ position: "absolute", opacity: waves }}>
        <path d={wavePath(FAST_DIM, 560)} fill="none" stroke={COLORS.yellow} strokeWidth={4} />
        <path d={wavePath(SLOW_DIM, 720)} fill="none" stroke={COLORS.yellow} strokeWidth={4} strokeOpacity={0.7} />
        <line x1={1080} y1={800} x2={1080 + 31 * 22} y2={800} stroke={COLORS.muted} strokeWidth={2} />
        <text x={1080 + 31 * 22} y={830} fill={COLORS.muted} fontSize={20} textAnchor="end">
          position →
        </text>
      </svg>
      <Label x={1080} y={480} size={22} color={COLORS.yellow} opacity={waves}>
        dimension {FAST_DIM}: fast wave, tells neighbours apart
      </Label>
      <Label x={1080} y={640} size={22} color={COLORS.yellow} opacity={waves}>
        dimension {SLOW_DIM}: slow wave, tells far-apart positions apart
      </Label>
      <div style={{ position: "absolute", left: 1080, top: 845, fontFamily: MONO, fontSize: 20, color: COLORS.muted, opacity: waves }}>
        PE(pos, 2i) = sin(pos / 10000^(2i/d)) · PE(pos, 2i+1) = cos(…)
      </div>
    </AbsoluteFill>
  );
};
