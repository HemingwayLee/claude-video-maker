const TIME = /(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})/;

const seconds = (stamp) => {
  const [, h, m, s, ms] = stamp.match(TIME);
  return +h * 3600 + +m * 60 + +s + +ms.padEnd(3, "0") / 1000;
};

/** Parse SRT text into cues: [{index, start, end, text}], sorted by start time. */
export function parseSrt(text) {
  const cues = [];
  for (const block of text.replace(/\r\n?/g, "\n").split(/\n{2,}/)) {
    const lines = block.trim().split("\n");
    const at = lines.findIndex((l) => l.includes("-->"));
    if (at === -1) continue;
    const [a, b] = lines[at].split("-->");
    if (!TIME.test(a) || !TIME.test(b)) continue;
    cues.push({ start: seconds(a), end: seconds(b), text: lines.slice(at + 1).join("\n").trim() });
  }
  cues.sort((x, y) => x.start - y.start);
  return cues.map((c, i) => ({ ...c, index: i + 1 }));
}

/** Index of the cue showing at time t, or -1. */
export function cueAt(cues, t) {
  let lo = 0;
  let hi = cues.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (cues[mid].start <= t) {
      found = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return found !== -1 && t < cues[found].end ? found : -1;
}
