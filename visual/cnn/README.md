# CNN architecture: a narrated explainer video

A 4 min 47 s, 1920×1080 (16:9), 30 fps MP4 that explains how a
**Convolutional Neural Network** works, made **entirely with code** using
[Remotion](https://www.remotion.dev/) (React → video). It has a spoken
voiceover, on-screen captions, and an animated diagram for every idea.

Every number shown in the video is computed by the code: the convolutions,
ReLU and pooling in the video are the real operations (see `src/data.ts`).

| Time      | #  | Scene                    | Visual aid                                                                 |
| --------- | -- | ------------------------ | -------------------------------------------------------------------------- |
| 0:00–0:12 |    | Intro                    | Pixel-art cat, title, the four building blocks                            |
| 0:12–0:27 | 01 | Images are numbers       | The cat as a 16×16 grid of brightness values, then split into R, G, B     |
| 0:27–0:57 | 02 | Why not a regular network? | Pixels flatten into a column wired to every neuron; 150,528,000-weight counter; the same cat shifted gives an unrelated vector |
| 0:57–1:32 | 03 | Convolution              | 3×3 kernel slides over an 8×8 image; the 9 products and their sum are written out; the 6×6 feature map fills in and reveals the edges |
| 1:32–1:57 | 04 | Weight sharing & filters | One kernel reused at many spots; 9 vs 150 million weights; 3 filters on the cat give 3 feature maps that stack into a volume |
| 1:57–2:16 | 05 | Stride & padding         | Stride 2 (7×7 → 3×3) and zero padding (5×5 → 5×5) side by side, plus the output-size formula |
| 2:16–2:35 | 06 | Activation: ReLU         | The `max(0, x)` graph; negative values in the feature map flip to 0       |
| 2:35–2:54 | 07 | Pooling                  | 2×2 max pooling: each block's winner flies into the 2×2 output            |
| 2:54–3:20 | 08 | Stacking layers          | Conv→ReLU→Pool ×3; early / middle / deep features (edges → shapes → objects); maps shrink, channels grow |
| 3:20–3:44 | 09 | The full architecture    | 3-D layer volumes from input to flatten, dense and softmax (92 % cat)     |
| 3:44–4:10 | 10 | Training                 | Guess → loss → backpropagation loop; a random kernel learns to become an edge detector; loss curve |
| 4:10–4:31 | 11 | Famous CNNs              | Timeline: LeNet-5 (1998), AlexNet (2012), VGG-16 (2014), ResNet (2015)    |
| 4:31–4:47 | 12 | Recap                    | One card per building block, and the whole pipeline in one line          |

A progress bar along the bottom edge has one segment per scene.

---

## 1. Reproduce the video

**Requirements**

- Node.js 18 or newer (`node -v`). Remotion downloads its own headless Chrome
  and ships its own ffmpeg, so nothing else is needed to render.
- macOS for the voiceover: it uses the built-in `say` text-to-speech command.
  Without it the video still renders, with captions but no sound (see 1.2).

```bash
cd visual/cnn
npm install          # install Remotion, React, TypeScript
npm run voiceover    # macOS: write one WAV per narration line → public/voice/
npm run render       # → out/cnn-explainer.mp4  (takes a few minutes)
```

Other commands:

```bash
npm run studio       # open an editor in the browser: scrub the timeline,
                     # edit code and see changes live
npm run still        # export one frame → out/thumbnail.png
npx remotion render CnnExplainer out/preview.mp4 --scale=0.5   # quick 960×540 preview
```

### 1.1 Choosing the voice

```bash
say -v '?'                                   # list the voices on your Mac
VOICE="Daniel" npm run voiceover             # British English
VOICE="Samantha" RATE=160 npm run voiceover  # slower (words per minute, default 175)
```

Better voices can be downloaded in *System Settings → Accessibility → Spoken
Content → System Voice → Manage Voices* (look for "Enhanced" or "Premium").
Then pass their name in `VOICE`.

You don't need to change anything else: the length of every scene follows
the length of its voice clips (see 3.2), so a slower voice gives a longer
video, still in sync.

### 1.2 No Mac, or no voice wanted

Skip `npm run voiceover` (or delete `public/voice/`). The video renders
silent with captions, and each line's time is estimated from its word count.

To use another text-to-speech tool, write one WAV file per line to
`public/voice/<scene>-<line>.wav` (for example `convolution-2.wav`) and a
`public/voice/manifest.json` that maps each name to its length in seconds:

```json
{ "intro-0": 2.9, "intro-1": 4.1 }
```

### 1.3 Troubleshooting

**`ProtocolError ... Target closed`** means the headless Chrome Remotion
downloaded could not start. This happened on the machine this was built on.
Try these in order:

1. Delete it so it downloads again (a partial download is a common cause):
   `rm -rf node_modules/.remotion && npx remotion browser ensure`
2. Use any other Chrome/Chromium binary through the `BROWSER_EXECUTABLE`
   environment variable (read in `remotion.config.ts`). The video in `out/`
   was rendered with Playwright's headless shell
   (`npx playwright install chromium-headless-shell`):

   ```bash
   BROWSER_EXECUTABLE=$(ls -d ~/Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-mac-arm64/chrome-headless-shell | tail -1) \
     npm run render
   ```

   Or, with regular Google Chrome:
   `BROWSER_EXECUTABLE="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run render`

---

## 2. Project layout

```
visual/cnn/
├── package.json            # dependencies + npm scripts
├── remotion.config.ts      # render settings (image format, browser path)
├── scripts/
│   └── voiceover.mjs       # narration.json → public/voice/*.wav + manifest.json
├── public/voice/           # generated voice clips (git-ignored)
└── src/
    ├── narration.json      # THE SCRIPT: every caption / spoken line, per scene
    ├── timeline.ts         # turns the script + clip lengths into frame numbers
    ├── index.ts            # entry point: registerRoot()
    ├── Root.tsx            # <Composition>: 1920×1080, 30 fps, length from the voice
    ├── CnnVideo.tsx        # puts the scenes, captions and audio on the timeline
    ├── data.ts             # the images, kernels, and the real convolution math
    ├── theme.ts            # colors and fonts
    ├── anim.ts             # fade / pop / lerp animation helpers
    ├── components/
    │   ├── Grid.tsx        # a matrix drawn as cells (+ the sliding Window)
    │   ├── Slab.tsx        # a layer volume drawn as a 3-D slab
    │   ├── Text.tsx        # Label and Card
    │   └── Chrome.tsx      # scene header, captions, progress bar
    └── scenes/             # one file per scene, in video order
        ├── Intro.tsx  Pixels.tsx  Dense.tsx  Convolution.tsx  Filters.tsx
        ├── Stride.tsx  Relu.tsx  Pooling.tsx  Hierarchy.tsx
        └── Architecture.tsx  Training.tsx  History.tsx  Recap.tsx
```

---

## 3. How it works

### 3.1 Video = a function of the frame number

As in the `helloworld` project: every component asks `useCurrentFrame()` and
draws what should be on screen at that frame. Remotion opens a headless
Chrome, screenshots frame 0, 1, 2, … and ffmpeg encodes the screenshots into
an H.264 MP4 with the audio mixed in.

### 3.2 The script drives the timing

The hard part of a narrated video is keeping pictures and voice in sync. Here
the narration is the single source of truth:

1. `src/narration.json` lists the scenes, and the lines spoken in each one.
   A line can have `speech` (how to pronounce it, e.g. "ray-loo" for ReLU)
   and `pad` (extra seconds after it, so an animation can finish).
2. `npm run voiceover` turns each line into a WAV clip and measures it.
3. Before rendering, `calculateMetadata` in `Root.tsx` reads
   `manifest.json`, and `buildTimeline()` in `timeline.ts` gives every line a
   slot as long as its clip (+ a short gap + `pad`). Scenes are placed back to
   back; the total becomes the video's length.
4. `CnnVideo.tsx` puts each scene in a `<Sequence>`, and inside it each line
   in its own `<Sequence>` with the caption and the `<Html5Audio>` clip.
5. Scenes time their animations against their own lines:

   ```tsx
   const L = useLines();               // start frame of each line in this scene
   const opacity = fade(frame, L[2]);  // appears when line 2 starts
   ```

   So when you rewrite a line or change the voice, the animations move with it.

### 3.3 Real math, not drawings

`src/data.ts` holds the 16×16 pixel-art cat, the 8×8 test image, the kernels,
and a real `convolve()` (cross-correlation, as in PyTorch/TensorFlow), `relu()`
and pooling input. The convolution scene, the three feature maps of the cat,
the ReLU scene and the pooling scene all show computed values.

---

## 4. Make it your own

| I want to…                        | Change this                                                            |
| --------------------------------- | ---------------------------------------------------------------------- |
| change what is said               | the `text` (caption) / `speech` (voice) in `src/narration.json`, then `npm run voiceover` |
| give an animation more time       | add or raise `pad` on that line in `narration.json`                    |
| change the voice or speed         | `VOICE=… RATE=… npm run voiceover`                                     |
| use a different example image     | `CAT_ART` or `BOX` in `src/data.ts`                                    |
| try a different kernel            | `KERNELS` in `src/data.ts`: the feature maps are recomputed            |
| change colors / fonts             | `src/theme.ts`                                                         |
| make a vertical (9:16) version    | `width={1080} height={1920}` in `src/Root.tsx`, then re-lay out scenes  |
| add a scene                       | add it to `narration.json`, create `src/scenes/MyScene.tsx`, register it in `SCENE_COMPONENTS` in `src/CnnVideo.tsx` |
| hide the captions                 | remove `<Caption … />` in `src/CnnVideo.tsx`                           |

Use `npm run studio` while editing: it updates live and you can scrub to any
frame. (Run `npm run voiceover` first so the studio uses the real timings.)

---

## 5. License note

Remotion is free for individuals and companies with up to 3 employees. Larger
companies need a company license; see
[remotion.dev/license](https://www.remotion.dev/license). The macOS system
voices are licensed for use on your Mac; check Apple's terms before publishing
videos commercially, or use another TTS tool (see 1.2).
