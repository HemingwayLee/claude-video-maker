# 百香果的由來: how passion fruit came to Taiwan (16:9 video)

A 1 min 3 s, **1920×1080 (16:9, landscape)**, 30 fps MP4, narrated in
Taiwanese Mandarin. The whole video is **made with code** using
[Remotion](https://www.remotion.dev/) (React → video).

The presenter is the man from the sticker sheets in `/tobeused/papa`. His
poses are cut out of a sheet (`npm run papa`). Everything else (the passion
fruit and its cut halves, the boat, Taiwan, the map pin, the research station,
the trellis with its vine, flowers and fruit, the pots, the watering can, the
sun) is SVG drawn by the files in `src/`. It is drawn in the man's sticker
style: soft painted shading, thin dark-brown outlines, a white sticker border
with a soft shadow, on a blurry, glowing background.

The video has **no subtitles and no progress bar**, and very little text on
screen. The voice carries the explanation. The only words shown are the title
百香果 (at the start and the end), 台灣 on the map and 鳳山 next to the map pin.

It explains:

> 百香果最初是日本人引進台灣，由鳳山農業試驗所培育而成。

| Time      | Scene          | What you see |
| --------- | -------------- | ------------ |
| 0:00–0:11 | 百香果          | The man waves; a purple passion fruit with a cute face bounces in, title 百香果. It splits into two halves full of golden jelly and seeds; he opens his arms, hearts rise |
| 0:11–0:24 | 日本人引進      | On the sea, a little boat with a Japanese flag on its sail, loaded with passion fruit, sails to Taiwan. The fruits hop onto the island and become seedlings; he points, then thumbs up |
| 0:24–0:35 | 鳳山農業試驗所   | A pin drops on Fengshan (Kaohsiung), 鳳山. A dotted line runs to the research station (house + greenhouse); he walks in. A happy fruit rolls along the line into the station; he opens his arms |
| 0:35–0:46 | 培育而成        | Seedlings in pots are watered, a vine climbs the trellis and passion flowers open while he squats and watches, hand on chin. The flowers turn into happy fruits, the sun comes out, he cheers holding up a passion fruit |
| 0:46–1:03 | 百香果的故事     | Recap in pictures: boat → station → passion fruit. Then Taiwan fills up with happy passion fruits, he cheers with one in his fist, the title comes back |

The narration (in `src/narration.json`):

1. 大家好！你吃過百香果嗎？切開來，是金黃色的果肉，酸酸甜甜，香氣十足！
2. 你知道嗎？百香果最初，是日本人引進台灣的。在日治時期，日本人把百香果帶到台灣來種植。
3. 後來，百香果來到了高雄的鳳山農業試驗所，由這裡的研究人員，繼續培育改良。
4. 他們細心照顧，一次又一次地試驗，終於培育出適合在台灣種植的好百香果！
5. 所以說，百香果最初是日本人引進台灣，由鳳山農業試驗所培育而成。現在，在台灣到處都吃得到香甜的百香果喔！

The rendered video is `out/passionfruit-papa.mp4`.

---

## 1. Reproduce the video

**Requirements**

- Node.js 18 or newer (`node -v`). Remotion downloads its own headless Chrome
  and ships its own ffmpeg, so nothing else is needed to render.
- macOS for the voiceover: it uses the built-in `say` text-to-speech command
  with the Taiwanese voice **Meijia**. Without it the video still renders,
  but silent (see 1.4).

```bash
cd plants/passionfruit-papa
npm install          # install Remotion, React, TypeScript, sharp
npm run papa         # cut the man's poses out of assets/ → public/papa/ (already done; only needed if you change them)
npm run voiceover    # macOS: one WAV per narration line → public/voice/
npm run render       # → out/passionfruit-papa.mp4  (a few minutes)
```

Other commands:

```bash
npm run studio       # open an editor in the browser: scrub the timeline,
                     # edit code and see changes live
npm run still        # export one frame → out/thumbnail.png
npx remotion still PassionFruit out/frame.png --frame=1150   # any frame (here: the trellis in bloom)
npx remotion render PassionFruit out/preview.mp4 --scale=0.5 # quick 960×540 preview
```

### 1.1 Changing the words

Everything that is said is in **`src/narration.json`**: one entry per scene,
one line per voice clip (the text is spoken, never shown). Edit the text, run
`npm run voiceover` again, then `npm run render`. The length of every scene
follows the length of its voice clips, so the pictures stay in sync.

- `speech` (optional): what the voice should say when it differs from
  `text`. Here it adds commas around 鳳山農業試驗所 so the voice slows down
  and says the name clearly.
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

The poses used: `wave`, `arms`, `point`, `thumbs`, `walk`, `squat`, `chin`,
`cheer` (plus `scratch`, `crossed`, `please` and `fist`, cut but unused). His
cap and clothes differ between poses because they do in the sheet. He can't
move his arms or mouth (each pose is one picture); he comes alive with springy
pose changes, a little hop when a line starts and a slow sway.

**Repainting him:** the sheet has no pose holding a fruit, so `Papa.tsx`
draws an SVG `prop` *behind* his fist (see `HANDS`, the fist positions per
pose): his fist covers the bottom of the fruit and the rest sticks out above
it. That is how he holds up a passion fruit in the `cheer` pose at the end of
the 培育而成 and 百香果的故事 scenes. To move the fruit, change the
`translate(...)` of the `prop` in `src/scenes/Breed.tsx` / `Today.tsx`.

### 1.4 No Mac, or no voice wanted

Skip `npm run voiceover` (or delete `public/voice/`). The video renders
silent, and each line's time is estimated from its number of characters
(4.3 per second).

To use another text-to-speech tool or a recorded human voice, write one WAV
file per line to `public/voice/<scene>-<line>.wav` (for example
`today-2.wav` is the third line of the `today` scene) and a
`public/voice/manifest.json` that maps each name to its length in seconds:

```json
{ "intro-0": 2.38, "intro-1": 5.38 }
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
plants/passionfruit-papa/
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
    ├── Root.tsx            # <Composition>: 1920×1080, 30 fps, length from the voice
    ├── PassionFruitVideo.tsx # puts the scenes and audio on the timeline
    ├── theme.ts            # palette, background moods, font, text outline
    ├── anim.ts             # fade / pop / lerp animation helpers
    ├── components/
    │   ├── Sticker.tsx     # the white-border + shadow SVG filter, <Stage>, <Sticker>
    │   ├── Backdrop.tsx    # the blurry glowing background, one "mood" per scene
    │   ├── Papa.tsx        # the man: pose changes, hops, sway, a prop in his fist
    │   ├── Label.tsx       # sticker-style text (only where words are needed)
    │   ├── PassionFruit.tsx # the whole fruit (with a face) and the cut half
    │   └── Things.tsx      # Taiwan + Fengshan pin, boat, waves, research station,
    │                       # pots, trellis + vine, passion flower, watering can,
    │                       # sun, arrow, sparkles, hearts, drops
    └── scenes/             # one file per scene, in video order
        ├── Intro.tsx  Arrival.tsx  Fengshan.tsx
        └── Breed.tsx  Today.tsx
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
   `Arrival.tsx` the boat sails from `L[0]` to `L[1]`, and the fruits hop onto
   Taiwan just after 「在日治時期…」 starts.

### 3.3 The sticker look

Each drawing is placed with `<Sticker x y scale rotate>`. It wraps the drawing
in the `#sticker` SVG filter (`Sticker.tsx`): the shape's outline grown by 8 px
and filled white, plus a blurred shadow below. The filter sits *outside* the
scale, so a small fruit and a big map get the same border width, like the
man's stickers. Shapes use gradients for soft shading and a thin `INK`
outline (`theme.ts`). The fruits' faces are drawn in light colors so they
stay readable on the dark purple skin.

The background (`Backdrop.tsx`) is a gradient with big, very blurred color
blobs drifting slowly, like the bokeh behind the sticker sheet. Each scene
picks a mood (`warm`, `sea`, `green`, `purple`) and can blend into a second
one: the intro turns purple when the fruit is cut, the last scene turns warm
when Taiwan fills up with fruit.
