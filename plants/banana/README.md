# 香蕉花的秘密: banana flowers, 空梳 and 花指 (9:16 video)

A 1 min 42 s, **1080×1920 (9:16, vertical)**, 30 fps MP4 for Shorts / Reels /
TikTok, narrated in Taiwanese Mandarin. It
is drawn in an **anime / manga style** (flat cel shading, thick outlines,
manga focus lines, sound-effect text and a chibi farmer). The whole video is
**made with code** using [Remotion](https://www.remotion.dev/) (React → video).
There is no image or video footage: every frame is SVG drawn by the files in `src/`.

The video has **no subtitles, no chapter badges and no progress bar**, and
very little text on screen. The voice carries the explanation; the screen only
shows the title, short labels on the key parts (一串・一梳・一根・香蕉花・苞片・
小花・空梳・不結果的花指・香蕉刀) and manga sound effects (特寫！ 咔嚓！ 咚！).

It tells this story:

> 香蕉樹有一串串的香蕉，下面有香蕉花，特寫香蕉花。香蕉長到最後，在香蕉花的上面的梗，
> 會有『空梳』與『不結果的花指』，這時候，我們就可以用香蕉刀，把它們剪除。

| Time      | #  | Scene          | Visual aid                                                                                 |
| --------- | -- | -------------- | ------------------------------------------------------------------------------------------ |
| 0:00–0:10 |    | 香蕉花的秘密    | The plant springs up, the farmer waves with a 「♪」 bubble, title 香蕉花 |
| 0:10–0:28 | 1  | 一串串的香蕉    | Dashed box = 一串; one hand glows = 一梳; one banana glows = 一根; pointer to the purple 香蕉花 |
| 0:28–0:46 | 2  | 特寫：香蕉花    | Zoom with manga focus lines and 「特寫！」; label 苞片; the bracts flip up one by one and show the rows of 小花 |
| 0:46–1:12 | 3  | 空梳與花指      | A spinning clock (time passes): bananas fatten; the stalk stretches (double arrow); 空梳 and 不結果的花指 circled and labeled; nutrient drops turn red past the last hand: 「搶養分！」 |
| 1:12–1:28 | 4  | 用香蕉刀剪除    | Farmer with the 香蕉刀 (labeled); a blinking cut line just below the last hand; the swing, slash and 「咔嚓！」; the stalk, 空梳, 花指 and flower fall together 「咚！」 |
| 1:28–1:42 | 5  | 重點回顧        | Food now goes only to the bananas, which grow bigger: 「又大又漂亮！」; a recap card: 「空梳」「花指」 → banana knife |

The video in `out/banana-flower.mp4` was rendered from this folder as it is.
`out/banana-flower-with-captions.mp4` is an earlier version that still had
captions, chapter badges and a progress bar; the code for it is no longer here.

---

## 1. Reproduce the video

**Requirements**

- Node.js 18 or newer (`node -v`). Remotion downloads its own headless Chrome
  and ships its own ffmpeg, so nothing else is needed to render.
- macOS for the voiceover: it uses the built-in `say` text-to-speech command
  with the Taiwanese voice **Meijia**. Without it the video still renders,
  but silent (see 1.3).

```bash
cd plants/banana
npm install          # install Remotion, React, TypeScript
npm run voiceover    # macOS: one WAV per narration line → public/voice/
npm run render       # → out/banana-flower.mp4  (about 1 minute)
```

Other commands:

```bash
npm run studio       # open an editor in the browser: scrub the timeline,
                     # edit code and see changes live
npm run still        # export one frame → out/thumbnail.png
npx remotion still BananaFlower out/frame.png --frame=1000   # any frame (here: the close-up)
npx remotion render BananaFlower out/preview.mp4 --scale=0.5 # quick 540×960 preview
```

### 1.1 Changing the words

Everything that is said is in **`src/narration.json`**: one
entry per scene, one line per voice clip (the text is spoken, never shown). Edit the text, run
`npm run voiceover` again, then `npm run render`. The length of every scene
follows the length of its voice clips, so the pictures stay in sync.

- `speech` (optional): what the voice should say when it differs from
  `text` (for example to fix a pronunciation).
- `pad` (optional): extra seconds of silence after a line, so an animation
  can finish (the cut scene uses this for the falling flower).

The scenes time their animations to the *start of each line* (see 3.2), so if
you add or remove a line in a scene, open that scene in `src/scenes/` and
check the `L[...]` numbers it uses.

### 1.2 Choosing the voice

```bash
say -v '?' | grep zh_TW                          # the Taiwanese voices on your Mac
VOICE="Flo (Chinese (Taiwan))" npm run voiceover # another voice
RATE=220 npm run voiceover                       # faster (default: the voice's own speed)
```

Better voices can be downloaded in *System Settings → Accessibility → Spoken
Content → System Voice → Manage Voices* (look for "Enhanced" or "Premium",
under Chinese (Taiwan)). Then pass their name in `VOICE`.

### 1.3 No Mac, or no voice wanted

Skip `npm run voiceover` (or delete `public/voice/`). The video renders
silent, and each line's time is estimated from its number of
characters (4.3 per second).

To use another text-to-speech tool or a recorded human voice, write one WAV
file per line to `public/voice/<scene>-<line>.wav` (for example `grow-2.wav`
is the third line of the `grow` scene) and a `public/voice/manifest.json`
that maps each name to its length in seconds:

```json
{ "intro-0": 3.28, "intro-1": 3.83 }
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

**Chinese text shows as boxes**: the labels use the PingFang TC font that
ships with macOS (then Heiti TC, Noto Sans TC, Microsoft JhengHei). On
Linux, install a Traditional Chinese font, for example `fonts-noto-cjk`.

---

## 2. Project layout

```
plants/banana/
├── package.json            # dependencies + npm scripts
├── remotion.config.ts      # render settings (image format, browser path)
├── scripts/
│   └── voiceover.mjs       # narration.json → public/voice/*.wav + manifest.json
├── public/voice/           # generated voice clips (git-ignored)
├── out/                    # the rendered video and thumbnail (git-ignored)
└── src/
    ├── narration.json      # THE SCRIPT: every spoken line, per scene
    ├── timeline.ts         # turns the script + clip lengths into frame numbers
    ├── index.ts            # entry point: registerRoot()
    ├── Root.tsx            # <Composition>: 1080×1920, 30 fps, length from the voice
    ├── BananaVideo.tsx     # puts the scenes and audio on the timeline
    ├── plant.ts            # geometry of the banana plant (hands, stalk, nodes, leaves)
    ├── theme.ts            # anime palette, one color per idea, font, text outline
    ├── anim.ts             # fade / pop / lerp animation helpers
    ├── components/
    │   ├── World.tsx       # the camera (pan + zoom), sky, clouds, hills, ground
    │   ├── BananaPlant.tsx # trunk, leaves, bunch, 空梳, 花指, the cut and the fall
    │   ├── BananaBud.tsx   # the banana flower: bracts that flip open, rows of 小花
    │   ├── Farmer.tsx      # the chibi farmer and the banana knife (香蕉刀)
    │   ├── Nutrients.tsx   # the nutrient drops that travel down the stalk
    │   └── Manga.tsx       # focus lines, sparkles, sound-effect text, bubbles, callouts
    └── scenes/             # one file per scene, in video order
        ├── Intro.tsx  Tree.tsx  Flower.tsx
        └── Grow.tsx  Cut.tsx  Recap.tsx
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
   `Cut.tsx` the knife strikes at `L[2] + 14`, 14 frames after the line
   「把空梳、花指，連同香蕉花一起剪除！」 starts.

### 3.3 One plant, one camera

There is a single drawing of the banana plant, in "world" coordinates
(`plant.ts`). Scenes don't redraw it; they change its parameters and move a
camera over it:

| Parameter (`<BananaPlant>`) | What it does                                                    |
| --------------------------- | --------------------------------------------------------------- |
| `g` (growth, 0 → 1)         | bananas get fatter and lighter green; the stalk under the last hand stretches and the 空梳 and 花指 appear on it |
| `open` (0 → 2)              | the banana flower's first, then second bract flips up, showing the 小花 under it |
| `cut`, `fall` (0 → 1)       | the part below `CUT_Y` becomes a separate piece that drops and tips over onto the ground |
| `removed`                   | the cut-off piece has been carried away (recap)                 |

The camera (`World.tsx`) is a point to look at plus a zoom; `moveCam()`
eases between keyframes. The background is drawn in layers that follow the
camera less and less (sky 8 %, far hills 35 %, near hills 65 %), which gives
the parallax depth you see during the close-up zoom. Labels are drawn in
screen space: `toScreen(cam, x, y)` turns a point on the plant into a point
on screen, so a label stays stuck to its target while the camera moves.

### 3.4 The anime look

- **Cel shading**: every shape has a flat color, one darker shade shape on
  the side away from the sun, a thick dark-brown outline (`INK`), and a small
  white highlight. Bananas are thick stroked curves drawn three times
  (outline, color, shade + shine).
- **Manga effects** (`Manga.tsx`): 集中線 focus lines for the close-up,
  four-point sparkles, big tilted sound-effect words (特寫！ 咔嚓！ 咚！)
  with an outline and drop shadow, a white flash between scenes.
- **Colors carry meaning** (`ROLE` in `theme.ts`): yellow = the bunch,
  pink = the flower, blue = 空梳, purple = 花指, red = the knife and the cut.
  Each label uses its idea's color, in every scene.

### 3.5 Vertical-video layout

The frame is 1080×1920. Nothing important is placed in the bottom ~300 px,
which apps such as YouTube Shorts and TikTok cover with their own buttons.
There are no captions; if you want them back, render a caption inside each
line's `<Sequence>` in `BananaVideo.tsx` (`timeline.scenes[].lines[].text`
holds the words and timing).
