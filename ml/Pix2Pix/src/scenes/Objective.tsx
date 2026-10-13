import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade } from "../anim";
import { Card, Label } from "../components/Text";
import { COLORS, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

// G* = arg min_G max_D L_cGAN(G, D) + λ L_L1(G), term by term; then: no z.
const Term: React.FC<{ color: string; on: boolean; children: React.ReactNode }> = ({ color, on, children }) => (
  <span
    style={{
      color,
      padding: "4px 10px",
      borderRadius: 10,
      background: on ? `${color}22` : "transparent",
      boxShadow: on ? `0 0 0 3px ${color}` : "none",
    }}
  >
    {children}
  </span>
);

export const Objective: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();
  const on = (k: number) => frame >= L[k] && frame < L[k + 1];
  return (
    <AbsoluteFill>
      <Label x={960} y={190} size={58} mono center opacity={fade(frame, L[0])}>
        G* = arg min<sub style={{ fontSize: 30 }}>G</sub> max<sub style={{ fontSize: 30 }}>D</sub>{" "}
        <Term color={ROLE.disc} on={on(1)}>
          L<sub style={{ fontSize: 30 }}>cGAN</sub>(G, D)
        </Term>{" "}
        +{" "}
        <Term color={COLORS.yellow} on={on(3)}>
          λ
        </Term>{" "}
        <Term color={ROLE.l1} on={on(2)}>
          L<sub style={{ fontSize: 30 }}>L1</sub>(G)
        </Term>
      </Label>

      <Card x={170} y={340} w={1580} h={170} accent={on(1) ? ROLE.disc : undefined} opacity={fade(frame, L[1])}>
        <Label x={40} y={22} size={26} weight={800} color={ROLE.disc}>
          the cGAN term: realism
        </Label>
        <Label x={790} y={78} size={38} mono center>
          E<sub style={{ fontSize: 20 }}>x,y</sub>[ log D(<span style={{ color: ROLE.input }}>x</span>, <span style={{ color: ROLE.real }}>y</span>) ] + E<sub style={{ fontSize: 20 }}>x</sub>[ log(1 − D(<span style={{ color: ROLE.input }}>x</span>, <span style={{ color: ROLE.gen }}>G(x)</span>)) ]
        </Label>
      </Card>
      <Label x={560} y={525} size={24} center color={ROLE.real} opacity={fade(frame, L[1] + 40)}>
        ↑ D: high on real pairs
      </Label>
      <Label x={1290} y={525} size={24} center color={ROLE.gen} opacity={fade(frame, L[1] + 70)}>
        ↑ D: low on fake pairs · G: wants it high
      </Label>

      <Card x={170} y={590} w={1000} h={170} accent={on(2) ? ROLE.l1 : undefined} opacity={fade(frame, L[2])}>
        <Label x={40} y={22} size={26} weight={800} color={ROLE.l1}>
          the L1 term: faithfulness
        </Label>
        <Label x={500} y={78} size={38} mono center>
          E<sub style={{ fontSize: 20 }}>x,y</sub>[ || <span style={{ color: ROLE.real }}>y</span> − <span style={{ color: ROLE.gen }}>G(x)</span> ||<sub style={{ fontSize: 20 }}>1</sub> ]
        </Label>
      </Card>
      <Card x={1230} y={590} w={520} h={170} accent={on(3) ? COLORS.yellow : undefined} opacity={fade(frame, L[3])}>
        <Label x={260} y={30} size={64} mono weight={800} center color={COLORS.yellow}>
          λ = 100
        </Label>
        <Label x={260} y={115} size={22} center color={COLORS.muted}>
          weighs L1 against the GAN term
        </Label>
      </Card>

      {/* no noise z */}
      <AbsoluteFill style={{ opacity: fade(frame, L[4]) }}>
        <Label x={500} y={790} size={44} mono center>
          G(x, <span style={{ color: ROLE.noise, textDecoration: "line-through", textDecorationThickness: 4 }}>z</span>)
        </Label>
        <Label x={800} y={795} size={40} center color={COLORS.muted}>
          →
        </Label>
        <Label x={1180} y={790} size={44} mono center>
          G(x) <span style={{ color: ROLE.noise }}>+ dropout</span>
        </Label>
        <Label x={960} y={862} size={24} center color={COLORS.muted} opacity={fade(frame, L[4] + 60)}>
          (G learned to ignore z; dropout, kept on at test time, adds a little randomness)
        </Label>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
