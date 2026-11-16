// Generates the voiceover: one WAV clip per narration line, using the
// text-to-speech voice built into macOS (`say`).
//
//   npm run voiceover                     # default voice: Meijia (Taiwanese Mandarin)
//   VOICE="Flo (Chinese (Taiwan))" npm run voiceover
//   RATE=200 npm run voiceover            # faster (default: the voice's own speed)
//   say -v '?' | grep zh_TW               # list the Taiwanese voices on your Mac
//
// Output:
//   public/voice/<scene>-<line>.wav       # the clips
//   public/voice/manifest.json            # { "<scene>-<line>": seconds, ... }
//
// The video reads manifest.json when it starts (calculateMetadata in
// src/Root.tsx) and stretches every line's time slot to fit its clip.
// Without the folder, the video still renders, silent.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const narration = JSON.parse(readFileSync(join(root, "src/narration.json"), "utf8"));
const outDir = join(root, "public/voice");

const VOICE = process.env.VOICE ?? "Meijia";
const RATE = process.env.RATE; // words per minute; unset = the voice's default

if (process.platform !== "darwin") {
  console.error("This script uses the macOS `say` command. See README.md for other options.");
  process.exit(1);
}

// Duration of a PCM WAV file: size of the "data" chunk / bytes per second.
const wavSeconds = (buf) => {
  const byteRate = buf.readUInt32LE(28);
  let offset = 12;
  while (offset < buf.length) {
    const id = buf.toString("ascii", offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    if (id === "data") return size / byteRate;
    offset += 8 + size + (size % 2);
  }
  throw new Error("no data chunk in WAV file");
};

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const manifest = {};
let total = 0;
for (const scene of narration.scenes) {
  scene.lines.forEach((line, i) => {
    const key = `${scene.id}-${i}`;
    const file = join(outDir, `${key}.wav`);
    execFileSync("say", [
      "-v", VOICE,
      ...(RATE ? ["-r", RATE] : []),
      "-o", file,
      "--file-format=WAVE",
      "--data-format=LEI16@24000",
      line.speech ?? line.text,
    ]);
    const seconds = Number(wavSeconds(readFileSync(file)).toFixed(3));
    manifest[key] = seconds;
    total += seconds;
    console.log(`${key.padEnd(10)} ${seconds.toFixed(2).padStart(6)}s  ${line.text}`);
  });
}

writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`\n${Object.keys(manifest).length} clips, ${total.toFixed(1)}s of speech → public/voice/`);
