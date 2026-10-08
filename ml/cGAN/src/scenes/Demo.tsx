import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade, lerp } from "../anim";
import { areaPath, type Chart, linePath, px, py } from "../components/Diagram";
import { Label } from "../components/Text";
import { CLASSES, finalD, FINAL, REAL, SNAPS, snapshotAt, TRACE, XS } from "../data";
import { CLASS_COLORS, COLORS, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

// One chart per class y, stacked.
const ROW_H = 190;
const chartFor = (c: number): Chart => ({ x: 230, y: 200 + c * (ROW_H + 30), w: 1000, h: ROW_H, x0: TRACE.xMin, x1: TRACE.xMax, y0: 0, y1: 1 });
const Z_PICK = 0.75; // the fixed noise value used for "ask for A, B or C"
const Z_IDX = TRACE.zLine.findIndex((z) => Math.abs(z - Z_PICK) < 1e-6);

export const Demo: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();

  // Training plays during lines 2 (slow start) to 3.
  const t = lerp(frame, [L[2], L[3] - 10], [0, 1]);
  const pos = Math.pow(t, 1.7) * (SNAPS.length - 1);
  const s = frame >= L[3] ? FINAL : snapshotAt(pos);

  const real = fade(frame, L[1]);
  const gen = fade(frame, L[1] + 40);
  const disc = fade(frame, L[3]);
  const wrong = fade(frame, L[4]);
  const ask = frame >= L[5];
  const askClass = ask ? Math.min(2, Math.floor((frame - L[5]) / 45) % 3) : -1;

  return (
    <AbsoluteFill>
      {CLASSES.map((k, c) => {
        const C = chartFor(c);
        const focus = askClass === -1 || askClass === c ? 1 : 0.35;
        return (
          <div key={k.name} style={{ position: "absolute", inset: 0, opacity: fade(frame, L[0] + c * 6) * focus }}>
            <svg width={1920} height={1080} style={{ position: "absolute" }}>
              <defs>
                <clipPath id={`clip-${c}`}>
                  <rect x={C.x} y={C.y - 2} width={C.w} height={C.h + 2} />
                </clipPath>
              </defs>
              <rect x={C.x} y={C.y} width={C.w} height={C.h} fill={COLORS.panel} opacity={0.6} />
              <line x1={C.x} y1={C.y + C.h} x2={C.x + C.w} y2={C.y + C.h} stroke={COLORS.muted} strokeWidth={2} />
              <g clipPath={`url(#clip-${c})`}>
                <path d={areaPath(C, XS, REAL[c])} fill={CLASS_COLORS[c]} fillOpacity={0.3 * real} stroke={CLASS_COLORS[c]} strokeOpacity={real} strokeWidth={4} />
                <path d={areaPath(C, XS, s.gen[c])} fill={ROLE.gen} fillOpacity={0.25 * gen} stroke={ROLE.gen} strokeOpacity={gen} strokeWidth={4} />
                <line x1={C.x} y1={py(C, 0.5)} x2={C.x + C.w} y2={py(C, 0.5)} stroke={ROLE.disc} strokeOpacity={0.4 * disc} strokeDasharray="8 6" strokeWidth={2} />
                <path d={linePath(C, XS, s.d[c])} fill="none" stroke={ROLE.disc} strokeOpacity={disc} strokeWidth={4} />
              </g>
              {c === 2
                ? [-4, -2, 0, 2, 4].map((v) => (
                    <text key={v} x={px(C, v)} y={C.y + C.h + 28} fill={COLORS.muted} fontSize={20} fontFamily={MONO} textAnchor="middle">
                      {v}
                    </text>
                  ))
                : null}
              {/* the fixed-noise sample for this label */}
              {ask && askClass === c ? (
                <>
                  <line x1={px(C, s.map[c][Z_IDX])} y1={C.y} x2={px(C, s.map[c][Z_IDX])} y2={C.y + C.h} stroke={COLORS.yellow} strokeWidth={3} />
                  <circle cx={px(C, s.map[c][Z_IDX])} cy={C.y + C.h - 14} r={12} fill={COLORS.yellow} stroke="#fff" strokeWidth={3} />
                </>
              ) : null}
            </svg>
            <div style={{ position: "absolute", left: 90, top: C.y + C.h / 2 - 30, width: 120, textAlign: "center" }}>
              <div style={{ fontSize: 22, color: COLORS.muted }}>label</div>
              <div style={{ fontSize: 48, fontWeight: 800, color: CLASS_COLORS[c] }}>
                <i style={{ color: ROLE.label, fontSize: 30 }}>y</i>={k.name}
              </div>
            </div>
          </div>
        );
      })}

      {/* "a real class C value, labelled A" */}
      <div style={{ opacity: wrong }}>
        <svg width={1920} height={1080} style={{ position: "absolute" }}>
          <circle cx={px(chartFor(0), 3)} cy={py(chartFor(0), finalD(3, 0))} r={14} fill="none" stroke={COLORS.red} strokeWidth={4} />
        </svg>
        <Label x={px(chartFor(0), 3) - 150} y={chartFor(0).y + 40} size={22} weight={700} color={COLORS.red} width={300}>
          x = 3 with label A: D = {finalD(3, 0).toFixed(2)}
        </Label>
      </div>

      {/* side panel */}
      <div style={{ position: "absolute", left: 1290, top: 200, width: 540 }}>
        <div style={{ fontSize: 24, color: COLORS.muted, opacity: fade(frame, L[0]) }}>training step</div>
        <div style={{ fontFamily: MONO, fontSize: 54, fontWeight: 800, opacity: fade(frame, L[0]) }}>
          {s.step.toLocaleString("en-US")}
          <span style={{ fontSize: 24, color: COLORS.muted }}> / {TRACE.config.steps.toLocaleString("en-US")}</span>
        </div>
        <div style={{ fontSize: 26, lineHeight: 1.6, marginTop: 24 }}>
          <div style={{ opacity: real }}>
            <span style={{ color: CLASS_COLORS[0] }}>━</span>
            <span style={{ color: CLASS_COLORS[1] }}>━</span>
            <span style={{ color: CLASS_COLORS[2] }}>━</span> real data of each class
          </div>
          <div style={{ opacity: gen }}>
            <span style={{ color: ROLE.gen, fontWeight: 800 }}>━</span> G(z | y) for that label
          </div>
          <div style={{ opacity: disc }}>
            <span style={{ color: ROLE.disc, fontWeight: 800 }}>━</span> D(x | y), dashed line at ½
          </div>
        </div>
        <div style={{ marginTop: 30, opacity: ask ? 1 : 0, fontSize: 28 }}>
          <div style={{ color: COLORS.muted, fontSize: 24 }}>same noise z = {Z_PICK}, asking for</div>
          <div style={{ fontSize: 56, fontWeight: 800, color: askClass >= 0 ? CLASS_COLORS[askClass] : COLORS.text }}>
            <i style={{ color: ROLE.label, fontSize: 36 }}>y</i> = {askClass >= 0 ? CLASSES[askClass].name : ""}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 26, color: COLORS.yellow }}>→ x = {askClass >= 0 ? s.map[askClass][Z_IDX].toFixed(2) : ""}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
