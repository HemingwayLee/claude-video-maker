import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade, lerp, linear } from "../anim";
import { areaPath, Axes, type Chart, Layer, linePath, px, py } from "../components/Diagram";
import { Label } from "../components/Text";
import { REAL, SNAPS, snapIndex, snapshotAt, TRACE, XS } from "../data";
import { COLORS, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

// Densities use the left axis (0..0.9); D(x) uses the right axis (0..1).
const MAIN: Chart = { x: 150, y: 220, w: 1060, h: 560, x0: TRACE.xMin, x1: TRACE.xMax, y0: 0, y1: 0.9 };
const DAX: Chart = { ...MAIN, y1: 1 };
const LOSS: Chart = { x: 1380, y: 400, w: 420, h: 170, x0: 0, x1: TRACE.config.steps, y0: 0.5, y1: 1.6 };
const MAP: Chart = { x: 1380, y: 660, w: 420, h: 150, x0: -3, x1: 3, y0: -4, y1: 4 };
const LOG4 = 2 * Math.log(2); // D's loss at equilibrium
const LOG2 = Math.log(2); // G's loss at equilibrium

// Arrows showing which way G's samples are pushed: along the slope of log D.
const ARROW_XS = Array.from({ length: 17 }, (_, i) => -4 + i * 0.5);

export const Demo: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();

  // Playback position in the recorded run (fractional snapshot index).
  // The first 400 steps change fastest, so they get a whole line to themselves.
  const early = snapIndex(400);
  const pos = frame < L[4] ? linear(frame, [L[3] + 10, L[4]], [0, early]) : lerp(frame, [L[4], L[5] - 20], [early, SNAPS.length - 1]);
  const s = snapshotAt(pos);

  const real = fade(frame, L[1]);
  const gen = fade(frame, L[1] + 50);
  const disc = fade(frame, L[2]);
  const side = fade(frame, L[3]);
  const half = fade(frame, L[5]);
  const gap = fade(frame, L[6]);
  const arrows = fade(frame, L[3] + 10) * (1 - fade(frame, L[5]));

  // The points the losses chart has drawn so far.
  const seen = SNAPS.slice(0, Math.floor(pos) + 1);

  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <defs>
          <clipPath id="main-clip">
            <rect x={MAIN.x} y={MAIN.y - 4} width={MAIN.w} height={MAIN.h + 4} />
          </clipPath>
          <marker id="push" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M 0 0 L 6 3 L 0 6 z" fill={COLORS.yellow} />
          </marker>
        </defs>
        <g opacity={fade(frame, L[0])}>
          <Axes c={MAIN} />
          <text x={MAIN.x + MAIN.w} y={MAIN.y + MAIN.h + 66} fill={COLORS.muted} fontSize={24} textAnchor="end">
            x (a single number)
          </text>
          {[-4, -2, 0, 2, 4].map((v) => (
            <text key={v} x={px(MAIN, v)} y={MAIN.y + MAIN.h + 34} fill={COLORS.muted} fontSize={22} fontFamily={MONO} textAnchor="middle">
              {v}
            </text>
          ))}
          <text x={MAIN.x} y={MAIN.y - 16} fill={COLORS.muted} fontSize={24}>
            how often each x appears
          </text>
        </g>

        <g clipPath="url(#main-clip)">
          {/* real data */}
          <path d={areaPath(MAIN, XS, REAL)} fill={ROLE.real} fillOpacity={0.25 * real} stroke={ROLE.real} strokeOpacity={real} strokeWidth={4} />
          {/* the generator's samples */}
          <path d={areaPath(MAIN, XS, s.gen)} fill={ROLE.gen} fillOpacity={0.3 * gen} stroke={ROLE.gen} strokeOpacity={gen} strokeWidth={4} />
          {/* the discriminator */}
          <line x1={MAIN.x} y1={py(DAX, 0.5)} x2={MAIN.x + MAIN.w} y2={py(DAX, 0.5)} stroke={ROLE.disc} strokeOpacity={disc * (0.35 + 0.65 * half)} strokeWidth={half > 0 ? 3 : 2} strokeDasharray="10 8" />
          <path d={linePath(DAX, XS, s.d)} fill="none" stroke={ROLE.disc} strokeOpacity={disc} strokeWidth={5} />
        </g>

        {/* right axis for D(x) */}
        <g opacity={disc}>
          <line x1={MAIN.x + MAIN.w} y1={MAIN.y} x2={MAIN.x + MAIN.w} y2={MAIN.y + MAIN.h} stroke={ROLE.disc} strokeWidth={2} />
          {[0, 0.5, 1].map((v) => (
            <text key={v} x={MAIN.x + MAIN.w + 12} y={py(DAX, v) + 8} fill={ROLE.disc} fontSize={22} fontFamily={MONO}>
              {v}
            </text>
          ))}
          <text x={MAIN.x + MAIN.w} y={MAIN.y - 16} fill={ROLE.disc} fontSize={24} textAnchor="end">
            D(x): chance x is real
          </text>
        </g>

        {/* where G is being pushed: slope of log D(x) where G has samples */}
        <g opacity={arrows}>
          {ARROW_XS.map((ax) => {
            const i = Math.round(((ax - TRACE.xMin) / (TRACE.xMax - TRACE.xMin)) * (XS.length - 1));
            if (s.gen[i] < 0.03) return null;
            const slope = (Math.log(s.d[i + 2] + 1e-6) - Math.log(s.d[i - 2] + 1e-6)) / (XS[i + 2] - XS[i - 2]);
            const len = Math.max(-70, Math.min(70, slope * 60));
            if (Math.abs(len) < 8) return null;
            const x0 = px(MAIN, ax);
            const y0 = MAIN.y + MAIN.h - 22;
            return <line key={ax} x1={x0} y1={y0} x2={x0 + len} y2={y0} stroke={COLORS.yellow} strokeWidth={4} markerEnd="url(#push)" />;
          })}
        </g>

        {/* the gap between the bumps */}
        <rect x={px(MAIN, -0.8)} y={MAIN.y} width={px(MAIN, 0.8) - px(MAIN, -0.8)} height={MAIN.h} rx={10} fill={COLORS.yellow} fillOpacity={0.08 * gap} stroke={COLORS.yellow} strokeOpacity={gap} strokeWidth={3} strokeDasharray="8 6" />
      </svg>

      {/* legend */}
      <div style={{ position: "absolute", left: MAIN.x + 30, top: MAIN.y + 20, fontSize: 26, lineHeight: 1.55 }}>
        <div style={{ opacity: real }}>
          <span style={{ color: ROLE.real, fontWeight: 800 }}>━</span> real data
        </div>
        <div style={{ opacity: gen }}>
          <span style={{ color: ROLE.gen, fontWeight: 800 }}>━</span> generator's samples
        </div>
        <div style={{ opacity: disc }}>
          <span style={{ color: ROLE.disc, fontWeight: 800 }}>━</span> discriminator D(x)
        </div>
        <div style={{ opacity: arrows, color: COLORS.yellow, fontSize: 22 }}>→ where G's samples are pushed</div>
      </div>
      <Label x={px(MAIN, 3.6)} y={py(DAX, 0.5) - 46} size={30} weight={800} color={ROLE.disc} opacity={half}>
        D ≈ ½
      </Label>
      <Label x={px(MAIN, 0)} y={MAIN.y + 14} size={24} weight={700} color={COLORS.yellow} center opacity={gap}>
        the gap: D still low
      </Label>

      {/* side panel: progress, losses, the generator as a function */}
      <div style={{ position: "absolute", left: 1380, top: 220, opacity: side }}>
        <div style={{ fontSize: 24, color: COLORS.muted }}>training step</div>
        <div style={{ fontFamily: MONO, fontSize: 56, fontWeight: 800 }}>
          {s.step.toLocaleString("en-US")}
          <span style={{ fontSize: 26, color: COLORS.muted }}> / {TRACE.config.steps.toLocaleString("en-US")}</span>
        </div>
      </div>
      <Layer opacity={side}>
        <Axes c={LOSS} />
        <text x={LOSS.x} y={LOSS.y - 12} fill={COLORS.muted} fontSize={22}>
          losses
        </text>
        <line x1={LOSS.x} y1={py(LOSS, LOG4)} x2={LOSS.x + LOSS.w} y2={py(LOSS, LOG4)} stroke={ROLE.disc} strokeOpacity={0.5} strokeDasharray="6 6" strokeWidth={2} />
        <line x1={LOSS.x} y1={py(LOSS, LOG2)} x2={LOSS.x + LOSS.w} y2={py(LOSS, LOG2)} stroke={ROLE.gen} strokeOpacity={0.5} strokeDasharray="6 6" strokeWidth={2} />
        <path d={linePath(LOSS, seen.map((p) => p.step), seen.map((p) => p.dLoss))} fill="none" stroke={ROLE.disc} strokeWidth={3} />
        <path d={linePath(LOSS, seen.map((p) => p.step), seen.map((p) => p.gLoss))} fill="none" stroke={ROLE.gen} strokeWidth={3} />
        <text x={LOSS.x + LOSS.w} y={py(LOSS, LOG4) - 8} fill={ROLE.disc} fontSize={18} textAnchor="end">
          D loss → 2 log 2
        </text>
        <text x={LOSS.x + LOSS.w} y={py(LOSS, LOG2) + 22} fill={ROLE.gen} fontSize={18} textAnchor="end">
          G loss → log 2
        </text>

        <Axes c={MAP} />
        <line x1={MAP.x} y1={py(MAP, 0)} x2={MAP.x + MAP.w} y2={py(MAP, 0)} stroke={COLORS.panelBorder} strokeWidth={2} />
        <text x={MAP.x} y={MAP.y - 12} fill={COLORS.muted} fontSize={22}>
          the generator: noise z → x = G(z)
        </text>
        <path d={linePath(MAP, TRACE.zLine, s.map.map((v) => Math.max(MAP.y0, Math.min(MAP.y1, v))))} fill="none" stroke={ROLE.gen} strokeWidth={4} />
        <text x={MAP.x + MAP.w} y={MAP.y + MAP.h + 26} fill={COLORS.muted} fontSize={18} textAnchor="end">
          z →
        </text>
      </Layer>
    </AbsoluteFill>
  );
};
