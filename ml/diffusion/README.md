# Diffusion models: a narrated explainer video

A 7 min 33 s, 1920×1080 (16:9), 30 fps MP4 that explains how **diffusion
models** work: the forward (noising) process, the noise-predicting network,
training, sampling, the U-Net and the Diffusion Transformer, faster sampling
with DDIM, classifier-free guidance, and latent diffusion (Stable Diffusion).
It is made **entirely with code** using [Remotion](https://www.remotion.dev/)
(React → video), with a spoken voiceover, on-screen captions, and an animated
diagram for every idea.

The centerpiece is **two real diffusion models**. `scripts/train-diffusion.mjs`
trains them from scratch in plain JavaScript, with no ML library:

1. An **unconditional DDPM** on 2-D points along a spiral. The video shows
   its learned "denoising direction" field and plays back its 1,000-step
   sampling. It also samples with DDIM at 50, 10 and 3 steps.
2. A **class-conditional DDPM** on three shapes, trained with label dropout.
   The video samples it with classifier-free guidance at w = 0, 1 and 3.

The picture sequences (a tree, a heart, a house and a moon appearing out of
noise) come from the **ideal denoiser** for a set of six 48×48 pictures. With
a finite training set, the best possible estimate of the clean image has a
closed form: a weighted average of the training images. No network is
trained for that part. It shows exactly what a perfect noise predictor does
in image space, and the video says so.

This is the fourth video in the `ml/` series (`gan`, `cGAN`, `Pix2Pix`).

| #  | Scene                               | Visual aid                                                                     |
| -- | ----------------------------------- | ------------------------------------------------------------------------------ |
|    | Intro                               | Four pictures emerge from noise; title                                         |
| 01 | The idea: destroy, then undo        | A picture at t = 0 … 1000; the reverse row; 2015 / 2020 (DDPM)                 |
| 02 | The forward process                 | Noising a picture; the β schedule; x_t = √ᾱ·x₀ + √(1−ᾱ)·ε worked out at t = 300; signal vs. noise weights over t |
| 03 | The reverse process                 | x_t and t → ε_θ → predicted noise ε̂ → one step back; the guess x̂₀ at t = 900 … 0 |
| 04 | Training                            | The 4-line training loop, one example worked through, our real loss curve      |
| 05 | Sampling                            | The sampling loop; four runs played back (x_t and x̂₀); the six training pictures |
| 06 | The network                         | U-Net of residual blocks, time embedding into every block, attention at low resolution; DiT |
| 07 | A real diffusion model, learning    | Spiral data dissolving into noise; model card + loss; the learned field at t = 999 … 5; 1,000-step sampling with paths; distance to the spiral |
| 08 | Fewer steps: DDIM                   | The same network at 1000 / 50 / 10 / 3 steps, with distances                    |
| 09 | Conditioning and guidance           | ε_θ(x_t, t, c); the 3-shape data; the CFG formula; samples at w = 0 / 1 / 3      |
| 10 | Latent diffusion                    | Encoder → 64×64×4 latent → U-Net (×50) → decoder; the prompt via CLIP + cross-attention |
| 11 | Diffusion vs. GANs                  | Training, variety, quality, speed                                               |
| 12 | Recap                               | Forward process · noise predictor · sampler · guidance                          |

A progress bar along the bottom edge has one segment per scene.

---

## 1. Reproduce the video

**Requirements**

- Node.js 18 or newer (`node -v`). Remotion downloads its own headless Chrome
  and ships its own ffmpeg, so nothing else is needed to render.
- macOS for the voiceover: it uses the built-in `say` text-to-speech command.
  Without it the video still renders, with captions but no sound (see 1.4).

```bash
cd ml/diffusion
npm install          # install Remotion, React, TypeScript
npm run train        # optional: re-train both models → src/diffusion-trace.json (~3 min)
npm run voiceover    # macOS: one WAV per narration line → public/voice/
npm run render       # → out/diffusion-explainer.mp4  (a few minutes)
```

`src/diffusion-trace.json` is already included, so `npm run train` is only
needed if you change the training settings. Training is seeded: running it
again gives the same file. The two models train in parallel, one process each.

Other commands:

```bash
npm run studio       # open an editor in the browser: scrub the timeline,
                     # edit code and see changes live
npm run still        # export one frame → out/thumbnail.png
npx remotion still DiffusionExplainer out/demo.png --frame=8580    # any frame (here: the sampled spiral)
npx remotion render DiffusionExplainer out/preview.mp4 --scale=0.5 # quick 960×540 preview
```

### 1.1 Changing the words

Everything that is said and captioned is in **`src/narration.json`**: one
entry per scene, one line per caption and voice clip. Edit the text, run
`npm run voiceover` again, then `npm run render`. Scene lengths follow the
voice clips, so the pictures stay in sync.

- `speech` (optional): what the voice says when it differs from the caption.
  The captions say "DDPM", "ε" and "w = 3"; the voice says "D D P M",
  "epsilon" and "w equals three".
- `pad` (optional): extra seconds after a line, so an animation can finish
  (the spiral's sampling playback uses this).

Scenes time their animations to the start of each line (see 3.2). If you
add or remove a line, open that scene in `src/scenes/` and check the `L[...]`
numbers it uses.

### 1.2 Choosing the voice

```bash
say -v '?'                                   # list the voices on your Mac
VOICE="Daniel" npm run voiceover             # British English
VOICE="Samantha" RATE=160 npm run voiceover  # slower (words per minute, default 175)
```

Better voices can be downloaded in *System Settings → Accessibility → Spoken
Content → System Voice → Manage Voices*. Look for "Enhanced" or "Premium",
then pass the voice's name in `VOICE`.

### 1.3 Experimenting with the models

Every setting can be overridden from the shell. The demo, DDIM and guidance
scenes then show the new runs:

```bash
STEPS=30000 npm run train         # train longer
HIDDEN=64 npm run train           # a smaller network
OUT=/tmp/try.json npm run train   # write somewhere else, keep the video's file
```

| Variable  | Default | Meaning                                              |
| --------- | ------- | ---------------------------------------------------- |
| `SEED`    | 11      | random seed (weights, data, noise)                   |
| `STEPS`   | 12000   | training steps                                       |
| `BATCH`   | 256     | points per step                                      |
| `LR`      | 1e-3    | Adam learning rate (cosine-decayed to 10 %)          |
| `HIDDEN`  | 96      | neurons per hidden layer (3 hidden layers, SiLU)     |
| `EMA`     | 0.995   | decay of the weight average used for sampling        |
| `SAMPLES` | 1500    | points per spiral sampling run                       |
| `OUT`     | `src/diffusion-trace.json` | where to write the recording      |

The schedule is DDPM's: T = 1000 steps, β linear from 1e-4 to 0.02. The
classes are hidden 15 % of the time during training (for classifier-free
guidance).

At the end, training prints what the video shows. The default run gives:

| Spiral sampler    | Mean distance to the spiral |
| ----------------- | --------------------------- |
| real data         | 0.032                       |
| DDPM, 1000 steps  | 0.050                       |
| DDIM, 50 steps    | 0.054                       |
| DDIM, 10 steps    | 0.144                       |
| DDIM, 3 steps     | 0.451                       |
| pure noise        | 0.486                       |

| Guidance scale w | Samples on the requested shape (ring / square / triangle) |
| ---------------- | --------------------------------------------------------- |
| 0                | 28 % / 23 % / 27 %  (the unconditional model)               |
| 1                | 97 % / 96 % / 97 %                                          |
| 3                | 100 % / 99 % / 100 %, but only part of each shape           |

Two of these are worse than in big image models, and the video says so.
DDIM at 10 steps loses much of the spiral; big models are smoother and
handle 20–50 steps well. At w = 0 the unconditional model smears across the
three shapes, because it saw only 15 % of the training examples.

### 1.4 No Mac, or no voice wanted

Skip `npm run voiceover` (or delete `public/voice/`). The video renders
silent with captions, and each line's time is estimated from its word count.

To use another text-to-speech tool, or your own recorded voice, write one
WAV file per line to `public/voice/<scene>-<line>.wav` (for example
`demo-4.wav`). Then write a `public/voice/manifest.json` that maps each name
to its length in seconds:

```json
{ "intro-0": 3.4, "intro-1": 5.0 }
```

### 1.5 Troubleshooting

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
ml/diffusion/
├── package.json              # dependencies + npm scripts
├── remotion.config.ts        # render settings (image format, browser path)
├── scripts/
│   ├── train-diffusion.mjs   # both tiny DDPMs (MLP, backprop, Adam, EMA), DDPM and
│   │                         # DDIM samplers, guidance, the ideal image denoiser
│   │                         # → src/diffusion-trace.json
│   └── voiceover.mjs         # narration.json → public/voice/*.wav + manifest.json
├── public/voice/             # generated voice clips (git-ignored)
└── src/
    ├── narration.json        # THE SCRIPT: every caption / spoken line, per scene
    ├── diffusion-trace.json  # the recorded runs (points, field, losses, image frames)
    ├── data.ts               # reads the recording; the forward process; image playback
    ├── timeline.ts           # turns the script + clip lengths into frame numbers
    ├── index.ts              # entry point: registerRoot()
    ├── Root.tsx              # <Composition>: 1920×1080, 30 fps, length from the voice
    ├── DiffusionVideo.tsx    # puts the scenes, captions and audio on the timeline
    ├── theme.ts              # colors (data, noise, network, time, guidance, latent) and fonts
    ├── anim.ts               # fade / pop / lerp animation helpers
    ├── components/
    │   ├── PointCloud.tsx    # canvas scatter plot: points, paths, arrow fields
    │   ├── PixelImage.tsx    # a 48×48 image with crisp pixels
    │   ├── Diagram.tsx       # arrows, network blocks, chart axes
    │   ├── Text.tsx          # Label and Card
    │   └── Chrome.tsx        # scene header, captions, progress bar
    └── scenes/               # one file per scene, in video order
        ├── Intro.tsx  Idea.tsx  Forward.tsx  Denoiser.tsx  Training.tsx  Sampling.tsx  UNet.tsx
        └── Demo.tsx  Ddim.tsx  Guidance.tsx  Latent.tsx  Compare.tsx  Recap.tsx
```

---

## 3. How it works

### 3.1 Video = a function of the frame number

Every component asks `useCurrentFrame()` and draws what should be on screen
at that frame. Remotion opens a headless Chrome, screenshots frame 0, 1, 2, …
and ffmpeg encodes the screenshots into an H.264 MP4 with the audio mixed in.

### 3.2 The script drives the timing

1. `src/narration.json` lists the scenes and the lines spoken in each one.
2. `npm run voiceover` turns each line into a WAV clip and measures it.
3. Before rendering, `calculateMetadata` in `Root.tsx` reads
   `manifest.json`, and `buildTimeline()` in `timeline.ts` gives every line a
   slot as long as its clip (+ a short gap + `pad`). Scenes are placed back to
   back; the total becomes the video's length.
4. Inside a scene, `useLines()` returns the frame where each line starts
   (`L[0]`, `L[1]`, …), and animations are written against those.

### 3.3 What is computed live, and what is recorded

- **Live, in the browser:** the forward process. `noisify()` in `data.ts`
  applies x_t = √ᾱ_t·x₀ + √(1−ᾱ_t)·ε to a picture or to the spiral points,
  with fixed seeded noise, at whatever t the frame needs.
- **Recorded by the training script** (`src/diffusion-trace.json`):
  - `spiral`: training data, loss curve, the learned −ε̂ field on a 19×19
    grid at t = 999 / 500 / 200 / 50 / 5, DDPM sampling snapshots every 50
    steps with 60 point paths, DDIM results at 50 / 10 / 3 steps, and distances.
  - `shapes`: training data, loss curve, and guided samples at w = 0 / 1 / 3.
  - `images`: four sampling runs with the ideal denoiser, 21 frames each
    (x_t and the guess x̂₀), plus the six training pictures (`icons`).
  - `alphaBar`: the noise schedule ᾱ_t, shared by the scenes and the formulas.

### 3.4 The ideal denoiser

For a training set of N images, the noisy image x_t was made from one of
them, and Bayes' rule says which one, probably:
weight_i ∝ exp(−‖x_t − √ᾱ_t·image_i‖² / (2(1 − ᾱ_t))). The best estimate
of the clean image, E[x₀ | x_t], is the weighted average of the training
images. Early on (lots of noise) the weights are spread out, so the guess is
a blurry average of everything. As the noise goes down, one weight goes to 1
and the guess becomes one picture. The "Sampling" scene shows exactly this.
A trained network can only approximate it, and because it approximates
rather than memorizes, it makes new pictures instead of copies.
