import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, lerp, pop } from "../anim";
import { Face } from "../components/Face";
import { FACE_Z, faceFromZ } from "../data";
import { COLORS, ROLE } from "../theme";
import { useLines } from "../timeline";

const SIZE = 150;
const GAP = 22;

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  const title = pop(frame, fps, L[1], 16);
  const vs = pop(frame, fps, L[2] + 6, 12);

  return (
    <AbsoluteFill>
      {/* faces condensing out of noise */}
      {FACE_Z.map((z, i) => {
        const r = Math.floor(i / 4);
        const c = i % 4;
        const start = L[0] + 8 + ((i * 7) % 12) * 5;
        const quality = lerp(frame, [start, start + 55], [0, 1]);
        return (
          <div key={i} style={{ position: "absolute", left: 120 + c * (SIZE + GAP), top: 220 + r * (SIZE + GAP), opacity: fade(frame, L[0] + i * 2, 10) }}>
            <Face p={faceFromZ(z)} size={SIZE} quality={quality} noiseSeed={`intro-${i}`} />
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 120, top: 740, width: 4 * SIZE + 3 * GAP, textAlign: "center", fontSize: 24, color: COLORS.muted, opacity: fade(frame, L[0] + 70) }}>
        none of these people exist
      </div>

      {/* the title */}
      <div style={{ position: "absolute", left: 920, top: 250, opacity: title, transform: `translateY(${(1 - title) * 40}px)` }}>
        <div style={{ fontSize: 32, fontWeight: 600, color: ROLE.gen, letterSpacing: 6 }}>HOW COMPUTERS LEARN TO CREATE</div>
        <div style={{ fontSize: 96, fontWeight: 800, color: COLORS.text, lineHeight: 1.04, marginTop: 16 }}>
          Generative
          <br />
          Adversarial
          <br />
          Networks
        </div>
        <div style={{ fontSize: 44, fontWeight: 600, color: COLORS.muted, marginTop: 18 }}>
          a.k.a. <span style={{ color: COLORS.yellow }}>GAN</span>
        </div>
      </div>

      {/* the two players */}
      <div style={{ position: "absolute", left: 920, top: 720, display: "flex", alignItems: "center", gap: 26 }}>
        {[
          { text: "Generator", color: ROLE.gen, at: L[2] },
          { text: "vs", color: COLORS.muted, at: L[2] + 6 },
          { text: "Discriminator", color: ROLE.disc, at: L[2] + 12 },
        ].map((chip) => {
          const p = chip.text === "vs" ? vs : pop(frame, fps, chip.at);
          return (
            <div
              key={chip.text}
              style={{
                padding: chip.text === "vs" ? 0 : "12px 28px",
                borderRadius: 40,
                border: chip.text === "vs" ? undefined : `3px solid ${chip.color}`,
                color: chip.color,
                fontSize: chip.text === "vs" ? 36 : 34,
                fontWeight: 800,
                opacity: Math.min(1, p),
                transform: `scale(${p})`,
              }}
            >
              {chip.text}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
