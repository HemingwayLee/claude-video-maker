import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade, fadeOut, lerp } from "../anim";
import { Arrow, Layer, NetBlock } from "../components/Diagram";
import { PixelImage } from "../components/PixelImage";
import { Card, Label } from "../components/Text";
import { average, outputAt, PHASES, TEST_INPUTS, TEST_TARGETS } from "../data";
import { COLORS, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

// D judges pairs: (x, y) is real, (x, G(x)) is fake. Then: how this relates
// to the cGAN, and why D must see x.
const AVG = average(PHASES);

const Verdict: React.FC<{ x: number; y: number; text: string; color: string; opacity: number }> = ({ x, y, text, color, opacity }) => (
  <div style={{ position: "absolute", left: x, top: y, padding: "8px 20px", borderRadius: 12, background: color, color: COLORS.bg, fontFamily: MONO, fontWeight: 800, fontSize: 30, opacity }}>{text}</div>
);

export const Idea: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();
  const main = fadeOut(frame, L[3] - 5, 15);
  const pairs = fade(frame, L[1]);
  const verdicts = fade(frame, L[2]);
  const blurSwap = frame >= L[2] + 75;
  const fakeImg = blurSwap ? AVG : outputAt("both", 0, 400);
  const pulse = 0.5 + 0.5 * Math.sin(frame / 5);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: main }}>
        <NetBlock x={900} y={500} w={250} h={280} shape="shrink" color={ROLE.disc} label="D" sub="discriminator" opacity={fade(frame, L[0])} glow={frame >= L[2] && frame < L[3] ? pulse * 0.6 : 0} />
        {/* real pair */}
        <AbsoluteFill style={{ opacity: pairs }}>
          <Card x={230} y={180} w={420} h={260} accent={ROLE.real} />
          <Label x={440} y={140} size={28} weight={800} color={ROLE.real} center>
            real pair
          </Label>
          <PixelImage im={TEST_INPUTS[0]} x={265} y={240} size={170} border={ROLE.input} />
          <PixelImage im={TEST_TARGETS[0]} x={455} y={240} size={170} border={ROLE.real} />
          <Label x={350} y={415} size={22} color={ROLE.input} center>x</Label>
          <Label x={540} y={415} size={22} color={ROLE.real} center>y</Label>
          {/* fake pair */}
          <Card x={230} y={570} w={420} h={260} accent={ROLE.gen} />
          <Label x={440} y={850} size={28} weight={800} color={ROLE.gen} center>
            fake pair
          </Label>
          <PixelImage im={TEST_INPUTS[0]} x={265} y={600} size={170} border={ROLE.input} />
          <PixelImage im={fakeImg} x={455} y={600} size={170} border={ROLE.gen} />
          <Label x={350} y={775} size={22} color={ROLE.input} center>x</Label>
          <Label x={540} y={775} size={22} color={ROLE.gen} center>{blurSwap ? "a blurry average" : "G(x)"}</Label>
          <Layer>
            <Arrow id="i1" d="M 660 310 C 760 310, 800 420, 890 450" color={ROLE.real} progress={lerp(frame, [L[1] + 10, L[1] + 30], [0, 1])} />
            <Arrow id="i2" d="M 660 700 C 760 700, 800 580, 890 550" color={ROLE.gen} progress={lerp(frame, [L[1] + 30, L[1] + 50], [0, 1])} />
            <Arrow id="i3" d="M 1160 450 L 1280 330" color={ROLE.real} progress={verdicts} />
            <Arrow id="i4" d="M 1160 550 L 1280 670" color={ROLE.gen} progress={verdicts} />
            {/* G gets pushed by D's verdict */}
            <Arrow id="i5" d="M 1025 650 C 1025 900, 700 930, 560 800" color={ROLE.gen} width={5} progress={lerp(frame, [L[2] + 40, L[2] + 70], [0, 1])} flow={frame} />
          </Layer>
          <Verdict x={1295} y={290} text="REAL → 1" color={ROLE.real} opacity={verdicts} />
          <Verdict x={1295} y={650} text="FAKE → 0" color={ROLE.gen} opacity={verdicts} />
          <Label x={1300} y={370} size={24} color={COLORS.muted} opacity={verdicts}>
            D learns to tell them apart
          </Label>
          <Label x={790} y={940} size={26} weight={700} color={ROLE.gen} center opacity={fade(frame, L[2] + 50)}>
            G learns to fool D
          </Label>
          <Label x={1300} y={740} size={28} weight={800} color={ROLE.gen} opacity={blurSwap ? fade(frame, L[2] + 80) : 0}>
            blur? easy to spot ✗
          </Label>
        </AbsoluteFill>
      </AbsoluteFill>

      {/* cGAN → Pix2Pix */}
      <AbsoluteFill style={{ opacity: fade(frame, L[3]) }}>
        <Card x={170} y={170} w={740} h={380} accent={COLORS.muted}>
          <Label x={30} y={24} size={30} weight={800} color={COLORS.muted}>
            cGAN (last video)
          </Label>
          <Label x={370} y={120} size={64} mono center>
            D(<span style={{ color: COLORS.text }}>x</span> | <span style={{ color: ROLE.input }}>y</span>)
          </Label>
          <Label x={370} y={240} size={28} center color={COLORS.muted}>
            condition y = a label, like <span style={{ color: ROLE.input, fontFamily: MONO }}>"glasses"</span>
          </Label>
        </Card>
        <Card x={1010} y={170} w={740} h={380} accent={ROLE.input}>
          <Label x={30} y={24} size={30} weight={800} color={ROLE.input}>
            Pix2Pix
          </Label>
          <Label x={370} y={120} size={64} mono center>
            D(<span style={{ color: ROLE.input }}>x</span>, <span style={{ color: COLORS.text }}>y</span>)
          </Label>
          <Label x={370} y={240} size={28} center color={COLORS.muted}>
            condition = <span style={{ color: ROLE.input }}>a whole image x</span>
          </Label>
          <PixelImage im={TEST_INPUTS[1]} x={330} y={290} size={80} border={ROLE.input} />
        </Card>
        {/* why D needs x: a real-looking output that doesn't fit the input */}
        <AbsoluteFill style={{ opacity: fade(frame, L[4]) }}>
          <Label x={960} y={600} size={30} weight={700} center>
            Without x, D would accept this. With x, it can see the answer doesn't fit:
          </Label>
          <PixelImage im={TEST_INPUTS[0]} x={560} y={690} size={170} border={ROLE.input} label="x: a circle" labelColor={ROLE.input} />
          <PixelImage im={TEST_TARGETS[1]} x={860} y={690} size={170} border={ROLE.gen} label="a real-looking square" labelColor={ROLE.gen} />
          <Layer>
            <Arrow id="i6" d="M 1050 775 L 1120 775" />
          </Layer>
          <Verdict x={1135} y={750} text="FAKE → 0" color={ROLE.gen} opacity={fade(frame, L[4] + 30)} />
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
