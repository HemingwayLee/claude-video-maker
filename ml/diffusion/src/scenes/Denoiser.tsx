import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade, fadeOut, lerp } from "../anim";
import { Arrow, Layer, NetBlock } from "../components/Diagram";
import { PixelImage } from "../components/PixelImage";
import { Label } from "../components/Text";
import { ALPHA_BAR, decode, imageFrames } from "../data";
import { COLORS, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

// x_t and t go in, the predicted noise ε̂ comes out; removing a little of it
// is one step back; ε̂ also gives a guess of the clean image, x̂_0.
const SEED = 0;
const FR = imageFrames(SEED);
const at = (t: number) => FR.find((f) => f.t === t)!;
const toFloat = (b: Uint8Array) => Float32Array.from(b, (v) => (v / 255) * 2 - 1);
const XT = toFloat(decode(at(600).xt));
const X0 = toFloat(decode(at(600).x0));
const ab = ALPHA_BAR[600]; // the sampler recorded frame t with ᾱ = ALPHA_BAR[t]
const EPS = XT.map((v, i) => (v - Math.sqrt(ab) * X0[i]) / Math.sqrt(1 - ab));
const NEXT = toFloat(decode(at(550).xt));
const ROW = [900, 700, 500, 300, 100, 0];

const Chip: React.FC<{ x: number; y: number; text: string; color: string; opacity?: number }> = ({ x, y, text, color, opacity = 1 }) => (
  <div style={{ position: "absolute", left: x, top: y, padding: "8px 18px", borderRadius: 12, border: `3px solid ${color}`, color, fontFamily: MONO, fontWeight: 800, fontSize: 30, opacity }}>{text}</div>
);

export const Denoiser: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();
  const top = fadeOut(frame, L[3] - 5, 12);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: top }}>
        <PixelImage im={{ data: XT, float: true }} x={130} y={280} size={260} border={ROLE.noise} label="noisy image xₜ" labelColor={ROLE.noise} opacity={fade(frame, L[0])} />
        <Chip x={175} y={590} text="t = 600" color={ROLE.time} opacity={fade(frame, L[0] + 20)} />
        <Layer opacity={fade(frame, L[0] + 10)}>
          <Arrow id="dn1" d="M 410 410 L 520 410" />
          <Arrow id="dn2" d="M 340 610 C 450 610, 480 500, 540 470" color={ROLE.time} />
          <Arrow id="dn3" d="M 840 410 L 940 410" progress={lerp(frame, [L[1], L[1] + 20], [0, 1])} />
        </Layer>
        <NetBlock x={540} y={410} w={290} h={260} shape="shrink" color={ROLE.net} label="ε_θ" sub="neural network" opacity={fade(frame, L[0] + 10)} />
        <PixelImage im={{ data: EPS, float: true }} x={960} y={280} size={260} border={ROLE.net} label="predicted noise ε̂" labelColor={ROLE.net} opacity={fade(frame, L[1] + 10)} />
        <Label x={1090} y={570} size={24} center color={COLORS.muted} opacity={fade(frame, L[1] + 30)}>
          not the clean image: the noise
        </Label>
        {/* one step back */}
        <AbsoluteFill style={{ opacity: fade(frame, L[2]) }}>
          <Layer>
            <Arrow id="dn4" d="M 1240 410 L 1430 410" color={ROLE.data} />
          </Layer>
          <Label x={1335} y={350} size={22} mono center color={ROLE.data}>
            xₜ − a little of ε̂
          </Label>
          <PixelImage im={{ data: NEXT, float: true }} x={1450} y={280} size={260} border={ROLE.data} label="a little cleaner" labelColor={ROLE.data} />
          <Label x={960} y={690} size={30} mono center>
            x<sub>t−1</sub> = <span style={{ color: COLORS.muted }}>1/√α<sub>t</sub></span> · ( x<sub>t</sub> − <span style={{ color: COLORS.muted }}>β<sub>t</sub>/√(1−ᾱ<sub>t</sub>)</span> · <span style={{ color: ROLE.net }}>ε̂</span> ) + <span style={{ color: ROLE.noise }}>σ<sub>t</sub> z</span>
          </Label>
          <Label x={960} y={750} size={22} center color={COLORS.muted}>
            (z: a little fresh noise, except at the very last step)
          </Label>
        </AbsoluteFill>
      </AbsoluteFill>

      {/* the network's guess of the clean image */}
      <AbsoluteFill style={{ opacity: fade(frame, L[3]) }}>
        <Label x={960} y={150} size={34} mono center>
          x̂<sub>0</sub> = ( x<sub>t</sub> − √(1−ᾱ<sub>t</sub>) · <span style={{ color: ROLE.net }}>ε̂</span> ) / √ᾱ<sub>t</sub>
        </Label>
        {ROW.map((t, i) => (
          <React.Fragment key={t}>
            <PixelImage im={{ data: decode(at(t).xt) }} x={190 + i * 260} y={300} size={200} border={ROLE.noise} label={`t = ${t}`} labelColor={ROLE.time} opacity={fade(frame, L[3] + 10 + i * 12)} />
            <PixelImage im={{ data: decode(at(t).x0) }} x={190 + i * 260} y={570} size={200} border={ROLE.net} opacity={fade(frame, L[3] + 20 + i * 12)} />
          </React.Fragment>
        ))}
        <Label x={175} y={390} size={24} weight={700} color={ROLE.noise} style={{ transform: "translateX(-100%)" }} opacity={fade(frame, L[3] + 10)}>
          xₜ
        </Label>
        <Label x={175} y={650} size={24} weight={700} color={ROLE.net} style={{ transform: "translateX(-100%)" }} opacity={fade(frame, L[3] + 20)}>
          guess x̂₀
        </Label>
        <Label x={960} y={810} size={26} center color={COLORS.muted} opacity={fade(frame, L[3] + 90)}>
          blurry average at first → one sharp picture at the end
        </Label>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
