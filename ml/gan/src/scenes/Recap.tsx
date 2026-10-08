import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, pop } from "../anim";
import { areaPath, type Chart, linePath, py } from "../components/Diagram";
import { Face } from "../components/Face";
import { Card, Label } from "../components/Text";
import { FACE_Z, FINAL, faceFromZ, REAL, TRACE, XS } from "../data";
import { COLORS, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

const MINI: Chart = { x: 1310, y: 420, w: 440, h: 180, x0: TRACE.xMin, x1: TRACE.xMax, y0: 0, y1: 0.6 };
const MINI_D: Chart = { ...MINI, y1: 1 };

export const Recap: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  const title = pop(frame, fps, L[0], 16);
  const g = pop(frame, fps, L[1], 14);
  const d = pop(frame, fps, L[1] + 25, 14);
  const game = pop(frame, fps, L[2], 14);

  const card = (p: number) => ({ opacity: Math.min(1, p), transform: `translateY(${(1 - Math.min(1, p)) * 30}px)` });

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: 170, textAlign: "center", fontSize: 60, fontWeight: 800, opacity: Math.min(1, title) }}>
        GAN = <span style={{ color: ROLE.gen }}>two networks</span>, <span style={{ color: COLORS.yellow }}>one game</span>
      </div>

      <div style={card(g)}>
        <Card x={130} y={300} w={520} h={520} accent={ROLE.gen}>
          <div style={{ padding: 30 }}>
            <div style={{ fontSize: 44, fontWeight: 800, color: ROLE.gen }}>Generator G</div>
            <div style={{ fontSize: 26, color: COLORS.muted, marginTop: 8 }}>noise in → sample out</div>
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 40 }}>
              <div style={{ fontSize: 40, fontStyle: "italic", fontWeight: 800, color: ROLE.noise }}>z</div>
              <div style={{ fontSize: 40, color: COLORS.muted }}>→</div>
              <Face p={faceFromZ(FACE_Z[4])} size={180} border={ROLE.gen} />
            </div>
            <div style={{ fontSize: 24, marginTop: 34, lineHeight: 1.4 }}>learns only from D's feedback</div>
          </div>
        </Card>
      </div>

      <div style={card(d)}>
        <Card x={700} y={300} w={520} h={520} accent={ROLE.disc}>
          <div style={{ padding: 30 }}>
            <div style={{ fontSize: 44, fontWeight: 800, color: ROLE.disc }}>Discriminator D</div>
            <div style={{ fontSize: 26, color: COLORS.muted, marginTop: 8 }}>sample in → P(real) out</div>
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 40 }}>
              <Face p={faceFromZ(FACE_Z[10])} size={180} border={ROLE.real} />
              <div style={{ fontSize: 40, color: COLORS.muted }}>→</div>
              <div style={{ fontFamily: MONO, fontSize: 52, fontWeight: 800, color: ROLE.disc }}>0.9</div>
            </div>
            <div style={{ fontSize: 24, marginTop: 34, lineHeight: 1.4 }}>a classifier: real vs. fake</div>
          </div>
        </Card>
      </div>

      <div style={card(game)}>
        <Card x={1270} y={300} w={520} h={520} accent={COLORS.yellow}>
          <div style={{ padding: 30 }}>
            <div style={{ fontSize: 44, fontWeight: 800, color: COLORS.yellow }}>The game</div>
            <div style={{ fontSize: 26, color: COLORS.muted, marginTop: 8 }}>take turns: train D, then G</div>
          </div>
        </Card>
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
          <path d={areaPath(MINI, XS, REAL)} fill={ROLE.real} fillOpacity={0.22} stroke={ROLE.real} strokeWidth={3} />
          <path d={areaPath(MINI, XS, FINAL.gen)} fill={ROLE.gen} fillOpacity={0.25} stroke={ROLE.gen} strokeWidth={3} />
          <line x1={MINI.x} y1={py(MINI_D, 0.5)} x2={MINI.x + MINI.w} y2={py(MINI_D, 0.5)} stroke={ROLE.disc} strokeDasharray="8 6" strokeWidth={2} />
          <path d={linePath(MINI_D, XS, FINAL.d)} fill="none" stroke={ROLE.disc} strokeWidth={3} opacity={0.8} />
          <line x1={MINI.x} y1={MINI.y + MINI.h} x2={MINI.x + MINI.w} y2={MINI.y + MINI.h} stroke={COLORS.muted} strokeWidth={2} />
        </svg>
        <Label x={1300} y={640} size={26} width={460} opacity={fade(frame, L[2] + 20)}>
          until <span style={{ color: ROLE.gen }}>fake</span> ≈ <span style={{ color: ROLE.real }}>real</span> and{" "}
          <span style={{ color: ROLE.disc }}>D ≈ ½</span>
        </Label>
        <Label x={1300} y={740} size={22} color={COLORS.muted} width={460} opacity={fade(frame, L[2] + 20)}>
          min<sub>G</sub> max<sub>D</sub> V(D, G)
        </Label>
      </div>
    </AbsoluteFill>
  );
};
