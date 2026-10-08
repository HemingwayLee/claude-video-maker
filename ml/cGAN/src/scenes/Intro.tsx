import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, lerp, pop } from "../anim";
import { YTag } from "../components/Cond";
import { Face } from "../components/Face";
import { FACE_Z, faceFromZ, faceFromZY } from "../data";
import { COLORS, ROLE } from "../theme";
import { useLines } from "../timeline";

const SIZE = 150;
const GAP = 22;

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  // Line 0: random faces. Line 1: the same faces, now asked for glasses.
  const asked = lerp(frame, [L[1] + 20, L[1] + 45], [0, 1]);
  const title = pop(frame, fps, L[1], 16);
  const credit = fade(frame, L[2]);

  return (
    <AbsoluteFill>
      {FACE_Z.map((z, i) => {
        const r = Math.floor(i / 4);
        const c = i % 4;
        const free = faceFromZ(z);
        const wanted = faceFromZY(z, 2);
        const p = { ...free, glasses: free.glasses + (wanted.glasses - free.glasses) * asked };
        return (
          <div key={i} style={{ position: "absolute", left: 120 + c * (SIZE + GAP), top: 250 + r * (SIZE + GAP), opacity: fade(frame, L[0] + i * 2, 10) }}>
            <Face p={p} size={SIZE} border={asked > 0.5 ? ROLE.label : undefined} />
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 120, top: 185, width: 4 * SIZE + 3 * GAP, textAlign: "center", fontSize: 30, fontWeight: 700, color: COLORS.muted, opacity: fade(frame, L[0] + 20) * (1 - asked) }}>
        GAN: you get whatever comes out
      </div>
      <YTag x={120 + (4 * SIZE + 3 * GAP) / 2} y={175} text="glasses" opacity={asked} style={{ transform: "translateX(-50%)" }} />

      <div style={{ position: "absolute", left: 920, top: 270, opacity: title, transform: `translateY(${(1 - title) * 40}px)` }}>
        <div style={{ fontSize: 32, fontWeight: 600, color: ROLE.label, letterSpacing: 6 }}>ASK FOR WHAT YOU WANT</div>
        <div style={{ fontSize: 100, fontWeight: 800, color: COLORS.text, lineHeight: 1.04, marginTop: 16 }}>
          Conditional
          <br />
          GANs
        </div>
        <div style={{ fontSize: 44, fontWeight: 600, color: COLORS.muted, marginTop: 18 }}>
          a.k.a. <span style={{ color: COLORS.yellow }}>cGAN</span>
        </div>
      </div>
      <div style={{ position: "absolute", left: 920, top: 690, fontSize: 30, color: COLORS.muted, opacity: credit }}>
        Mirza &amp; Osindero, <span style={{ color: COLORS.text }}>“Conditional Generative Adversarial Nets”</span>, 2014
      </div>
    </AbsoluteFill>
  );
};
