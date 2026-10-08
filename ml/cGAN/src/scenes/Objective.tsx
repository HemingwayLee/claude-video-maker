import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade } from "../anim";
import { Card } from "../components/Text";
import { COLORS, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

const Dc = () => <span style={{ color: ROLE.disc }}>D</span>;
const Gc = () => <span style={{ color: ROLE.gen }}>G</span>;
const Y = () => <i style={{ color: ROLE.label, fontWeight: 800 }}>y</i>;
const Sub: React.FC<{ children: React.ReactNode }> = ({ children }) => <sub style={{ fontSize: "0.5em", verticalAlign: "-0.45em" }}>{children}</sub>;

const Term: React.FC<{ children: React.ReactNode; color: string; on: number; note: React.ReactNode }> = ({ children, color, on, note }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
    <div style={{ padding: "6px 14px", borderRadius: 14, boxShadow: `0 0 0 3px ${color}${Math.round(on * 255).toString(16).padStart(2, "0")}`, background: `${color}${Math.round(on * 34).toString(16).padStart(2, "0")}` }}>{children}</div>
    <div style={{ marginTop: 18, fontSize: 26, fontWeight: 500, lineHeight: 1.4, textAlign: "center", color: COLORS.text, opacity: on, width: 560, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>{note}</div>
  </div>
);

export const Objective: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();

  const cond = fade(frame, L[0] + 30);
  const t1 = fade(frame, L[1]);
  const t2 = fade(frame, L[1] + 30);
  const g = fade(frame, L[2]);
  const goal = fade(frame, L[3]);

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: 200, display: "flex", justifyContent: "center", alignItems: "flex-start", gap: 16, fontSize: 48, fontWeight: 600, fontFamily: "'Times New Roman', Georgia, serif", opacity: fade(frame, L[0]) }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ padding: "6px 0", whiteSpace: "nowrap" }}>
            <span style={{ color: ROLE.gen, textShadow: g ? `0 0 ${18 * g}px ${ROLE.gen}` : undefined }}>
              min<Sub>G</Sub>
            </span>{" "}
            <span style={{ color: ROLE.disc, textShadow: t1 ? `0 0 ${18 * t1}px ${ROLE.disc}` : undefined }}>
              max<Sub>D</Sub>
            </span>{" "}
            V(<Dc />, <Gc />) =
          </div>
          <div style={{ marginTop: 18, fontSize: 26, lineHeight: 1.45, fontFamily: "'Helvetica Neue', Arial, sans-serif", width: 340, textAlign: "center" }}>
            <div style={{ opacity: t1 }}>
              <span style={{ color: ROLE.disc, fontWeight: 700 }}>D</span> pushes V <b>up</b>
            </div>
            <div style={{ opacity: g }}>
              <span style={{ color: ROLE.gen, fontWeight: 700 }}>G</span> pushes V <b>down</b>
            </div>
          </div>
        </div>
        <Term
          color={ROLE.real}
          on={t1}
          note={
            <>
              real image with its true label: D(x | y) → 1
            </>
          }
        >
          <span style={{ whiteSpace: "nowrap" }}>
            𝔼<Sub>x, y ∼ p<sub style={{ fontSize: "0.8em" }}>data</sub></Sub> [ log <Dc />(<span style={{ color: ROLE.real }}>x</span>
            <span style={{ opacity: 0.4 + 0.6 * cond }}> | <Y /></span>) ]
          </span>
        </Term>
        <div style={{ padding: "6px 0" }}>+</div>
        <Term
          color={ROLE.gen}
          on={t2}
          note={
            <>
              fake made for label y: D → 0
              <br />
              <span style={{ color: ROLE.gen }}>G wants it → 1</span>
            </>
          }
        >
          <span style={{ whiteSpace: "nowrap" }}>
            𝔼<Sub>z, y</Sub> [ log(1 − <Dc />(<Gc />(<span style={{ color: ROLE.noise }}>z</span>
            <span style={{ opacity: 0.4 + 0.6 * cond }}> | <Y /></span>)
            <span style={{ opacity: 0.4 + 0.6 * cond }}> | <Y /></span>)) ]
          </span>
        </Term>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", fontSize: 26, color: ROLE.label, fontWeight: 700, opacity: cond * (1 - goal) }}>
        the only change from the GAN: “| y” everywhere
      </div>

      <Card x={460} y={560} w={1000} h={200} accent={ROLE.label} opacity={goal}>
        <div style={{ padding: "26px 34px", textAlign: "center" }}>
          <div style={{ fontSize: 28, color: COLORS.muted }}>the goal, for every label y</div>
          <div style={{ fontFamily: "'Times New Roman', Georgia, serif", fontSize: 52, marginTop: 10 }}>
            <span style={{ color: ROLE.gen }}>
              p<sub style={{ fontSize: "0.55em" }}>g</sub>(x | <Y />)
            </span>{" "}
            ={" "}
            <span style={{ color: ROLE.real }}>
              p<sub style={{ fontSize: "0.55em" }}>data</sub>(x | <Y />)
            </span>
          </div>
        </div>
      </Card>
      <div style={{ position: "absolute", left: 0, right: 0, top: 790, textAlign: "center", fontFamily: MONO, fontSize: 20, color: COLORS.muted, opacity: goal }}>
        Mirza &amp; Osindero, 2014. In practice G uses the non-saturating loss −log D(G(z | y) | y), as in a plain GAN.
      </div>
    </AbsoluteFill>
  );
};
