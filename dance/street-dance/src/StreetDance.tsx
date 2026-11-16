import React from "react";
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame, interpolate, Easing } from "remotion";
import { Street } from "./Street";
import { beatAt, pulse, TOTAL_FRAMES } from "./beat";
import { OUTFIT_SWITCHES, SIZE_TWEAK, stepAt, type Step } from "./choreography";
import sprites from "./sprites.json";

const W = 1080;
const GROUND = 1560; // y of her feet
const BODY = 960; // on-screen height of a standing pose (px)

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (v: number) => 1 - (1 - v) ** 3;

type Pose = { x: number; y: number; rot: number; sx: number; sy: number; air: number };

/** Where the body is during a step, p = 0..1 through the step. */
function motion(step: Step, index: number, p: number, lenBeats: number): Pose {
  const dir = index % 2 ? -1 : 1;
  const t = p * lenBeats; // beats since the step started
  const pop = Math.exp(-t * 9); // entry accent
  const land = Math.exp(-t * 11);
  let x = 0, y = 0, rot = 0, air = 0;
  let sx = 1 + 0.06 * pop + 0.04 * land;
  let sy = 1 + 0.06 * pop - 0.07 * land;

  switch (step.move ?? "bounce") {
    case "bounce":
      y = -38 * Math.sin(Math.PI * p);
      rot = dir * 3 * Math.sin(Math.PI * p);
      air = Math.sin(Math.PI * p) * 0.15;
      break;
    case "sway":
      x = dir * 55 * Math.sin(Math.PI * p);
      y = -22 * Math.sin(Math.PI * p);
      rot = dir * 7 * Math.sin(Math.PI * p);
      break;
    case "jump": {
      // crouch, launch, land
      const q = clamp01((p - 0.12) / 0.8);
      const h = Math.sin(Math.PI * q);
      y = -290 * h;
      air = h;
      if (p < 0.12) {
        sy *= 1 - 0.1 * Math.sin((Math.PI * p) / 0.12);
        sx *= 1 + 0.06 * Math.sin((Math.PI * p) / 0.12);
      } else {
        sy *= 1 + 0.06 * h;
        sx *= 1 - 0.03 * h;
      }
      rot = dir * 4 * h;
      break;
    }
    case "turn": {
      // spin out: the body narrows to nothing as she turns, the next step spins back in
      const q = easeOut(clamp01((p - 0.35) / 0.65));
      sx *= Math.cos((Math.PI / 2) * q);
      y = -60 * Math.sin(Math.PI * p);
      rot = dir * 6 * q;
      air = 0.3 * Math.sin(Math.PI * p);
      break;
    }
  }
  // spin in after an outfit change
  if (OUTFIT_SWITCHES.includes(step.beat)) {
    sx *= Math.max(0.02, easeOut(clamp01(t / 0.35)));
  }
  return { x, y, rot, sx, sy, air };
}

const Sprite: React.FC<{ step: Step; pose: Pose; groove: number; rgb: number; opacity?: number; ghost?: boolean }> = ({
  step, pose, groove, rgb, opacity = 1, ghost,
}) => {
  const m = sprites[step.pose];
  const h = BODY * m.rel * (SIZE_TWEAK[step.pose] ?? 1);
  const w = (h * m.w) / m.h;
  const flip = step.flip ? -1 : 1;
  const filter = ghost
    ? "brightness(1.6) saturate(0) drop-shadow(0 0 0 #ff5fd0) opacity(0.9)"
    : [
        `drop-shadow(${(10 * rgb).toFixed(1)}px 0 0 rgba(255,40,150,${(0.75 * rgb).toFixed(2)}))`,
        `drop-shadow(${(-10 * rgb).toFixed(1)}px 0 0 rgba(40,230,255,${(0.75 * rgb).toFixed(2)}))`,
        "drop-shadow(0 18px 24px rgba(10,0,30,0.45))",
      ].join(" ");
  return (
    <Img
      src={staticFile(`sprites/${step.pose}.png`)}
      style={{
        position: "absolute",
        left: W / 2 - w / 2 + pose.x + groove,
        top: GROUND - h + pose.y,
        width: w,
        height: h,
        transformOrigin: "50% 100%",
        transform: `rotate(${pose.rot}deg) scale(${pose.sx * flip}, ${pose.sy})`,
        filter,
        opacity,
        mixBlendMode: ghost ? "screen" : undefined,
      }}
    />
  );
};

const Dancer: React.FC<{ frame: number }> = ({ frame }) => {
  const b = Math.min(beatAt(frame), 31.999);
  const { index, step, prev, start, end } = stepAt(b);
  const len = end - start;
  const p = clamp01((b - start) / len);
  const pose = motion(step, index, p, len);
  const groove = 22 * Math.sin((Math.PI * b) / 1); // hips swing left/right every beat
  const rgb = pulse(frame, 7, step.beat >= 24 ? 0.5 : 1);
  const tSince = b - start;

  // motion-trail ghost of the previous pose
  let ghost: React.ReactNode = null;
  if (prev && tSince < 0.35 && !OUTFIT_SWITCHES.includes(step.beat)) {
    const pp = motion(prev, index - 1, 1, step.beat - prev.beat);
    ghost = (
      <Sprite
        step={prev}
        pose={{ ...pp, x: pp.x - (index % 2 ? -1 : 1) * 40 }}
        groove={22 * Math.sin(Math.PI * start)}
        rgb={0}
        opacity={0.45 * Math.exp(-tSince * 9)}
        ghost
      />
    );
  }

  const shadowW = 340 * (1 - 0.45 * pose.air);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: W / 2 + pose.x + groove - shadowW / 2,
          top: GROUND - 34,
          width: shadowW,
          height: 64,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(8,0,20,0.6), rgba(8,0,20,0) 70%)",
          opacity: 1 - 0.5 * pose.air,
        }}
      />
      {ghost}
      <Sprite step={step} pose={pose} groove={groove} rgb={rgb} />
    </>
  );
};

/** Star burst + white flash when the outfit changes. */
const SwitchFX: React.FC<{ frame: number }> = ({ frame }) => {
  const b = beatAt(frame);
  const T = OUTFIT_SWITCHES.find((s) => b >= s - 0.12 && b < s + 1.2);
  if (T === undefined) return null;
  const t = b - T;
  const flash = t < 0 ? (t + 0.12) / 0.12 : Math.exp(-t * 7);
  const stars = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2 + T;
    const d = easeOut(clamp01(t / 1)) * (380 + (i % 3) * 120);
    const s = 1 - clamp01(t / 1.1);
    const colors = ["#fff36b", "#ff7ad9", "#7af6ff", "#ffffff"];
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: W / 2 + Math.cos(a) * d - 30,
          top: 1100 + Math.sin(a) * d * 1.2 - 30,
          width: 60,
          height: 60,
          fontSize: 56,
          lineHeight: "60px",
          textAlign: "center",
          color: colors[i % 4],
          transform: `scale(${s * (0.6 + (i % 2) * 0.5)}) rotate(${t * 300}deg)`,
          textShadow: "0 0 18px currentColor",
          opacity: t < 0 ? 0 : 1,
        }}
      >
        ✦
      </div>
    );
  });
  return (
    <>
      {stars}
      <AbsoluteFill style={{ background: "#fff", opacity: clamp01(flash) * 0.85 }} />
    </>
  );
};

/** Little hearts / notes floating up around her. */
const Floaters: React.FC<{ frame: number }> = ({ frame }) => {
  const items = Array.from({ length: 14 }, (_, i) => {
    const period = 70 + (i % 5) * 13;
    const ph = ((frame + i * 37) % period) / period;
    const x = 120 + ((i * 173) % 840);
    const y = 1500 - ph * 900;
    const glyph = i % 3 === 0 ? "♪" : i % 3 === 1 ? "♥" : "✦";
    const color = ["#ff7ad9", "#ffe66b", "#7af6ff"][i % 3];
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: x + 30 * Math.sin(ph * 6 + i),
          top: y,
          fontSize: 44 + (i % 4) * 10,
          color,
          opacity: Math.sin(Math.PI * ph) * 0.8,
          textShadow: `0 0 14px ${color}`,
          fontFamily: "'Arial Rounded MT Bold', Arial, sans-serif",
        }}
      >
        {glyph}
      </div>
    );
  });
  return <>{items}</>;
};

const TEXT: React.CSSProperties = {
  fontFamily: "'Arial Rounded MT Bold', 'Helvetica Neue', Arial, sans-serif",
  color: "#fff",
  fontWeight: 800,
  WebkitTextStroke: "2px rgba(20,0,40,0.55)",
  textShadow: "0 4px 14px rgba(0,0,0,0.55)",
};

const Overlay: React.FC<{ frame: number }> = ({ frame }) => {
  const b = beatAt(frame);
  const look = b < 8 ? 1 : b < 16 ? 2 : b < 24 ? 3 : null;
  const tagPop = look ? 1 + 0.25 * Math.exp(-((b - [0, 0, 8, 16][look]) * 6)) : 1;
  const capIn = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.back(2)) });
  const endIn = clamp01((b - 30.6) / 0.4);
  return (
    <AbsoluteFill>
      {/* caption */}
      <div
        style={{
          ...TEXT,
          position: "absolute",
          top: 190,
          left: 60,
          right: 60,
          textAlign: "center",
          fontSize: 44,
          lineHeight: 1.18,
          transform: `scale(${capIn})`,
          opacity: 1 - endIn,
        }}
      >
        <span style={{ background: "rgba(255,255,255,0.95)", color: "#1b1033", WebkitTextStroke: "0", textShadow: "none", padding: "6px 22px", borderRadius: 18, boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}>
          POV: the beat drops on your walk home 🎧
        </span>
      </div>

      {/* outfit counter */}
      {look && (
        <div
          style={{
            ...TEXT,
            position: "absolute",
            top: 360,
            right: 70,
            fontSize: 46,
            padding: "8px 26px",
            borderRadius: 40,
            background: ["", "#ff4fa6", "#ff8a3d", "#4f7dff"][look],
            WebkitTextStroke: "0",
            transform: `scale(${tagPop}) rotate(6deg)`,
          }}
        >
          fit {look}/3
        </div>
      )}
      {b >= 24 && b < 30.6 && (
        <div style={{ ...TEXT, position: "absolute", top: 360, right: 70, fontSize: 46, padding: "8px 26px", borderRadius: 40, background: "#9b5cff", WebkitTextStroke: "0", transform: `scale(${1 + 0.15 * pulse(frame, 8, 0.5)}) rotate(6deg)` }}>
          all of them ✨
        </div>
      )}

      {/* end card */}
      {endIn > 0 && (
        <div
          style={{
            ...TEXT,
            position: "absolute",
            top: 260,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: 92,
            lineHeight: 1.1,
            transform: `scale(${0.6 + 0.4 * easeOut(endIn)}) rotate(-4deg)`,
            opacity: endIn,
            WebkitTextStroke: "4px #ff3fa4",
          }}
        >
          which fit?
          <br />
          <span style={{ fontSize: 72 }}>1 · 2 · 3 👇</span>
        </div>
      )}

      {/* bottom caption + sound line */}
      <div style={{ ...TEXT, position: "absolute", left: 50, right: 200, bottom: 70, fontSize: 36, lineHeight: 1.35, fontWeight: 700, WebkitTextStroke: "0" }}>
        <div style={{ fontSize: 42, fontWeight: 800 }}>night walk, new moves</div>
        <div>#streetdance #outfitcheck #dancechallenge</div>
        <div style={{ marginTop: 10, fontSize: 34, opacity: 0.9 }}>♪ original sound · 128 bpm</div>
      </div>

      {/* progress bar */}
      <div style={{ position: "absolute", left: 0, bottom: 0, height: 8, width: `${(frame / (TOTAL_FRAMES - 1)) * 100}%`, background: "rgba(255,255,255,0.85)" }} />
    </AbsoluteFill>
  );
};

export const StreetDance: React.FC = () => {
  const frame = useCurrentFrame();
  const b = beatAt(frame);
  // camera: slow push-in, a bump on every kick, a punch + tilt at each outfit change
  const near = OUTFIT_SWITCHES.map((s) => (b >= s ? Math.exp(-(b - s) * 4) : 0)).reduce((a, v) => a + v, 0);
  const intro = interpolate(frame, [0, 12], [1.22, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const outro = interpolate(b, [31, 32], [1, 1.08], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const zoom = intro * outro * (1 + 0.035 * (frame / TOTAL_FRAMES)) * (1 + 0.022 * pulse(frame, 7)) * (1 + 0.08 * near);
  const tilt = 2.5 * near * Math.sin(b * 40);
  const finale = b >= 24 && b < 31 ? 6 * pulse(frame, 9, 0.5) : 0;
  const introFlash = Math.exp(-frame / 3);

  return (
    <AbsoluteFill style={{ background: "#0f0b2e", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${zoom}) rotate(${tilt}deg) translateY(${finale}px)`, transformOrigin: "50% 62%" }}>
        <Street />
        <Floaters frame={frame} />
        <Dancer frame={frame} />
      </AbsoluteFill>
      <SwitchFX frame={frame} />
      {/* vignette */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 55%, rgba(5,0,20,0.55) 100%)" }} />
      <Overlay frame={frame} />
      <AbsoluteFill style={{ background: "#fff", opacity: introFlash }} />
      <Audio src={staticFile("music.wav")} />
    </AbsoluteFill>
  );
};

