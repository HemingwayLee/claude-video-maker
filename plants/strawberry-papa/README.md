# 草莓的種子在哪裡？ where a strawberry's seeds really are (9:16 video)

A 1 min 4 s, **1080×1920 (9:16, vertical)**, 30 fps MP4 for Shorts / Reels /
TikTok, narrated in Taiwanese Mandarin. The whole video is **made with
code** using [Remotion](https://www.remotion.dev/) (React → video).

The presenter is the man from the sticker sheets in `/tobeused/papa`. His
poses are cut out of a sheet (`npm run papa`). Everything else (the
strawberry and its achenes, the big achene that splits open, the seed, the
magnifying glass, the plate, the sun, the moon, the stars and the sprouts) is
SVG drawn by the files in `src/`. It is drawn in the man's sticker style:
soft painted shading, thin dark-brown outlines, a white sticker border with a
soft shadow, on a blurry, glowing background.

The video has **no subtitles and no progress bar**, and very little text on
screen. The voice carries the explanation. The only words shown are the two
key terms **瘦果** and **種子** (plus two question marks in the intro).

It explains:

> 草莓的種子在哪裡？草莓表面的一粒粒小顆粒學名叫做「瘦果」，而每一粒瘦果的裡面，才包裹著真正的「種子」。如果我們把草莓放久一點，就可以看到草莓表面的小顆粒冒出芽來。

| Time      | Scene     | What you see |
| --------- | --------- | ------------ |
| 0:00–0:10 | 草莓       | The man waves; a strawberry with a cute face bounces in. Question marks pop up, the strawberry goes "wow?", he scratches his head |
| 0:10–0:26 | 瘦果       | A magnifying glass glides over the strawberry and shows the bumps up close. The bumps light up while he squats and thinks. One bump gets a ring and a dotted line up to the word 瘦果; thumbs up |
| 0:26–0:38 | 真正的種子  | That bump pops off the strawberry, flies to the middle and grows huge (the strawberry moves to a corner). The shell splits in two and the real seed inside shines: 種子. He opens his arms |
| 0:38–0:51 | 冒出芽來    | The strawberry sits on a plate. The sun and the moon cross the sky three times (day, night, day…) and the berry gets a little darker. Then green sprouts pop out of the bumps one after another; he opens his arms, amazed |
| 0:51–1:04 | 種子藏在瘦果裡 | Recap in pictures: strawberry → achene (瘦果) ↓ seed (種子) → sprout. He cheers holding up a strawberry, hearts float up |

The narration (in `src/narration.json`):

1. 大家好！你看，這是一顆紅通通的草莓。你知道，草莓的種子在哪裡嗎？
2. 仔細看，草莓表面有一粒一粒的小顆粒。很多人以為，這就是草莓的種子。其實，這些小顆粒的學名，叫做「瘦果」。
3. 我們拿一粒瘦果，放大來看看。原來，每一粒瘦果的裡面，才包裹著真正的「種子」！
4. 如果我們把草莓，放久一點，就可以看到，草莓表面的小顆粒，冒出芽來喔！
5. 所以，草莓的種子，就藏在每一粒瘦果的裡面！下次吃草莓的時候，記得仔細看一看喔！

The rendered video is `out/strawberry-papa.mp4`.

---

## 1. Reproduce the video

**Requirements**

- Node.js 18 or newer (`node -v`). Remotion downloads its own headless Chrome
  and ships its own ffmpeg, so nothing else is needed to render.
- macOS for the voiceover: it uses the built-in `say` text-to-speech command
  with the Taiwanese voice **Meijia**. Without it the video still renders,
  but silent (see 1.4).

```bash
cd plants/strawberry-papa
npm install          # install Remotion, React, TypeScript, sharp
npm run papa         # cut the man's poses out of assets/ → public/papa/ (already done; only needed if you change them)
npm run voiceover    # macOS: one WAV per narration line → public/voice/
npm run render       # → out/strawberry-papa.mp4  (several minutes)
```

Other commands:

```bash
npm run studio       # open an editor in the browser: scrub the timeline,
                     # edit code and see changes live
npm run still        # export one frame → out/thumbnail.png
npx remotion still StrawberrySeeds out/frame.png --frame=1007  # any frame (here: the seed is revealed)
npx remotion render StrawberrySeeds out/preview.mp4 --scale=0.5 # quick 540×960 preview
```

### 1.1 Changing the words

Everything that is said is in **`src/narration.json`**: one entry per scene,
one line per voice clip (the text is spoken, never shown). Edit the text, run
`npm run voiceover` again, then `npm run render`. The length of every scene
follows the length of its voice clips, so the pictures stay in sync.

- `speech` (optional): what the voice should say when it differs from
  `text`. Here it drops the 「」 and adds a comma before 瘦果 and 種子 so
  the voice pauses and says the key word clearly.
- `pad` (optional): extra seconds of silence after a line, so an animation
  can finish. The first line of the 冒出芽來 scene has a long `pad` (2.4 s):
  that is the time the sun and moon need to cross the sky.

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

The poses used: `wave`, `scratch`, `point`, `chin`, `thumbs`, `squat`,
`arms`, `cheer` (plus `crossed`, `please`, `fist` and `walk`, cut but
unused). His cap and clothes differ between poses because they do in the
sheet. He can't move his arms or mouth (each pose is one picture); he comes
alive with springy pose changes, a little hop when a line starts and a slow
sway.

**Repainting him:** the sheet has no pose holding a fruit, so `Papa.tsx`
draws an SVG `prop` *behind* his fist (see `HANDS`, the fist positions per
pose): his fist covers the tip of the strawberry and the rest sticks out
above it. That is how he holds up a strawberry in the `cheer` pose at the
end. To move it, change the `translate(...)` / `scale(...)` of `held` in
`src/scenes/Outro.tsx`.

### 1.4 No Mac, or no voice wanted

Skip `npm run voiceover` (or delete `public/voice/`). The video renders
silent, and each line's time is estimated from its number of characters
(4.3 per second).

To use another text-to-speech tool or a recorded human voice, write one WAV
file per line to `public/voice/<scene>-<line>.wav` (for example
`achene-2.wav` is the third line of the `achene` scene) and a
`public/voice/manifest.json` that maps each name to its length in seconds:

```json
{ "intro-0": 3.98, "intro-1": 2.77 }
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
plants/strawberry-papa/
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
    ├── StrawberryVideo.tsx # puts the scenes and audio on the timeline
    ├── theme.ts            # palette, background moods, font, text outline
    ├── anim.ts             # fade / pop / lerp animation helpers
    ├── components/
    │   ├── Sticker.tsx     # the white-border + shadow SVG filter, <Stage>, <Sticker>
    │   ├── Backdrop.tsx    # the blurry glowing background, one "mood" per scene
    │   ├── Papa.tsx        # the man: pose changes, hops, sway, a prop in his fist
    │   ├── Label.tsx       # sticker-style text (only where words are needed)
    │   ├── Strawberry.tsx  # the strawberry: achenes (ACHENES), glow, face,
    │   │                   # aging, sprouts growing from the achenes; <Sprout>
    │   └── Things.tsx      # the big achene that splits open, the seed,
    │                       # magnifier, plate, sun, moon, star, question mark,
    │                       # arrow, sparkles, hearts
    └── scenes/             # one file per scene, in video order
        ├── Intro.tsx  Achene.tsx  SeedInside.tsx
        └── Sprouting.tsx  Outro.tsx
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
   `SeedInside.tsx` the shell splits just after 「原來，每一粒瘦果的裡面」
   starts (`L[1] + 14`), and the seed shines on 「才包裹著真正的種子」 (`L[2]`).

### 3.3 The strawberry and its achenes

`Strawberry.tsx` computes the achene positions once (`ACHENES`: staggered
rows inside the berry's outline, with a little jitter) and draws each one as
a tiny golden teardrop in a darker dimple, tilted toward the tip. Because the
positions are shared, scenes can work with single achenes:

- `Achene.tsx` rings the achene nearest the upper right (`POINTED`) and draws
  the dotted line from it to the word 瘦果,
- `SeedInside.tsx` hides that same achene on the berry (`hide`) and flies a
  big `AcheneBig` out from its exact spot,
- `sprouts` grows a `<Sprout>` out of two achenes in three, each pointing
  away from the middle of the berry, one after another (none around the face).

The magnifying glass in `Achene.tsx` draws the same strawberry a second time,
2.2× bigger around the lens center, clipped to the lens circle.

### 3.4 The sticker look

Each drawing is placed with `<Sticker x y scale rotate>`. It wraps the drawing
in the `#sticker` SVG filter (`Sticker.tsx`): the shape's outline grown by 8 px
and filled white, plus a blurred shadow below. The filter sits *outside* the
scale, so a small achene and a big strawberry get the same border width, like
the man's stickers. Shapes use gradients for soft shading and a thin `INK`
outline (`theme.ts`).

The background (`Backdrop.tsx`) is a gradient with big, very blurred color
blobs drifting slowly, like the bokeh behind the sticker sheet. Each scene
picks a mood (`warm`, `pink`, `gold`, `green`, `night`) and can blend into a
second one: in 冒出芽來 the sky blends between `green` and `night` as the
days pass.
