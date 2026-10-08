# Conditional GAN (cGAN) architecture: a narrated explainer video

A 4 min 52 s, 1920×1080 (16:9), 30 fps MP4 that explains how a
**conditional Generative Adversarial Network** works: a GAN that you can ask
for a specific kind of output. It is made **entirely with code** using
[Remotion](https://www.remotion.dev/) (React → video), with a spoken
voiceover, on-screen captions, and an animated diagram for every idea.

The centerpiece is **a real cGAN**: `scripts/train-cgan.mjs` trains a tiny
conditional generator and discriminator (hand-written backpropagation, no ML
library) on 1-D data with three classes, records how they learn, and the
video plays that recording back. The densities, the D(x | y) curves, and the
D values quoted in scene 05 come from that run.

This project builds on the GAN video in `../gan`. Watch that one first if
GANs are new to you.

| Time      | #  | Scene                       | Visual aid                                                                 |
| --------- | -- | --------------------------- | -------------------------------------------------------------------------- |
| 0:00–0:19 |    | Intro                       | 12 random faces; asking for y = glasses puts glasses on all of them; title and paper |
| 0:19–0:36 | 01 | The problem: no control     | z → G → face; redrawing the noise attempt after attempt until glasses appear; G has no input for "glasses" |
| 0:36–0:59 | 02 | The idea: add a condition   | y flows into both G and D; what y can be; the forger gets an order for a $20 note |
| 0:59–1:24 | 03 | The architecture            | (z, y) → G → fake + y; training set gives (image, true label); pairs travel into D → D(x \| y); the label cycles through every class |
| 1:24–1:56 | 04 | Feeding in the condition    | One-hot vector; [z \| y] concatenated for G; one label plane per class for an image D; label embedding and projection discriminator |
| 1:56–2:16 | 05 | Two ways to be fake         | Real + matching → REAL; looks fake → FAKE; real-looking but wrong label → FAKE; measured D(3.0 \| C) vs D(3.0 \| A) from the trained run |
| 2:16–2:39 | 06 | The objective               | The cGAN value function with "\| y" everywhere, term by term; goal p_g(x \| y) = p_data(x \| y) |
| 2:39–3:02 | 07 | Training                    | Step 1 (train D on real pairs and fakes for random labels), Step 2 (train G for a chosen label, D frozen); the labels glow as they travel with their images |
| 3:02–3:45 | 08 | A real cGAN, learning       | The recorded run, one chart per class: real data, G(z \| y) and D(x \| y) over 3,000 steps; a wrong-label point; the same noise asked for A, B and C |
| 3:45–4:07 | 09 | Noise vs. condition         | A 3 × 5 grid of faces: rows = labels, columns = noise; fix y / vary z, and fix z / vary y |
| 4:07–4:35 | 10 | What the condition can be   | A class (BigGAN), an image (Pix2Pix), a low-res image (SRGAN), a sentence (text-to-image GANs) |
| 4:35–4:52 | 11 | Recap                       | Cards for G(z \| y), D(x \| y) and the trained result                     |

A progress bar along the bottom edge has one segment per scene.

---

## 1. Reproduce the video

**Requirements**

- Node.js 18 or newer (`node -v`). Remotion downloads its own headless Chrome
  and ships its own ffmpeg, so nothing else is needed to render.
- macOS for the voiceover: it uses the built-in `say` text-to-speech command.
  Without it the video still renders, with captions but no sound (see 1.3).

```bash
cd ml/cGAN
npm install          # install Remotion, React, TypeScript
npm run train        # optional: re-train the 1-D cGAN → src/cgan-trace.json (~12 s)
npm run voiceover    # macOS: write one WAV per narration line → public/voice/
npm run render       # → out/cgan-explainer.mp4  (takes a few minutes)
```

`src/cgan-trace.json` is already included, so `npm run train` is only needed
if you change the training settings. Training is seeded: running it again
gives a byte-identical file.

Other commands:

```bash
npm run studio       # open an editor in the browser: scrub the timeline,
                     # edit code and see changes live
npm run still        # export one frame → out/thumbnail.png
npx remotion render CganExplainer out/preview.mp4 --scale=0.5   # quick 960×540 preview
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

### 1.2 Experimenting with the cGAN

Every training setting can be overridden from the shell. The demo scene then
shows the new run:

```bash
SEED=3 npm run train              # a different random start
D_STEPS=1 LR_G=1e-3 npm run train # one D update per G update, faster G
STEPS=6000 npm run train          # train longer
```

| Variable  | Default | Meaning                                              |
| --------- | ------- | ---------------------------------------------------- |
| `SEED`    | 13      | random seed (weights, noise, data)                   |
| `STEPS`   | 3000    | training steps                                       |
| `D_STEPS` | 3       | discriminator updates per generator update           |
| `BATCH`   | 128     | samples per update                                   |
| `LR_D`    | 1e-3    | discriminator learning rate (Adam, decays to 10 %)   |
| `LR_G`    | 5e-4    | generator learning rate (Adam, decays to 10 %)       |
| `HIDDEN`  | 24      | neurons per hidden layer, both networks              |

At the end, training prints a distance for each class (0 = the generated
distribution matches the real one exactly, 1 = no overlap). The default run
gets 0.049 / 0.017 / 0.065. GANs are sensitive: when we compared seeds, some
fit all three classes well and others left one class noticeably off, which
is why seed 13 is the default. To change the classes themselves, edit
`CLASSES` near the top of `scripts/train-cgan.mjs`.

### 1.3 No Mac, or no voice wanted

Skip `npm run voiceover` (or delete `public/voice/`). The video renders
silent with captions, and each line's time is estimated from its word count.

To use another text-to-speech tool, write one WAV file per line to
`public/voice/<scene>-<line>.wav` (for example `demo-2.wav`) and a
`public/voice/manifest.json` that maps each name to its length in seconds:

```json
{ "intro-0": 5.1, "intro-1": 3.4 }
```

### 1.4 Troubleshooting

**`ProtocolError ... Target closed`** means the headless Chrome Remotion
downloaded could not start. Try these in order:

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
ml/cGAN/
├── package.json            # dependencies + npm scripts
├── remotion.config.ts      # render settings (image format, browser path)
├── scripts/
│   ├── train-cgan.mjs      # trains the real 1-D cGAN → src/cgan-trace.json
│   └── voiceover.mjs       # narration.json → public/voice/*.wav + manifest.json
├── public/voice/           # generated voice clips (git-ignored)
└── src/
    ├── narration.json      # THE SCRIPT: every caption / spoken line, per scene
    ├── cgan-trace.json     # the recorded training run (121 snapshots × 3 classes)
    ├── timeline.ts         # turns the script + clip lengths into frame numbers
    ├── index.ts            # entry point: registerRoot()
    ├── Root.tsx            # <Composition>: 1920×1080, 30 fps, length from the voice
    ├── CganVideo.tsx       # puts the scenes, captions and audio on the timeline
    ├── data.ts             # reads the training run; (z, y) → faces
    ├── theme.ts            # colors (G, D, real, noise z, condition y, classes) and fonts
    ├── anim.ts             # fade / pop / lerp animation helpers
    ├── components/
    │   ├── Cond.tsx        # the condition: "y = …" tag and one-hot vector
    │   ├── Face.tsx        # a stylized face drawn from 8 latent numbers (+ noise)
    │   ├── Diagram.tsx     # arrows, network blocks, noise vector, chart helpers
    │   ├── Text.tsx        # Label and Card
    │   └── Chrome.tsx      # scene header, captions, progress bar
    └── scenes/             # one file per scene, in video order
        ├── Intro.tsx  Problem.tsx  Idea.tsx  Architecture.tsx  Feeding.tsx
        ├── Match.tsx  Objective.tsx  Training.tsx  Demo.tsx
        └── Control.tsx  Uses.tsx  Recap.tsx
```

---

## 3. How it works

### 3.1 Video = a function of the frame number

Every component asks `useCurrentFrame()` and draws what should be on screen
at that frame. Remotion opens a headless Chrome, screenshots frame 0, 1, 2, …
and ffmpeg encodes the screenshots into an H.264 MP4 with the audio mixed in.

### 3.2 The script drives the timing

The narration is the single source of truth:

1. `src/narration.json` lists the scenes, and the lines spoken in each one.
   A line can have `speech` (how to pronounce it: the captions say "y" and
   "cGAN", the voice says "why" and "C GAN") and `pad` (extra seconds after
   it, so an animation can finish).
2. `npm run voiceover` turns each line into a WAV clip and measures it.
3. Before rendering, `calculateMetadata` in `Root.tsx` reads
   `manifest.json`, and `buildTimeline()` in `timeline.ts` gives every line a
   slot as long as its clip (+ a short gap + `pad`). Scenes are placed back to
   back; the total becomes the video's length.
4. `CganVideo.tsx` puts each scene in a `<Sequence>`, and inside it each line
   in its own `<Sequence>` with the caption and the `<Html5Audio>` clip.
5. Scenes time their animations against their own lines:

   ```tsx
   const L = useLines();               // start frame of each line in this scene
   const opacity = fade(frame, L[2]);  // appears when line 2 starts
   ```

   So when you rewrite a line or change the voice, the animations move with it.

### 3.3 The real cGAN behind scenes 05, 08 and 11

`scripts/train-cgan.mjs` is a complete conditional GAN in about 270 lines of
plain JavaScript:

- **Data**: three classes (the condition y), each a bell curve:
  A at −3, B at 0, C at +3.
- **Condition**: y is a one-hot vector of length 3, concatenated to each
  network's input. This is the original 2014 recipe.
- **Generator** G: (z, y) → 24 → 24 → x, leaky-ReLU. z is one random number.
- **Discriminator** D: (x, y) → 24 → 24 → logit → sigmoid, leaky-ReLU.
- **Training**: per step, 3 D updates on real pairs (x, its true y) → 1 and
  fake pairs (G(z | y), y) for random y → 0, then 1 G update with the
  non-saturating loss −log D(G(z | y) | y). The gradient flows back through
  the frozen D into G; only its x part reaches G. Adam, β₁ = 0.5.

Every 25 steps it records, for each class, G's density (a kernel density
estimate of 4,000 generated samples), D(x | y) on a grid, and the z → x
mapping. The demo blends between snapshots for smooth motion. The "same
noise, asking for A, B or C" result uses the recorded mapping at z = 0.75.

### 3.4 What is illustrative

A real image cGAN is far too large to train for or run inside a video, so:

- The **faces** are drawn by `components/Face.tsx`. The condition y decides
  the mouth and the glasses (`faceFromZY` in `src/data.ts`); the noise z
  decides everything else. In a trained image cGAN that split is learned and
  usually less clean, which scene 09 says on screen.
- The D scores on the three faces in scene 05 are illustrative (labelled on
  screen). The two numbers below them are measured from the trained 1-D run.
- The pictures in scene 10 (goldfish, house sketch, blurry face, bird) are
  simple drawings of each idea, not model outputs (labelled on screen).

---

## 4. Make it your own

| I want to…                        | Change this                                                            |
| --------------------------------- | ---------------------------------------------------------------------- |
| change what is said               | the `text` (caption) / `speech` (voice) in `src/narration.json`, then `npm run voiceover` |
| give an animation more time       | add or raise `pad` on that line in `narration.json`                    |
| change the voice or speed         | `VOICE=… RATE=… npm run voiceover`                                     |
| train the cGAN differently        | env variables of `npm run train` (1.2), or `CLASSES` in `scripts/train-cgan.mjs` |
| change the face labels            | `FACE_LABELS` and `faceFromZY` in `src/data.ts`                         |
| change colors / fonts             | `src/theme.ts` (`ROLE` and `CLASS_COLORS`)                             |
| make a vertical (9:16) version    | `width={1080} height={1920}` in `src/Root.tsx`, then re-lay out scenes  |
| add a scene                       | add it to `narration.json`, create `src/scenes/MyScene.tsx`, register it in `SCENE_COMPONENTS` in `src/CganVideo.tsx` |
| hide the captions                 | remove `<Caption … />` in `src/CganVideo.tsx`                          |

Use `npm run studio` while editing: it updates live and you can scrub to any
frame. (Run `npm run voiceover` first so the studio uses the real timings.)

Note: if you re-train with other settings, scene 05 recomputes its two
measured D values automatically, but check that the narration still fits
what the demo shows.

---

## 5. References

- Mirza & Osindero, *Conditional Generative Adversarial Nets*, 2014: the
  conditional objective and one-hot conditioning.
- Goodfellow et al., *Generative Adversarial Nets*, NeurIPS 2014.
- Miyato & Koyama, *cGANs with Projection Discriminator*, ICLR 2018.
- Brock et al., *BigGAN*, 2018 · Isola et al., *Pix2Pix*, 2016 ·
  Ledig et al., *SRGAN*, 2016 · Reed et al., *Generative Adversarial
  Text to Image Synthesis*, 2016.

## 6. License note

Remotion is free for individuals and companies with up to 3 employees. Larger
companies need a company license; see
[remotion.dev/license](https://www.remotion.dev/license). The macOS system
voices are licensed for use on your Mac; check Apple's terms before publishing
videos commercially, or use another TTS tool (see 1.3).
