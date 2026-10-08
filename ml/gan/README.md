# GAN architecture: a narrated explainer video

A 5 min 54 s, 1920×1080 (16:9), 30 fps MP4 that explains how a
**Generative Adversarial Network** works, made **entirely with code** using
[Remotion](https://www.remotion.dev/) (React → video). It has a spoken
voiceover, on-screen captions, and an animated diagram for every idea.

The centerpiece is **a real GAN**: `scripts/train-gan.mjs` trains a tiny
generator and discriminator (hand-written backpropagation, no ML library) on
1-D data, records how they learn, and the video plays that recording back.
The densities, the D(x) curve, the losses, and the final loss of 1.376 shown
in the video come from that run.

| Time      | #  | Scene                      | Visual aid                                                                 |
| --------- | -- | -------------------------- | -------------------------------------------------------------------------- |
| 0:00–0:15 |    | Intro                      | 12 faces condense out of pixel noise; title; Generator vs Discriminator    |
| 0:15–0:41 | 01 | Classify vs. generate      | image → network → label, next to noise → network → new face; "its score: ???"; a second network as the judge |
| 0:41–1:04 | 02 | A forger and a detective   | A banknote improving from crude to perfect, the detective's verdict stamps, two skill meters climbing in turns |
| 1:04–1:35 | 03 | The architecture           | z → G → fake; training set → real; both feed D → P(real); samples travel into D; the gradient feedback loop back to G |
| 1:35–2:01 | 04 | Inside the generator       | 100-number z → DCGAN layers 4×4×1024 … 32×32×128 → 64×64×3 image; latent space dots; a walk from z₁ to z₂ morphs the face |
| 2:01–2:24 | 05 | Inside the discriminator   | Image → shrinking conv layers → one logit → sigmoid curve; real (0.92) vs fake (0.09); fakes improve, D drifts to 0.5 |
| 2:24–2:54 | 06 | The minimax game           | The value function V(D, G), term by term; saturating vs non-saturating generator loss chart |
| 2:54–3:18 | 07 | Training: taking turns     | Step 1 (G frozen, train D) and Step 2 (D frozen, train G, error flows back through D) with locks, labels and losses |
| 3:18–4:04 | 08 | A real GAN, learning       | The recorded run: real data, G's samples and D(x) evolving over 3,000 steps; arrows showing where G is pushed; losses; the z → x mapping |
| 4:04–4:37 | 09 | Why it works               | D\* = p_data / (p_data + p_g) computed from the run; V = −log 4 + 2·JSD; D\* → ½; loss 2 log 2 ≈ 1.386 vs the run's 1.376 |
| 4:37–5:09 | 10 | Why GANs are hard to train | Mode collapse, instability, vanishing gradients; fixes (WGAN, gradient penalty, spectral norm, TTUR, progressive growing) |
| 5:09–5:37 | 11 | A short history            | Timeline: GAN (2014), DCGAN (2015), CycleGAN, ProGAN (2017), BigGAN, StyleGAN (2018); diffusion models today |
| 5:37–5:54 | 12 | Recap                      | One card each for G, D and the game                                        |

A progress bar along the bottom edge has one segment per scene.

---

## 1. Reproduce the video

**Requirements**

- Node.js 18 or newer (`node -v`). Remotion downloads its own headless Chrome
  and ships its own ffmpeg, so nothing else is needed to render.
- macOS for the voiceover: it uses the built-in `say` text-to-speech command.
  Without it the video still renders, with captions but no sound (see 1.3).

```bash
cd ml/gan
npm install          # install Remotion, React, TypeScript
npm run train        # optional: re-train the 1-D GAN → src/gan-trace.json (~10 s)
npm run voiceover    # macOS: write one WAV per narration line → public/voice/
npm run render       # → out/gan-explainer.mp4  (takes a few minutes)
```

`src/gan-trace.json` is already included, so `npm run train` is only needed
if you change the training settings. The training is seeded: running it
again gives a byte-identical file.

Other commands:

```bash
npm run studio       # open an editor in the browser: scrub the timeline,
                     # edit code and see changes live
npm run still        # export one frame → out/thumbnail.png
npx remotion render GanExplainer out/preview.mp4 --scale=0.5   # quick 960×540 preview
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

### 1.2 Experimenting with the GAN

Every training setting can be overridden from the shell. The demo scene then
shows the new run:

```bash
SEED=3 npm run train              # a different random start
D_STEPS=1 LR_G=1e-3 npm run train # one D update per G update, faster G
STEPS=6000 npm run train          # train longer
```

| Variable  | Default | Meaning                                              |
| --------- | ------- | ---------------------------------------------------- |
| `SEED`    | 11      | random seed (weights, noise, data)                   |
| `STEPS`   | 3000    | training steps                                       |
| `D_STEPS` | 3       | discriminator updates per generator update ("k")     |
| `BATCH`   | 128     | samples per update                                   |
| `LR_D`    | 1e-3    | discriminator learning rate (Adam, decays to 10 %)   |
| `LR_G`    | 5e-4    | generator learning rate (Adam, decays to 10 %)       |
| `HIDDEN`  | 24      | neurons per hidden layer, both networks              |

GANs are sensitive. Many settings give a worse fit or bumps that are too
narrow, which is a good way to see the problems from scene 10 for yourself.
The narration says "our GAN finished at 1.38". If you re-train, check that
line in `src/narration.json` against the new final D loss, which is printed
at the end of training.

### 1.3 No Mac, or no voice wanted

Skip `npm run voiceover` (or delete `public/voice/`). The video renders
silent with captions, and each line's time is estimated from its word count.

To use another text-to-speech tool, write one WAV file per line to
`public/voice/<scene>-<line>.wav` (for example `demo-3.wav`) and a
`public/voice/manifest.json` that maps each name to its length in seconds:

```json
{ "intro-0": 4.1, "intro-1": 3.6 }
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
ml/gan/
├── package.json            # dependencies + npm scripts
├── remotion.config.ts      # render settings (image format, browser path)
├── scripts/
│   ├── train-gan.mjs       # trains the real 1-D GAN → src/gan-trace.json
│   └── voiceover.mjs       # narration.json → public/voice/*.wav + manifest.json
├── public/voice/           # generated voice clips (git-ignored)
└── src/
    ├── narration.json      # THE SCRIPT: every caption / spoken line, per scene
    ├── gan-trace.json      # the recorded training run (121 snapshots)
    ├── timeline.ts         # turns the script + clip lengths into frame numbers
    ├── index.ts            # entry point: registerRoot()
    ├── Root.tsx            # <Composition>: 1920×1080, 30 fps, length from the voice
    ├── GanVideo.tsx        # puts the scenes, captions and audio on the timeline
    ├── data.ts             # reads the training run; latent vectors → faces
    ├── theme.ts            # colors (one per role: G, D, real, noise) and fonts
    ├── anim.ts             # fade / pop / lerp animation helpers
    ├── components/
    │   ├── Face.tsx        # a stylized face drawn from 8 latent numbers (+ noise)
    │   ├── Diagram.tsx     # arrows, network blocks, noise vector, chart helpers
    │   ├── Slab.tsx        # a layer volume drawn as a 3-D slab
    │   ├── Text.tsx        # Label and Card
    │   └── Chrome.tsx      # scene header, captions, progress bar
    └── scenes/             # one file per scene, in video order
        ├── Intro.tsx  Generative.tsx  Analogy.tsx  Architecture.tsx
        ├── Generator.tsx  Discriminator.tsx  Objective.tsx  Training.tsx
        └── Demo.tsx  Equilibrium.tsx  Problems.tsx  History.tsx  Recap.tsx
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
   A line can have `speech` (how to pronounce it, e.g. "G of zee" for G(z))
   and `pad` (extra seconds after it, so an animation can finish).
2. `npm run voiceover` turns each line into a WAV clip and measures it.
3. Before rendering, `calculateMetadata` in `Root.tsx` reads
   `manifest.json`, and `buildTimeline()` in `timeline.ts` gives every line a
   slot as long as its clip (+ a short gap + `pad`). Scenes are placed back to
   back; the total becomes the video's length.
4. `GanVideo.tsx` puts each scene in a `<Sequence>`, and inside it each line
   in its own `<Sequence>` with the caption and the `<Html5Audio>` clip.
5. Scenes time their animations against their own lines:

   ```tsx
   const L = useLines();               // start frame of each line in this scene
   const opacity = fade(frame, L[2]);  // appears when line 2 starts
   ```

   So when you rewrite a line or change the voice, the animations move with it.

### 3.3 The real GAN behind scenes 08 and 09

`scripts/train-gan.mjs` is a complete GAN in under 300 lines of plain
JavaScript:

- **Data**: a mix of two bell curves, centered at −2 and +2.
- **Generator** G: z (one random number) → 24 → 24 → x, leaky-ReLU.
- **Discriminator** D: x → 24 → 24 → logit → sigmoid, leaky-ReLU.
- **Training**: per step, 3 D updates on real (label 1) and fake (label 0)
  batches, then 1 G update with the non-saturating loss −log D(G(z)), where
  the gradient flows back through the frozen D into G. Adam, β₁ = 0.5.

Every 25 steps it records G's density (a kernel density estimate of 6,000
generated samples), D(x) on a grid, both losses and the z → x mapping. The
demo scene blends between snapshots for smooth motion. The equilibrium scene
computes the optimal D\* = p_data / (p_data + p_g) from the same snapshots.

### 3.4 What is illustrative

A real image GAN is far too large to train for or run inside a video, so the
**faces** are drawn by `components/Face.tsx` from 8 latent numbers (skin
tone, hair, face width, eyes, smile, glasses …). They behave like a
generator's latent space: nearby z's give similar faces and a straight line
from z₁ to z₂ morphs smoothly. "Bad" fakes are the same faces under pixel
noise and blur. The mode-collapse, instability and vanishing-gradient charts
in scene 10 are drawn from formulas (the mode-collapse card says so on
screen). Everything in scenes 08 and 09 is real.

---

## 4. Make it your own

| I want to…                        | Change this                                                            |
| --------------------------------- | ---------------------------------------------------------------------- |
| change what is said               | the `text` (caption) / `speech` (voice) in `src/narration.json`, then `npm run voiceover` |
| give an animation more time       | add or raise `pad` on that line in `narration.json`                    |
| change the voice or speed         | `VOICE=… RATE=… npm run voiceover`                                     |
| train the GAN differently         | env variables of `npm run train` (1.2), or the `MODES` (real data) in `scripts/train-gan.mjs` |
| change how faces look             | `faceFromZ` in `src/data.ts`, drawing in `src/components/Face.tsx`     |
| change colors / fonts             | `src/theme.ts` (`ROLE` holds the generator / discriminator / real colors) |
| make a vertical (9:16) version    | `width={1080} height={1920}` in `src/Root.tsx`, then re-lay out scenes  |
| add a scene                       | add it to `narration.json`, create `src/scenes/MyScene.tsx`, register it in `SCENE_COMPONENTS` in `src/GanVideo.tsx` |
| hide the captions                 | remove `<Caption … />` in `src/GanVideo.tsx`                           |

Use `npm run studio` while editing: it updates live and you can scrub to any
frame. (Run `npm run voiceover` first so the studio uses the real timings.)

---

## 5. References

- Goodfellow et al., *Generative Adversarial Nets*, NeurIPS 2014: the
  minimax game, the optimal discriminator and the Jensen–Shannon result.
- Radford et al., *DCGAN*, 2015 · Arjovsky et al., *Wasserstein GAN*, 2017 ·
  Zhu et al., *CycleGAN*, 2017 · Karras et al., *ProGAN*, 2017 and
  *StyleGAN*, 2018 · Brock et al., *BigGAN*, 2018.

## 6. License note

Remotion is free for individuals and companies with up to 3 employees. Larger
companies need a company license; see
[remotion.dev/license](https://www.remotion.dev/license). The macOS system
voices are licensed for use on your Mac; check Apple's terms before publishing
videos commercially, or use another TTS tool (see 1.3).
