import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, lerp, pop } from "../anim";
import { Grid } from "../components/Grid";
import { Slab } from "../components/Slab";
import { Label } from "../components/Text";
import { CAT } from "../data";
import { COLORS, gray, MONO } from "../theme";
import { useLines } from "../timeline";

const MID = 470; // vertical center line of the diagram

const VOLUMES = [
  { name: "Conv + ReLU", dims: "224×224×32", x: 360, h: 300, t: 28, color: COLORS.yellow },
  { name: "Max pool", dims: "112×112×32", x: 560, h: 200, t: 28, color: COLORS.cyan },
  { name: "Conv + ReLU", dims: "112×112×64", x: 720, h: 200, t: 52, color: COLORS.yellow },
  { name: "Max pool", dims: "56×56×64", x: 905, h: 130, t: 52, color: COLORS.cyan },
];
const FLAT = { x: 1110, n: 14, size: 22 };
const FC = { x: 1290, n: 8 };
const OUT = { x: 1440 };
const CLASSES = [
  { name: "cat", p: 0.92, color: COLORS.yellow },
  { name: "dog", p: 0.06, color: COLORS.muted },
  { name: "bird", p: 0.02, color: COLORS.muted },
];

const flatY = (i: number) => MID - (FLAT.n * 28) / 2 + i * 28;
const fcY = (j: number) => MID - (FC.n * 44) / 2 + j * 44 + 22;

const Brace: React.FC<{ x1: number; x2: number; y: number; label: string; color: string; opacity: number }> = ({ x1, x2, y, label, color, opacity }) => (
  <>
    <svg width={1920} height={1080} style={{ position: "absolute", opacity }}>
      <path d={`M ${x1} ${y} L ${x1} ${y + 14} L ${x2} ${y + 14} L ${x2} ${y}`} fill="none" stroke={color} strokeWidth={3} />
    </svg>
    <Label x={(x1 + x2) / 2} y={y + 26} size={30} weight={700} color={color} center opacity={opacity}>
      {label}
    </Label>
  </>
);

export const Architecture: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  // Faint at first (line 0), then lit stage by stage.
  const lit = (start: number) => 0.25 + 0.75 * fade(frame, start, 12);
  const appear = (k: number) => fade(frame, L[0] + k * 4, 12);

  const flatLit = lit(L[2]);
  const fcLit = lit(L[3]);
  const outLit = lit(L[4]);
  const bars = lerp(frame, [L[4] + 20, L[4] + 50], [0, 1]);

  return (
    <AbsoluteFill>
      {/* input image */}
      <div style={{ position: "absolute", left: 90, top: MID - 110, opacity: appear(0) * lit(L[1]) }}>
        <Grid data={CAT} cell={14} color={gray} gap={0} style={{ outline: `3px solid ${COLORS.text}` }} />
      </div>
      <Label x={202} y={700} size={26} weight={700} center opacity={appear(0)}>
        Input
      </Label>
      <Label x={202} y={734} size={22} mono center color={COLORS.muted} opacity={appear(0)}>
        224×224×3
      </Label>

      {/* feature extractor */}
      {VOLUMES.map((v, i) => {
        const d = v.h * 0.45;
        const start = L[1] + 12 + i * 14;
        return (
          <React.Fragment key={i}>
            <Slab x={v.x} y={MID - v.h / 2 + d / 2} h={v.h} t={v.t} color={v.color} opacity={appear(i + 1) * lit(start)} glow={fade(frame, start, 8) * (1 - fade(frame, start + 14, 12))} />
            <Label x={v.x + (v.t + d) / 2} y={700} size={24} weight={700} center color={v.color} opacity={appear(i + 1)}>
              {v.name}
            </Label>
            <Label x={v.x + (v.t + d) / 2} y={734} size={22} mono center color={COLORS.muted} opacity={appear(i + 1)}>
              {v.dims}
            </Label>
          </React.Fragment>
        );
      })}

      {/* connections: flatten → dense → output */}
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        {Array.from({ length: FLAT.n }).map((_, i) =>
          Array.from({ length: FC.n }).map((__, j) => (
            <line key={`${i}-${j}`} x1={FLAT.x + FLAT.size} y1={flatY(i) + FLAT.size / 2} x2={FC.x} y2={fcY(j)} stroke={COLORS.magenta} strokeWidth={1} opacity={0.35 * fade(frame, L[3] + 5, 20)} />
          )),
        )}
        {Array.from({ length: FC.n }).map((_, j) =>
          CLASSES.map((c, k) => (
            <line key={`${j}-${k}`} x1={FC.x} y1={fcY(j)} x2={OUT.x - 4} y2={MID - 70 + k * 70 + 20} stroke={COLORS.magenta} strokeWidth={1} opacity={0.35 * fade(frame, L[4], 20)} />
          )),
        )}
      </svg>

      {/* flatten */}
      {Array.from({ length: FLAT.n }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: FLAT.x,
            top: flatY(i),
            width: FLAT.size,
            height: FLAT.size,
            borderRadius: 4,
            background: COLORS.purple,
            opacity: appear(5) * flatLit,
            transform: `scale(${frame >= L[2] ? pop(frame, fps, L[2] + i * 2) : 1})`,
          }}
        />
      ))}
      <Label x={FLAT.x + 11} y={700} size={24} weight={700} center color={COLORS.purple} opacity={appear(5)}>
        Flatten
      </Label>
      <Label x={FLAT.x + 11} y={734} size={22} mono center color={COLORS.muted} opacity={appear(5)}>
        200,704
      </Label>

      {/* dense */}
      {Array.from({ length: FC.n }).map((_, j) => (
        <div
          key={j}
          style={{
            position: "absolute",
            left: FC.x - 15,
            top: fcY(j) - 15,
            width: 30,
            height: 30,
            borderRadius: 15,
            border: `4px solid ${COLORS.magenta}`,
            background: COLORS.panel,
            boxSizing: "border-box",
            opacity: appear(6) * fcLit,
          }}
        />
      ))}
      <Label x={FC.x} y={700} size={24} weight={700} center color={COLORS.magenta} opacity={appear(6)}>
        Dense
      </Label>
      <Label x={FC.x} y={734} size={22} mono center color={COLORS.muted} opacity={appear(6)}>
        128
      </Label>

      {/* softmax output */}
      {CLASSES.map((c, k) => (
        <div key={c.name} style={{ position: "absolute", left: OUT.x, top: MID - 70 + k * 70, display: "flex", alignItems: "center", gap: 14, opacity: appear(7) * outLit }}>
          <div style={{ width: 70, fontSize: 30, fontWeight: 700, color: k === 0 ? COLORS.yellow : COLORS.text, textAlign: "right" }}>{c.name}</div>
          <div style={{ width: 220, height: 40, borderRadius: 6, background: "rgba(255,255,255,0.08)" }}>
            <div style={{ width: 220 * c.p * bars, height: "100%", borderRadius: 6, background: c.color, boxShadow: k === 0 ? `0 0 ${24 * bars}px ${COLORS.yellow}` : undefined }} />
          </div>
          <div style={{ width: 80, fontFamily: MONO, fontSize: 28, color: k === 0 ? COLORS.yellow : COLORS.muted }}>{Math.round(c.p * 100 * bars)}%</div>
        </div>
      ))}
      <Label x={OUT.x + 190} y={700} size={24} weight={700} center opacity={appear(7)}>
        Softmax
      </Label>
      <Label x={OUT.x + 190} y={734} size={22} mono center color={COLORS.muted} opacity={appear(7)}>
        probabilities, sum = 1
      </Label>

      <Brace x1={90} x2={1020} y={790} label="Feature extractor" color={COLORS.yellow} opacity={fade(frame, L[1] + 70)} />
      <Brace x1={1090} x2={1830} y={790} label="Classifier" color={COLORS.magenta} opacity={fade(frame, L[3] + 20)} />
    </AbsoluteFill>
  );
};
