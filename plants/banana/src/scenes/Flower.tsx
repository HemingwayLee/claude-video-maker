import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, fadeOut, lerp, pop } from "../anim";
import { BananaPlant } from "../components/BananaPlant";
import { Callout, FocusLines, Sfx, Sparkle } from "../components/Manga";
import { moveCam, toScreen, World } from "../components/World";
import { budCenter, budTop, RACHIS_X } from "../plant";
import { COLORS, ROLE } from "../theme";
import { useLines } from "../timeline";

// Close-up (特寫) of the banana flower: bracts lift and show the small flowers.
export const Flower: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();
  const close = { x: RACHIS_X, y: budCenter(0) - 10, z: 3.4 };
  const cam = moveCam(frame, [
    [0, { x: 620, y: 1010, z: 1.25 }],
    [8, { x: 620, y: 1010, z: 1.25 }],
    [26, close],
    [L[2], close],
    [L[3] + 10, { ...close, y: close.y - 30, z: 3.6 }],
  ]);
  // Bracts lift during lines 2 and 3.
  const open = lerp(frame, [L[2] + 4, L[2] + 34], [0, 1]) + lerp(frame, [L[3] - 6, L[3] + 26], [0, 1]);
  const zoomBurst = fade(frame, 6, 6) * fadeOut(frame, 34, 14);

  // Screen points (in the close-up), measured on the bud drawing.
  const top = budTop(0);
  const bractSide = toScreen(cam, RACHIS_X + 50, top + 150);
  const florets = toScreen(cam, RACHIS_X - 34, top + 50);
  const center = toScreen(cam, RACHIS_X, budCenter(0));
  return (
    <AbsoluteFill>
      <World
        cam={cam}
        frame={frame}
        overlay={
          <>
            <FocusLines frame={frame} cx={center[0]} cy={center[1]} opacity={zoomBurst + 0.35 * fade(frame, 40, 20)} />
            <Sfx text="特寫！" x={790} y={360} size={130} color={COLORS.pink} rot={-10} scale={pop(frame, fps, 14, 9)} opacity={fadeOut(frame, L[1] + 10, 10)} />
            <Callout tx={bractSide[0]} ty={bractSide[1]} lx={820} ly={bractSide[1] + 200} text="苞片" sub="紫紅色・一片一片" color={ROLE.flower} progress={lerp(frame, [L[1] + 6, L[1] + 24], [0, 1])} size={60} />
            <Callout tx={florets[0]} ty={florets[1]} lx={300} ly={300} text="小花" sub="細細長長，像手指" color={COLORS.orange} progress={lerp(frame, [L[3] + 22, L[3] + 40], [0, 1])} size={60} />
            <svg width={1080} height={1920} style={{ position: "absolute", opacity: fade(frame, L[3] + 30, 10) }}>
              {[
                [-260, -280, 34],
                [250, -340, 28],
                [300, -120, 22],
              ].map(([dx, dy, s], i) => (
                <Sparkle key={i} x={center[0] + dx} y={center[1] + dy} size={s * (0.7 + 0.3 * Math.sin(frame / 4 + i))} color={COLORS.yellow} rot={frame * 3} />
              ))}
            </svg>
          </>
        }
      >
        <BananaPlant frame={frame} open={open} />
      </World>
      {/* soft vignette to pull the eye to the flower */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at 50% 47%, rgba(0,0,0,0) 45%, rgba(40,10,30,0.35) 100%)",
          opacity: fade(frame, 20, 15),
        }}
      />
    </AbsoluteFill>
  );
};
