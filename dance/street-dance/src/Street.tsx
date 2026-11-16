// A night-time shopping street, drawn in code with a tiny 3D projection.
// World units are metres: X left/right, Y up, Z away from the camera.
// Neon signs, string lights and lamps pulse with the beat.
import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { pulse, beatAt } from "./beat";

const W = 1080;
const H = 1920;
const VPX = W / 2;
const VPY = 930; // horizon
const F = 720; // focal length (px)
const CAM_Y = 1.7;
const STREET = 4.6; // building line, either side

const P = (x: number, y: number, z: number): [number, number] => [VPX + (F * x) / z, VPY + (F * (CAM_Y - y)) / z];
const poly = (pts: [number, number, number][]) => pts.map(([x, y, z]) => P(x, y, z).join(",")).join(" ");

// deterministic random
const rng = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

type Building = { side: -1 | 1; z0: number; z1: number; h: number; color: string; sign?: Sign; seed: number };
type Sign = { text: string; color: string; y: number };

const SIGN_TEXT = ["NOODLE", "CAFÉ", "24/7", "BOBA", "KARAOKE", "SHOES", "DIM SUM", "OPEN"];
const NEON = ["#ff3fa4", "#3ff2ff", "#ffd23f", "#9b5cff", "#4dff9a", "#ff6b3f"];
const WALLS = ["#2a1f45", "#33264f", "#251b3d", "#3a2a52", "#2c2240", "#3b2547"];

function makeBuildings(): Building[] {
  const r = rng(42);
  const out: Building[] = [];
  for (const side of [-1, 1] as const) {
    let z = 2.2;
    let k = side === -1 ? 0 : 3;
    while (z < 90) {
      const len = 4 + r() * 7 + z * 0.08;
      out.push({
        side,
        z0: z,
        z1: z + len,
        h: 9 + r() * 20,
        color: WALLS[Math.floor(r() * WALLS.length)],
        sign: z < 45 ? { text: SIGN_TEXT[k % SIGN_TEXT.length], color: NEON[k % NEON.length], y: 3.6 + r() * 1.2 } : undefined,
        seed: Math.floor(r() * 1e6),
      });
      k++;
      z += len + 0.4;
    }
  }
  // far ones first
  return out.sort((a, b) => b.z0 - a.z0);
}

const BuildingView: React.FC<{ b: Building; frame: number }> = ({ b, frame }) => {
  const X = b.side * STREET;
  const r = rng(b.seed);
  const windows: React.ReactNode[] = [];
  const floors = Math.floor((b.h - 4.5) / 3);
  const cols = Math.max(1, Math.floor((b.z1 - b.z0) / 2.2));
  for (let f = 0; f < floors; f++) {
    for (let c = 0; c < cols; c++) {
      const lit = r() < 0.55;
      const warm = r();
      const y0 = 5 + f * 3;
      const za = b.z0 + ((c + 0.25) * (b.z1 - b.z0)) / cols;
      const zb = b.z0 + ((c + 0.75) * (b.z1 - b.z0)) / cols;
      // a few windows flicker on the beat
      const flick = r() < 0.08 ? 0.5 + 0.5 * pulse(frame, 3, 2) : 1;
      windows.push(
        <polygon
          key={`${f}-${c}`}
          points={poly([[X, y0, za], [X, y0 + 1.6, za], [X, y0 + 1.6, zb], [X, y0, zb]])}
          fill={lit ? (warm < 0.6 ? "#ffcf7a" : warm < 0.85 ? "#ffe9b8" : "#9fe3ff") : "#1a1330"}
          opacity={lit ? 0.85 * flick : 0.9}
        />,
      );
    }
  }
  const shopGlow = b.sign ? b.sign.color : "#ffb36b";
  const zm = (b.z0 + b.z1) / 2;
  const signLen = Math.min(3.2, (b.z1 - b.z0) * 0.6);
  const beatGlow = 0.65 + 0.35 * pulse(frame, 4);
  return (
    <g>
      {/* facade */}
      <polygon points={poly([[X, 0, b.z0], [X, b.h, b.z0], [X, b.h, b.z1], [X, 0, b.z1]])} fill={b.color} />
      {/* the end wall facing the street (gives depth) */}
      <polygon
        points={poly([[X, 0, b.z0], [X, b.h, b.z0], [X + b.side * 3, b.h, b.z0], [X + b.side * 3, 0, b.z0]])}
        fill={b.color}
        style={{ filter: "brightness(0.7)" }}
      />
      {windows}
      {/* shop window */}
      <polygon
        points={poly([[X, 0.2, b.z0 + 0.5], [X, 2.8, b.z0 + 0.5], [X, 2.8, b.z1 - 0.5], [X, 0.2, b.z1 - 0.5]])}
        fill={shopGlow}
        opacity={0.28}
      />
      <polygon
        points={poly([[X, 0.2, b.z0 + 0.5], [X, 2.8, b.z0 + 0.5], [X, 2.8, b.z1 - 0.5], [X, 0.2, b.z1 - 0.5]])}
        fill="#fff3d6"
        opacity={0.12}
      />
      {/* awning */}
      <polygon
        points={poly([[X, 3.1, b.z0 + 0.3], [X - b.side * 1.1, 2.8, b.z0 + 0.3], [X - b.side * 1.1, 2.8, b.z1 - 0.3], [X, 3.1, b.z1 - 0.3]])}
        fill={shopGlow}
        opacity={0.55}
      />
      {/* neon sign: a vertical blade sign sticking out over the street */}
      {b.sign && zm < 45 && (
        <NeonBlade X={X} side={b.side} z={b.z0 + 0.8} y={b.sign.y} len={signLen} text={b.sign.text} color={b.sign.color} glow={beatGlow} />
      )}
    </g>
  );
};

const NeonBlade: React.FC<{ X: number; side: number; z: number; y: number; len: number; text: string; color: string; glow: number }> = ({
  X, side, z, y, text, color, glow,
}) => {
  // a board perpendicular to the facade, 1.1m out, 3.4m tall
  const x0 = X;
  const x1 = X - side * 1.15;
  const [ax, ay] = P(x0, y + 3.4, z);
  const [bx, by] = P(x1, y, z);
  const w = Math.abs(bx - ax);
  const h = Math.abs(by - ay);
  const cx = (ax + bx) / 2;
  const top = Math.min(ay, by);
  const chars = text.split("");
  const fs = Math.min(w * 0.62, (h / chars.length) * 0.82);
  return (
    <g>
      <rect x={Math.min(ax, bx)} y={top} width={w} height={h} rx={w * 0.12} fill="#130c22" stroke={color} strokeWidth={Math.max(1.5, w * 0.05)} opacity={0.95} />
      <g filter="url(#neon)" opacity={glow}>
        {chars.map((ch, i) => (
          <text
            key={i}
            x={cx}
            y={top + ((i + 0.78) * h) / chars.length}
            fontSize={fs}
            fontWeight={800}
            textAnchor="middle"
            fill={color}
            fontFamily="'Arial Rounded MT Bold', 'Helvetica Neue', Arial, sans-serif"
          >
            {ch}
          </text>
        ))}
      </g>
      {chars.map((ch, i) => (
        <text
          key={`w${i}`}
          x={cx}
          y={top + ((i + 0.78) * h) / chars.length}
          fontSize={fs}
          fontWeight={800}
          textAnchor="middle"
          fill="#fff"
          opacity={0.75 * glow}
          fontFamily="'Arial Rounded MT Bold', 'Helvetica Neue', Arial, sans-serif"
        >
          {ch}
        </text>
      ))}
    </g>
  );
};

const BULB = ["#ff5fb0", "#ffd84a", "#5ff0ff", "#9d7bff", "#5fff9e"];

const StringLights: React.FC<{ z: number; frame: number; i: number }> = ({ z, frame, i }) => {
  const pts: [number, number][] = [];
  const bulbs: React.ReactNode[] = [];
  const n = 18;
  const beat = Math.floor(beatAt(frame));
  for (let k = 0; k <= n; k++) {
    const x = -STREET + (2 * STREET * k) / n;
    const y = 6.2 - 1.3 * (1 - (x / STREET) ** 2);
    const [sx, sy] = P(x, y, z);
    pts.push([sx, sy]);
    if (k > 0 && k < n) {
      const on = (k + beat + i) % 3 !== 0 ? 1 : 0.35;
      const r = Math.max(2, (F * 0.09) / z);
      const c = BULB[(k + i) % BULB.length];
      bulbs.push(
        <g key={k} opacity={on}>
          <circle cx={sx} cy={sy + r} r={r * 3.2} fill={c} opacity={0.22} />
          <circle cx={sx} cy={sy + r} r={r} fill={c} />
          <circle cx={sx - r * 0.3} cy={sy + r * 0.7} r={r * 0.35} fill="#fff" opacity={0.8} />
        </g>,
      );
    }
  }
  return (
    <g>
      <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke="#120a1f" strokeWidth={Math.max(1, F * 0.02 / z)} />
      {bulbs}
    </g>
  );
};

const Lamp: React.FC<{ side: number; z: number; frame: number }> = ({ side, z }) => {
  const X = side * (STREET - 0.9);
  const [bx, by] = P(X, 0, z);
  const [tx, ty] = P(X, 5.2, z);
  const [hx, hy] = P(X - side * 0.7, 5.1, z);
  const w = Math.max(2, (F * 0.12) / z);
  const glowR = (F * 2.4) / z;
  return (
    <g>
      <line x1={bx} y1={by} x2={tx} y2={ty} stroke="#0d0818" strokeWidth={w} />
      <line x1={tx} y1={ty} x2={hx} y2={hy} stroke="#0d0818" strokeWidth={w * 0.8} />
      <circle cx={hx} cy={hy + w} r={glowR} fill="url(#lampGlow)" />
      <circle cx={hx} cy={hy + w} r={w * 1.1} fill="#fff4cf" />
      {/* pool of light on the ground */}
      <ellipse cx={P(X - side * 0.7, 0, z)[0]} cy={P(X, 0, z)[1]} rx={glowR * 1.1} ry={glowR * 0.25} fill="#ffcf7a" opacity={0.13} />
    </g>
  );
};

export const Street: React.FC = () => {
  const frame = useCurrentFrame();
  const buildings = useMemo(makeBuildings, []);
  const g = pulse(frame, 5);

  const road = poly([[-STREET, 0, 1], [STREET, 0, 1], [STREET, 0, 400], [-STREET, 0, 400]]);
  const sidewalkL = poly([[-STREET, 0, 1], [-STREET + 1.6, 0, 1], [-STREET + 1.6, 0, 400], [-STREET, 0, 400]]);
  const sidewalkR = poly([[STREET, 0, 1], [STREET - 1.6, 0, 1], [STREET - 1.6, 0, 400], [STREET, 0, 400]]);

  // zebra crossing right under the dancer
  const zebra = [];
  for (let k = 0; k < 6; k++) {
    const z0 = 1.9 + k * 0.6;
    zebra.push(<polygon key={k} points={poly([[-2.4, 0, z0], [2.4, 0, z0], [2.4, 0, z0 + 0.3], [-2.4, 0, z0 + 0.3]])} fill="#cfc4e6" opacity={0.42} />);
  }
  const dashes = [];
  for (let z = 6; z < 120; z *= 1.28) {
    dashes.push(<polygon key={z} points={poly([[-0.08, 0, z], [0.08, 0, z], [0.08, 0, z * 1.12], [-0.08, 0, z * 1.12]])} fill="#ffd25e" opacity={0.7} />);
  }

  // distant skyline
  const r = rng(7);
  const skyline = [];
  for (let x = -40; x < W + 40; ) {
    const w = 30 + r() * 70;
    const h = 60 + r() * 220;
    skyline.push(<rect key={x} x={x} y={VPY - h} width={w} height={h} fill="#3a2458" opacity={0.85} />);
    x += w - 6;
  }

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0f0b2e" />
          <stop offset="0.45" stopColor="#3b1d5e" />
          <stop offset="0.78" stopColor="#a33a78" />
          <stop offset="1" stopColor="#ff8a5c" />
        </linearGradient>
        <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a2b55" />
          <stop offset="1" stopColor="#17112a" />
        </linearGradient>
        <radialGradient id="lampGlow">
          <stop offset="0" stopColor="#ffe3a3" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffe3a3" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="horizonGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffb07a" stopOpacity="0.7" />
          <stop offset="1" stopColor="#ffb07a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="spot" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ff7ad9" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ff7ad9" stopOpacity="0" />
        </radialGradient>
        <filter id="neon" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width={W} height={VPY + 2} fill="url(#sky)" />
      {/* a few stars */}
      {Array.from({ length: 40 }, (_, i) => {
        const rr = rng(100 + i);
        return <circle key={i} cx={rr() * W} cy={rr() * 420} r={1 + rr() * 1.6} fill="#fff" opacity={0.3 + 0.5 * Math.abs(Math.sin(frame / 9 + i))} />;
      })}
      <ellipse cx={VPX} cy={VPY} rx={520} ry={160} fill="url(#horizonGlow)" />
      {skyline}

      <polygon points={road} fill="url(#road)" />
      <polygon points={sidewalkL} fill="#4a3a66" />
      <polygon points={sidewalkR} fill="#4a3a66" />
      {dashes}

      {buildings.filter((b) => b.z0 > 30).map((b, i) => <BuildingView key={`f${i}`} b={b} frame={frame} />)}
      {[60, 40, 26, 17, 11].map((z, i) => <StringLights key={z} z={z} frame={frame} i={i} />)}
      {[44, 28, 18].flatMap((z) => [<Lamp key={`l${z}`} side={-1} z={z} frame={frame} />, <Lamp key={`r${z}`} side={1} z={z} frame={frame} />])}
      {buildings.filter((b) => b.z0 <= 30).map((b, i) => <BuildingView key={`n${i}`} b={b} frame={frame} />)}
      {[10, 7].flatMap((z) => [<Lamp key={`l${z}`} side={-1} z={z} frame={frame} />, <Lamp key={`r${z}`} side={1} z={z} frame={frame} />])}

      {zebra}
      {/* wet-road reflections of the neon */}
      <ellipse cx={VPX - 260} cy={1420} rx={90} ry={260} fill="#ff3fa4" opacity={0.08 + 0.06 * g} />
      <ellipse cx={VPX + 280} cy={1460} rx={90} ry={280} fill="#3ff2ff" opacity={0.07 + 0.06 * g} />
      {/* spotlight on the dancer, pumps with the kick */}
      <ellipse cx={VPX} cy={1545} rx={430 + 40 * g} ry={120 + 10 * g} fill="url(#spot)" opacity={0.7 + 0.3 * g} />
    </svg>
  );
};
