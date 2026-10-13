import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade, lerp } from "../anim";
import { Layer } from "../components/Diagram";
import { TaskArt } from "../components/TaskArt";
import { Label } from "../components/Text";
import { COLORS, ROLE } from "../theme";
import { useLines } from "../timeline";

// The paper's generator for 256×256 images, drawn as feature maps:
// bar height ~ image size, bar width ~ number of channels.
const ENC = [
  { s: 256, c: 3 },
  { s: 128, c: 64 },
  { s: 64, c: 128 },
  { s: 32, c: 256 },
  { s: 16, c: 512 },
  { s: 8, c: 512 },
  { s: 4, c: 512 },
  { s: 2, c: 512 },
];
const BOTTLENECK = { s: 1, c: 512 };
const H = (s: number) => 26 + (262 * Math.log2(s)) / 8;
const W = (c: number) => 6 + 3 * Math.log2(c);
const Y0 = 300;
const DY = 58;
const ex = (i: number) => 250 + i * 70;
const dx = (i: number) => 1670 - i * 70;
const cy = (i: number) => Y0 + i * DY;
const BX = 960;
const BY = cy(8);

const Bar: React.FC<{ x: number; y: number; w: number; h: number; color: string; opacity: number; extra?: number }> = ({ x, y, w, h, color, opacity, extra = 0 }) => (
  <g opacity={opacity}>
    <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={4} fill={`${color}55`} stroke={color} strokeWidth={3} />
    {extra > 0 && <rect x={x - w / 2 - 2 - w * extra} y={y - h / 2} width={w * extra} height={h} rx={4} fill={`${ROLE.input}55`} stroke={ROLE.input} strokeWidth={3} />}
  </g>
);

export const UNet: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();
  const encShow = (i: number) => fade(frame, L[1] + i * 9, 10);
  const botShow = fade(frame, L[1] + 8 * 9, 10);
  const decShow = (i: number) => fade(frame, L[2] + (7 - i) * 8, 10);
  const squeeze = frame >= L[3] && frame < L[4];
  const skips = (i: number) => lerp(frame, [L[4] + 10 + (7 - i) * 6, L[4] + 25 + (7 - i) * 6], [0, 1]);
  const anySkip = frame >= L[4];
  const uShape = fade(frame, L[5]);
  // A dot travelling along the U while the bottleneck is explained.
  const t = squeeze ? ((frame - L[3]) % 70) / 70 : -1;
  const travel = (u: number): [number, number] => {
    if (u < 0.5) {
      const k = u * 2 * 8;
      const i = Math.floor(k);
      const f = k - i;
      const x0 = ex(Math.min(i, 7));
      const x1 = i + 1 >= 8 ? BX : ex(i + 1);
      return [x0 + (x1 - x0) * f, cy(i) + DY * f];
    }
    const k = (1 - (u - 0.5) * 2) * 8;
    const i = Math.floor(k);
    const f = k - i;
    const x0 = dx(Math.min(i, 7));
    const x1 = i + 1 >= 8 ? BX : dx(i + 1);
    return [x0 + (x1 - x0) * f, cy(i) + DY * f];
  };
  const dot = t >= 0 ? travel(t) : null;
  return (
    <AbsoluteFill>
      <Label x={960} y={140} size={34} weight={800} center color={ROLE.gen} opacity={fade(frame, L[0])}>
        G = encoder → decoder{anySkip ? " + skip connections" : ""}
      </Label>
      {/* input and output images */}
      <TaskArt task="facade" side="labels" size={150} x={40} y={cy(0) - 75} style={{ opacity: fade(frame, L[0] + 10), boxShadow: `0 0 0 3px ${ROLE.input}` }} />
      <TaskArt
        task="facade"
        side="real"
        size={150}
        x={1730}
        y={cy(0) - 75}
        style={{ opacity: fade(frame, L[2] + 50), boxShadow: `0 0 0 3px ${ROLE.gen}`, filter: frame >= L[3] + 30 && !(frame >= L[4] + 70) ? "blur(5px)" : undefined }}
      />
      <Label x={1805} y={cy(0) + 90} size={22} color={squeeze ? COLORS.red : COLORS.muted} center opacity={fade(frame, L[3] + 30)}>
        {frame >= L[4] + 70 ? "details kept" : "details lost"}
      </Label>
      <Layer>
        {/* the U */}
        <path d={`M ${ex(0)} ${cy(0)} L ${BX} ${BY} L ${dx(0)} ${cy(0)}`} stroke={ROLE.gen} strokeOpacity={0.12 * uShape} strokeWidth={120} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        {/* the down/up path */}
        {ENC.map((_, i) => (
          <React.Fragment key={i}>
            <line x1={ex(i)} y1={cy(i)} x2={i === 7 ? BX : ex(i + 1)} y2={cy(i + 1)} stroke={COLORS.muted} strokeWidth={2} opacity={encShow(i + 1)} />
            <line x1={dx(i)} y1={cy(i)} x2={i === 7 ? BX : dx(i + 1)} y2={cy(i + 1)} stroke={COLORS.muted} strokeWidth={2} opacity={decShow(i)} />
          </React.Fragment>
        ))}
        {/* skip connections */}
        {ENC.map((l, i) => {
          if (i === 0) return null;
          const p = skips(i);
          const x1 = ex(i) + W(l.c) / 2 + 4;
          const x2 = dx(i) - W(l.c) * 1.5 - 10;
          return (
            <g key={`s${i}`} opacity={p > 0 ? 1 : 0}>
              <line x1={x1} y1={cy(i) - H(l.s) / 2 + 8} x2={x1 + (x2 - x1) * p} y2={cy(i) - H(l.s) / 2 + 8} stroke={ROLE.input} strokeWidth={4} strokeDasharray="12 8" strokeDashoffset={-frame * 1.5} />
              {p > 0.98 && <path d={`M ${x2 - 12} ${cy(i) - H(l.s) / 2} L ${x2} ${cy(i) - H(l.s) / 2 + 8} L ${x2 - 12} ${cy(i) - H(l.s) / 2 + 16}`} fill="none" stroke={ROLE.input} strokeWidth={4} />}
            </g>
          );
        })}
        {ENC.map((l, i) => (
          <Bar key={`e${i}`} x={ex(i)} y={cy(i)} w={W(l.c)} h={H(l.s)} color={i === 0 ? ROLE.input : COLORS.blue} opacity={encShow(i)} />
        ))}
        <Bar x={BX} y={BY} w={W(BOTTLENECK.c)} h={H(BOTTLENECK.s)} color={squeeze ? COLORS.red : COLORS.purple} opacity={botShow} />
        {squeeze && <circle cx={BX} cy={BY} r={40 + 10 * Math.sin(frame / 4)} fill="none" stroke={COLORS.red} strokeWidth={4} />}
        {ENC.map((l, i) => (
          <Bar key={`d${i}`} x={dx(i)} y={cy(i)} w={i === 0 ? W(3) : W(l.c)} h={H(l.s)} color={i === 0 ? ROLE.gen : COLORS.green} opacity={decShow(i)} extra={i > 0 ? skips(i) : 0} />
        ))}
        {dot && <circle cx={dot[0]} cy={dot[1]} r={11} fill={COLORS.yellow} />}
      </Layer>
      {/* sizes */}
      <Label x={ex(0)} y={cy(0) + H(256) / 2 + 10} size={20} mono center color={ROLE.input} opacity={encShow(0)}>
        256×256×3
      </Label>
      <Label x={ex(1) + 8} y={cy(1) + H(128) / 2 + 10} size={18} mono color={COLORS.blue} opacity={encShow(1)}>
        128×128×64
      </Label>
      <Label x={ex(4) - 10} y={cy(4) + H(16) / 2 + 10} size={18} mono color={COLORS.blue} opacity={encShow(4)}>
        16×16×512
      </Label>
      <Label x={BX} y={BY + 32} size={22} mono center color={squeeze ? COLORS.red : COLORS.purple} opacity={botShow}>
        1×1×512 bottleneck
      </Label>
      <Label x={dx(0)} y={cy(0) + H(256) / 2 + 10} size={20} mono center color={ROLE.gen} opacity={decShow(0)}>
        256×256×3
      </Label>
      <Label x={560} y={890} size={26} center color={COLORS.blue} opacity={encShow(2)}>
        encoder: 4×4 conv, stride 2 (halves the size)
      </Label>
      <Label x={1360} y={890} size={26} center color={COLORS.green} opacity={decShow(5)}>
        decoder: 4×4 transposed conv (doubles it)
      </Label>
      <Label x={960} y={188} size={24} weight={700} center color={ROLE.input} opacity={fade(frame, L[4] + 40)}>
        copy each encoder layer across, stack it onto the decoder layer
      </Label>
      <Label x={BX} y={BY + 70} size={56} weight={900} center color={ROLE.gen} opacity={uShape}>
        U-Net
      </Label>
    </AbsoluteFill>
  );
};
