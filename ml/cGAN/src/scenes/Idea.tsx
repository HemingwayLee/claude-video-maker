import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, lerp, pop } from "../anim";
import { Arrow, Layer, NetBlock } from "../components/Diagram";
import { YTag } from "../components/Cond";
import { Card } from "../components/Text";
import { COLORS, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

const KINDS = ["glasses", "the digit 7", "“cat”", "a sentence", "a whole image"];
const ROW = 400;

const Note: React.FC<{ value: string; color: string }> = ({ value, color }) => (
  <svg width={300} height={150} viewBox="0 0 300 150">
    <rect x={3} y={3} width={294} height={144} rx={10} fill={color} stroke="#1d4d38" strokeWidth={4} />
    <rect x={14} y={14} width={272} height={122} rx={6} fill="none" stroke="#1d4d38" strokeWidth={2} strokeDasharray="5 4" />
    <ellipse cx={150} cy={75} rx={40} ry={48} fill="#a6dcc0" stroke="#1d4d38" strokeWidth={3} />
    <text x={30} y={50} fontSize={34} fontWeight={800} fill="#1d4d38" fontFamily={MONO}>
      {value}
    </text>
    <text x={270} y={130} fontSize={34} fontWeight={800} fill="#1d4d38" fontFamily={MONO} textAnchor="end">
      {value}
    </text>
  </svg>
);

export const Idea: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  const yIn = lerp(frame, [L[0] + 20, L[0] + 50], [0, 1]);
  const analogy = fade(frame, L[2]);

  return (
    <AbsoluteFill>
      {/* both networks get y */}
      <NetBlock x={260} y={ROW} w={260} h={200} shape="grow" color={ROLE.gen} label="G" sub="generator" opacity={fade(frame, L[0])} />
      <NetBlock x={1300} y={ROW} w={260} h={200} shape="shrink" color={ROLE.disc} label="D" sub="discriminator" opacity={fade(frame, L[0])} />
      <YTag x={810} y={185} text="the condition" opacity={yIn} size={32} />
      <Layer opacity={yIn}>
        <Arrow id="i1" d={`M 820 230 C 600 240, 420 260, 400 ${ROW - 105}`} color={ROLE.label} width={5} progress={yIn} />
        <Arrow id="i2" d={`M 1060 230 C 1260 240, 1420 260, 1430 ${ROW - 100}`} color={ROLE.label} width={5} progress={yIn} />
      </Layer>
      <div style={{ position: "absolute", left: 140, top: ROW + 140, fontSize: 28, fontWeight: 700, opacity: yIn }}>
        <span style={{ color: ROLE.gen }}>G(z | y)</span>: make something of kind <i style={{ color: ROLE.label }}>y</i>
      </div>
      <div style={{ position: "absolute", left: 1180, top: ROW + 140, fontSize: 28, fontWeight: 700, opacity: yIn }}>
        <span style={{ color: ROLE.disc }}>D(x | y)</span>: a real example of <i style={{ color: ROLE.label }}>y</i>?
      </div>

      {/* what y can be */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 640, display: "flex", justifyContent: "center", gap: 18, opacity: frame < L[2] ? 1 : 0 }}>
        {KINDS.map((k, i) => {
          const p = pop(frame, fps, L[1] + i * 10, 14);
          return (
            <div key={k} style={{ position: "relative", width: 250, height: 60, opacity: Math.min(1, p), transform: `scale(${p})` }}>
              <YTag x={0} y={0} text={k} size={26} />
            </div>
          );
        })}
      </div>

      {/* the forger, with an order */}
      <div style={{ opacity: analogy }}>
        <Card x={300} y={600} w={1320} h={250} />
        <div style={{ position: "absolute", left: 340, top: 625, fontSize: 30, fontWeight: 800, color: ROLE.gen }}>Forger</div>
        <div style={{ position: "absolute", left: 340, top: 670, fontSize: 24, color: COLORS.muted, width: 300 }}>gets an order: make a</div>
        <div style={{ position: "absolute", left: 340, top: 715 }}>
          <div style={{ position: "relative", height: 60 }}>
            <YTag x={0} y={0} text="$20 note" />
          </div>
        </div>
        <div style={{ position: "absolute", left: 800, top: 650 }}>
          <Note value="20" color="#6fbf96" />
        </div>
        <div style={{ position: "absolute", left: 1160, top: 625, fontSize: 30, fontWeight: 800, color: ROLE.disc }}>Detective</div>
        <div style={{ position: "absolute", left: 1160, top: 670, fontSize: 26, color: COLORS.text, width: 430 }}>
          checks: does this look like a <b>real $20</b>?
        </div>
        <div style={{ position: "absolute", left: 1160, top: 760, fontSize: 22, color: COLORS.muted, width: 430 }}>A perfect $10 is still a failed $20.</div>
      </div>
    </AbsoluteFill>
  );
};
