import React from "react";
import { CROWN_Y, HAND_Y, LAST_HAND_Y, RACHIS_X, TRUNK_X } from "../plant";
import { COLORS, INK } from "../theme";
import { type Cam, toScreen } from "./World";

// Little glowing drops that travel from the trunk, down the stalk, into
// the fruit, ending at world y `bottom`. Past the last hand they are going
// to the flower part, not the bananas, so they turn red.
export const Nutrients: React.FC<{ frame: number; cam: Cam; bottom: number; show: number }> = ({ frame, cam, bottom, show }) => {
  if (frame < 0 || show <= 0) return null;
  const start: [number, number] = [TRUNK_X + 5, CROWN_Y + 15];
  const c1: [number, number] = [TRUNK_X + 60, CROWN_Y - 90];
  const c2: [number, number] = [RACHIS_X - 40, CROWN_Y - 70];
  const end: [number, number] = [RACHIS_X, HAND_Y[0] - 30];
  const at = (t: number): [number, number] => {
    // first half: along the arching stalk; second half: straight down
    if (t < 0.4) {
      const u = t / 0.4;
      const v = 1 - u;
      return [
        v * v * v * start[0] + 3 * v * v * u * c1[0] + 3 * v * u * u * c2[0] + u * u * u * end[0],
        v * v * v * start[1] + 3 * v * v * u * c1[1] + 3 * v * u * u * c2[1] + u * u * u * end[1],
      ];
    }
    const u = (t - 0.4) / 0.6;
    return [RACHIS_X, end[1] + (bottom - end[1]) * u];
  };
  const n = 9;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", opacity: show }}>
      {Array.from({ length: n }, (_, i) => {
        const t = ((frame / 70 + i / n) % 1 + 1) % 1;
        const [wx, wy] = at(t);
        const [x, y] = toScreen(cam, wx, wy);
        const stolen = wy > LAST_HAND_Y + 20;
        return <circle key={i} cx={x} cy={y} r={15} fill={stolen ? COLORS.red : COLORS.nutrient} stroke={INK} strokeWidth={4} />;
      })}
    </svg>
  );
};
