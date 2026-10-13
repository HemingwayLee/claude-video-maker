import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { fade, fadeOut, lerp } from "../anim";
import { Arrow, Layer } from "../components/Diagram";
import { TaskArt } from "../components/TaskArt";
import { Card, Label } from "../components/Text";
import { COLORS, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

// A 70×70 window slides over a 256×256 image; each position gives one cell
// of a 30×30 grid of real/fake scores. Their mean is D's answer.
const IMG = { x: 170, y: 230, s: 480 };
const GRID = { x: 1080, y: 230, s: 480, n: 30 };
const WIN = (IMG.s * 70) / 256;
const SCORES = Array.from({ length: GRID.n * GRID.n }, (_, i) => {
  const r = random(`p${i}`);
  return r < 0.82 ? 0.55 + 0.45 * random(`q${i}`) : 0.45 * random(`q${i}`);
});
const MEAN = SCORES.reduce((s, v) => s + v, 0) / SCORES.length;
const cellColor = (v: number) => (v >= 0.5 ? `rgba(6,214,160,${0.3 + v * 0.6})` : `rgba(239,71,111,${0.3 + (1 - v) * 0.6})`);

const SIZES = [
  { n: 1, name: "1×1 · PixelGAN", note: "more colorful, but no sharper" },
  { n: 16, name: "16×16", note: "sharp, but tiling artifacts" },
  { n: 70, name: "70×70", note: "sharp, fewest artifacts", best: true },
  { n: 286, name: "286×286 · ImageGAN", note: "no better, harder to train" },
];

export const PatchGan: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();
  const scan = lerp(frame, [L[1] + 10, L[2] - 10], [0, 1]);
  const filled = Math.floor(scan * SCORES.length);
  const k = Math.min(filled, SCORES.length - 1);
  const wx = IMG.x + ((k % GRID.n) / (GRID.n - 1)) * (IMG.s - WIN);
  const wy = IMG.y + (Math.floor(k / GRID.n) / (GRID.n - 1)) * (IMG.s - WIN);
  const main = fadeOut(frame, L[3] - 5, 15);
  const single = fade(frame, L[0] + 10) * fadeOut(frame, L[0] + 70, 12);
  const cell = GRID.s / GRID.n;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: main }}>
        <TaskArt task="street" side="real" size={IMG.s} x={IMG.x} y={IMG.y} style={{ boxShadow: `0 0 0 4px ${ROLE.gen}` }} />
        <Label x={IMG.x + IMG.s / 2} y={IMG.y - 50} size={26} mono center color={COLORS.muted}>
          256 × 256 image
        </Label>
        {/* "one score for the whole image?" */}
        <Label x={GRID.x + GRID.s / 2} y={IMG.y + 180} size={44} mono center color={ROLE.disc} opacity={single}>
          D → one score?
        </Label>
        {/* sliding window */}
        {frame >= L[1] && scan < 1 && (
          <div style={{ position: "absolute", left: wx, top: wy, width: WIN, height: WIN, border: `4px solid ${ROLE.disc}`, borderRadius: 4, boxShadow: `0 0 20px ${ROLE.disc}` }} />
        )}
        <Label x={IMG.x + IMG.s / 2} y={IMG.y + IMG.s + 20} size={26} center color={ROLE.disc} opacity={fade(frame, L[1])}>
          each cell looks at one 70 × 70 patch
        </Label>
        <Layer opacity={fade(frame, L[1])}>
          <Arrow id="pg1" d={`M ${IMG.x + IMG.s + 30} ${IMG.y + IMG.s / 2} L ${GRID.x - 30} ${IMG.y + IMG.s / 2}`} color={ROLE.disc} />
        </Layer>
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, opacity: fade(frame, L[1]) }}>
          <rect x={GRID.x - 4} y={GRID.y - 4} width={GRID.s + 8} height={GRID.s + 8} fill="none" stroke={ROLE.disc} strokeWidth={3} rx={6} />
          {SCORES.slice(0, filled).map((v, i) => (
            <rect key={i} x={GRID.x + (i % GRID.n) * cell + 1} y={GRID.y + Math.floor(i / GRID.n) * cell + 1} width={cell - 2} height={cell - 2} fill={cellColor(v)} />
          ))}
        </svg>
        <Label x={GRID.x + GRID.s / 2} y={GRID.y - 50} size={26} mono center color={ROLE.disc} opacity={fade(frame, L[1])}>
          30 × 30 grid of real/fake scores
        </Label>
        {/* the average */}
        <AbsoluteFill style={{ opacity: fade(frame, L[2]) }}>
          <Layer>
            <Arrow id="pg2" d={`M ${GRID.x + GRID.s / 2} ${GRID.y + GRID.s + 12} L ${GRID.x + GRID.s / 2} ${GRID.y + GRID.s + 70}`} color={ROLE.disc} />
          </Layer>
          <Label x={GRID.x + GRID.s / 2} y={GRID.y + GRID.s + 80} size={36} mono center color={ROLE.disc}>
            mean = {MEAN.toFixed(2)} → D's answer
          </Label>
        </AbsoluteFill>
      </AbsoluteFill>

      {/* why patches */}
      <AbsoluteFill style={{ opacity: fade(frame, L[3]) * fadeOut(frame, L[5] - 5, 12) }}>
        <Card x={170} y={200} w={760} h={420} accent={ROLE.l1}>
          <Label x={30} y={24} size={34} weight={800} color={ROLE.l1}>
            L1 handles the big picture
          </Label>
          <Label x={30} y={80} size={26} color={COLORS.muted}>
            low frequencies: layout, colors
          </Label>
          <TaskArt task="street" side="real" size={240} x={260} y={140} style={{ filter: "blur(6px)" }} />
        </Card>
        <Card x={990} y={200} w={760} h={420} accent={ROLE.disc}>
          <Label x={30} y={24} size={34} weight={800} color={ROLE.disc}>
            PatchGAN handles the details
          </Label>
          <Label x={30} y={80} size={26} color={COLORS.muted}>
            high frequencies: sharp edges, texture
          </Label>
          <div style={{ position: "absolute", left: 260, top: 140, width: 240, height: 240, overflow: "hidden", borderRadius: 8, boxShadow: `0 0 0 4px ${ROLE.disc}` }}>
            <TaskArt task="street" side="real" size={720} x={-160} y={-400} />
          </div>
        </Card>
        <div style={{ position: "absolute", left: 0, right: 0, top: 700, display: "flex", justifyContent: "center", gap: 30, opacity: fade(frame, L[4]) }}>
          {["fewer parameters", "faster", "works on any image size"].map((t) => (
            <div key={t} style={{ padding: "14px 30px", borderRadius: 40, border: `3px solid ${ROLE.disc}`, color: COLORS.text, fontFamily: MONO, fontSize: 28, fontWeight: 700 }}>
              {t}
            </div>
          ))}
        </div>
      </AbsoluteFill>

      {/* patch sizes compared in the paper */}
      <AbsoluteFill style={{ opacity: fade(frame, L[5]) }}>
        <Label x={960} y={160} size={34} weight={800} center>
          Patch size, tested in the paper (on 256 × 256 images)
        </Label>
        {SIZES.map((s, i) => {
          const x = 170 + i * 410;
          const box = 260;
          const p = Math.max(6, Math.min(box, (box * s.n) / 256));
          return (
            <Card key={s.n} x={x} y={240} w={360} h={560} accent={s.best ? ROLE.real : undefined} opacity={fade(frame, L[5] + 10 + i * 12)}>
              <div style={{ position: "absolute", left: 50, top: 40, width: box, height: box, background: COLORS.bg, borderRadius: 6, border: `2px solid ${COLORS.panelBorder}` }}>
                <div style={{ position: "absolute", left: (box - p) / 2, top: (box - p) / 2, width: p, height: p, border: `3px solid ${ROLE.disc}`, background: `${ROLE.disc}33` }} />
              </div>
              <Label x={180} y={330} size={30} weight={800} center color={s.best ? ROLE.real : COLORS.text}>
                {s.name}
              </Label>
              <Label x={180} y={390} size={24} center color={COLORS.muted} width={300}>
                {s.note}
              </Label>
              {s.best && (
                <Label x={180} y={470} size={34} weight={900} center color={ROLE.real}>
                  ✓ best
                </Label>
              )}
            </Card>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
