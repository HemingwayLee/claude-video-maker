import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade, lerp } from "../anim";
import { Arrow, Layer, NetBlock, NoiseVector } from "../components/Diagram";
import { YTag } from "../components/Cond";
import { Face } from "../components/Face";
import { Label } from "../components/Text";
import { faceFromZ, gaussian } from "../data";
import { COLORS, ROLE } from "../theme";
import { useLines } from "../timeline";

const TRY_FRAMES = 16; // one new draw of the noise every this many frames
// Draw noise vectors until one happens to give glasses.
const TRIES: number[][] = [];
for (let k = 0; TRIES.length < 40; k++) {
  const z = gaussian(`try-${k}`, 8);
  TRIES.push(z);
}
const FIRST_HIT = Math.max(5, TRIES.findIndex((z, i) => i >= 5 && faceFromZ(z).glasses > 0.6));
const ROW = 450;

export const Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();

  // Line 1: keep drawing noise until glasses appear.
  const attempt = Math.min(FIRST_HIT, Math.max(0, Math.floor((frame - L[1] - 10) / TRY_FRAMES)));
  const trying = frame >= L[1];
  const z = trying ? TRIES[attempt] : gaussian("problem-z", 8);
  const face = faceFromZ(z);
  const hit = trying && attempt === FIRST_HIT;
  const socket = fade(frame, L[2]);

  return (
    <AbsoluteFill>
      <NoiseVector values={z} x={260} y={ROW - 130} cell={30} opacity={fade(frame, L[0])} />
      <NetBlock x={420} y={ROW} w={280} h={220} shape="grow" color={ROLE.gen} label="G" sub="generator" opacity={fade(frame, L[0])} />
      <Layer opacity={fade(frame, L[0])}>
        <Arrow id="p1" d={`M 340 ${ROW} L 405 ${ROW}`} progress={lerp(frame, [L[0] + 5, L[0] + 20], [0, 1])} />
        <Arrow id="p2" d={`M 715 ${ROW} L 800 ${ROW}`} progress={lerp(frame, [L[0] + 15, L[0] + 30], [0, 1])} />
      </Layer>
      <div style={{ position: "absolute", left: 820, top: ROW - 110, opacity: fade(frame, L[0] + 20) }}>
        <Face p={face} size={220} border={hit ? COLORS.green : trying ? COLORS.red : ROLE.gen} />
      </div>

      {/* what we want */}
      <div style={{ position: "absolute", left: 1150, top: 260, opacity: fade(frame, L[1]) }}>
        <div style={{ fontSize: 28, color: COLORS.muted }}>we want:</div>
        <div style={{ position: "relative", height: 60 }}>
          <YTag x={0} y={8} text="glasses" />
        </div>
        <div style={{ fontSize: 30, marginTop: 40 }}>
          attempt <span style={{ fontFamily: "Menlo, monospace", color: COLORS.yellow, fontWeight: 700 }}>{attempt + 1}</span>
        </div>
        <div style={{ fontSize: 44, fontWeight: 800, color: hit ? COLORS.green : COLORS.red, marginTop: 6 }}>{hit ? "✓ glasses, finally" : "✗ no glasses"}</div>
        <div style={{ fontSize: 24, color: COLORS.muted, marginTop: 14, width: 560 }}>draw new noise and hope…</div>
      </div>

      {/* G has no input for the request */}
      <div style={{ position: "absolute", left: 490, top: ROW - 240, opacity: socket, textAlign: "center", width: 140 }}>
        <div style={{ width: 60, height: 60, margin: "0 auto", borderRadius: 30, border: `4px dashed ${COLORS.muted}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, color: COLORS.red, fontWeight: 800 }}>✗</div>
        <div style={{ fontSize: 22, color: COLORS.muted, marginTop: 8 }}>no input for “glasses”</div>
      </div>
      <Label x={560} y={ROW + 150} size={28} weight={700} color={COLORS.text} center opacity={socket}>
        the noise z decides <span style={{ color: COLORS.red }}>everything</span>
      </Label>
    </AbsoluteFill>
  );
};
