# 枸杞台灣也能種嗎？ (16:9 video)

A 54-second, **1920×1080 (16:9)**, 30 fps MP4 narrated in Taiwanese Mandarin.
It is drawn in an **anime / manga style**: flat cel shading, thick outlines,
chibi characters, a big red 〇 like on a Japanese quiz show, sweat drops and
"gloom" lines, and spinning burst backgrounds.

The video has **no subtitles and no progress bar**, and very little text on
screen. The voice carries the words, and the pictures carry the numbers.
The whole video is **made with code** using [Remotion](https://www.remotion.dev/)
(React → video). There is no footage: every frame is drawn as SVG by the files
in `src/`.

It is based on this text:

> 枸杞台灣也能種嗎？
> 可以種，但台灣種植枸杞有一定難度且產量極少。全台灣枸杞種植面積合計不到 10 公頃，
> 市面上超過 98% 的枸杞仍仰賴中國進口。

| Time      | Scene                  | Narration                                   | What is on screen |
| --------- | ---------------------- | ------------------------------------------- | ----------------- |
| 0:00–0:06 | intro: 枸杞台灣也能種嗎？ | 紅通通的枸杞，台灣也能種嗎？                   | A goji shrub grows and fills with red berries; a girl wonders 「？」; the title 枸杞 next to Taiwan with a question mark |
| 0:06–0:17 | answer: 可以種，但很難    | 答案是：可以種！／有一定的難度，／而且產量極少。 | A field with a Taiwan signpost. A big red 〇 drawn around the shrub on a burst background 「叮咚♪」. Then the farmer sweats while the shrub shakes, with a difficulty meter at 4 of 5 stars. Then a basket with only three berries, gloom lines and 「……」 |
| 0:17–0:29 | area: 不到 10 公頃        | 全台灣的枸杞種植面積，／合計還不到十公頃，／大約只有十四個足球場那麼大。 | A map of Taiwan; a counter climbs to 「< 10 公頃」; 14 numbered football pitches pop up, and 「⚽ × 14」 appears |
| 0:29–0:42 | import: 98% 靠進口        | 所以，市面上的枸杞，／超過百分之九十八，／仍然仰賴從中國進口。 | A market stall with 100 berries (one per 1 %); 98 of them turn orange while the counter climbs to 「> 98%」. A map slides in: ships carry crates of goji from the mainland coast to Taiwan |
| 0:42–0:54 | recap: 重點回顧          | 總結一下：台灣可以種枸杞，但種得很少；／我們吃到的枸杞，幾乎都是進口的喔！ | Two cards: a shrub on Taiwan beside a nearly empty basket 「能種，但很少」, and a cargo ship 「> 98%」「幾乎都是進口」. The two characters cheer |

**"14 football pitches"** is the only fact in the video that is not from the
source text. It is there to make 10 公頃 easy to picture. A standard pitch is
105 × 68 m ≈ 0.714 公頃, so 10 公頃 ÷ 0.714 ≈ 14. To drop it, see section 3.

The video in `out/goji-taiwan.mp4` was rendered from this folder as it is.

---

## 1. Reproduce the video

**Requirements**

- Node.js 18 or newer (`node -v`). Remotion downloads its own headless Chrome
  and ships its own ffmpeg, so nothing else is needed to render.
- macOS for the voiceover. It uses the built-in `say` text-to-speech command
  with the Taiwanese voice **Meijia**. Without it, the video still renders,
  but it is silent (see 1.2).

```bash
cd plants/gogi
npm install          # install Remotion, React, TypeScript
npm run voiceover    # macOS: one WAV per narration line → public/voice/
npm run render       # → out/goji-taiwan.mp4  (about 1 minute)
```

Other commands:

```bash
npm run studio       # open an editor in the browser: scrub the timeline,
                     # edit code and see changes live
npm run still        # export one frame → out/thumbnail.png
npx remotion still GojiTaiwan out/frame.png --frame=1060   # any frame (here: the 98 % counter)
```

### 1.1 How the timing works

The video's length is not hard-coded. `npm run voiceover` writes
`public/voice/manifest.json`, which holds the length of every clip. When
rendering, `calculateMetadata` in `src/Root.tsx` reads it, and
`src/timeline.ts` gives every narration line a time slot that is as long as
its clip, plus a short gap and the line's `pad`.

Every scene times its animation from the start of its lines (`useLines()`),
not from fixed frame numbers. So if you change the voice, the speed, or the
wording, the pictures stay in sync. **Run `npm run voiceover` again after any
change to `src/narration.json`.**

### 1.2 Voice options

```bash
say -v '?' | grep zh_TW                     # list the Taiwanese voices on your Mac
VOICE="Flo (Chinese (Taiwan))" npm run voiceover
RATE=200 npm run voiceover                  # faster speech (words per minute)
```

Better voices can be downloaded in **System Settings → Accessibility → Spoken
Content → System Voice → Manage Voices… → Chinese (Taiwan)**.

**No Mac, or your own voice:** record one WAV per line, named
`public/voice/<scene>-<line>.wav` (for example `area-1.wav`), and write
`public/voice/manifest.json` with each clip's length in seconds:

```json
{ "intro-0": 2.91, "answer-0": 1.69, "answer-1": 3.28 }
```

Without `public/voice/`, the video renders silent, with each line's length
estimated from its number of characters.

### 1.3 Troubleshooting

**`ProtocolError ... Target closed`** means the headless Chrome that Remotion
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

**Chinese text shows as boxes**: the on-screen labels use the PingFang TC
font that ships with macOS. If that is missing, they fall back to Heiti TC,
Noto Sans TC, or Microsoft JhengHei. On Linux, install a Traditional Chinese
font, for example `fonts-noto-cjk`.

---

## 2. Project layout

```
plants/gogi/
├── package.json            # dependencies + npm scripts
├── remotion.config.ts      # render settings (image format, browser path)
├── scripts/
│   └── voiceover.mjs       # narration.json → public/voice/*.wav + manifest.json
├── public/voice/           # generated voice clips (git-ignored)
├── out/                    # the rendered video and thumbnail (git-ignored)
└── src/
    ├── narration.json      # THE SCRIPT: every spoken line, per scene (never shown on screen)
    ├── timeline.ts         # turns the script + clip lengths into frame numbers
    ├── index.ts            # entry point: registerRoot()
    ├── Root.tsx            # <Composition>: 1920×1080, 30 fps, length from the voice
    ├── GojiVideo.tsx       # puts the scenes and audio on the timeline; white flash between scenes
    ├── theme.ts            # colors (one accent per idea), font, outlined-text helper
    ├── anim.ts             # fade / pop / lerp helpers
    ├── components/
    │   ├── Backdrop.tsx    # Field (sky, clouds, hills), Sea, Burst (spinning rays)
    │   ├── Goji.tsx        # GojiBush (grows, leaves, flowers, berries) and one Berry
    │   ├── People.tsx      # Chibi farmer (斗笠) and girl, ready-made POSES, Basket
    │   ├── Map.tsx         # Taiwan and mainland coastlines (lon/lat), Ship, Crate
    │   ├── Pitch.tsx       # football pitch seen from above, ball
    │   ├── Manga.tsx       # FocusLines, Sparkle, Sfx text, SpeechBubble, 〇 Maru, Star
    │   └── Stage.tsx       # a full-screen 1920×1080 SVG layer
    └── scenes/
        ├── Intro.tsx       # 枸杞台灣也能種嗎？
        ├── Answer.tsx      # 可以種 → 有難度 → 產量極少
        ├── Area.tsx        # < 10 公頃 ≈ 14 football pitches
        ├── Import.tsx      # 100 berries → > 98 % → ships across the strait
        └── Recap.tsx       # two summary cards
```

Colors keep one meaning throughout the video: **green = grown in Taiwan**,
**orange = imported**, and **blue = difficulty**.

---

## 3. Making changes

**Change what is said:** edit `text` in `src/narration.json`. If the voice
should pronounce something differently from how it is written, add `speech`,
for example `"speech": "百分之九十八"`. Use `pad` to hold a line longer so an
animation can finish. Then run `npm run voiceover && npm run render`.

**Add or remove a line:** each scene reads its line start frames as `L[0]`,
`L[1]`, and so on. The comment at the top of each scene file lists which
animation belongs to which line. Update that scene along with the script.

**Remove the football-pitch comparison:** delete the third line of the `area`
scene in `narration.json`, and in `src/scenes/Area.tsx` delete the pitches,
ball and 「× 14」 (everything that uses `L[2]`).

**Change the numbers:** the counters are in `Area.tsx` (`[0, 10]`, the 公頃
counter) and `Import.tsx` (`[0, 98]`, the berries that turn orange). The same
numbers also appear on the recap card in `Recap.tsx`.

**Add subtitles or a progress bar later:** the line text and timing are
already in `timeline.scenes[].lines[]`. In `GojiVideo.tsx`, render a caption
inside each line's `<Sequence>`; `plants/banana/src/components/Chrome.tsx` has
ready-made `Caption` and `ProgressBar` components.

**Another aspect ratio:** change `width` and `height` in `src/Root.tsx`. The
scenes are laid out for 1920×1080, so you would also need to move things
around in the scene files.
