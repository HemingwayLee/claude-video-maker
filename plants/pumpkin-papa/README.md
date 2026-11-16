# 「小黑」南瓜: a small Taiwanese chestnut pumpkin (9:16 video)

A 1 min 17 s, **1080×1920 (9:16, vertical)**, 30 fps MP4 for Shorts / Reels /
TikTok, narrated in Taiwanese Mandarin. The whole video is **made with
code** using [Remotion](https://www.remotion.dev/) (React → video).

The presenter is the man from the sticker sheets in `/tobeused/papa`. His
poses are cut out of a sheet (`npm run papa`). Everything else (pumpkins, the
chestnut, Taiwan, Hokkaido, the sun, the thermometer, the plants and the
month ring) is SVG drawn by the files in `src/`. It is drawn in the man's
sticker style: soft painted shading, thin dark-brown outlines, a white
sticker border with a soft shadow, on a blurry, glowing background.

The video has **no subtitles and no progress bar**, and very little text on
screen. The voice carries the explanation. The only words shown are the title
「小黑」南瓜, the names 小黑 / 貝貝, the places 台灣 / 北海道, the month numbers on
the ring and 10月 → 2月.

It explains:

> 「小黑」是台灣育種的小型栗子南瓜品種。與中國的「貝貝南瓜」十分相似，「貝貝南瓜」也是一種栗子南瓜。
> 因為栗子南瓜是北海道培育的品種，所以比較適合冷涼的氣候，在台灣炎熱的氣候不太容易種植成功。
> 但「小黑南瓜」有針對台灣炎熱的氣候做改良，所以成功的機率會比較高一些。「小黑南瓜」建議的在種植季節是秋冬兩季(也就是10月到2月)

| Time      | Scene         | What you see |
| --------- | ------------- | ------------ |
| 0:00–0:09 | 小黑南瓜       | The man waves; a dark-green pumpkin with a cute face bounces in; title 「小黑」南瓜, he cheers with both fists up |
| 0:09–0:25 | 台灣的栗子南瓜 | He points at you, Taiwan with 小黑 on it; the pumpkin is sliced open (golden flesh) and he opens his arms; flesh ≈ chestnut, he squats with his hand on his chin |
| 0:25–0:34 | 小黑與貝貝     | 小黑 ≈ 貝貝 side by side; a chestnut pops over each and a dashed frame groups them (both chestnut pumpkins) while he squats and thinks; thumbs up |
| 0:34–0:48 | 北海道與台灣   | Snowy Hokkaido, a chestnut pumpkin on it, a low thermometer, he opens his arms. Swap to Taiwan under a blazing sun: the thermometer shoots up, the pumpkin sweats, he scratches his head |
| 0:48–1:00 | 為台灣改良     | 小黑 puts on sunglasses (ready for the heat), he clenches his fists. Two rows of 4 plants in the sun: other chestnut pumpkins give 1 pumpkin, 小黑 gives 3 (✓); he cheers |
| 1:00–1:11 | 種植季節       | A ring of the 12 months: 10–11 light up orange (autumn), 12–2 blue (winter); an arrow sweeps from 10 round to 2; 10月 → 2月; he points, then thumbs up |
| 1:11–1:17 | 一起種小黑     | Autumn leaves fall, he cheers behind a pile of happy 小黑, the title comes back |

The rendered video is `out/xiaohei-pumpkin-papa.mp4`.

---

## 1. Reproduce the video

**Requirements**

- Node.js 18 or newer (`node -v`). Remotion downloads its own headless Chrome
  and ships its own ffmpeg, so nothing else is needed to render.
- macOS for the voiceover: it uses the built-in `say` text-to-speech command
  with the Taiwanese voice **Meijia**. Without it the video still renders,
  but silent (see 1.4).

```bash
cd plants/pumpkin-papa
npm install          # install Remotion, React, TypeScript, sharp
npm run papa         # cut the man's poses out of assets/ → public/papa/ (already done; only needed if you change them)
npm run voiceover    # macOS: one WAV per narration line → public/voice/
npm run render       # → out/xiaohei-pumpkin-papa.mp4  (a few minutes)
```

Other commands:

```bash
npm run studio       # open an editor in the browser: scrub the timeline,
                     # edit code and see changes live
npm run still        # export one frame → out/thumbnail.png
npx remotion still XiaoheiPumpkin out/frame.png --frame=1990   # any frame (here: the month ring)
npx remotion render XiaoheiPumpkin out/preview.mp4 --scale=0.5 # quick 540×960 preview
```

### 1.1 Changing the words

Everything that is said is in **`src/narration.json`**: one entry per scene,
one line per voice clip (the text is spoken, never shown). Edit the text, run
`npm run voiceover` again, then `npm run render`. The length of every scene
follows the length of its voice clips, so the pictures stay in sync.

- `speech` (optional): what the voice should say when it differs from
  `text` (for example to fix a pronunciation).
- `pad` (optional): extra seconds of silence after a line, so an animation
  can finish.

The scenes time their animations to the *start of each line* (see 3.2), so if
you add or remove a line in a scene, open that scene in `src/scenes/` and
check the `L[...]` numbers it uses.

### 1.2 Choosing the voice

```bash
say -v '?' | grep zh_TW                          # the Taiwanese voices on your Mac
VOICE="Eddy (Chinese (Taiwan))" npm run voiceover # a male voice, to match the man
RATE=220 npm run voiceover                       # faster (default: the voice's own speed)
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
line to `POSES` (open the sheet in any image viewer to read the pixel
coordinates), run `npm run papa` and use the name in a scene.

The poses used: `wave`, `cheer`, `point`, `arms`, `chin`, `thumbs`,
`scratch`, `fist` (plus `crossed` and `please`, cut but unused). His cap and
clothes differ between poses because they do in the sheet. He can't move his
arms or mouth (each pose is one picture); he comes alive with springy pose
changes, a little hop when a line starts and a slow sway. `Papa.tsx` can
also draw an SVG `prop` behind his fist (see `HANDS`), though this video
doesn't use it.

The same video with the girl as presenter is in `../pumpkin`.

### 1.4 No Mac, or no voice wanted

Skip `npm run voiceover` (or delete `public/voice/`). The video renders
silent, and each line's time is estimated from its number of characters
(4.3 per second).

To use another text-to-speech tool or a recorded human voice, write one WAV
file per line to `public/voice/<scene>-<line>.wav` (for example
`climate-2.wav` is the third line of the `climate` scene) and a
`public/voice/manifest.json` that maps each name to its length in seconds:

```json
{ "intro-0": 3.83, "intro-1": 1.86 }
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
plants/pumpkin-papa/
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
    ├── PumpkinVideo.tsx    # puts the scenes and audio on the timeline
    ├── theme.ts            # palette, background moods, font, text outline
    ├── anim.ts             # fade / pop / lerp animation helpers
    ├── components/
    │   ├── Sticker.tsx     # the white-border + shadow SVG filter, <Stage>, <Sticker>
    │   ├── Backdrop.tsx    # the blurry glowing background, one "mood" per scene
    │   ├── Papa.tsx        # the man: pose changes, hops, sway
    │   ├── Label.tsx       # sticker-style text (only where words are needed)
    │   ├── Pumpkin.tsx     # 小黑 / 貝貝 with faces and sunglasses; the cut half
    │   ├── Things.tsx      # chestnut, sun, snowflake, thermometer, Taiwan,
    │   │                   # Hokkaido, pumpkin plant, sparkles, hearts, sweat
    │   └── Calendar.tsx    # the 12-month ring and the arrow around it
    └── scenes/             # one file per scene, in video order
        ├── Intro.tsx  What.tsx  Similar.tsx  Climate.tsx
        └── Improved.tsx  Season.tsx  Outro.tsx
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
   `Climate.tsx` Hokkaido slides out and Taiwan slides in at `L[2]`, the
   moment 「在炎熱的台灣…」 starts.

### 3.3 The sticker look

Each drawing is placed with `<Sticker x y scale rotate>`. It wraps the drawing
in the `#sticker` SVG filter (`Sticker.tsx`): the shape's outline grown by 8 px
and filled white, plus a blurred shadow below. The filter sits *outside* the
scale, so a small chestnut and a big pumpkin get the same border width, like
the man's stickers. Shapes use gradients for soft shading and a thin
`INK` outline (`theme.ts`).

The background (`Backdrop.tsx`) is a vertical gradient with big, very blurred
color blobs drifting slowly, like the bokeh behind the sticker sheet. Each
scene picks a mood (`warm`, `green`, `cold`, `hot`, `autumn`) and can blend
into a second one. The climate scene goes from `cold` to `hot` when it
switches from Hokkaido to Taiwan.
