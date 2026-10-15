import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, fadeOut, lerp, linear, pop } from "../anim";
import { BananaPlant } from "../components/BananaPlant";
import { Farmer, HAND, KNIFE_LEN } from "../components/Farmer";
import { Callout, Sfx, Sparkle } from "../components/Manga";
import { moveCam, toScreen, World } from "../components/World";
import { CUT_Y, GROUND_Y, LAST_HAND_Y, RACHIS_X } from "../plant";
import { COLORS, INK, ROLE } from "../theme";
import { useLines } from "../timeline";

const FARMER_X = 900;
const FALL_FRAMES = 22;

// The farmer cuts the stalk just below the last hand with the banana knife;
// the empty hands, finger flowers and the banana flower fall off together.
export const Cut: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();
  const cam = moveCam(frame, [
    [0, { x: 640, y: 1080, z: 1.2 }],
    [24, { x: 730, y: 1180, z: 1.02 }],
    [L[1], { x: 730, y: 1180, z: 1.02 }],
    [L[1] + 20, { x: 700, y: 1120, z: 1.3 }],
    [L[2] + 6, { x: 700, y: 1120, z: 1.3 }],
    [L[2] + 30, { x: 600, y: 1190, z: 0.98 }],
  ]);

  // The swing: wind up during line 1, strike early in line 2.
  const strike = L[2] + 14;
  const knifeAngle =
    frame < strike
      ? lerp(frame, [L[1] + 10, L[1] + 30], [12, 22])
      : linear(frame, [strike, strike + 6], [22, -42]) + lerp(frame, [strike + 20, strike + 40], [0, 50]);
  const cutFrame = strike + 4; // when the blade passes the stalk
  const isCut = frame >= cutFrame;
  const fall = linear(frame, [cutFrame, cutFrame + FALL_FRAMES], [0, 1]);
  const landed = cutFrame + FALL_FRAMES;

  const farmerX = FARMER_X + lerp(frame, [6, 26], [380, 0]);
  const a = (knifeAngle * Math.PI) / 180;
  const handW: [number, number] = [farmerX + HAND[0], GROUND_Y + HAND[1]];
  const bladeW: [number, number] = [handW[0] + Math.sin(a) * (KNIFE_LEN + 40) - Math.cos(a) * 60, handW[1] - Math.cos(a) * (KNIFE_LEN + 40) - Math.sin(a) * 60];
  const blade = toScreen(cam, ...bladeW);
  const cut = toScreen(cam, RACHIS_X, CUT_Y);
  const lastHand = toScreen(cam, RACHIS_X - 70, LAST_HAND_Y - 10);
  const landing = toScreen(cam, RACHIS_X - 100, GROUND_Y - 10);

  const slash = frame >= cutFrame - 1 ? fade(frame, cutFrame - 1, 2) * fadeOut(frame, cutFrame + 6, 8) : 0;
  const cutLine = frame >= L[1] && !isCut ? 0.6 + 0.4 * Math.sin(frame / 3) : 0;

  return (
    <AbsoluteFill>
      <World
        cam={cam}
        frame={frame}
        overlay={
          <>
            <svg width={1080} height={1920} style={{ position: "absolute" }}>
              {/* where to cut: a blinking dashed line just under the last hand */}
              {cutLine > 0 && (
                <g opacity={cutLine * fade(frame, L[1] + 6, 8)}>
                  <line x1={cut[0] - 130} y1={cut[1]} x2={cut[0] + 130} y2={cut[1]} stroke="#fff" strokeWidth={14} strokeLinecap="round" />
                  <line x1={cut[0] - 130} y1={cut[1]} x2={cut[0] + 130} y2={cut[1]} stroke={ROLE.knife} strokeWidth={8} strokeDasharray="20 14" strokeLinecap="round" />
                </g>
              )}
              {/* slash */}
              {slash > 0 && (
                <g opacity={slash}>
                  <path d={`M ${cut[0] + 230} ${cut[1] - 120} Q ${cut[0]} ${cut[1] + 30} ${cut[0] - 260} ${cut[1] + 10}`} stroke={INK} strokeWidth={34} fill="none" strokeLinecap="round" />
                  <path d={`M ${cut[0] + 230} ${cut[1] - 120} Q ${cut[0]} ${cut[1] + 30} ${cut[0] - 260} ${cut[1] + 10}`} stroke="#fff" strokeWidth={22} fill="none" strokeLinecap="round" />
                  {[-1, 1].map((k) => (
                    <line key={k} x1={cut[0] - 40} y1={cut[1] + k * 50} x2={cut[0] + 120} y2={cut[1] + k * 90} stroke={COLORS.yellow} strokeWidth={8} strokeLinecap="round" />
                  ))}
                </g>
              )}
              {/* dust when the piece hits the ground */}
              {frame >= landed &&
                [-1, -0.3, 0.4, 1].map((k, i) => {
                  const t = linear(frame, [landed, landed + 16], [0, 1]);
                  return <circle key={i} cx={landing[0] + k * (90 + 120 * t)} cy={landing[1] - 20 * t - (i % 2) * 20} r={20 + 26 * t} fill="#e8d9b5" stroke={INK} strokeWidth={4} opacity={1 - t} />;
                })}
              {/* done: sparkles around the bunch */}
              {frame > landed + 18 &&
                [
                  [-170, -260, 30],
                  [150, -330, 24],
                  [190, -120, 20],
                ].map(([dx, dy, s], i) => (
                  <Sparkle key={i} x={cut[0] + dx} y={cut[1] + dy} size={s * pop(frame, fps, landed + 18 + i * 4) * (0.7 + 0.3 * Math.sin(frame / 4 + i))} color={COLORS.yellow} rot={frame * 3} />
                ))}
            </svg>
            <Callout tx={blade[0]} ty={blade[1]} lx={820} ly={330} text="香蕉刀" color={ROLE.knife} progress={lerp(frame, [L[0] + 26, L[0] + 44], [0, 1]) * fadeOut(frame, L[1] - 2, 8)} size={58} />
            {isCut && <Sfx text="咔嚓！" x={cut[0] + 200} y={cut[1] - 240} size={140} color={COLORS.yellow} rot={-12} scale={pop(frame, fps, cutFrame, 8)} opacity={fadeOut(frame, cutFrame + 34, 10)} />}
            {frame >= landed && <Sfx text="咚！" x={landing[0] - 40} y={landing[1] - 170} size={100} color={COLORS.orange} rot={8} scale={pop(frame, fps, landed, 8)} opacity={fadeOut(frame, landed + 30, 10)} />}
          </>
        }
      >
        <BananaPlant frame={frame} g={1} cut={isCut} fall={fall} />
        <g transform={`translate(${farmerX} ${GROUND_Y})`}>
          <Farmer
            frame={frame}
            pose="hold"
            knifeAngle={knifeAngle}
            talking={frame >= L[0] && frame < L[0] + 70}
            face={frame >= L[1] && frame < landed + 20 ? "determined" : "happy"}
            knifeGlow={lerp(frame, [L[0] + 20, L[0] + 30], [0, 0.9]) * fadeOut(frame, L[1] - 2, 8)}
          />
        </g>
      </World>
    </AbsoluteFill>
  );
};
