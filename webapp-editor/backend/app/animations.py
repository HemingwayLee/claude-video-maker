"""Animations Claude Code makes from selected subtitles (the "Animation options" and "Generated videos" tabs).

For each request the backend sets up a ready-to-render Remotion project in `<animations_dir>/<uuid>/`:
the voice of the selected part of the source video (following the timeline edit), the subtitles' timing in
frames, a few reference stills, and BRIEF.md with the prompt and options. Claude Code then writes the React
scenes, checks stills, and renders `out/animation.mp4`. node_modules links to the shared install in the image.
"""

import asyncio
import json
import logging
import re
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app import jobs, models, schemas
from app.claude import MODELS, ensure_credentials
from app.config import settings
from app.db import SessionLocal, get_db
from app.videos import _probe_duration, _video_dir

logger = logging.getLogger(__name__)

router = APIRouter(tags=["animations"])

OPTIONS_KEY = "animation_options"
OUTPUT = "out/animation.mp4"
THUMBNAIL = "out/thumbnail.jpg"
PAD_S = 0.25  # a little air before the first and after the last subtitle
MAX_REFERENCE_FRAMES = 6
MAX_ACTIVITY = 400

STYLES = {
    "flat": "Flat vector illustration: simple geometric shapes, bold flat colours, no outlines or thin ones, "
    "soft shadows at most. Friendly and clean, like a modern explainer video.",
    "sticker": "Cartoon sticker style: characters and objects with thick dark outlines, a white sticker border, "
    "bright fills and simple shading; playful, bouncy motion.",
    "whiteboard": "Hand-drawn whiteboard sketch: dark marker lines on white, drawn on as if by hand (animate "
    "SVG strokes), a few accent colours, simple doodles and arrows.",
    "infographic": "Clean infographic: diagrams, icons, arrows, charts and labels that build up step by step; "
    "precise layout, generous spacing, calm motion.",
    "kinetic": "Kinetic typography: the words themselves are the visuals — big type that moves, scales and "
    "swaps in rhythm with the voice, with a few supporting shapes and icons.",
    "papercut": "Paper cut-out: layered paper shapes with subtle drop shadows and slightly uneven edges, "
    "textured flat colours, gentle parallax movement.",
}
TEXT_RULES = {
    "none": "Show no text on screen (no captions, no labels). Tell the story with pictures and motion only.",
    "keywords": "Show only a few key words or short labels on screen when they help; no full sentences or "
    "running captions.",
    "captions": "Show the subtitles as captions, each exactly during its time (see CUES), readable at the "
    "bottom of the frame, plus any labels the pictures need.",
}
LANGUAGE_NAMES = {
    "en": "English",
    "zh_TW": "Traditional Chinese as written in Taiwan (繁體中文)",
    "ja": "Japanese (日本語)",
}

# Imports running in this process, by animation id: the asyncio task, the current stage and the activity.
_running: dict[int, dict[str, Any]] = {}


# --- options ------------------------------------------------------------------------------------------------


def load_options(db: Session) -> schemas.AnimationOptions:
    row = db.get(models.AppSetting, OPTIONS_KEY)
    saved = row.value if row else {}
    defaults = schemas.AnimationOptions(model=settings.claude_default_model).model_dump()
    try:
        return schemas.AnimationOptions(**{**defaults, **saved})
    except ValueError:  # an option that's no longer valid: fall back to the defaults
        return schemas.AnimationOptions(**defaults)


@router.get("/api/animation-options")
def get_options(db: Session = Depends(get_db)):
    return {
        "options": load_options(db),
        "defaults": schemas.AnimationOptions(model=settings.claude_default_model),
        "models": MODELS,
    }


@router.put("/api/animation-options", response_model=schemas.AnimationOptions)
def save_options(payload: schemas.AnimationOptions, db: Session = Depends(get_db)):
    row = db.get(models.AppSetting, OPTIONS_KEY)
    if row is None:
        db.add(models.AppSetting(key=OPTIONS_KEY, value=payload.model_dump()))
    else:
        row.value = payload.model_dump()
    db.commit()
    return payload


# --- reading animations -------------------------------------------------------------------------------------


def _project_dir(anim: models.Animation) -> Path:
    return Path(settings.animations_dir) / str(anim.uuid)


def _read(anim: models.Animation, detail: bool = False):
    live = _running.get(anim.id)
    data = {k: getattr(anim, k) for k in schemas.AnimationRead.model_fields if hasattr(anim, k)}
    data.update(
        has_video=anim.status == "complete" and (_project_dir(anim) / OUTPUT).exists(),
        stage=live["stage"] if live else None,
        project_dir=str(Path("animations") / str(anim.uuid)),
    )
    if detail:
        return schemas.AnimationDetail(**data, activity=live["activity"] if live else (anim.activity or []))
    return schemas.AnimationRead(**data)


def _get(db: Session, animation_id: int) -> models.Animation:
    anim = db.get(models.Animation, animation_id)
    if anim is None:
        raise HTTPException(404, "Animation not found")
    return anim


def recover_interrupted() -> int:
    """Claude Code runs don't survive a restart: mark the ones that were going as failed."""
    with SessionLocal() as db:
        result = db.execute(
            update(models.Animation)
            .where(models.Animation.status.in_(("queued", "running")))
            .values(status="error", error="Interrupted by a server restart.", finished_at=datetime.now(timezone.utc))
        )
        db.commit()
        return result.rowcount


@router.get("/api/animations", response_model=list[schemas.AnimationRead])
def list_animations(db: Session = Depends(get_db)):
    return [_read(a) for a in db.scalars(select(models.Animation).order_by(models.Animation.id.desc()))]


@router.get("/api/animations/{animation_id}", response_model=schemas.AnimationDetail)
def get_animation(animation_id: int, db: Session = Depends(get_db)):
    return _read(_get(db, animation_id), detail=True)


@router.get("/api/animations/{animation_id}/video")
def animation_video(animation_id: int, download: bool = False, db: Session = Depends(get_db)):
    anim = _get(db, animation_id)
    path = _project_dir(anim) / OUTPUT
    if not path.exists():
        raise HTTPException(404, "This animation has no video yet")
    name = re.sub(r"[^\w\- ]+", "", anim.title).strip()[:80] or "animation"
    return FileResponse(path, media_type="video/mp4", filename=f"{name}.mp4" if download else None)


@router.get("/api/animations/{animation_id}/thumbnail")
def animation_thumbnail(animation_id: int, db: Session = Depends(get_db)):
    path = _project_dir(_get(db, animation_id)) / THUMBNAIL
    if not path.exists():
        raise HTTPException(404, "No thumbnail")
    return FileResponse(path, media_type="image/jpeg")


@router.post("/api/animations/{animation_id}/cancel", status_code=202)
def cancel_animation(animation_id: int, db: Session = Depends(get_db)):
    _get(db, animation_id)
    live = _running.get(animation_id)
    if live:
        live["task"].cancel()
    return {"stopping": bool(live)}


@router.delete("/api/animations/{animation_id}", status_code=204)
def delete_animation(animation_id: int, db: Session = Depends(get_db)):
    anim = _get(db, animation_id)
    live = _running.get(animation_id)
    if live:
        live["task"].cancel()
    shutil.rmtree(_project_dir(anim), ignore_errors=True)
    db.delete(anim)
    db.commit()


# --- creating one -------------------------------------------------------------------------------------------


def _kept_pieces(segments: list[list[float]] | None, duration: float, a: float, b: float) -> list[tuple[float, float]]:
    """The parts of [a, b] (source seconds) that the video's timeline edit keeps, in order."""
    kept = [seg for seg in segments or [] if isinstance(seg, list)] or [[0.0, duration]]  # source parts only
    return [(max(a, s), min(b, e)) for s, e in kept if min(b, e) - max(a, s) > 0.01]


def _to_animation_time(pieces: list[tuple[float, float]], t: float) -> float:
    """Source time -> seconds from the start of the animation (a cut-out time maps to where the cut is)."""
    offset = 0.0
    for s, e in pieces:
        if t < s:
            return offset
        if t <= e:
            return offset + (t - s)
        offset += e - s
    return offset


def _frame_size(options: schemas.AnimationOptions, video_path: Path) -> tuple[int, int, str]:
    aspect = options.aspect
    if aspect == "source":
        aspect = "16:9"
        try:
            out = subprocess.run(
                ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:stream_side_data=rotation",
                 "-of", "json", str(video_path)],
                capture_output=True, text=True, timeout=30, check=True,
            ).stdout
            stream = json.loads(out)["streams"][0]
            w, h = stream["width"], stream["height"]
            if any(abs(d.get("rotation", 0)) == 90 for d in stream.get("side_data_list", [])):
                w, h = h, w
            aspect = "9:16" if h > w * 1.1 else "1:1" if abs(w - h) <= w * 0.1 else "16:9"
        except (OSError, subprocess.SubprocessError, ValueError, KeyError, IndexError):
            pass
    short = 1080 if options.resolution == "1080p" else 720
    long = short * 16 // 9
    return {"16:9": (long, short), "9:16": (short, long), "1:1": (short, short)}[aspect] + (aspect,)


def _cut_audio(video_path: Path, pieces: list[tuple[float, float]], out: Path) -> bool:
    """The voice of the kept pieces, joined, as a WAV. False when the video has no audio."""
    parts = "".join(f"[0:a]atrim=start={s:.3f}:end={e:.3f},asetpts=PTS-STARTPTS[a{i}];" for i, (s, e) in enumerate(pieces))
    graph = parts + "".join(f"[a{i}]" for i in range(len(pieces))) + f"concat=n={len(pieces)}:v=0:a=1[out]"
    proc = subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(video_path), "-filter_complex", graph, "-map", "[out]",
         "-ar", "48000", "-ac", "2", str(out)],
        capture_output=True, text=True, timeout=600,
    )
    if proc.returncode != 0:
        if "matches no streams" in proc.stderr or "does not contain any stream" in proc.stderr:
            return False
        raise HTTPException(422, f"Couldn't cut the audio: {proc.stderr.strip()[-300:]}")
    return True


def _reference_frames(video_path: Path, times: list[float], folder: Path) -> list[str]:
    folder.mkdir(parents=True, exist_ok=True)
    names = []
    for i, t in enumerate(times, start=1):
        name = f"frame-{i:02d}.jpg"
        proc = subprocess.run(
            ["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", str(video_path), "-frames:v", "1",
             "-vf", "scale='min(720,iw)':-2", "-q:v", "4", str(folder / name)],
            capture_output=True, timeout=60,
        )
        if proc.returncode == 0 and (folder / name).exists():
            names.append(name)
    return names


TSCONFIG = {
    "compilerOptions": {
        "target": "ES2018", "module": "commonjs", "jsx": "react-jsx", "strict": True, "noEmit": True,
        "lib": ["es2019", "dom"], "esModuleInterop": True, "resolveJsonModule": True, "skipLibCheck": True,
        "forceConsistentCasingInFileNames": True,
    },
    "include": ["src"],
}

ROOT_TSX = """// Set up by webapp-editor: the composition's size, length and sound come from brief.ts. Don't edit.
import React from "react";
import { AbsoluteFill, Composition, Html5Audio, staticFile } from "remotion";
import { Animation } from "./Animation";
import { VIDEO } from "./brief";

const Main: React.FC = () => (
  <AbsoluteFill>
    <Animation />
    {VIDEO.audio ? <Html5Audio src={staticFile(VIDEO.audio)} /> : null}
  </AbsoluteFill>
);

export const Root: React.FC = () => (
  <Composition
    id="Animation"
    component={Main}
    durationInFrames={VIDEO.durationInFrames}
    fps={VIDEO.fps}
    width={VIDEO.width}
    height={VIDEO.height}
  />
);
"""

INDEX_TS = """import { registerRoot } from "remotion";
import { Root } from "./Root";

registerRoot(Root);
"""

ANIMATION_TSX = """// Replace this with the animation. Time things to CUES (frames) from ./brief.
import React from "react";
import { AbsoluteFill } from "remotion";

export const Animation: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#f4efe6", justifyContent: "center", alignItems: "center" }} />
);
"""

REMOTION_CONFIG = """import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setEntryPoint("src/index.ts");
"""


def _scaffold(folder: Path, video: dict, cues: list[dict], brief: str) -> None:
    (folder / "src").mkdir(parents=True, exist_ok=True)
    (folder / "out").mkdir(exist_ok=True)
    (folder / "public").mkdir(exist_ok=True)
    link = folder / "node_modules"
    if not link.exists() and not link.is_symlink():
        link.symlink_to(Path(settings.remotion_runtime) / "node_modules")
    # One render (or still) at a time across all animations: Chrome rendering is heavy.
    lock = "flock /tmp/remotion-render.lock"
    package = {
        "name": "animation",
        "private": True,
        "scripts": {
            "still": f"{lock} remotion still src/index.ts Animation",
            "render": f"{lock} remotion render src/index.ts Animation {OUTPUT}",
            "typecheck": "tsc --noEmit",
        },
    }
    (folder / "package.json").write_text(json.dumps(package, indent=2) + "\n")
    (folder / "tsconfig.json").write_text(json.dumps(TSCONFIG, indent=2) + "\n")
    (folder / "remotion.config.ts").write_text(REMOTION_CONFIG)
    (folder / "src" / "index.ts").write_text(INDEX_TS)
    (folder / "src" / "Root.tsx").write_text(ROOT_TSX)
    (folder / "src" / "Animation.tsx").write_text(ANIMATION_TSX)
    cue_lines = ",\n".join(f"  {{ from: {c['from']}, to: {c['to']}, text: {json.dumps(c['text'], ensure_ascii=False)} }}" for c in cues)
    (folder / "src" / "brief.ts").write_text(
        "// Set up by webapp-editor from the request. Don't edit.\n"
        f"export const VIDEO = {json.dumps(video)} as const;\n\n"
        "// The subtitles of the selected part, in frames from the start of the animation (what is said when).\n"
        f"export const CUES: {{ from: number; to: number; text: string }}[] = [\n{cue_lines}\n];\n"
    )
    (folder / "BRIEF.md").write_text(brief)


def _brief(prompt: str, o: schemas.AnimationOptions, video: dict, cues: list[dict], aspect: str,
           has_audio: bool, frames: list[str], source_title: str) -> str:
    fps = video["fps"]
    style = o.custom_style.strip() if o.style == "custom" and o.custom_style.strip() else STYLES.get(o.style, STYLES["flat"])
    language = "the same language as the subtitles" if o.text_language == "subtitles" else LANGUAGE_NAMES[o.text_language]
    rows = "\n".join(
        f"| {c['from']}–{c['to']} | {c['from'] / fps:.2f}–{c['to'] / fps:.2f} s | {c['text'].replace('|', '/').replace(chr(10), ' ')} |"
        for c in cues
    )
    if o.audio == "original" and has_audio:
        sound = ("`public/audio.wav` is the real voice of this part of the source video, already wired up in "
                 "Root.tsx. Sync the pictures to it using CUES: show each idea while it is being said.")
    elif o.audio == "original":
        sound = "The source video has no sound here, so the animation is silent."
    else:
        sound = "Silent: no audio. Pace the animation as if the subtitles were being read aloud at CUES' times."
    refs = (
        "Stills from the source video at these moments, to see what it is about (subject, objects, setting): "
        + ", ".join(f"`public/reference/{f}`" for f in frames)
        + ". Look at them with Read. Use them as reference only — draw the animation; don't put the photos in it."
        if frames else "No reference stills."
    )
    return f"""# Animation brief

## Request

{prompt.strip()}

## What is said (CUES in `src/brief.ts`)

From the video "{source_title}". Frames at {fps} fps, from the start of the animation.

| Frames | Time | Subtitle |
| --- | --- | --- |
{rows}

## Format

- {video['width']}×{video['height']} ({aspect}), {fps} fps, {video['durationInFrames']} frames = {video['durationInFrames'] / fps:.2f} s. Fill the whole length.
- Sound: {sound}

## Look

- Style: {style}
- Colours: {o.palette.strip() or "your choice; harmonious, high contrast, readable"}.
- On-screen text: {TEXT_RULES[o.on_screen_text]} Any text is in {language}.
- Keep important content inside the safe area (5% margin), and text large enough to read on a phone.

## Reference

{refs}
{f"## More instructions{chr(10)}{chr(10)}{o.extra_instructions.strip()}{chr(10)}" if o.extra_instructions.strip() else ""}"""


PROMPT = """\
Make a short animated video with Remotion (React) in this folder. Read BRIEF.md first: it has the request, \
what is said and when, the format and the look.

How to work:
- Write the animation in `src/`: start from `src/Animation.tsx` and add scene/component files as you like. \
Don't change `src/Root.tsx` or `src/brief.ts` (size, length, fps and sound come from there).
- Everything is installed already (no npm install; no internet at render time): remotion, \
@remotion/transitions, @remotion/shapes, @remotion/paths, @remotion/noise, @remotion/media-utils, react. \
Draw with React, SVG and CSS; animate with useCurrentFrame, interpolate, spring, Sequence/Series. \
Installed fonts: "Noto Sans", "Noto Serif", "Noto Sans CJK TC", "Noto Sans CJK JP", "Noto Color Emoji".
- Time the scenes to CUES (frames) from `src/brief.ts`, so each picture appears while its words are said.
- Check your work: `npm run typecheck`, then render a few stills at key frames, e.g. \
`npm run still -- out/check-0120.png --frame=120`, and look at them with Read. Fix anything wrong \
(overlaps, text cut off or too small, empty or static frames, wrong timing).
- When it looks right, `npm run render` (writes out/animation.mp4). Renders run one at a time, so a \
render may wait for another to finish.
- Finish with two or three sentences describing the scenes.
"""


def _summarize_tool(name: str, data: dict) -> str:
    if name == "Bash":
        return str(data.get("command", ""))[:300]
    if name in ("Read", "Write", "Edit"):
        return str(data.get("file_path", "")).split("/animations/", 1)[-1].split("/", 1)[-1]
    if name in ("Glob", "Grep"):
        return str(data.get("pattern", ""))[:200]
    if name == "TodoWrite":
        return f"{len(data.get('todos', []))} steps"
    return ""


def _stage_for(name: str, data: dict) -> str | None:
    cmd = str(data.get("command", ""))
    path = str(data.get("file_path", ""))
    if name == "Bash" and "render" in cmd and "still" not in cmd:
        return "Rendering the video…"
    if name == "Bash" and "still" in cmd:
        return "Checking frames…"
    if name == "Bash" and ("tsc" in cmd or "typecheck" in cmd):
        return "Checking the code…"
    if name == "Read" and path.endswith((".png", ".jpg")):
        return "Looking at frames…"
    if name in ("Write", "Edit") and "/src/" in path:
        return "Writing the animation…"
    if name == "Read" and path.endswith("BRIEF.md"):
        return "Reading the brief…"
    return None


@router.post("/api/animations", response_model=schemas.AnimationRead, status_code=202)
async def create_animation(payload: schemas.AnimationCreate, db: Session = Depends(get_db)):
    """Make an animation from selected subtitles: set up the project, then let Claude Code build and render it."""
    video = db.get(models.Video, payload.video_id)
    if video is None or not video.video_file or video.status not in ("ready", "transcribing"):
        raise HTTPException(409, "The video isn't ready")
    options = schemas.AnimationOptions(
        **{**load_options(db).model_dump(), **payload.options.model_dump(exclude_none=True)}
    )
    video_path = _video_dir(video) / video.video_file
    duration = video.duration_s or _probe_duration(video_path) or max(c.end for c in payload.cues)

    a = max(0.0, min(c.start for c in payload.cues) - PAD_S)
    b = min(duration, max(c.end for c in payload.cues) + PAD_S)
    pieces = _kept_pieces(video.segments, duration, a, b)
    if not pieces:
        raise HTTPException(400, "Those subtitles are all in parts of the video you cut out")
    kept = sum(e - s for s, e in pieces)

    width, height, aspect = _frame_size(options, video_path)
    fps = options.fps
    length_s = kept if options.length == "match" else options.custom_seconds
    total_frames = max(1, round(length_s * fps))
    cues = []
    for c in sorted(payload.cues, key=lambda c: c.start):
        start = _to_animation_time(pieces, c.start)
        end = _to_animation_time(pieces, c.end)
        f0, f1 = round(start * fps), min(round(end * fps), total_frames)
        if f1 > f0:
            cues.append({"from": f0, "to": f1, "text": c.text.strip()})

    title = (payload.title or "").strip() or re.sub(r"\s+", " ", payload.prompt).strip()[:60]
    anim = models.Animation(
        title=title[:300],
        video_id=video.id,
        source_title=video.title,
        start_s=a,
        end_s=b,
        cues=cues,
        prompt=payload.prompt,
        options=options.model_dump(),
        status="queued",
    )
    db.add(anim)
    db.flush()
    folder = _project_dir(anim)
    try:
        (folder / "public").mkdir(parents=True, exist_ok=True)
        has_audio = options.audio == "original" and await asyncio.to_thread(
            _cut_audio, video_path, pieces, folder / "public" / "audio.wav"
        )
        frames: list[str] = []
        if options.reference_frames:
            mids = [(c.start + c.end) / 2 for c in sorted(payload.cues, key=lambda c: c.start)]
            step = max(1, len(mids) // MAX_REFERENCE_FRAMES + (len(mids) % MAX_REFERENCE_FRAMES > 0))
            frames = await asyncio.to_thread(
                _reference_frames, video_path, mids[::step][:MAX_REFERENCE_FRAMES], folder / "public" / "reference"
            )
        spec = {"width": width, "height": height, "fps": fps, "durationInFrames": total_frames,
                "audio": "audio.wav" if has_audio else None}
        _scaffold(folder, spec, cues, _brief(payload.prompt, options, spec, cues, aspect, has_audio, frames, video.title))
        db.commit()
    except BaseException:
        db.rollback()
        shutil.rmtree(folder, ignore_errors=True)
        raise
    db.refresh(anim)

    live = {"stage": "Waiting for Claude Code…", "activity": []}
    _running[anim.id] = live
    live["task"] = asyncio.create_task(_run(anim.id, options))
    return _read(anim)


def _save(animation_id: int, **values) -> None:
    with SessionLocal() as db:
        db.execute(update(models.Animation).where(models.Animation.id == animation_id).values(**values))
        db.commit()


async def _run(animation_id: int, options: schemas.AnimationOptions) -> None:
    from claude_agent_sdk import (
        AssistantMessage, ClaudeAgentOptions, ResultMessage, SystemMessage, TextBlock, ToolUseBlock, query,
    )

    live = _running[animation_id]
    activity: list[dict] = live["activity"]
    with SessionLocal() as db:
        anim = db.get(models.Animation, animation_id)
        folder = _project_dir(anim)
    started = datetime.now(timezone.utc)
    cost = None
    error = None
    status = "error"
    session_id = None

    def note(entry: dict) -> None:
        activity.append({"at": datetime.now(timezone.utc).isoformat(), **entry})
        del activity[:-MAX_ACTIVITY]

    try:
        ensure_credentials()
        async with jobs.slots:  # shares the limit on concurrent Claude Code runs with the chat
            _save(animation_id, status="running")
            live["stage"] = "Claude Code is starting…"
            sdk_options = ClaudeAgentOptions(
                model=options.model,
                effort=options.effort,
                cwd=str(folder),
                system_prompt={"type": "preset", "preset": "claude_code"},
                allowed_tools=["Read", "Write", "Edit", "Bash", "Glob", "Grep", "TodoWrite"],
                permission_mode="dontAsk",
                max_turns=options.max_turns or None,
                max_budget_usd=options.max_budget_usd or None,
                max_buffer_size=settings.claude_max_buffer_bytes,
            )
            async for message in query(prompt=PROMPT, options=sdk_options):
                if isinstance(message, SystemMessage) and message.subtype == "init":
                    session_id = message.data.get("session_id")
                elif isinstance(message, AssistantMessage) and message.parent_tool_use_id is None:
                    for block in message.content:
                        if isinstance(block, ToolUseBlock):
                            note({"type": "tool", "tool": block.name, "detail": _summarize_tool(block.name, block.input)})
                            live["stage"] = _stage_for(block.name, block.input) or live["stage"]
                        elif isinstance(block, TextBlock) and block.text.strip():
                            note({"type": "text", "text": block.text.strip()[:4000]})
                elif isinstance(message, ResultMessage):
                    cost = message.total_cost_usd
                    if message.is_error:
                        error = f"Claude Code stopped: {message.result or message.subtype}"
        output = folder / OUTPUT
        if output.exists() and output.stat().st_mtime >= started.timestamp():
            status = "complete"
            if error:  # e.g. hit the turn or budget limit after rendering: keep the video, note why it stopped
                note({"type": "text", "text": error})
                error = None
        elif error is None:
            error = "Claude Code finished without rendering out/animation.mp4."
    except asyncio.CancelledError:
        status, error = "stopped", "Stopped."
    except Exception as exc:  # noqa: BLE001 - shown to the user
        logger.exception("Animation %s failed", animation_id)
        error = f"Couldn't make the animation: {exc}"
    finally:
        duration = None
        if status == "complete":
            output = folder / OUTPUT
            duration = await asyncio.to_thread(_probe_duration, output)
            await asyncio.to_thread(
                subprocess.run,
                ["ffmpeg", "-v", "error", "-y", "-ss", f"{(duration or 0) * 0.4:.2f}", "-i", str(output),
                 "-frames:v", "1", "-vf", "scale='min(640,iw)':-2", str(folder / THUMBNAIL)],
                capture_output=True, timeout=60,
            )
        _save(
            animation_id,
            status=status,
            error=error,
            activity=list(activity),
            cost_usd=cost,
            duration_s=duration,
            claude_session_id=session_id,
            finished_at=datetime.now(timezone.utc),
        )
        _running.pop(animation_id, None)
