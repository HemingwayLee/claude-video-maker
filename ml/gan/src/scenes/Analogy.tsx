import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, lerp, pop } from "../anim";
import { Card, Label } from "../components/Text";
import { COLORS, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

const mix = (a: number[], b: number[], t: number) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;

// A banknote; `q` 0..1 is how good the forgery is (1 = perfect).
const Banknote: React.FC<{ q: number }> = ({ q }) => {
  const base = mix([150, 120, 80], [78, 154, 115], q);
  const ink = mix([90, 60, 40], [24, 82, 58], q);
  return (
    <svg width={440} height={220} viewBox="0 0 440 220" style={{ transform: `rotate(${(1 - q) * -6}deg)` }}>
      <rect x={4} y={4} width={432} height={212} rx={12} fill={base} stroke={ink} strokeWidth={4} />
      <rect x={20} y={20} width={400} height={180} rx={8} fill="none" stroke={ink} strokeWidth={2} strokeDasharray="6 4" opacity={q} />
      {/* portrait */}
      <ellipse cx={220} cy={110} rx={58 * (0.6 + 0.4 * q)} ry={70 * (0.6 + 0.4 * q)} fill={mix([190, 160, 110], [150, 205, 170], q)} stroke={ink} strokeWidth={3} />
      <circle cx={220} cy={92} r={20} fill={ink} opacity={0.25 + 0.75 * q} />
      <path d="M 186 150 Q 220 118 254 150" fill={ink} opacity={0.25 + 0.75 * q} />
      {/* denomination */}
      <text x={56} y={66} fontSize={40} fontWeight={800} fill={ink} fontFamily={MONO} transform={`rotate(${(1 - q) * 14} 56 66)`}>
        {q < 0.35 ? "1OO" : "100"}
      </text>
      <text x={384} y={190} fontSize={40} fontWeight={800} fill={ink} fontFamily={MONO} textAnchor="end" opacity={0.3 + 0.7 * q}>
        100
      </text>
      {/* security strip */}
      <rect x={320} y={4} width={10} height={212} fill="#d6e8ff" opacity={q * 0.7} />
      {/* smudges of a bad forgery */}
      <g opacity={1 - q}>
        <circle cx={120} cy={160} r={22} fill="#5a3a20" opacity={0.5} />
        <circle cx={350} cy={70} r={14} fill="#5a3a20" opacity={0.5} />
        <path d="M 60 120 L 140 100" stroke="#3a2010" strokeWidth={4} />
      </g>
    </svg>
  );
};

const Pencil: React.FC<{ color: string }> = ({ color }) => (
  <svg width={130} height={130} viewBox="0 0 100 100">
    <g transform="rotate(45 50 50)">
      <rect x={40} y={8} width={20} height={62} rx={3} fill={color} />
      <rect x={40} y={8} width={20} height={10} fill="#ffd166" />
      <polygon points="40,70 60,70 50,92" fill="#f2d2b0" />
      <polygon points="46,84 54,84 50,92" fill="#222" />
    </g>
  </svg>
);

const Magnifier: React.FC<{ color: string }> = ({ color }) => (
  <svg width={130} height={130} viewBox="0 0 100 100">
    <circle cx={42} cy={42} r={26} fill={`${color}22`} stroke={color} strokeWidth={8} />
    <line x1={61} y1={61} x2={88} y2={88} stroke={color} strokeWidth={12} strokeLinecap="round" />
  </svg>
);

const Meter: React.FC<{ x: number; y: number; value: number; color: string; label: string; opacity: number }> = ({ x, y, value, color, label, opacity }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 360, opacity }}>
    <div style={{ fontSize: 24, color: COLORS.muted, marginBottom: 8 }}>{label}</div>
    <div style={{ height: 22, borderRadius: 11, background: "rgba(255,255,255,0.08)" }}>
      <div style={{ width: `${value * 100}%`, height: "100%", borderRadius: 11, background: color }} />
    </div>
  </div>
);

export const Analogy: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  // Skill of each player over time: they take turns improving.
  const forger = lerp(frame, [L[0], L[2], L[2] + 50, L[4], L[4] + 30, L[4] + 60, L[4] + 90], [0.1, 0.1, 0.5, 0.5, 0.75, 0.75, 0.95]);
  const detective = lerp(frame, [L[0], L[3], L[3] + 40, L[4] + 15, L[4] + 45, L[4] + 75, L[4] + 105], [0.15, 0.15, 0.6, 0.6, 0.8, 0.8, 0.95]);
  const quality = forger;

  // The detective's verdict on the current note.
  const verdicts: { at: number; text: string; color: string }[] = [
    { at: L[1] + 10, text: "FAKE!", color: COLORS.red },
    { at: L[2] + 55, text: "real…?", color: COLORS.yellow },
    { at: L[3] + 45, text: "FAKE!", color: COLORS.red },
    { at: L[4] + 110, text: "can't tell", color: COLORS.muted },
  ];
  const current = [...verdicts].reverse().find((v) => frame >= v.at);
  const stamp = current ? pop(frame, fps, current.at, 12) : 0;

  return (
    <AbsoluteFill>
      {/* the forger */}
      <Card x={110} y={250} w={420} h={420} accent={ROLE.gen} opacity={fade(frame, L[0])}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 50 }}>
          <Pencil color={ROLE.gen} />
          <div style={{ fontSize: 46, fontWeight: 800, color: ROLE.gen, marginTop: 24 }}>Forger</div>
          <div style={{ fontSize: 26, color: COLORS.muted, marginTop: 8 }}>makes fake money</div>
        </div>
      </Card>
      {/* the detective */}
      <Card x={1390} y={250} w={420} h={420} accent={ROLE.disc} opacity={fade(frame, L[0] + 10)}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 50 }}>
          <Magnifier color={ROLE.disc} />
          <div style={{ fontSize: 46, fontWeight: 800, color: ROLE.disc, marginTop: 24 }}>Detective</div>
          <div style={{ fontSize: 26, color: COLORS.muted, marginTop: 8 }}>spots the fakes</div>
        </div>
      </Card>

      {/* the note being judged */}
      <div style={{ position: "absolute", left: 740, top: 300, opacity: fade(frame, L[0] + 20) }}>
        <Banknote q={quality} />
      </div>
      <Label x={960} y={250} size={26} color={COLORS.muted} center opacity={fade(frame, L[0] + 20)}>
        forgery quality: <span style={{ fontFamily: MONO, color: COLORS.text }}>{Math.round(quality * 100)}%</span>
      </Label>
      {current ? (
        <div
          style={{
            position: "absolute",
            left: 960,
            top: 580,
            transform: `translateX(-50%) scale(${stamp}) rotate(-6deg)`,
            padding: "10px 34px",
            border: `5px solid ${current.color}`,
            borderRadius: 12,
            color: current.color,
            fontSize: 52,
            fontWeight: 900,
            letterSpacing: 3,
            whiteSpace: "nowrap",
          }}
        >
          {current.text}
        </div>
      ) : null}

      {/* the arms race */}
      <Meter x={140} y={730} value={forger} color={ROLE.gen} label="forger's skill" opacity={fade(frame, L[2])} />
      <Meter x={1420} y={730} value={detective} color={ROLE.disc} label="detective's skill" opacity={fade(frame, L[2])} />
      <Label x={960} y={750} size={30} weight={700} color={COLORS.yellow} center opacity={fade(frame, L[4])}>
        ⇄ each one forces the other to improve
      </Label>
    </AbsoluteFill>
  );
};
