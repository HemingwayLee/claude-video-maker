import { createContext, useContext } from "react";
import narration from "./narration.json";

// Turns the narration script into frame numbers.
//
// Every line of narration gets a time slot. If a voice clip exists for the
// line (see scripts/voiceover.mjs), the slot is as long as the clip; if not,
// the length is estimated from the number of characters. Scenes are then laid out back
// to back. Scene animations are timed against their lines (useLines), so
// the visuals stay in sync with the voice whatever voice or speed you use.

export const FPS = 30;

const CHARS_PER_SECOND = 4.3; // estimate when there is no voice clip (Chinese: characters, not words)
const GAP_AFTER_LINE = 0.45; // breathing room after each line (s)
const SCENE_LEAD_IN = 0.6; // silence before a scene's first line (s)
const SCENE_TAIL = 0.5; // silence after a scene's last line (s)

export type LineTiming = {
  key: string; // e.g. "area-2", also the voice clip's file name
  text: string;
  from: number; // first frame, relative to the scene
  duration: number; // frames
  audio: string | null; // path inside public/, or null
};

export type SceneTiming = {
  id: string;
  title: string;
  index: number;
  from: number; // first frame, relative to the video
  duration: number;
  lines: LineTiming[];
};

export type Timeline = {
  scenes: SceneTiming[];
  durationInFrames: number;
};

// Clip lengths in seconds, keyed by line key (public/voice/manifest.json).
export type VoiceManifest = Record<string, number>;

type LineDef = { text: string; speech?: string; pad?: number };
type SceneDef = { id: string; title: string; lines: LineDef[] };
const SCENES: SceneDef[] = narration.scenes;

const sec = (s: number) => Math.round(s * FPS);

// Characters that are actually spoken (punctuation is not).
const spokenChars = (text: string) => text.replace(/[\s，。！？、：；「」『』,.!?:;]/g, "").length;

export const buildTimeline = (voice: VoiceManifest | null): Timeline => {
  let cursor = 0;
  const scenes = SCENES.map((scene, index): SceneTiming => {
    let t = sec(SCENE_LEAD_IN);
    const lines = scene.lines.map((line, i): LineTiming => {
      const key = `${scene.id}-${i}`;
      const clip = voice?.[key];
      const spoken = clip ?? spokenChars(line.speech ?? line.text) / CHARS_PER_SECOND;
      const timing: LineTiming = {
        key,
        text: line.text,
        from: t,
        duration: sec(spoken + GAP_AFTER_LINE + (line.pad ?? 0)),
        audio: clip === undefined ? null : `voice/${key}.wav`,
      };
      t += timing.duration;
      return timing;
    });
    const duration = t + sec(SCENE_TAIL);
    const timing = { id: scene.id, title: scene.title, index, from: cursor, duration, lines };
    cursor += duration;
    return timing;
  });
  return { scenes, durationInFrames: cursor };
};

// Each scene component reads its own timing from this context.
export const SceneContext = createContext<SceneTiming | null>(null);

export const useScene = (): SceneTiming => {
  const scene = useContext(SceneContext);
  if (!scene) throw new Error("useScene() must be used inside a scene");
  return scene;
};

// Start frame of every line in the current scene: L[2] is when line 2 starts.
// L[L.length] is the scene's last frame, handy as an "end" marker.
export const useLines = (): number[] => {
  const scene = useScene();
  return [...scene.lines.map((l) => l.from), scene.duration];
};
