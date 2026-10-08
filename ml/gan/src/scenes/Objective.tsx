import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade } from "../anim";
import { Axes, type Chart, Layer, linePath, px, py } from "../components/Diagram";
import { Label } from "../components/Text";
import { COLORS, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

const Dc = () => <span style={{ color: ROLE.disc }}>D</span>;
const Gc = () => <span style={{ color: ROLE.gen }}>G</span>;
const Sub: React.FC<{ children: React.ReactNode }> = ({ children }) => <sub style={{ fontSize: "0.5em", verticalAlign: "-0.45em" }}>{children}</sub>;

// One term of the formula, with a highlight box and a note underneath.
const Term: React.FC<{ children: React.ReactNode; color: string; on: number; note: React.ReactNode }> = ({ children, color, on, note }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
    <div style={{ padding: "6px 14px", borderRadius: 14, border: `3px solid ${color}`, borderColor: `rgba(0,0,0,0)`, boxShadow: `0 0 0 3px ${color}${Math.round(on * 255).toString(16).padStart(2, "0")}`, background: `${color}${Math.round(on * 34).toString(16).padStart(2, "0")}` }}>
      {children}
    </div>
    <div style={{ marginTop: 18, fontSize: 26, fontWeight: 500, lineHeight: 1.4, textAlign: "center", color: COLORS.text, opacity: on, width: 520 }}>{note}</div>
  </div>
);

const CHART: Chart = { x: 640, y: 560, w: 600, h: 300, x0: 0, x1: 1, y0: -4.6, y1: 4.6 };
const DS = Array.from({ length: 199 }, (_, i) => 0.005 + i * 0.005);

export const Objective: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();

  const t1 = fade(frame, L[1]) * (frame < L[4] ? 1 : 0.35);
  const t2 = fade(frame, L[2]) * (frame < L[4] ? 1 : 0.35);
  const players = fade(frame, L[3]);
  const chart = fade(frame, L[4] + 10);

  return (
    <AbsoluteFill>
      {/* the value function */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 190,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: 16,
          fontSize: 50,
          fontWeight: 600,
          opacity: fade(frame, L[0]),
          fontFamily: "'Times New Roman', Georgia, serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ padding: "6px 0", whiteSpace: "nowrap" }}>
            <span style={{ color: ROLE.gen, textShadow: players ? `0 0 ${18 * players}px ${ROLE.gen}` : undefined }}>
              min<Sub>G</Sub>
            </span>{" "}
            <span style={{ color: ROLE.disc, textShadow: players ? `0 0 ${18 * players}px ${ROLE.disc}` : undefined }}>
              max<Sub>D</Sub>
            </span>{" "}
            V(<Dc />, <Gc />) =
          </div>
          <div style={{ marginTop: 18, fontSize: 26, lineHeight: 1.45, fontFamily: "inherit", opacity: players, width: 360, textAlign: "center" }}>
            <div>
              <span style={{ color: ROLE.disc, fontWeight: 700 }}>D</span> pushes V <b>up</b>
            </div>
            <div>
              <span style={{ color: ROLE.gen, fontWeight: 700 }}>G</span> pushes V <b>down</b>
            </div>
          </div>
        </div>
        <Term
          color={ROLE.real}
          on={t1}
          note={
            <>
              on <span style={{ color: ROLE.real, fontWeight: 700 }}>real data</span>, D wants D(x) → 1
              <br />
              <span style={{ fontFamily: MONO, color: COLORS.muted, fontSize: 22 }}>log 1 = 0, the largest it can be</span>
            </>
          }
        >
          <span style={{ whiteSpace: "nowrap" }}>
            𝔼<Sub>x∼p<sub style={{ fontSize: "0.8em" }}>data</sub></Sub> [ log <Dc />(<span style={{ color: ROLE.real }}>x</span>) ]
          </span>
        </Term>
        <div style={{ padding: "6px 0" }}>+</div>
        <Term
          color={ROLE.gen}
          on={t2}
          note={
            <>
              on <span style={{ color: ROLE.gen, fontWeight: 700 }}>fakes</span>, D wants D(G(z)) → 0
              <br />
              <span style={{ fontFamily: MONO, color: COLORS.muted, fontSize: 22 }}>log(1 − 0) = 0, again the largest</span>
            </>
          }
        >
          <span style={{ whiteSpace: "nowrap" }}>
            𝔼<Sub>z∼p<sub style={{ fontSize: "0.8em" }}>z</sub></Sub> [ log(1 − <Dc />(<Gc />(<span style={{ color: ROLE.noise }}>z</span>))) ]
          </span>
        </Term>
      </div>

      {/* saturating vs non-saturating generator loss */}
      <Layer opacity={chart}>
        <rect x={CHART.x} y={CHART.y} width={px(CHART, 0.15) - CHART.x} height={CHART.h} fill={COLORS.yellow} opacity={0.1} />
        <text x={CHART.x + 8} y={CHART.y + 26} fill={COLORS.yellow} fontSize={20}>
          early training:
        </text>
        <text x={CHART.x + 8} y={CHART.y + 50} fill={COLORS.yellow} fontSize={20}>
          fakes are bad
        </text>
        <line x1={CHART.x} y1={py(CHART, 0)} x2={CHART.x + CHART.w} y2={py(CHART, 0)} stroke={COLORS.panelBorder} strokeWidth={2} />
        <Axes c={CHART} xLabel="D(G(z)): how real D finds the fake" yLabel="G's loss (lower is better for G)" />
        <path d={linePath(CHART, DS, DS.map((d) => Math.max(CHART.y0, Math.log(1 - d))))} fill="none" stroke={COLORS.muted} strokeWidth={5} strokeDasharray="12 8" />
        <path d={linePath(CHART, DS, DS.map((d) => -Math.log(d)))} fill="none" stroke={ROLE.gen} strokeWidth={5} />
        <text x={CHART.x - 12} y={CHART.y + CHART.h + 30} fill={COLORS.muted} fontSize={22} fontFamily={MONO} textAnchor="middle">
          0
        </text>
        <text x={CHART.x + CHART.w} y={CHART.y + CHART.h + 30} fill={COLORS.muted} fontSize={22} fontFamily={MONO}>
          1
        </text>
      </Layer>
      <div style={{ position: "absolute", left: 1300, top: 600, width: 520, fontSize: 26, lineHeight: 1.45, opacity: chart }}>
        <div style={{ color: COLORS.muted }}>
          <span style={{ fontFamily: MONO }}>- - -</span> minimize log(1 − D(G(z)))
        </div>
        <div style={{ color: COLORS.muted, fontSize: 22, marginBottom: 14 }}>almost flat at the left: weak gradient</div>
        <div style={{ color: ROLE.gen, fontWeight: 700 }}>
          <span style={{ fontFamily: MONO }}>——</span> minimize −log D(G(z))
        </div>
        <div style={{ color: COLORS.muted, fontSize: 22 }}>steep at the left: strong gradient (used in practice)</div>
      </div>
      <Label x={130} y={600} size={26} width={460} color={COLORS.text} opacity={chart}>
        Both losses want D(G(z)) → 1. They differ in <b style={{ color: COLORS.yellow }}>how hard they push</b> when the fakes are still obvious.
      </Label>
    </AbsoluteFill>
  );
};
