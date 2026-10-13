import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, lerp, linear, pop } from "../anim";
import { Berry } from "../components/Goji";
import { landPath, MAINLAND, type Projection, project, Ship, Taiwan } from "../components/Map";
import { Stage } from "../components/Stage";
import { COLORS, FONT, INK, outline, ROLE } from "../theme";
import { useLines } from "../timeline";

// 0「所以，市面上的枸杞，」      a market stall: 100 goji berries, one per 1 %
// 1「超過百分之九十八，」        98 of them turn "imported" orange, counter → 98 %
// 2「仍然仰賴從中國進口。」      a map slides in: ships carry crates across the strait

const GRID = 10;
const CELL = 58;

// The map panel's projection, centered between the two coasts.
const PROJ: Projection = { k: 190, lon0: 120.0, lat0: 24.0 };

export const Import: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();
  const tinted = Math.round(linear(frame, [L[1] + 4, L[1] + 34], [0, 98]));
  const counterIn = pop(frame, fps, L[1] + 2, 12);
  // Step 2: everything on the left makes room for the map.
  const shift = lerp(frame, [L[2], L[2] + 18], [0, 1]);
  const gx = 960 - 400 * shift - 260 * (1 - shift) * fade(frame, L[1], 14); // grid center x
  const gs = 1 - 0.18 * shift;
  const mapX = lerp(frame, [L[2], L[2] + 20], [2400, 1390]);
  const counterX = lerp(frame, [L[2], L[2] + 18], [1440, 560]);
  const counterY = lerp(frame, [L[2], L[2] + 18], [540, 150]);
  const counterS = lerp(frame, [L[2], L[2] + 18], [1, 0.6]);
  const half = (GRID * CELL) / 2;
  // Coast to coast: where the ships leave and arrive.
  const [fromX, fromY] = project([118.4, 24.6], PROJ);
  const [toX, toY] = project([120.15, 23.9], PROJ);
  return (
    <AbsoluteFill style={{ background: "#fff4d6", backgroundImage: "radial-gradient(#f2d9a6 22%, transparent 24%)", backgroundSize: "26px 26px" }}>
      <Stage>
        {/* the market stall: awning + a tray of 100 berries */}
        <g transform={`translate(${gx} 600) scale(${gs * pop(frame, fps, 0, 14)})`}>
          <rect x={-half - 30} y={-half - 30} width={GRID * CELL + 60} height={GRID * CELL + 60} rx={24} fill={COLORS.wood} stroke={INK} strokeWidth={8} />
          <rect x={-half - 8} y={-half - 8} width={GRID * CELL + 16} height={GRID * CELL + 16} rx={12} fill="#fff8e6" stroke={INK} strokeWidth={5} />
          <g transform={`translate(0 ${-half - 60})`}>
            {Array.from({ length: 8 }, (_, i) => {
              const w = (GRID * CELL + 100) / 8;
              const x = -half - 50 + i * w;
              return (
                <path
                  key={i}
                  d={`M ${x} -60 L ${x + w} -60 L ${x + w} 10 Q ${x + w / 2} 50 ${x} 10 Z`}
                  fill={i % 2 ? "#fff" : COLORS.red}
                  stroke={INK}
                  strokeWidth={5}
                  strokeLinejoin="round"
                />
              );
            })}
          </g>
          {Array.from({ length: GRID * GRID }, (_, i) => {
            const r = Math.floor(i / GRID);
            const c = i % GRID;
            const x = -half + (c + 0.5) * CELL;
            const y = -half + (r + 0.5) * CELL;
            const appear = pop(frame, fps, 6 + (r + c) * 1.2, 14);
            const imp = i < tinted;
            return (
              <g key={i}>
                {imp && <rect x={x - CELL / 2 + 3} y={y - CELL / 2 + 3} width={CELL - 6} height={CELL - 6} rx={10} fill={ROLE.imported} opacity={0.85} />}
                <g transform={`translate(${x} ${y - 20}) scale(${appear})`}>
                  <Berry x={0} y={0} size={36} rot={-30} stroke={3} />
                </g>
              </g>
            );
          })}
        </g>
        {/* the map panel */}
        <g transform={`translate(${mapX} 560)`}>
          <clipPath id="panel">
            <rect x={-420} y={-440} width={840} height={880} rx={30} />
          </clipPath>
          <g clipPath="url(#panel)">
            <rect x={-420} y={-440} width={840} height={880} fill={COLORS.sea} />
            {Array.from({ length: 14 }, (_, i) => (
              <path
                key={i}
                d={`M ${((i * 263) % 760) - 380 + Math.sin(frame / 30 + i) * 10} ${((i * 181) % 820) - 400} q 18 -14 36 0 q 18 -14 36 0`}
                stroke={COLORS.seaLine}
                strokeWidth={5}
                fill="none"
                strokeLinecap="round"
              />
            ))}
            <path d={landPath(MAINLAND, PROJ)} fill={COLORS.landFar} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
            <g transform={`translate(${project([120.97, 23.6], PROJ).join(" ")})`}>
              <Taiwan height={3.4 * PROJ.k} fill={ROLE.taiwan} stroke={6} mountains={false} />
            </g>
            {/* shipping lane */}
            <path d={`M ${fromX} ${fromY} Q ${(fromX + toX) / 2} ${fromY - 120} ${toX} ${toY}`} stroke="#fff" strokeWidth={8} strokeDasharray="20 18" fill="none" strokeDashoffset={-frame * 2} />
            {[0, 1, 2].map((k) => {
              if (frame < L[2] + 10) return null;
              const tt = ((frame - L[2] - 10) / 135 + k / 3) % 1;
              const x = (1 - tt) * (1 - tt) * fromX + 2 * (1 - tt) * tt * ((fromX + toX) / 2) + tt * tt * toX;
              const y = (1 - tt) * (1 - tt) * fromY + 2 * (1 - tt) * tt * (fromY - 120) + tt * tt * toY;
              const o = Math.min(1, tt * 8, (1 - tt) * 8);
              return (
                <g key={k} transform={`translate(${x} ${y + 20}) scale(0.48)`} opacity={o}>
                  <Ship frame={frame + k * 20} />
                </g>
              );
            })}
          </g>
          <rect x={-420} y={-440} width={840} height={880} rx={30} fill="none" stroke={INK} strokeWidth={10} />
          {/* labels on the map */}
          <g fontFamily={FONT} fontWeight={900} fontSize={64} textAnchor="middle" paintOrder="stroke" stroke={INK} strokeWidth={12}>
            <text x={-240} y={-250} fill={ROLE.imported}>中國</text>
            <text x={250} y={-310} fill={ROLE.taiwan}>台灣</text>
          </g>
        </g>
      </Stage>
      {/* the counter: > 98 % */}
      <div
        style={{
          position: "absolute",
          left: counterX,
          top: counterY,
          transform: `translate(-50%, -50%) scale(${counterS * counterIn}) rotate(-3deg)`,
          display: "flex",
          alignItems: "baseline",
          fontFamily: FONT,
          fontWeight: 900,
          color: ROLE.imported,
          textShadow: `${outline(INK, 12)}, 10px 14px 0 ${INK}`,
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ fontSize: 160, color: COLORS.yellow, marginRight: 14 }}>&gt;</span>
        <span style={{ fontSize: 260, width: 330, textAlign: "right" }}>{tinted}</span>
        <span style={{ fontSize: 160 }}>%</span>
      </div>
    </AbsoluteFill>
  );
};
