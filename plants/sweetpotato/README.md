# 地瓜葉水培法: keep sweet potato leaf cuttings in water (9:16 video)

A 50-second, **1080×1920 (9:16, vertical)**, 30 fps MP4 for Shorts / Reels /
TikTok, narrated in Taiwanese Mandarin. The whole video is **made with
code** using [Remotion](https://www.remotion.dev/) (React → video).

The presenter is the man from the sticker sheets in `/tobeused/papa`. His
poses are cut out of a sheet (`npm run papa`). Everything else (the sweet
potato leaf cuttings, the garden, the scissors, the glass of water, the
roots, sun and moon) is SVG drawn by the files in `src/`. It is drawn in his
sticker style: soft painted shading, thin dark-brown outlines, a white
sticker border with a soft shadow, on a blurry, glowing background.

The video has **no subtitles and no progress bar**. The voice carries the
explanation. The only words on screen are the title 地瓜葉 / 水培法 (at the
start, when it is named, and at the end).

It explains:

> 把剛剪下的地瓜葉枝條插在水裡（水培法）是非常有效的方法這不僅能讓地瓜葉保持新鮮、防止枯萎，它甚至會開始發根並繼續生長。

| Time      | Scene        | What you see |
| --------- | ------------ | ------------ |
| 0:00–0:07 | 地瓜葉水培法  | The man waves; a fresh sweet potato leaf cutting pops up; title 地瓜葉 水培法; thumbs up |
| 0:07–0:17 | 剛剪下的枝條  | He holds scissors in his fist by the sweet potato patch; snip! one stem comes free. Then he thinks: in his thought bubble a cutting left on a board goes limp and yellow ✗ |
| 0:17–0:26 | 插在水裡      | A glass fills with water, the fresh cutting dips in (splash); 水培法; thumbs up |
| 0:26–0:33 | 保持新鮮      | The same cutting in a glass without water (wilts ✗) and with water (stays fresh ✓) |
| 0:33–0:43 | 發根生長      | Sun, moon, sun… cross the sky (days pass); white roots grow from the stem in the water, then the tip grows two new leaves; he cheers |
| 0:43–0:50 | 試試看        | The rooted, growing cutting; open arms, thumbs up; the title comes back |

The rendered video is `out/sweet-potato-leaves.mp4`.

---

## 1. Reproduce the video

**Requirements**

- Node.js 18 or newer (`node -v`). Remotion downloads its own headless Chrome
  and ships its own ffmpeg, so nothing else is needed to render.
- macOS for the voiceover: it uses the built-in `say` text-to-speech command
  with the Taiwanese voice **Meijia**. Without it the video still renders,
  but silent (see 1.4).

```bash
cd plants/sweetpotato
npm install          # install Remotion, React, TypeScript, sharp
npm run papa         # cut the man's poses out of assets/ → public/papa/ (already done; only needed if you change them)
npm run voiceover    # macOS: one WAV per narration line → public/voice/
npm run render       # → out/sweet-potato-leaves.mp4  (a few minutes)
```

Other commands:

```bash
npm run studio       # open an editor in the browser: scrub the timeline,
                     # edit code and see changes live
npm run still        # export one frame → out/thumbnail.png
npx remotion still SweetPotatoLeaves out/frame.png --frame=1290   # any frame (here: roots + new leaves)
npx remotion render SweetPotatoLeaves out/preview.mp4 --scale=0.5 # quick 540×960 preview
```

### 1.1 Changing the words

Everything that is said is in **`src/narration.json`**: one entry per scene,
one line per voice clip (the text is spoken, never shown). Edit the text, run
`npm run voiceover` again, then `npm run render`. The length of every scene
follows the length of its voice clips, so the pictures stay in sync.

- `speech` (optional): what the voice should say when it differs from
  `text` (for example to fix a pronunciation).
- `pad` (optional): extra seconds of silence after a line, so an animation
  can finish (the wilting and the roots use this).

The scenes time their animations to the *start of each line* (see 3.2), so if
you add or remove a line in a scene, open that scene in `src/scenes/` and
check the `L[...]` numbers it uses.

### 1.2 Choosing the voice

```bash
say -v '?' | grep zh_TW                            # the Taiwanese voices on your Mac
VOICE="Eddy (Chinese (Taiwan))" npm run voiceover  # a male voice, to match the man
RATE=200 npm run voiceover                         # faster (default: the voice's own speed)
```

Better voices can be downloaded in *System Settings → Accessibility → Spoken
Content → System Voice → Manage Voices* (look for "Enhanced" or "Premium",
under Chinese (Taiwan)). Then pass their name in `VOICE`.

### 1.3 Changing the man

The sticker sheets from `/tobeused/papa` are copied into `assets/`. Only
`8c738fcc…` (5 × 3 poses, clean transparent background) is used; the other
one, `ba9eb3c2…`, has red and yellow blotches stuck to the figures.

`scripts/cut-papa.mjs` cuts one pose per entry in its `POSES` table (pose
name → crop box in sheet pixels):

1. crop the box,
2. keep the largest non-transparent blob (the man), which drops the
   sparkles, hearts and music notes next to him,
3. fill the holes inside him,
4. upscale 2× and draw a fresh, even white sticker outline.

It writes `public/papa/<pose>.png` and `public/papa/poses.json` (each
pose's size, read by `src/components/Papa.tsx`). To use another pose, add a
line to `POSES`, run `npm run papa` and use the name in a scene.

The poses used: `wave`, `thumbs`, `fist`, `chin`, `point`, `arms`,
`scratch`, `cheer` (plus `crossed` and `please`, cut but unused).

**Holding things.** No pose in the sheet holds scissors, so `<Papa prop={…}>`
draws an SVG *behind* the sticker at his fist (positions in `HANDS` in
`Papa.tsx`, as fractions of the image): the fist covers the handle and the
blades stick out above it. That's how he holds the scissors in the cut
scene. He can't move his arms or mouth (each pose is one picture); he comes
alive with springy pose changes, a little hop when a line starts and a slow
sway.

### 1.4 No Mac, or no voice wanted

Skip `npm run voiceover` (or delete `public/voice/`). The video renders
silent, and each line's time is estimated from its number of characters
(4.3 per second).

To use another text-to-speech tool or a recorded human voice, write one WAV
file per line to `public/voice/<scene>-<line>.wav` (for example
`roots-1.wav` is the second line of the `roots` scene) and a
`public/voice/manifest.json` that maps each name to its length in seconds:

```json
{ "intro-0": 4.25, "cut-0": 2.92 }
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

**Chinese text shows as boxes**: the labels use the PingFang TC font that
ships with macOS (then Heiti TC, Noto Sans TC, Microsoft JhengHei). On
Linux, install a Traditional Chinese font, for example `fonts-noto-cjk`.

---

## 2. Project layout

```
plants/sweetpotato/
├── package.json            # dependencies + npm scripts
├── remotion.config.ts      # render settings (image format, browser path)
├── assets/                 # the man's sticker sheets (copied from /tobeused/papa)
├── scripts/
│   ├── cut-papa.mjs        # assets/*.png → public/papa/<pose>.png + poses.json
│   └── voiceover.mjs       # narration.json → public/voice/*.wav + manifest.json
├── public/
│   ├── papa/               # the man's poses, cut out
│   └── voice/              # generated voice clips (git-ignored)
├── out/                    # the rendered video and thumbnail (git-ignored)
└── src/
    ├── narration.json      # THE SCRIPT: every spoken line, per scene
    ├── timeline.ts         # turns the script + clip lengths into frame numbers
    ├── index.ts            # entry point: registerRoot()
    ├── Root.tsx            # <Composition>: 1080×1920, 30 fps, length from the voice
    ├── SweetPotatoVideo.tsx# puts the scenes and audio on the timeline
    ├── theme.ts            # palette, background moods, font, text outline
    ├── anim.ts             # fade / pop / lerp animation helpers
    ├── components/
    │   ├── Sticker.tsx     # the white-border + shadow SVG filter, <Stage>, <Sticker>
    │   ├── Backdrop.tsx    # the blurry glowing background, one "mood" per scene
    │   ├── Papa.tsx        # the man: pose changes, hops, sway, a prop in his fist
    │   ├── Label.tsx       # sticker-style text (only for the title)
    │   ├── Plant.tsx       # the leaf cutting: wilt, roots, new growth
    │   └── Things.tsx      # glass of water, scissors, board, soil, thought
    │                       # bubble, sun, moon, sparkles, hearts, ✓/✗, drops
    └── scenes/             # one file per scene, in video order
        ├── Intro.tsx  Cut.tsx  Water.tsx
        └── Fresh.tsx  Roots.tsx  Outro.tsx
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
   (`L[0]`, `L[1]`, …). Animations are written against those: for example in
   `Fresh.tsx` the cutting without water starts wilting at `L[1] + 4`, as
   「還能防止它枯萎」 starts.

### 3.3 One cutting, three dials

There is a single drawing of the leaf cutting (`Plant.tsx`). Scenes don't
redraw it; they turn its dials:

| `<Cutting>` prop | What it does |
| ---------------- | ------------ |
| `wilt` (0 → 1)   | the stem bends over, the leaves droop, shrink and turn yellow |
| `roots` (0 → 1)  | white roots grow out of the bottom of the stem, sideways so they stay in the glass |
| `grow` (0 → 1)   | the tip grows on and unfolds two new, pale leaves |
| `length`         | stem length: 380 on its own, 500 in a glass so the leaves stay above the rim |

`<Jar>` (`Things.tsx`) draws its children between the back of the glass and
the water, so whatever is inside looks submerged.

### 3.4 The sticker look

Each drawing is placed with `<Sticker x y scale rotate>`. It wraps the drawing
in the `#sticker` SVG filter (`Sticker.tsx`): the shape's outline grown by 8 px
and filled white, plus a blurred shadow below. The filter sits *outside* the
scale, so every object gets the same border width, like the man's stickers.
The background (`Backdrop.tsx`) is a gradient with big, very blurred color
blobs drifting slowly. Each scene picks a mood (`green`, `dry`, `water`,
`night`, `warm`) and can blend into another. While days pass in the roots
scene, the background dims to `night` each time the moon crosses.
