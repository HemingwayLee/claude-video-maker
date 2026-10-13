import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade, fadeOut, lerp, linear } from "../anim";
import { Axes, type Chart, Layer, linePath } from "../components/Diagram";
import { PointCloud } from "../components/PointCloud";
import { Card, Label } from "../components/Text";
import { noiseFor, noisify, TRACE } from "../data";
import { COLORS, ROLE } from "../theme";
import { useLines } from "../timeline";

// The real 2-D model: data, forward noising, the learned denoising field,
// and DDPM sampling (1,000 steps) played back with a few trails.
const SP = TRACE.spiral;
const S = TRACE.settings;
const NOISE = noiseFor("spiral", SP.data.length);
const SNAPS = SP.ddpm.snaps; // t = 1000, 950, …, 0
const MAIN = { x: 170, y: 170, size: 700, range: 3.6 };
const LOSS = SP.losses;
const LC: Chart = { x: 1060, y: 560, w: 700, h: 220, x0: 0, x1: LOSS[LOSS.length - 1].step, y0: 0, y1: Math.max(...LOSS.map((l) => l.loss)) * 1.05 };

const mix = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(",")})`;
};
const snapAt = (p: number) => {
  const f = Math.max(0, Math.min(1, p)) * (SNAPS.length - 1);
  const k = Math.min(SNAPS.length - 2, Math.floor(f));
  const u = f - k;
  const a = SNAPS[k].points;
  const b = SNAPS[k + 1].points;
  return { points: a.map((v, i) => v + (b[i] - v) * u), t: SNAPS[k].t + (SNAPS[k + 1].t - SNAPS[k].t) * u };
};
const unit = (eps: number[]) => {
  const out = new Array(eps.length);
  for (let i = 0; i < eps.length; i += 2) {
    const dx = -eps[i];
    const dy = -eps[i + 1];
    const m = Math.hypot(dx, dy) || 1;
    const k = Math.min(1, m / 1.2) / m;
    out[i] = dx * k;
    out[i + 1] = dy * k;
  }
  return out;
};

export const Demo: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();
  const mainShow = fadeOut(frame, L[3] - 5, 10) + fade(frame, L[4] - 5, 10);
  const fieldShow = fade(frame, L[3]) * fadeOut(frame, L[4] - 5, 10);
  // forward process on the data
  const tf = frame < L[1] ? 0 : linear(frame, [L[1] + 10, L[2] - 10], [0, 1000]);
  // sampling playback
  const ps = linear(frame, [L[4] + 30, L[5] - 10], [0, 1]);
  const sampling = frame >= L[4];
  const snap = snapAt(ps);
  const pts = sampling ? snap.points : noisify(SP.data, tf, "spiral", NOISE);
  const tShown = sampling ? snap.t : tf;
  const color = sampling ? mix(COLORS.purple, COLORS.green, ps) : mix(COLORS.green, COLORS.purple, tf / 1000);
  const done = frame >= L[5];
  const trails = done ? SP.ddpm.trails.slice(0, 12) : [];
  const nLoss = Math.max(2, Math.round(lerp(frame, [L[2] + 10, L[3] - 10], [0, 1]) * LOSS.length));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: mainShow }}>
        <PointCloud
          x={MAIN.x}
          y={MAIN.y}
          size={MAIN.size}
          range={MAIN.range}
          layers={[...(done ? [{ points: SP.data, color: COLORS.muted, alpha: 0.25, radius: 1.8 }] : []), { points: pts, color, radius: 2.4, alpha: 0.85 }]}
          lines={done ? [{ paths: trails, color: COLORS.yellow, width: 1.4, alpha: 0.45 }] : []}
        />
        <Label x={MAIN.x + MAIN.size / 2} y={MAIN.y + MAIN.size + 16} size={34} mono weight={800} center color={ROLE.time} opacity={frame >= L[1] ? 1 : 0}>
          t = {Math.round(tShown)}
        </Label>
        <Label x={MAIN.x + MAIN.size / 2} y={MAIN.y - 50} size={28} weight={700} center color={sampling ? ROLE.net : frame >= L[1] ? ROLE.noise : ROLE.data}>
          {sampling ? (done ? "DDPM samples · paths of 12 points" : "sampling: noise → data") : frame >= L[1] ? "forward process: data → noise" : "training data: points on a spiral"}
        </Label>
      </AbsoluteFill>

      {/* model card + loss */}
      <AbsoluteFill style={{ opacity: fade(frame, L[2]) * fadeOut(frame, L[3] - 5, 10) }}>
        <Card x={1040} y={200} w={740} h={280}>
          <Label x={30} y={26} size={30} weight={800} color={ROLE.net}>
            ε_θ(x, y, t): a small MLP
          </Label>
          <Label x={30} y={84} size={24} mono color={COLORS.text}>
            input: point (x, y) + 32-dim time embedding
          </Label>
          <Label x={30} y={124} size={24} mono color={COLORS.text}>
            3 hidden layers × {S.HIDDEN}, SiLU · output: ε̂ (2 numbers)
          </Label>
          <Label x={30} y={164} size={24} mono color={COLORS.text}>
            {S.STEPS.toLocaleString()} steps · batch {S.BATCH} · Adam · EMA weights
          </Label>
          <Label x={30} y={214} size={22} color={COLORS.muted}>
            written from scratch in plain JavaScript: scripts/train-diffusion.mjs
          </Label>
        </Card>
        <Layer>
          <Axes c={LC} xLabel="training step" yLabel="loss = ||ε − ε̂||²" />
          <path d={linePath(LC, LOSS.slice(0, nLoss).map((l) => l.step), LOSS.slice(0, nLoss).map((l) => l.loss))} stroke={ROLE.net} strokeWidth={3} fill="none" />
        </Layer>
      </AbsoluteFill>

      {/* the learned field at five noise levels */}
      <AbsoluteFill style={{ opacity: fieldShow }}>
        <Label x={960} y={170} size={30} weight={700} center>
          arrows: −ε̂, the direction the network says is "less noisy"
        </Label>
        {SP.field.map((f, i) => (
          <React.Fragment key={f.t}>
            <PointCloud
              x={95 + i * 352}
              y={330}
              size={320}
              range={3}
              layers={[{ points: SP.data, color: COLORS.green, alpha: 0.18, radius: 1.2 }]}
              arrows={[{ at: SP.grid, dir: unit(f.eps), color: ROLE.net, scale: 13 }]}
              label={`t = ${f.t}`}
              labelColor={ROLE.time}
              opacity={fade(frame, L[3] + 10 + i * 12)}
            />
          </React.Fragment>
        ))}
        <Label x={250} y={680} size={24} center color={COLORS.muted} opacity={fade(frame, L[3] + 30)}>
          lots of noise: toward the middle
        </Label>
        <Label x={1660} y={680} size={24} center color={COLORS.muted} opacity={fade(frame, L[3] + 80)}>
          little noise: onto the spiral
        </Label>
      </AbsoluteFill>

      {/* result */}
      <AbsoluteFill style={{ opacity: fade(frame, L[5]) }}>
        <Card x={1040} y={260} w={740} h={330} accent={ROLE.data}>
          <Label x={30} y={26} size={28} weight={800} color={ROLE.data}>
            mean distance to the spiral
          </Label>
          {[
            ["real data", SP.dataDistance, ROLE.data],
            ["our samples (DDPM, 1000 steps)", SP.ddpm.distance, ROLE.net],
            ["pure noise", SP.noiseDistance, ROLE.noise],
          ].map(([name, v, c], k) => (
            <React.Fragment key={k}>
              <Label x={30} y={100 + k * 70} size={26} color={COLORS.text}>
                {name as string}
              </Label>
              <Label x={700} y={100 + k * 70} size={30} mono weight={800} color={c as string} style={{ transform: "translateX(-100%)" }}>
                {(v as number).toFixed(3)}
              </Label>
            </React.Fragment>
          ))}
        </Card>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
