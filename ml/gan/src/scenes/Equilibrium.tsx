import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade, lerp } from "../anim";
import { areaPath, Axes, type Chart, px, py } from "../components/Diagram";
import { Card } from "../components/Text";
import { FINAL, REAL, SNAPS, snapIndex, snapshotAt, TRACE, XS } from "../data";
import { COLORS, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

const CHART: Chart = { x: 140, y: 420, w: 880, h: 390, x0: TRACE.xMin, x1: TRACE.xMax, y0: 0, y1: 0.9 };
const DAX: Chart = { ...CHART, y1: 1 };

// The best discriminator for densities p_data and p_g, drawn only where
// there is data to judge (it is undefined where both densities are zero).
const optimalPath = (gen: number[]) => {
  let d = "";
  let pen = false;
  XS.forEach((x, i) => {
    const total = REAL[i] + gen[i];
    if (total < 0.03) {
      pen = false;
      return;
    }
    const v = REAL[i] / total;
    d += `${pen ? "L" : "M"} ${px(DAX, x).toFixed(1)} ${py(DAX, v).toFixed(1)} `;
    pen = true;
  });
  return d;
};

const Frac: React.FC<{ top: React.ReactNode; bottom: React.ReactNode }> = ({ top, bottom }) => (
  <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", verticalAlign: "middle", margin: "0 10px" }}>
    <span style={{ padding: "0 8px 6px" }}>{top}</span>
    <span style={{ borderTop: `3px solid ${COLORS.text}`, padding: "6px 8px 0" }}>{bottom}</span>
  </span>
);
const Pd = () => (
  <span style={{ color: ROLE.real }}>
    p<sub style={{ fontSize: "0.55em" }}>data</sub>(x)
  </span>
);
const Pg = () => (
  <span style={{ color: ROLE.gen }}>
    p<sub style={{ fontSize: "0.55em" }}>g</sub>(x)
  </span>
);

export const Equilibrium: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();

  const pos = lerp(frame, [L[3] + 10, L[4] - 20], [snapIndex(300), SNAPS.length - 1]);
  const s = snapshotAt(pos);

  const formula = fade(frame, L[1]);
  const chart = fade(frame, L[1] + 20);

  return (
    <AbsoluteFill>
      {/* the optimal discriminator */}
      <div style={{ position: "absolute", left: 150, top: 180, fontFamily: "'Times New Roman', Georgia, serif", fontSize: 48, opacity: formula, display: "flex", alignItems: "center" }}>
        <span style={{ color: ROLE.disc }}>D*(x)</span>&nbsp;=
        <Frac
          top={<Pd />}
          bottom={
            <>
              <Pd /> + <Pg />
            </>
          }
        />
      </div>
      <div style={{ position: "absolute", left: 660, top: 215, fontSize: 26, color: COLORS.muted, opacity: fade(frame, L[1] + 30), width: 380 }}>
        the share of real data at each point
      </div>

      <svg width={1920} height={1080} style={{ position: "absolute", opacity: chart }}>
        <defs>
          <clipPath id="eq-clip">
            <rect x={CHART.x} y={CHART.y - 4} width={CHART.w} height={CHART.h + 4} />
          </clipPath>
        </defs>
        <Axes c={CHART} xLabel="x" />
        <g clipPath="url(#eq-clip)">
          <path d={areaPath(CHART, XS, REAL)} fill={ROLE.real} fillOpacity={0.22} stroke={ROLE.real} strokeWidth={4} />
          <path d={areaPath(CHART, XS, s.gen)} fill={ROLE.gen} fillOpacity={0.28} stroke={ROLE.gen} strokeWidth={4} />
          <line x1={CHART.x} y1={py(DAX, 0.5)} x2={CHART.x + CHART.w} y2={py(DAX, 0.5)} stroke={ROLE.disc} strokeOpacity={0.5} strokeWidth={2} strokeDasharray="10 8" />
          <path d={optimalPath(s.gen)} fill="none" stroke={ROLE.disc} strokeWidth={5} />
        </g>
        <line x1={CHART.x + CHART.w} y1={CHART.y} x2={CHART.x + CHART.w} y2={CHART.y + CHART.h} stroke={ROLE.disc} strokeWidth={2} />
        {[0, 0.5, 1].map((v) => (
          <text key={v} x={CHART.x + CHART.w + 12} y={py(DAX, v) + 8} fill={ROLE.disc} fontSize={22} fontFamily={MONO}>
            {v}
          </text>
        ))}
        <text x={CHART.x} y={CHART.y - 16} fill={COLORS.muted} fontSize={22}>
          our GAN at step <tspan fontFamily={MONO} fill={COLORS.text}>{s.step.toLocaleString("en-US")}</tspan>
          <tspan fill={ROLE.disc}> · D* computed from the two curves</tspan>
        </text>
      </svg>

      {/* what G is really minimizing */}
      <Card x={1110} y={180} w={710} h={250} accent={COLORS.purple} opacity={fade(frame, L[2])}>
        <div style={{ padding: "22px 28px" }}>
          <div style={{ fontSize: 24, color: COLORS.muted }}>with D = D*, the game becomes</div>
          <div style={{ fontFamily: "'Times New Roman', Georgia, serif", fontSize: 40, marginTop: 10 }}>
            V = −log 4 + 2 · <span style={{ color: COLORS.purple, fontWeight: 700 }}>JSD</span>(<span style={{ color: ROLE.real }}>p<sub>data</sub></span> ‖ <span style={{ color: ROLE.gen }}>p<sub>g</sub></span>)
          </div>
          <div style={{ fontSize: 24, marginTop: 14, lineHeight: 1.4 }}>
            <span style={{ color: COLORS.purple, fontWeight: 700 }}>Jensen–Shannon divergence</span>: a distance between distributions. Always ≥ 0, and 0 only when they are equal.
          </div>
        </div>
      </Card>

      <Card x={1110} y={460} w={710} h={140} accent={ROLE.disc} opacity={fade(frame, L[3])}>
        <div style={{ padding: "22px 28px", fontSize: 32, lineHeight: 1.4 }}>
          <span style={{ color: ROLE.gen }}>
            p<sub>g</sub>
          </span>{" "}
          ={" "}
          <span style={{ color: ROLE.real }}>
            p<sub>data</sub>
          </span>{" "}
          ⇒ <span style={{ color: ROLE.disc, fontWeight: 700 }}>D* = ½</span> everywhere
          <div style={{ fontSize: 22, color: COLORS.muted }}>the best guess is a coin flip</div>
        </div>
      </Card>

      <Card x={1110} y={630} w={710} h={180} accent={COLORS.yellow} opacity={fade(frame, L[4])}>
        <div style={{ padding: "20px 28px", fontSize: 28, lineHeight: 1.5 }}>
          <div>
            D's loss = −log ½ − log ½ = <b>2 log 2</b> ≈ <span style={{ fontFamily: MONO, color: COLORS.yellow }}>1.386</span>
          </div>
          <div>
            our run, step {TRACE.config.steps.toLocaleString("en-US")}: <span style={{ fontFamily: MONO, color: COLORS.yellow }}>{FINAL.dLoss.toFixed(3)}</span>
          </div>
        </div>
      </Card>
    </AbsoluteFill>
  );
};
