# webapp-editor

A web UI for talking to Claude Code, built on the same stack as `info-center`:

- **backend/**: FastAPI + SQLAlchemy on PostgreSQL. Claude Code runs through the Claude Agent SDK
  (`app/claude.py`); each answer is a background job (`app/jobs.py`) streamed to the browser as server-sent
  events, so it keeps running if you reload or switch chats, and can be stopped.
- **frontend/**: React 19 + Vite + MUI. The first tab, **Claude Code**, is the chat: a chat list, model picker,
  streaming answers with tool calls, Stop, and Up/Down prompt history. The second tab, **Video Editing**, is a
  small video editor (`src/pages/VideoEditingPage.jsx`, `src/components/video/`): **Import video** opens a dialog
  to upload a video with an optional `.srt`, or to download a video and its subtitles (en / zh_TW / ja) from a
  YouTube link (yt-dlp + ffmpeg, `app/videos.py`). Each import becomes an item in the sidebar; selecting one opens
  the player, the subtitle list and a zoomable, editable timeline: split the video at the playhead and delete
  parts (removed parts close up and are skipped on playback), an Audio track shows the sound's waveform (`GET /api/videos/{id}/waveform`, computed once with ffmpeg and cached
  as `waveform.u8`), and you can delete or retime subtitles (drag a cue's edges, or
  type exact times). Edits are non-destructive and autosaved: kept parts in the `videos.segments` column, edited
  subtitles in `subtitles.srt` with the original kept as `subtitles.original.srt` until Reset. When YouTube has no captions in that
  language, Claude Code can write them: it transcribes the audio with Whisper (`backend/scripts/transcribe.py`,
  model `WHISPER_MODEL`), then corrects, translates and times the cues. Imported files go to
  `workspace/videos/<uuid>/` (`video.mp4`, `subtitles.srt`), where Claude Code can use them.
  The editor's right-hand panel has two tabs: **Subtitle** (the subtitle list and editor) and **Material** (animations
  generated from this video, plus video/audio files uploaded from disk, previewed in place; stored in the video's
  `materials/` folder, `app/materials.py`). Drag Material onto the timeline and it gets its own track (video tracks
  above the main video, audio below the main audio), CapCut-style: move clips, trim their edges, split at the
  playhead, delete, mute a track, undo/redo; clips snap to the playhead and other clip edges. The player plays the
  tracks in sync (video tracks cover the main picture). Tracks are saved in `videos.overlays` with the rest of the
  edit (`src/video/overlays.js`, `components/video/OverlayTrack.jsx`).
  The right panel's **Export** tab renders the edited timeline with ffmpeg (`backend/app/exports.py`, one render
  at a time): an MP4 with sound (kept parts joined, extra tracks overlaid and mixed, subtitles optionally burnt
  in), or the audio alone (MP3/M4A/WAV). Renders go to a temporary folder in the backend container (never the
  workspace); the browser downloads the file as soon as it's done and the server deletes it right after. Subtitles download as SRT or WebVTT, timed to the edited video or to the original.
  The third tab, **Animation making options**, holds the options Claude Code uses to make animations (style,
  colours, on-screen text, frame, resolution, fps, length, sound, reference stills, extra instructions, model,
  effort, cost and turn limits). In Video Editing, select subtitles, right-click and choose **Generate animation**:
  the backend (`app/animations.py`) sets up a Remotion project in `workspace/animations/<uuid>/` with the
  selected part's voice (following timeline cuts), the subtitles' timing in frames, reference stills and a
  `BRIEF.md`; Claude Code writes the scenes, checks stills and renders `out/animation.mp4`. The fourth tab,
  **Generated videos**, lists them with live progress, the result, and what Claude Code did. Remotion, its
  headless Chrome and CJK fonts are installed in the backend image (`backend/remotion-runtime/`, shared by all
  projects through a `node_modules` link); renders run one at a time.
  Add more tabs in `src/App.jsx`.
- **docker-compose.dev.yml**: Postgres, backend, frontend and pgweb, with hot reload on both sides
  (`uvicorn --reload`, Vite HMR; file watching polls so it works over Docker bind mounts).

## Run

```sh
cd webapp-editor
cp .env.example .env   # set CLAUDE_CODE_OAUTH_TOKEN (from `claude setup-token`) or ANTHROPIC_API_KEY
docker compose -f docker-compose.dev.yml up -d --build
```

| Service  | URL                              |
| -------- | -------------------------------- |
| App      | http://localhost:5679            |
| API      | http://localhost:8766/docs       |
| pgweb    | http://localhost:8082            |
| Postgres | `localhost:5433` (app / app)     |

Edit files under `backend/` or `frontend/` and the running containers pick the change up. After changing
`requirements.txt` or `package.json`, rebuild: `docker compose -f docker-compose.dev.yml up -d --build`.
A backend reload ends answers that were running; they are marked as interrupted.

## Where Claude Code works

Claude Code runs inside the backend container with `/workspace` as its working directory, which is
`webapp-editor/workspace/` by default. It may read, write and run shell commands there without asking
(`permission_mode="dontAsk"` with the tools in `CLAUDE_ALLOWED_TOOLS`, see `app/config.py`). To let it work
on something else, set `WORKSPACE_DIR` in `.env` (e.g. `WORKSPACE_DIR=..` for this whole repo) and recreate the
backend. Session transcripts live in the `claude-config` volume, so chats resume after restarts.
