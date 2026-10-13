# Pix2Pix architecture: a narrated explainer video

A 7 min 2 s, 1920×1080 (16:9), 30 fps MP4 that explains **Pix2Pix**:
image-to-image translation with conditional adversarial networks
(Isola, Zhu, Zhou, Efros, CVPR 2017, [arXiv:1611.07004](https://arxiv.org/abs/1611.07004)).
It is made **entirely with code** using [Remotion](https://www.remotion.dev/)
(React → video), with a spoken voiceover, on-screen captions, and an animated
diagram for every idea.

The centerpiece is **a real Pix2Pix**. `scripts/train-pix2pix.mjs` trains a tiny
U-Net generator and PatchGAN discriminator on 32×32 images. The convolutions,
backpropagation and Adam are written by hand, with no ML library. It trains three
times, once per loss (L1 only, cGAN only, L1 + cGAN), and records the runs.
The video plays the recordings back. All the training images, outputs and
patch scores in the video come from those runs.

This is the third video in a series. `../gan` explains GANs and `../cGAN`
explains conditional GANs; Pix2Pix is a cGAN whose condition is a whole image.

| Time      | #  | Scene                          | Visual aid                                                                 |
| --------- | -- | ------------------------------ | -------------------------------------------------------------------------- |
| 0:00–0:23 |    | Intro                          | Sketch → shoe, map → aerial, day → night, B&W → color; title and paper     |
| 0:23–0:45 | 01 | The task: image in, image out  | Training pairs (x, y); x → G → G(x), with G(x) learning in fast-forward; before Pix2Pix: one hand-made loss per task |
| 0:45–1:20 | 02 | Why a simple loss gives blur   | One outline, four equally right striped answers; one pixel that is dark in half of them; their average next to the real L1-trained output |
| 1:20–1:56 | 03 | The idea: learn the loss       | D judges pairs: (x, y) → REAL, (x, G(x)) → FAKE; the blurry average gets caught; cGAN D(x \| y) vs Pix2Pix D(x, y); a real-looking answer that doesn't fit x → FAKE |
| 1:56–2:38 | 04 | The generator: a U-Net         | The paper's 256×256 encoder-decoder drawn to scale (bar height = size, width = channels); the 1×1 bottleneck loses detail; skip connections; the U |
| 2:38–3:23 | 05 | The discriminator: PatchGAN    | A 70×70 window slides over the image and fills a 30×30 score grid, then the mean; L1 = low frequencies, PatchGAN = high; the paper's 1 / 16 / 70 / 286 patch comparison |
| 3:23–3:54 | 06 | The objective                  | G* = arg min_G max_D L_cGAN + λ L_L1, term by term; λ = 100; no z, dropout instead |
| 3:54–4:22 | 07 | Training                       | Step 1 (update D on a real and a fake pair), step 2 (update G, D frozen, + λ·L1); the paper's settings |
| 4:22–5:13 | 08 | A real Pix2Pix, learning       | The recorded runs: 4 test outlines × (L1 only, cGAN only, L1 + cGAN) over 3,000 steps, with stripe-crispness scores |
| 5:13–5:41 | 09 | Inside the PatchGAN            | The trained D's 8×8 patch scores on the real image, the Pix2Pix output and the L1 output |
| 5:41–6:08 | 10 | What it can do                 | The paper's tasks; human judges fooled in 18.9 % of trials (map → aerial); #edges2cats |
| 6:08–6:43 | 11 | Limits and what came next      | Paired vs. unpaired data (CycleGAN); pix2pixHD, SPADE/GauGAN; PatchGAN in VQGAN and Stable Diffusion's autoencoder |
| 6:43–7:02 | 12 | Recap                          | U-Net · PatchGAN · cGAN + λ·L1, and the trained result                     |

A progress bar along the bottom edge has one segment per scene.

---

## 1. Reproduce the video

**Requirements**

- Node.js 18 or newer (`node -v`). Remotion downloads its own headless Chrome
  and ships its own ffmpeg, so nothing else is needed to render.
- macOS for the voiceover: it uses the built-in `say` text-to-speech command.
  Without it the video still renders, with captions but no sound (see 1.4).

```bash
cd ml/Pix2Pix
npm install          # install Remotion, React, TypeScript
npm run train        # optional: re-train the 3 tiny Pix2Pix runs → src/pix2pix-trace.json (~3 min)
npm run voiceover    # macOS: one WAV per narration line → public/voice/
npm run render       # → out/pix2pix-explainer.mp4  (a few minutes)
```

`src/pix2pix-trace.json` is already included, so `npm run train` is only
needed if you change the training settings. Training is seeded: running it
again gives a byte-identical file. The three runs train in parallel, one
process each.

Other commands:

```bash
npm run gradcheck    # check the hand-written backprop against finite differences
npm run studio       # open an editor in the browser: scrub the timeline,
                     # edit code and see changes live
npm run still        # export one frame → out/thumbnail.png
npx remotion still Pix2PixExplainer out/demo.png --frame=9300   # any frame (here: the trained runs)
npx remotion render Pix2PixExplainer out/preview.mp4 --scale=0.5 # quick 960×540 preview
```

### 1.1 Changing the words

Everything that is said and captioned is in **`src/narration.json`**: one
entry per scene, one line per caption and voice clip. Edit the text, run
`npm run voiceover` again, then `npm run render`. Scene lengths follow the
voice clips, so the pictures stay in sync.

- `speech` (optional): what the voice says when it differs from the caption.
  The captions say "Pix2Pix", "L1" and "y". The voice says "Pix to Pix",
  "L 1" and "why".
- `pad` (optional): extra seconds after a line, so an animation can finish
  (the demo's 3,000-step playback uses this).

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

### 1.3 Experimenting with the tiny Pix2Pix

Every training setting can be overridden from the shell. The demo, patch
and blur scenes then show the new runs:

```bash
LAMBDA=10 npm run train          # weaker L1 term (the paper's choice is 100)
STEPS=6000 npm run train         # train longer (snapshots stop at step 3,000)
NGF=16 NDF=16 npm run train      # wider networks (about 4× slower)
OUT=/tmp/try.json npm run train  # write somewhere else, keep the video's file
```

| Variable  | Default | Meaning                                                  |
| --------- | ------- | -------------------------------------------------------- |
| `SEED`    | 7       | random seed (weights and data; the same for all 3 runs)  |
| `STEPS`   | 3000    | training steps                                           |
| `BATCH`   | 8       | examples per step                                        |
| `LR`      | 5e-4    | Adam learning rate (β₁ = 0.5, like the paper)            |
| `LAMBDA`  | 100     | weight of the L1 term in the L1 + cGAN run               |
| `NGF`     | 8       | generator width (channels of the first layer)            |
| `NDF`     | 8       | discriminator width                                      |
| `OUT`     | `src/pix2pix-trace.json` | where to write the recording            |

At the end, training prints a **stripe crispness** score per test image. It
measures row-to-row contrast inside the shape, as a share of the target's,
so 1.00 means as crisp as the real image. The default run gets:

| Run        | Crispness (4 test images)   | Final L1 | What you see                           |
| ---------- | --------------------------- | -------- | -------------------------------------- |
| L1 only    | 0.23 · 0.56 · 0.26 · 0.42   | 0.095    | right shape and color, stripes smeared |
| cGAN only  | (meaningless)               | 0.679    | the same blob for every input          |
| L1 + cGAN  | 0.91 · 1.09 · 0.89 · 1.15   | 0.102    | crisp stripes in the right shape       |

L1 + cGAN ends with a slightly *higher* L1 than L1 alone and still looks far
better. That is the paper's argument in one number: L1 rewards the safe
average, not a sharp, plausible answer.

**How the tiny model differs from the paper** (all to make it train in
minutes on a CPU): 32×32 images instead of 256×256, so 4 encoder layers
instead of 8. A PatchGAN with an 18×18 receptive field and an 8×8 output
instead of 70×70 and 30×30. No batch normalization and no dropout. He
initialization instead of N(0, 0.02). Batch 8 and learning rate 5e-4
instead of batch 1 and 2e-4. The losses, λ = 100, the halved D loss, the
skip connections and the conditional (x, y) input to D follow the paper.

### 1.4 No Mac, or no voice wanted

Skip `npm run voiceover` (or delete `public/voice/`). The video renders
silent with captions, and each line's time is estimated from its word count.

To use another text-to-speech tool, or your own recorded voice, write one
WAV file per line to `public/voice/<scene>-<line>.wav` (for example
`demo-2.wav`). Then write a `public/voice/manifest.json` that maps each name
to its length in seconds:

```json
{ "intro-0": 7.1, "intro-1": 5.2 }
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
ml/Pix2Pix/
├── package.json             # dependencies + npm scripts
├── remotion.config.ts       # render settings (image format, browser path)
├── scripts/
│   ├── train-pix2pix.mjs    # the tiny Pix2Pix: data, U-Net, PatchGAN, backprop,
│   │                        # Adam, 3 runs in parallel → src/pix2pix-trace.json
│   └── voiceover.mjs        # narration.json → public/voice/*.wav + manifest.json
├── public/voice/            # generated voice clips (git-ignored)
└── src/
    ├── narration.json       # THE SCRIPT: every caption / spoken line, per scene
    ├── pix2pix-trace.json   # the recorded runs (outputs at 14 steps, losses, patch scores)
    ├── data.ts              # reads the recording; blends snapshots for smooth playback
    ├── timeline.ts          # turns the script + clip lengths into frame numbers
    ├── index.ts             # entry point: registerRoot()
    ├── Root.tsx             # <Composition>: 1920×1080, 30 fps, length from the voice
    ├── Pix2PixVideo.tsx     # puts the scenes, captions and audio on the timeline
    ├── theme.ts             # colors (x, y, G, D, L1) and fonts
    ├── anim.ts              # fade / pop / lerp animation helpers
    ├── components/
    │   ├── PixelImage.tsx   # a 32×32 image from the run, with optional patch-score overlay
    │   ├── TaskArt.tsx      # illustrations of the paper's tasks (labels, edges, maps, …)
    │   ├── Diagram.tsx      # arrows, network blocks
    │   ├── Text.tsx         # Label and Card
    │   └── Chrome.tsx       # scene header, captions, progress bar
    └── scenes/              # one file per scene, in video order
        ├── Intro.tsx  Task.tsx  Blur.tsx  Idea.tsx  UNet.tsx  PatchGan.tsx
        └── Objective.tsx  Training.tsx  Demo.tsx  Patches.tsx  Results.tsx  Legacy.tsx  Recap.tsx
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

### 3.3 The toy task, and why it shows the blur

The input is a shape's outline. The target is the filled shape with dark
horizontal stripes, 2 rows dark and 2 light, starting at a **random row**.
The outline fixes the shape and the color, but not where the stripes are.
So each pixel inside the shape is dark in half of the right answers and
light in the other half. For such a pixel, every value between dark and
light gives the same expected L1 loss. An L1-trained network has no reason
to commit, and fills the shape with a smear. A discriminator can see that
no real image looks like that, which pushes G to draw *some* crisp set of
stripes. This is the effect in the paper's figure 4, in a form you can
train in three minutes.

### 3.4 The recording

`src/pix2pix-trace.json` holds, for each run:

- `snapshots`: G's output on 4 fixed test outlines at 14 training steps
  (0 … 3,000), as base64 bytes. `outputAt()` in `data.ts` blends the two
  nearest snapshots, so the demo can play training back smoothly.
- `losses`: D loss, G's GAN loss and L1, averaged every 25 steps.
- `patches`: the trained D's 8×8 scores for the real and the generated pair.
- `crisp`: the stripe-crispness score described in 1.3.

The L1 + cGAN run also has `patchesL1`, its discriminator's scores for the
L1-only run's blurry outputs, which the "Inside the PatchGAN" scene shows.
The file also has `phases`, the four right answers for one outline, used by
the blur scene.
