# Hello World video

A 15-second, 1920×1080, 30 fps MP4 made **entirely with code**, using
[Remotion](https://www.remotion.dev/) (React → video).

| Time    | Scene  | What you see                                                   |
| ------- | ------ | -------------------------------------------------------------- |
| 0–4 s   | Intro  | "Hello, World!" letters spring up one by one                   |
| 4–9 s   | Frames | Five "frame" cards with a moving ball: a video is many pictures |
| 9–15 s  | Outro  | "Made with code" inside a spinning gradient ring, fade to black |

A frame counter in the bottom-right corner runs the whole time, so you can
see which frame you are looking at.

---

## 1. Reproduce the video

**Requirements:** Node.js 18 or newer (`node -v`). Nothing else: Remotion
downloads its own headless Chrome and ships its own ffmpeg.

```bash
cd helloworld
npm install          # install Remotion, React, TypeScript
npm run render       # → out/helloworld.mp4  (takes ~30–60 s)
```

Other commands:

```bash
npm run studio       # open an editor in the browser: scrub the timeline,
                     # edit code and see changes live (hot reload)
npm run still        # export a single frame → out/thumbnail.png
npx remotion render HelloWorld out/hello.gif --codec=gif   # GIF instead of MP4
```

### Troubleshooting

**`ProtocolError ... Target closed`** means the headless Chrome Remotion
downloaded could not start. Try these in order:

1. Delete it so it downloads again (a partial download is a common cause):
   `rm -rf node_modules/.remotion && npx remotion browser ensure`
2. Use any other Chrome/Chromium binary through the `BROWSER_EXECUTABLE`
   environment variable (read in `remotion.config.ts`). For example, with
   Playwright's headless shell (`npx playwright install chromium-headless-shell`):

   ```bash
   BROWSER_EXECUTABLE=$(ls -d ~/Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-mac-arm64/chrome-headless-shell | tail -1) \
     npm run render
   ```

   Or, with regular Google Chrome:
   `BROWSER_EXECUTABLE="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run render`

---

## 2. Project layout

```
helloworld/
├── package.json          # dependencies + npm scripts (studio / render / still)
├── remotion.config.ts    # render settings (image format, browser path)
├── tsconfig.json
└── src/
    ├── index.ts          # entry point: registerRoot()
    ├── Root.tsx          # <Composition>: size, fps, duration
    ├── HelloWorld.tsx    # the timeline: which scene plays when
    ├── FrameCounter.tsx  # overlay showing the current frame
    └── scenes/
        ├── Intro.tsx
        ├── Frames.tsx
        └── Outro.tsx
```

---

## 3. How video creation works (the knowledge part)

### 3.1 A video is a sequence of still images

A video is a flip-book. Each picture is a **frame**. Show frames fast enough
and your eye sees motion.

- **Frame rate (fps):** frames per second. 24 is the film look, 30 is
  standard for web and social, 60 is smooth for games and UI.
- **Duration in frames** = seconds × fps. This video is 15 × 30 = **450 frames**.
- **Resolution:** pixels per frame. 1920×1080 ("1080p", 16:9) is the YouTube
  standard. Use 1080×1920 (9:16) for Reels, TikTok and Shorts, and 1080×1080
  (1:1) for square posts.

### 3.2 Video = a function of the frame number

This is the central idea of programmatic video:

```
picture = f(frame)
```

Every component asks "what frame is it?" with `useCurrentFrame()` and draws
what should be on screen **at that exact moment**. Nothing is "playing" during
rendering: Remotion opens a headless Chrome, sets the frame to 0 and takes a
screenshot, then 1, then 2, and so on up to 449. Because each frame depends
only on its number, frames can be rendered in parallel and in any order, and
every render is identical.

> Don't use `setTimeout`, CSS `transition`/`animation` or `Math.random()`.
> They depend on wall-clock time or chance, not on the frame number, so they
> flicker or break in the render. Use `random("seed")` from Remotion if you
> need randomness.

### 3.3 Animation = mapping frames to values

Two helpers do almost all the work:

**`interpolate(frame, inputRange, outputRange)`** maps linearly. For example,
"fade in over the first 15 frames":

```tsx
const opacity = interpolate(frame, [0, 15], [0, 1], {
  extrapolateRight: "clamp", // stay at 1 after frame 15 instead of going to 2, 3, …
});
```

**`spring({ frame, fps })`** goes from 0 to 1 with physics: fast at first,
then a small overshoot and a settle. It looks more natural than a straight
line. Use the result for scale, position or opacity:

```tsx
const progress = spring({ frame: frame - delay, fps, config: { damping: 12 } });
transform: `translateY(${(1 - progress) * 120}px)`;
```

A lower `damping` gives more bounce. Subtracting a `delay` starts the spring
later. That is how the letters in the intro are staggered (`i * 3` frames
apart).

### 3.4 Timeline = Sequences

`HelloWorld.tsx` arranges scenes on a timeline:

```tsx
<Sequence from={120} durationInFrames={150}>
  <Frames />
</Sequence>
```

Inside a `<Sequence>`, `useCurrentFrame()` **starts again at 0**, so each scene
is written as if it were its own small video. That makes scenes easy to
reorder or re-time: change `from` and you're done. Anything outside a Sequence
(like `FrameCounter`) shows for the whole video.

### 3.5 Transitions

Transitions here are hand-made: each scene fades its own opacity to 0 during
its last 15–30 frames, and the next scene fades in. For ready-made wipes,
slides and crossfades, see `@remotion/transitions`.

### 3.6 Rendering = screenshots + encoding

`npm run render` does three things:

1. **Bundle:** webpack bundles your React code into a web page.
2. **Capture:** headless Chrome renders frame 0…449 and takes a screenshot of
   each one (JPEG here, see `remotion.config.ts`).
3. **Encode:** ffmpeg compresses the 450 images into an **H.264** video in an
   **MP4** container.

Some terms to know:

- **Codec** (H.264, H.265, VP9, ProRes) is how frames are compressed.
  H.264 plays everywhere.
- **Container** (MP4, WebM, MOV) is the file format that holds the video and
  audio streams together.
- **Bitrate / CRF** trades quality against file size: `--crf=18` is higher
  quality and a bigger file; `--crf=28` is smaller.

Inspect the result with Remotion's bundled ffprobe:

```bash
npx remotion ffprobe out/helloworld.mp4
```

---

## 4. Make it your own

| I want to…                 | Change this                                                                |
| -------------------------- | -------------------------------------------------------------------------- |
| change the length          | `DURATION_IN_SECONDS` in `src/Root.tsx`, then the `<Sequence>` timings    |
| make a vertical video      | `width={1080} height={1920}` in `src/Root.tsx`                            |
| change the text            | `TEXT` in `src/scenes/Intro.tsx`, strings in the other scenes             |
| change the colors          | `backgroundColor` in `HelloWorld.tsx`, `COLORS` in `Frames.tsx`           |
| add music                  | put `music.mp3` in a `public/` folder, then add `<Audio src={staticFile("music.mp3")} />` inside `HelloWorld` |
| add an image or video clip | `<Img src={staticFile("logo.png")} />` or `<OffthreadVideo src={…} />`    |
| add a scene                | create `src/scenes/MyScene.tsx`, then add a `<Sequence>` in `HelloWorld.tsx` |

Use `npm run studio` while editing: it updates live, and you can scrub to any
frame.

---

## 5. License note

Remotion is free for individuals and companies with up to 3 employees. Larger
companies need a company license; see
[remotion.dev/license](https://www.remotion.dev/license).
