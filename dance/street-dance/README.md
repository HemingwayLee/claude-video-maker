# street-dance

A 15-second vertical (1080×1920) TikTok-style clip: the sticker girl from
`tobeused/girl/` dances on a neon night street, changing outfits on the beat.

## How it's made

| Step | File | What it does |
| --- | --- | --- |
| Poses | `tools/extract_sprites.py` | Cuts 15 full-body poses out of the sticker sheets (alpha-channel blobs), cleans the fringe, upscales 2×, writes `public/sprites/*.png` + `src/sprites.json` |
| Music | `tools/music.mjs` | Synthesizes an original 128 BPM house loop (kick, clap, hats, bass, chord stabs, hook, risers) → `public/music.wav`. 32 beats = exactly 15 s |
| Dance | `src/choreography.ts` | One pose per beat (half-beat in the finale), with a move type: `bounce`, `sway`, `jump`, `turn` |
| Street | `src/Street.tsx` | Night shopping street drawn with a small 3D projection: buildings, lit windows, neon blade signs, string lights, lamps, zebra crossing — all pulsing on the beat |
| Video | `src/StreetDance.tsx` | Body motion (hop, squash/stretch, sway, hip groove), RGB-split on the kick, motion-trail ghosts, spin + flash + star burst at outfit changes, captions, end card |

Structure: fit 1 (beats 0–7) → fit 2 (8–15) → fit 3 (16–23) → double-time
outfit roulette (24–31) → "which fit?" end card.

## Run

```bash
npm install
npm run sprites   # optional, sprites are committed (needs pillow numpy scipy)
npm run music     # optional, music.wav is committed
npm run render    # → out/street-dance.mp4
```

If Remotion's bundled headless Chrome fails to start (`Target closed`,
`icudtl.dat not found`), render with your installed Chrome:

```bash
BROWSER_EXECUTABLE="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run render
```
