# Transformer architecture: a narrated explainer video

A 6 min 23 s, 1920×1080 (16:9), 30 fps MP4 that explains how the
**Transformer** works, the architecture behind today's language models. It
is made **entirely with code** using [Remotion](https://www.remotion.dev/)
(React → video), with a spoken voiceover, on-screen captions, and an animated
diagram for every idea.

The core math is computed, not drawn: the attention scene runs
softmax(QKᵀ/√d)·V step by step on a 4-word example, the causal mask and its
softmax are calculated, and the positional-encoding heatmap and waves use the
sine/cosine formula from the paper (see `src/data.ts`).

| Time      | #  | Scene                     | Visual aid                                                                 |
| --------- | -- | ------------------------- | -------------------------------------------------------------------------- |
| 0:00–0:17 |    | Intro                     | “Attention is all you need” with pulsing attention arcs; title; the building blocks |
| 0:17–0:44 | 01 | Before Transformers       | An RNN reading word by word with one memory vector, early words fading; a Transformer row where every word connects to every word |
| 0:44–1:07 | 02 | Words become vectors      | Sentence → tokens → IDs → embedding vectors; a 2-D embedding space with clusters |
| 1:07–1:32 | 03 | Where is each word?       | “dog bites man” = “man bites dog” as a set; the sinusoidal positional-encoding heatmap; embedding + position = input; fast and slow waves |
| 1:32–1:58 | 04 | Attention: the idea       | “…because it was too tired”: arcs from “it”, with “animal” weighted highest; swapping in “wide” moves the attention to “street”; the new vector as a weighted mix |
| 1:58–2:28 | 05 | Queries, keys and values  | Embedding × W_Q, W_K, W_V → q, k, v, each with its question; a search-engine analogy with q·k scores |
| 2:28–3:08 | 06 | Attention, step by step   | Real numbers: Q·Kᵀ filled cell by cell (with the dot product written out), ÷√d, row softmax (Σ = 1), weights × V → outputs |
| 3:08–3:37 | 07 | Multi-head attention      | Three heads with different patterns (previous word, pronoun → noun, verb → object); concatenate → W_O |
| 3:37–4:10 | 08 | The Transformer block     | The block built up: attention, residual “skip” paths, Add & Norm, feed-forward (512 → 2048 → 512) |
| 4:10–4:30 | 09 | Stacking blocks           | 6 blocks become 96 (GPT-3); “bank” in “river bank” refined from word to meaning |
| 4:30–4:58 | 10 | Encoder and decoder       | “I love cats” → “J'aime les chats”; cross-attention from encoder to decoder; BERT / GPT / T5 |
| 4:58–5:30 | 11 | Generating text           | Causal mask (−∞ above the diagonal) and its softmax; scores over the vocabulary → probabilities → “mat” is picked and appended |
| 5:30–6:02 | 12 | Why it took over          | Parallel vs sequential; 1 step vs 7; 65 M → 175 B parameters; the n² cost of attention |
| 6:02–6:23 | 13 | Recap                     | The whole pipeline in one stack, with the repeated block marked × N        |

A progress bar along the bottom edge has one segment per scene.

---

## 1. Reproduce the video

**Requirements**

- Node.js 18 or newer (`node -v`). Remotion downloads its own headless Chrome
  and ships its own ffmpeg, so nothing else is needed to render.
- macOS for the voiceover: it uses the built-in `say` text-to-speech command.
  Without it the video still renders, with captions but no sound (see 1.2).

```bash
cd ml/transformer
npm install          # install Remotion, React, TypeScript
npm run voiceover    # macOS: write one WAV per narration line → public/voice/
npm run render       # → out/transformer-explainer.mp4  (takes a few minutes)
```

Other commands:

```bash
npm run studio       # open an editor in the browser: scrub the timeline,
                     # edit code and see changes live
npm run still        # export one frame → out/thumbnail.png
npx remotion render TransformerExplainer out/preview.mp4 --scale=0.5   # quick 960×540 preview
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
`public/voice/<scene>-<line>.wav` (for example `math-2.wav`) and a
`public/voice/manifest.json` that maps each name to its length in seconds:

```json
{ "intro-0": 5.2, "intro-1": 6.1 }
```

### 1.3 Troubleshooting

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
ml/transformer/
├── package.json              # dependencies + npm scripts
├── remotion.config.ts        # render settings (image format, browser path)
├── scripts/
│   └── voiceover.mjs         # narration.json → public/voice/*.wav + manifest.json
├── public/voice/             # generated voice clips (git-ignored)
└── src/
    ├── narration.json        # THE SCRIPT: every caption / spoken line, per scene
    ├── timeline.ts           # turns the script + clip lengths into frame numbers
    ├── index.ts              # entry point: registerRoot()
    ├── Root.tsx              # <Composition>: 1920×1080, 30 fps, length from the voice
    ├── TransformerVideo.tsx  # puts the scenes, captions and audio on the timeline
    ├── data.ts               # matrices, softmax, attention, mask, positional encoding
    ├── theme.ts              # colors (one per role: query, key, value, attention…) and fonts
    ├── anim.ts               # fade / pop / lerp animation helpers
    ├── components/
    │   ├── MatrixView.tsx    # a matrix as a labelled grid of cells
    │   ├── Token.tsx         # a token chip
    │   ├── Diagram.tsx       # arrows, vectors, chart helpers
    │   ├── Text.tsx          # Label and Card
    │   └── Chrome.tsx        # scene header, captions, progress bar
    └── scenes/               # one file per scene, in video order
        ├── Intro.tsx  Before.tsx  Tokens.tsx  Position.tsx  Idea.tsx  Qkv.tsx
        ├── AttentionMath.tsx  MultiHead.tsx  Block.tsx  Stack.tsx
        └── EncDec.tsx  Generate.tsx  Why.tsx  Recap.tsx
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
   A line can have `speech` (how to pronounce it, e.g. "W Q" for W_Q, or
   "GPT three") and `pad` (extra seconds after it, so an animation can finish).
2. `npm run voiceover` turns each line into a WAV clip and measures it.
3. Before rendering, `calculateMetadata` in `Root.tsx` reads
   `manifest.json`, and `buildTimeline()` in `timeline.ts` gives every line a
   slot as long as its clip (+ a short gap + `pad`). Scenes are placed back to
   back; the total becomes the video's length.
4. `TransformerVideo.tsx` puts each scene in a `<Sequence>`, and inside it
   each line in its own `<Sequence>` with the caption and the `<Html5Audio>`
   clip.
5. Scenes time their animations against their own lines:

   ```tsx
   const L = useLines();               // start frame of each line in this scene
   const opacity = fade(frame, L[2]);  // appears when line 2 starts
   ```

   So when you rewrite a line or change the voice, the animations move with it.

### 3.3 What is computed and what is illustrative

**Computed in `src/data.ts`** (change the inputs and the video changes):

- **Attention, step by step** (scene 06): `Q`, `K`, `V` are small 4×4
  matrices, hand-picked so the pattern is readable (the → cat, cat → sat,
  sat → cat, down → sat). From them the code computes the scores `Q·Kᵀ`, the
  scaled scores `/√4`, the row softmax, and the outputs `weights·V`. The
  dot product written under the grid and the weighted sum for “cat” are the
  same numbers.
- **Positional encoding** (scene 03): the sine/cosine formula from the paper,
  `PE(pos, 2i) = sin(pos / 10000^(2i/d))`, `PE(pos, 2i+1) = cos(…)`, with
  d = 48 so the waves fit on screen (the paper uses 512).
- **Causal mask** (scene 11): seeded random scores, −∞ above the diagonal,
  then the row softmax. The upper triangle of the weights comes out exactly 0.
- **Next-token probabilities** (scene 11): the softmax of example scores.
- **n²** and the parameter counts (scene 12): plain arithmetic and published
  model sizes (Transformer base 65 M, BERT-large 340 M, GPT-2 1.5 B,
  GPT-3 175 B).

**Illustrative** (there is no trained model inside the video):

- The attention weights of “it” (scene 04). They show the pattern from the
  well-known example sentence, which trained models do learn.
- The three head patterns (scene 07), the embedding-space clusters (02), the
  search-analogy labels (05), and what each depth of the stack encodes (09).
  Each of these is labelled as an illustration on screen.
- The token IDs (02) and the values inside the drawn weight matrices and
  embedding vectors are seeded random numbers or examples.

---

## 4. Make it your own

| I want to…                        | Change this                                                            |
| --------------------------------- | ---------------------------------------------------------------------- |
| change what is said               | the `text` (caption) / `speech` (voice) in `src/narration.json`, then `npm run voiceover` |
| give an animation more time       | add or raise `pad` on that line in `narration.json`                    |
| change the voice or speed         | `VOICE=… RATE=… npm run voiceover`                                     |
| try other attention numbers       | `Q`, `K`, `V` (and `MATH_TOKENS`) in `src/data.ts`: every grid is recomputed |
| change the example sentences      | `IT_SENTENCE`, `TOKEN_SENTENCE`, `HEAD_TOKENS`, `GEN_TOKENS` in `src/data.ts` |
| change colors / fonts             | `src/theme.ts` (`ROLE` holds the query / key / value / attention colors) |
| make a vertical (9:16) version    | `width={1080} height={1920}` in `src/Root.tsx`, then re-lay out scenes  |
| add a scene                       | add it to `narration.json`, create `src/scenes/MyScene.tsx`, register it in `SCENE_COMPONENTS` in `src/TransformerVideo.tsx` |
| hide the captions                 | remove `<Caption … />` in `src/TransformerVideo.tsx`                   |

Use `npm run studio` while editing: it updates live and you can scrub to any
frame. (Run `npm run voiceover` first so the studio uses the real timings.)

---

## 5. References

- Vaswani et al., *Attention Is All You Need*, NeurIPS 2017: the
  architecture, scaled dot-product attention, multi-head attention (h = 8,
  d_k = 64), sinusoidal positional encoding, N = 6, d_model = 512,
  d_ff = 2048.
- Devlin et al., *BERT*, 2018 · Radford et al., *GPT-2*, 2019 · Raffel et
  al., *T5*, 2019 · Brown et al., *GPT-3*, 2020.
- The “animal … street … it was too tired / wide” example is from Google's
  2017 blog post introducing the Transformer.

## 6. License note

Remotion is free for individuals and companies with up to 3 employees. Larger
companies need a company license; see
[remotion.dev/license](https://www.remotion.dev/license). The macOS system
voices are licensed for use on your Mac; check Apple's terms before publishing
videos commercially, or use another TTS tool (see 1.2).
