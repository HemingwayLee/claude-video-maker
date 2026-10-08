import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, pop } from "../anim";
import { Arrow, Layer } from "../components/Diagram";
import { YTag } from "../components/Cond";
import { Face } from "../components/Face";
import { Card, Label } from "../components/Text";
import { FACE_Z, faceFromZY, finalD } from "../data";
import { COLORS, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

const CASES = [
  { title: "real, matches", face: faceFromZY(FACE_Z[6], 2), quality: 1, d: 0.91, verdict: "REAL", why: "looks real and has glasses", color: COLORS.green, border: ROLE.real },
  { title: "looks fake", face: faceFromZY(FACE_Z[1], 2), quality: 0.35, d: 0.06, verdict: "FAKE", why: "doesn't look like a real photo", color: COLORS.red, border: ROLE.gen },
  { title: "real-looking, wrong", face: faceFromZY(FACE_Z[9], 1), quality: 1, d: 0.04, verdict: "FAKE", why: "a fine face, but no glasses", color: COLORS.red, border: ROLE.gen },
];
const XS = [110, 700, 1290];

export const Match: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  const real1d = fade(frame, L[3] + 20);

  return (
    <AbsoluteFill>
      {CASES.map((c, i) => {
        const on = fade(frame, L[i] + (i === 0 ? 10 : 0));
        const stamp = pop(frame, fps, L[i] + (i === 0 ? 40 : 30), 12);
        const x = XS[i];
        return (
          <React.Fragment key={i}>
            <Card x={x} y={190} w={520} h={470} accent={frame >= L[i] && frame < L[i + 1] ? c.color : undefined} opacity={on} />
            <Label x={x + 30} y={210} size={30} weight={800} color={COLORS.text} opacity={on}>
              {i + 1}. {c.title}
            </Label>
            <div style={{ position: "absolute", left: x + 30, top: 270, opacity: on }}>
              <Face p={c.face} size={190} quality={c.quality} noiseSeed={`match-${i}`} border={c.border} />
            </div>
            <YTag x={x + 30} y={480} text="glasses" opacity={on} />
            <Layer opacity={on}>
              <Arrow id={`m${i}`} d={`M ${x + 240} 365 L ${x + 300} 365`} />
            </Layer>
            <div style={{ position: "absolute", left: x + 310, top: 290, opacity: on }}>
              <div style={{ fontSize: 24, color: ROLE.disc, fontWeight: 700 }}>D(x | y)</div>
              <div style={{ fontFamily: MONO, fontSize: 54, fontWeight: 800, color: ROLE.disc }}>{c.d.toFixed(2)}</div>
              <div style={{ marginTop: 10, display: "inline-block", padding: "4px 18px", border: `4px solid ${c.color}`, borderRadius: 10, color: c.color, fontSize: 36, fontWeight: 900, transform: `scale(${stamp}) rotate(-5deg)` }}>{c.verdict}</div>
            </div>
            <Label x={x + 30} y={560} size={24} color={COLORS.muted} width={460} opacity={on}>
              {c.why}
            </Label>
          </React.Fragment>
        );
      })}

      <div style={{ position: "absolute", left: 110, top: 700, width: 1700, fontSize: 28, lineHeight: 1.5, opacity: real1d }}>
        <span style={{ color: COLORS.muted }}>Measured in this project's trained 1-D cGAN (scene 08): a real class-C value x = 3.0 gets</span>
        <br />
        D(3.0 | y = C) = <b style={{ fontFamily: MONO, color: COLORS.green }}>{finalD(3, 2).toFixed(2)}</b>
        <span style={{ color: COLORS.muted }}> (right label, can't tell)</span> &nbsp;·&nbsp; D(3.0 | y = A) = <b style={{ fontFamily: MONO, color: COLORS.red }}>{finalD(3, 0).toFixed(2)}</b>
        <span style={{ color: COLORS.muted }}> (wrong label, rejected)</span>
      </div>
      <div style={{ position: "absolute", right: 110, top: 670, fontFamily: MONO, fontSize: 18, color: COLORS.muted, opacity: fade(frame, L[0] + 30) }}>(face scores: illustration)</div>
    </AbsoluteFill>
  );
};
