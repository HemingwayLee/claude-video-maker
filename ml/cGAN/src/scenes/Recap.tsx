import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { pop } from "../anim";
import { YTag } from "../components/Cond";
import { areaPath, type Chart } from "../components/Diagram";
import { Face } from "../components/Face";
import { Card, Label } from "../components/Text";
import { FACE_Z, FINAL, faceFromZY, REAL, TRACE, XS } from "../data";
import { CLASS_COLORS, COLORS, ROLE } from "../theme";
import { useLines } from "../timeline";

const MINI: Chart = { x: 1310, y: 470, w: 440, h: 150, x0: TRACE.xMin, x1: TRACE.xMax, y0: 0, y1: 1 };

export const Recap: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  const title = pop(frame, fps, L[0], 16);
  const g = pop(frame, fps, L[0] + 20, 14);
  const d = pop(frame, fps, L[1], 14);
  const result = pop(frame, fps, L[2], 14);
  const card = (p: number) => ({ opacity: Math.min(1, p), transform: `translateY(${(1 - Math.min(1, p)) * 30}px)` });

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: 170, textAlign: "center", fontSize: 58, fontWeight: 800, opacity: Math.min(1, title) }}>
        cGAN = GAN + the condition <i style={{ color: ROLE.label }}>y</i>, given to <span style={{ color: ROLE.gen }}>both</span> players
      </div>

      <div style={card(g)}>
        <Card x={130} y={300} w={520} h={520} accent={ROLE.gen}>
          <div style={{ padding: 30 }}>
            <div style={{ fontSize: 44, fontWeight: 800, color: ROLE.gen }}>G(z | y)</div>
            <div style={{ fontSize: 26, color: COLORS.muted, marginTop: 8 }}>noise + label in → sample out</div>
            <div style={{ position: "relative", height: 60, marginTop: 30 }}>
              <YTag x={0} y={0} text="glasses" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 20 }}>
              <div style={{ fontSize: 40, fontStyle: "italic", fontWeight: 800, color: ROLE.noise }}>z</div>
              <div style={{ fontSize: 40, color: COLORS.muted }}>→</div>
              <Face p={faceFromZY(FACE_Z[4], 2)} size={170} border={ROLE.gen} />
            </div>
          </div>
        </Card>
      </div>

      <div style={card(d)}>
        <Card x={700} y={300} w={520} h={520} accent={ROLE.disc}>
          <div style={{ padding: 30 }}>
            <div style={{ fontSize: 44, fontWeight: 800, color: ROLE.disc }}>D(x | y)</div>
            <div style={{ fontSize: 26, color: COLORS.muted, marginTop: 8 }}>two questions at once</div>
            <div style={{ fontSize: 30, marginTop: 40, lineHeight: 1.6 }}>
              <div>✓ does it look <b>real</b>?</div>
              <div>
                ✓ does it <b>match</b> <i style={{ color: ROLE.label }}>y</i>?
              </div>
            </div>
            <div style={{ fontSize: 24, color: COLORS.muted, marginTop: 30 }}>fails either one → fake</div>
          </div>
        </Card>
      </div>

      <div style={card(result)}>
        <Card x={1270} y={300} w={520} h={520} accent={COLORS.yellow}>
          <div style={{ padding: 30 }}>
            <div style={{ fontSize: 44, fontWeight: 800, color: COLORS.yellow }}>The result</div>
            <div style={{ fontSize: 26, color: COLORS.muted, marginTop: 8 }}>ask for a class, get that class</div>
          </div>
        </Card>
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
          {REAL.map((r, c) => (
            <React.Fragment key={c}>
              <path d={areaPath(MINI, XS, r)} fill={CLASS_COLORS[c]} fillOpacity={0.3} stroke={CLASS_COLORS[c]} strokeWidth={3} />
              <path d={areaPath(MINI, XS, FINAL.gen[c])} fill="none" stroke={ROLE.gen} strokeWidth={3} strokeDasharray="6 4" />
            </React.Fragment>
          ))}
          <line x1={MINI.x} y1={MINI.y + MINI.h} x2={MINI.x + MINI.w} y2={MINI.y + MINI.h} stroke={COLORS.muted} strokeWidth={2} />
        </svg>
        <Label x={1310} y={640} size={24} width={460}>
          {TRACE.config.classes.map((k, c) => (
            <span key={k.name} style={{ color: CLASS_COLORS[c], fontWeight: 800, marginRight: 18 }}>
              y={k.name}
            </span>
          ))}
        </Label>
        <Label x={1310} y={690} size={22} color={COLORS.muted} width={460}>
          <span style={{ color: ROLE.gen }}>- - -</span> generated, per label (this project's trained run)
        </Label>
        <Label x={1310} y={760} size={22} color={COLORS.muted} width={460} mono>
          goal reached: p_g(x | y) ≈ p_data(x | y)
        </Label>
      </div>
    </AbsoluteFill>
  );
};
