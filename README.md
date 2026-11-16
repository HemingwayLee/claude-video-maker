# claude-video-maker

Narrated explainer videos made **entirely with code**. Each video is a small
[Remotion](https://www.remotion.dev/) project: React components are rendered
frame by frame in a headless Chrome and encoded to MP4 with ffmpeg.

| Project            | Video                                   |
| ------------------ | --------------------------------------- |
| `helloworld/`      | A 15-second "Hello World" starter       |
| `ml/gan/`          | GAN architecture                        |
| `ml/cGAN/`         | Conditional GAN                         |
| `ml/Pix2Pix/`      | Pix2Pix (U-Net + PatchGAN + cGAN/L1)    |
| `ml/cnn/`          | CNN architecture                        |
| `ml/diffusion/`    | Diffusion models                        |
| `ml/transformer/`  | Transformer architecture                |
| `dance/street-dance/` | 15 s vertical street dance (sticker girl) |

Each project has its own README with the scene list and details.

## How a video is made

There is no HTML file in between. The React code is the video. Remotion
draws each frame in a headless browser, captures a screenshot of it, and
ffmpeg encodes the screenshots into the MP4.

```
narration.json ──► voiceover.mjs ──► public/voice/*.wav + manifest.json
   (script)        (macOS `say`)         (clip lengths)
                                              │
train-*.mjs ──► *-trace.json                  │   (optional: real model data shown in the video)
                                              ▼
            React scenes (src/scenes/*.tsx) + timeline.ts
                                              │
                          remotion render
                                              ▼
      headless Chrome draws frame 0, 1, 2… ──► screenshot each (JPEG)
                                              ▼
                 ffmpeg: frames + audio ──► out/<video>.mp4
```

1. **Script.** All the spoken lines and captions are in `src/narration.json`,
   one entry per scene and one line per caption.
2. **Voice.** `npm run voiceover` turns each line into a WAV file using
   macOS `say`. It also writes `public/voice/manifest.json`, which records
   how long each clip is.
3. **Data (optional).** Some projects have `npm run train`, which trains a
   tiny real model (hand-written, no ML library) and saves a record of the
   training to `src/*-trace.json`. The video plays that record back, so the
   outputs you see on screen are real.
4. **Timing.** `src/timeline.ts` uses the clip lengths to work out the frame
   where each line starts. Scenes time their animations to those frames
   (`L[0]`, `L[1]`, …), so the picture stays in sync with the voice.
5. **Scenes.** Each file in `src/scenes/` is a React component. It calls
   `useCurrentFrame()` and draws whatever should be on screen at that frame.
   In other words, the video is a function of the frame number.
6. **Render.** `npm run render` (`remotion render`) opens headless Chrome,
   captures every frame (1920×1080, 30 fps), and has ffmpeg mix in the audio
   to produce the MP4.

`npm run studio` opens a browser preview where you can scrub through the
timeline and see code changes live. It is only a preview, not a step in
making the video.

## Quick start

Requires Node.js 18+. The voiceover step needs macOS; without it the video
renders silent, with captions.

```bash
cd ml/Pix2Pix        # or any other project
npm install
npm run voiceover    # macOS: narration.json → public/voice/
npm run render       # → out/*.mp4
```
