import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fadeOut, lerp, pop } from "../anim";
import { Backdrop } from "../components/Backdrop";
import { Papa } from "../components/Papa";
import { Cutting } from "../components/Plant";
import { Stage, Sticker } from "../components/Sticker";
import { Badge, Board, Scissors, Soil, Sparkle, Thought } from "../components/Things";
import { useLines } from "../timeline";

// L0 「從菜園剛剪下來的地瓜葉枝條，」 the man, scissors in his fist, by the
//    sweet potato patch; snip! one stem comes free.
// L1 「如果就這樣放著，很快就會軟掉、枯萎。」 he thinks: in his thought bubble the
//    cutting lies on a board and goes limp and yellow. ✗
export const Cut: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  const garden = pop(frame, fps, 4, 12) * fadeOut(frame, L[1] - 6, 12);
  const snipAt = L[0] + 46;
  const scissorsIn = pop(frame, fps, snipAt - 22, 11) * fadeOut(frame, snipAt + 14, 8);
  const open = frame < snipAt - 6 ? 55 : lerp(frame, [snipAt - 6, snipAt], [55, 0]);
  const lift = lerp(frame, [snipAt + 2, snipAt + 24], [0, 1]);
  const flash = frame >= snipAt - 2 && frame < snipAt + 8 ? fadeOut(frame, snipAt, 8) : 0;

  const bubble = pop(frame, fps, L[1] + 4, 12);
  const wilt = lerp(frame, [L[1] + 30, L[1] + 100], [0, 1]);
  const bad = pop(frame, fps, L[1] + 104, 10);
  const tw = (start: number, period = 40) => (frame < start ? 0 : Math.sin((((frame - start) % period) / period) * Math.PI));

  return (
    <AbsoluteFill>
      <Backdrop mood="green" to="dry" mix={lerp(frame, [L[1], L[1] + 60], [0, 0.8])} />
      <Stage>
        {/* the patch, with the stem that gets cut in the middle */}
        <g opacity={garden}>
          <Sticker x={690} y={1420} scale={garden}>
            <g transform="translate(-170 -20) rotate(-14) scale(0.8)">
              <Cutting sway={Math.sin(frame / 15) * 10} />
            </g>
            <g transform="translate(180 -16) rotate(12) scale(0.85)">
              <Cutting sway={Math.sin(frame / 17 + 1) * 10} />
            </g>
            <Soil />
          </Sticker>
          <Sticker x={690} y={1380 - lift * 260} scale={garden} rotate={lift * -8}>
            <Cutting sway={Math.sin(frame / 14 + 2) * 10} />
          </Sticker>
          {/* the stump left in the soil */}
          <path d="M686,1384 L686,1350" stroke="#3a2618" strokeWidth={13} strokeLinecap="round" />
          <path d="M686,1384 L686,1350" stroke="#8a5a72" strokeWidth={8} strokeLinecap="round" />
        </g>
        <Sticker x={700} y={1352} scale={1.1 * scissorsIn} rotate={-70}>
          <Scissors open={open} />
        </Sticker>
        {flash > 0 && <path d="M560,1390 L840,1310" stroke="#fff" strokeWidth={20} strokeLinecap="round" opacity={flash} />}
        {lift > 0.3 && frame < L[1] && (
          <>
            <Sparkle x={540} y={1000} t={tw(snipAt + 8, 36)} size={42} />
            <Sparkle x={860} y={1060} t={tw(snipAt + 18, 42)} size={34} />
          </>
        )}

        {/* the thought bubble: left on the table, it wilts */}
        <Sticker x={640} y={860} scale={1.2 * bubble} border={false}>
          <Thought tx={-330} ty={400}>
            <g transform="translate(0 60)">
              <Board />
              <g transform="translate(-140 -20) rotate(88) scale(0.72)">
                <Cutting wilt={wilt} />
              </g>
            </g>
          </Thought>
        </Sticker>
        <Sticker x={900} y={640} scale={bad}>
          <Badge good={false} />
        </Sticker>
      </Stage>
      <Papa
        poses={[[6, "fist"], [L[1], "chin"]]}
        x={frame < L[1] ? 250 : 230}
        y={1860}
        height={frame < L[1] ? 760 : 600}
        hops={[L[0], snipAt]}
        prop={
          frame < L[1] ? (
            <g transform="rotate(-20) scale(0.75)">
              <Scissors open={frame < snipAt - 22 ? 30 : 0} />
            </g>
          ) : undefined
        }
      />
    </AbsoluteFill>
  );
};
