import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, fadeOut, lerp, pop } from "../anim";
import { Backdrop } from "../components/Backdrop";
import { Label } from "../components/Label";
import { Papa } from "../components/Papa";
import { Stage, Sticker } from "../components/Sticker";
import { ACHENES, Strawberry } from "../components/Strawberry";
import { Magnifier, Sparkle } from "../components/Things";
import { MOODS } from "../theme";
import { useLines } from "../timeline";

// The big strawberry in the middle of the screen.
const BX = 540;
const BY = 760;
const BS = 2.6;

// The achene the label points at: the one closest to the upper right.
export const POINTED = ACHENES.reduce(
  (best, [x, y], i) => (Math.hypot(x - 75, y + 40) < Math.hypot(ACHENES[best][0] - 75, ACHENES[best][1] + 40) ? i : best),
  0,
);

// 「仔細看，草莓表面有一粒一粒的小顆粒。」 a magnifying glass glides over the
// strawberry and shows its bumps up close.
// 「很多人以為，這就是草莓的種子。」 the bumps light up; he squats and thinks.
// 「其實，這些小顆粒的學名，叫做「瘦果」。」 one bump gets a ring and the word
// 瘦果 (the only text in the scene); he points at you.
export const Achene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  const berry = (zoom = 1) => (
    <g transform={`translate(${BX} ${BY}) scale(${BS * zoom})`}>
      <Strawberry glow={glow} />
    </g>
  );

  // magnifier path over the berry during line 0
  const mIn = pop(frame, fps, L[0] + 6, 12);
  const mOut = fadeOut(frame, L[1] - 6, 14);
  const t0 = L[0] + 20;
  const t1 = L[1] - 10;
  const mx = lerp(frame, [t0, (t0 + t1) / 2, t1], [400, 690, 540]);
  const my = lerp(frame, [t0, (t0 + t1) / 2, t1], [860, 760, 1000]);
  const R = 170;
  const ZOOM = 2.2;
  const lensX = mx + (1 - mIn) * 700;

  // the bumps light up from line 1
  const glow = fade(frame, L[1] + 4, 20) * (0.75 + 0.25 * Math.sin(frame / 5)) * fadeOut(frame, L[2] + 10, 20);

  // the ring and the label for 瘦果
  const ring = pop(frame, fps, L[2] + 10, 10);
  const [ax, ay] = ACHENES[POINTED];
  const px = BX + ax * BS;
  const py = BY + ay * BS;
  const tw = (start: number, period = 40) => {
    const t = ((frame - start) % period) / period;
    return frame < start ? 0 : Math.sin(t * Math.PI);
  };

  return (
    <AbsoluteFill>
      <Backdrop mood="pink" />
      <Stage>
        <g filter="url(#sticker)">{berry()}</g>

        {/* the magnifier: the same strawberry, bigger, clipped to the lens */}
        {mIn > 0.01 && mOut > 0.01 && (
          <g opacity={mOut}>
            <defs>
              <clipPath id="lens">
                <circle cx={lensX} cy={my} r={R} />
              </clipPath>
            </defs>
            <g clipPath="url(#lens)">
              <circle cx={lensX} cy={my} r={R} fill={MOODS.pink[1]} />
              <g transform={`translate(${lensX} ${my}) scale(${ZOOM}) translate(${-lensX} ${-my})`}>{berry()}</g>
              <circle cx={lensX} cy={my} r={R} fill="#dff3ff" opacity={0.15} />
            </g>
            <g filter="url(#soft)" transform={`translate(${lensX} ${my})`}>
              <Magnifier r={R} />
            </g>
          </g>
        )}

        {/* 瘦果: a ring around one bump and a dotted line up to the word */}
        {ring > 0.01 && (
          <g>
            <path
              d={`M${px},${py - 34} Q${px + 120},${py - 200} ${760},${300}`}
              fill="none"
              stroke="#fff"
              strokeWidth={8}
              strokeDasharray="4 18"
              strokeLinecap="round"
              opacity={fade(frame, L[2] + 16, 12)}
            />
            <circle cx={px} cy={py} r={34 * ring} fill="#fff6a0" opacity={0.35} />
            <circle cx={px} cy={py} r={34 * ring} fill="none" stroke="#fff" strokeWidth={8} />
            <circle cx={px} cy={py} r={34 * ring} fill="none" stroke="#ff9d2e" strokeWidth={4} />
          </g>
        )}
        <Sparkle x={240} y={560} t={tw(L[1] + 6)} size={40} />
        <Sparkle x={880} y={980} t={tw(L[1] + 20, 46)} size={34} />
        <Sparkle x={820} y={520} t={tw(L[1] + 34, 50)} size={30} />
      </Stage>
      <Label x={790} y={250} at={L[2] + 24} size={130} rotate={-4}>
        瘦果
      </Label>
      <Papa
        poses={[[4, "point"], [L[1], "chin"], [L[2] + 6, "thumbs"]]}
        x={190}
        y={1890}
        height={680}
        hops={[L[0], L[2]]}
      />
    </AbsoluteFill>
  );
};
