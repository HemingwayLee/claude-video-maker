"""Source videos for the Video Editing tab: upload a video (+ .srt), or download one (+ subtitles) from YouTube.

Each video gets its own folder, `<videos_dir>/<uuid>/`, holding `video.<ext>` and, when there are subtitles,
`subtitles.srt`. YouTube downloads run in a background thread (yt-dlp); the list endpoint reports progress.
When a YouTube video has no captions in the chosen language, Claude Code can write them: it transcribes the
audio with Whisper (scripts/transcribe.py), then proofreads, translates if needed and re-times the cues.
"""

import asyncio
import logging
import re
import shutil
import subprocess
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, PlainTextResponse
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app import jobs, models, schemas
from app.claude import ensure_credentials
from app.config import settings
from app.db import SessionLocal, get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/videos", tags=["videos"])

VIDEO_EXTENSIONS = {".mp4", ".mov", ".m4v", ".mkv", ".webm", ".avi"}
SUBTITLE_FILE = "subtitles.srt"
ORIGINAL_SUBTITLE_FILE = "subtitles.original.srt"  # kept on the first edit, for Reset
MIN_LENGTH = 0.05  # shortest clip or cue, seconds
# Audio waveform for the timeline: one peak per 1/WAVEFORM_RATE s, as unsigned bytes (0-255).
WAVEFORM_FILE = "waveform.u8"
WAVEFORM_RATE = 100
WAVEFORM_SAMPLE_RATE = 8000
TIMESTAMP = re.compile(r"\d{1,2}:\d{2}:\d{2}[,.]\d{1,3}\s*-->\s*\d{1,2}:\d{2}:\d{2}[,.]\d{1,3}")

TRANSCRIBE_SCRIPT = Path(__file__).resolve().parent.parent / "scripts" / "transcribe.py"

# Subtitle languages offered in the UI: YouTube caption codes to look for, and how to tell Claude Code.
LANGUAGES = {
    "en": {"youtube": ["en", "en-US", "en-GB"], "name": "English"},
    "zh_TW": {
        "youtube": ["zh-TW", "zh-Hant", "zh-Hant-TW"],
        "name": "Traditional Chinese as written in Taiwan (繁體中文, zh-TW): Traditional characters only, "
        "Taiwanese vocabulary, full-width punctuation",
    },
    "ja": {"youtube": ["ja", "ja-JP"], "name": "Japanese (日本語)"},
}

# State of imports running in this process, by video id.
_progress: dict[int, float | None] = {}
_stage: dict[int, str] = {}
_cancelled: set[int] = set()
_tasks: dict[int, asyncio.Task] = {}  # keeps running imports referenced (and cancellable)


def _video_dir(video: models.Video) -> Path:
    return Path(settings.videos_dir) / str(video.uuid)


def _read(video: models.Video) -> schemas.VideoRead:
    return schemas.VideoRead(
        **{k: getattr(video, k) for k in schemas.VideoRead.model_fields if hasattr(video, k)},
        has_video=bool(video.video_file),
        has_subtitles=bool(video.subtitle_file),
        progress=_progress.get(video.id) if video.status == "downloading" else None,
        stage=_stage.get(video.id) if video.status in ("downloading", "transcribing") else None,
        subtitles_edited=bool(video.subtitle_file) and (_video_dir(video) / ORIGINAL_SUBTITLE_FILE).exists(),
    )


def _get(db: Session, video_id: int) -> models.Video:
    video = db.get(models.Video, video_id)
    if video is None:
        raise HTTPException(404, "Video not found")
    return video


def _probe_duration(path: Path) -> float | None:
    try:
        out = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
            capture_output=True, text=True, timeout=30, check=True,
        ).stdout.strip()
        return float(out) if out else None
    except (OSError, subprocess.SubprocessError, ValueError):
        return None


def _decode_srt(data: bytes) -> str:
    """Subtitles as text, checked to look like SRT. Raises 400 otherwise."""
    for encoding in ("utf-8-sig", "utf-16", "cp1252"):
        try:
            text = data.decode(encoding)
            break
        except UnicodeDecodeError:
            continue
    else:
        raise HTTPException(400, "Could not read the subtitle file's text encoding")
    if not TIMESTAMP.search(text):
        raise HTTPException(400, "That doesn't look like an .srt file (no `00:00:01,000 --> 00:00:02,000` lines)")
    return text.replace("\r\n", "\n").replace("\r", "\n")


def _save_srt(folder: Path, upload: UploadFile) -> None:
    if not (upload.filename or "").lower().endswith(".srt"):
        raise HTTPException(400, "Subtitles must be an .srt file")
    text = _decode_srt(upload.file.read())
    (folder / SUBTITLE_FILE).write_text(text, encoding="utf-8")


def _srt_time(t: float) -> str:
    ms = round(t * 1000)
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def cues_to_srt(cues: list[schemas.Cue]) -> str:
    blocks = []
    for i, c in enumerate(sorted(cues, key=lambda c: c.start), start=1):
        text = "\n".join(line for line in c.text.replace("\r", "").split("\n") if line.strip()) or " "
        blocks.append(f"{i}\n{_srt_time(c.start)} --> {_srt_time(c.end)}\n{text}\n")
    return "\n".join(blocks)


def _clear_original(folder: Path) -> None:
    """New subtitles replace the old ones entirely, so there's no original to go back to."""
    (folder / ORIGINAL_SUBTITLE_FILE).unlink(missing_ok=True)


def srt_to_vtt(srt: str) -> str:
    """WebVTT for the browser's <track> element, which can't read SRT."""
    body = re.sub(r"(\d{2}:\d{2}:\d{2}),(\d{3})", r"\1.\2", srt.lstrip("﻿"))
    return "WEBVTT\n\n" + body


def recover_interrupted() -> int:
    """Imports don't survive a restart: mark the ones that were running as failed."""
    with SessionLocal() as db:
        downloads = db.execute(
            update(models.Video)
            .where(models.Video.status == "downloading")
            .values(status="error", error="Interrupted by a server restart. Delete it and import again.")
        ).rowcount
        # The video itself is there; only its subtitles are missing.
        transcripts = db.execute(
            update(models.Video)
            .where(models.Video.status == "transcribing")
            .values(status="ready", error="Writing the subtitles was interrupted by a server restart.")
        ).rowcount
        db.commit()
        return downloads + transcripts


# --- endpoints --------------------------------------------------------------------------------------------


@router.get("", response_model=list[schemas.VideoRead])
def list_videos(db: Session = Depends(get_db)):
    return [_read(v) for v in db.scalars(select(models.Video).order_by(models.Video.id.desc()))]


@router.get("/{video_id}", response_model=schemas.VideoRead)
def get_video(video_id: int, db: Session = Depends(get_db)):
    return _read(_get(db, video_id))


@router.post("/upload", response_model=schemas.VideoRead, status_code=201)
def upload_video(
    video: UploadFile = File(...),
    subtitles: UploadFile | None = File(None),
    title: str | None = Form(None),
    db: Session = Depends(get_db),
):
    """Upload a video file, optionally with its .srt subtitles."""
    ext = Path(video.filename or "").suffix.lower()
    if ext not in VIDEO_EXTENSIONS:
        raise HTTPException(400, f"Unsupported video type {ext or '(none)'}; use one of {', '.join(sorted(VIDEO_EXTENSIONS))}")

    row = models.Video(
        title=(title or "").strip()[:300] or Path(video.filename).stem[:300] or "Untitled video",
        source="upload",
        status="ready",
    )
    db.add(row)
    db.flush()  # assigns the uuid used for the folder
    folder = _video_dir(row)
    folder.mkdir(parents=True, exist_ok=True)
    try:
        if subtitles is not None and subtitles.filename:
            _save_srt(folder, subtitles)
            row.subtitle_file, row.subtitle_source = SUBTITLE_FILE, "upload"
        target = folder / f"video{ext}"
        with target.open("wb") as out:
            shutil.copyfileobj(video.file, out, length=1024 * 1024)
        row.video_file = target.name
        row.size_bytes = target.stat().st_size
        row.duration_s = _probe_duration(target)
        db.commit()
    except BaseException:
        db.rollback()
        shutil.rmtree(folder, ignore_errors=True)
        raise
    db.refresh(row)
    return _read(row)


@router.post("/youtube", response_model=schemas.VideoRead, status_code=202)
async def import_youtube(payload: schemas.YouTubeImport, db: Session = Depends(get_db)):
    """Start downloading a YouTube video and its subtitles. Poll the video (or the list) for progress."""
    url = payload.url.strip()
    if not re.match(r"^https?://", url):
        raise HTTPException(400, "Enter a full YouTube link, starting with https://")
    row = models.Video(title=url[:300], source="youtube", source_url=url, status="downloading")
    db.add(row)
    db.commit()
    db.refresh(row)
    _progress[row.id] = None
    _stage[row.id] = "Starting download…"
    _tasks[row.id] = asyncio.create_task(_import_youtube(row.id, payload))
    return _read(row)


@router.patch("/{video_id}", response_model=schemas.VideoRead)
def rename_video(video_id: int, payload: schemas.VideoUpdate, db: Session = Depends(get_db)):
    video = _get(db, video_id)
    video.title = payload.title.strip()
    db.commit()
    db.refresh(video)
    return _read(video)


@router.delete("/{video_id}", status_code=204)
def delete_video(video_id: int, db: Session = Depends(get_db)):
    """Delete a video and its files. An import in progress is stopped (it removes its own files)."""
    video = _get(db, video_id)
    task = _tasks.get(video_id)
    if video.status == "downloading" and task:
        _cancelled.add(video_id)  # the download thread checks this
    else:
        if video.status == "transcribing" and task:
            task.cancel()
        shutil.rmtree(_video_dir(video), ignore_errors=True)
    db.delete(video)
    db.commit()


@router.get("/{video_id}/video")
def video_file(video_id: int, db: Session = Depends(get_db)):
    """The video itself (supports range requests, so the player can seek)."""
    video = _get(db, video_id)
    if not video.video_file:
        raise HTTPException(404, "This video has no file yet")
    return FileResponse(_video_dir(video) / video.video_file)


@router.get("/{video_id}/subtitles.srt")
def subtitles_srt(video_id: int, db: Session = Depends(get_db)):
    video = _get(db, video_id)
    if not video.subtitle_file:
        raise HTTPException(404, "This video has no subtitles")
    safe = re.sub(r"[^\w\- ]+", "", video.title).strip()[:80] or "subtitles"
    return FileResponse(_video_dir(video) / video.subtitle_file, media_type="application/x-subrip", filename=f"{safe}.srt")


@router.get("/{video_id}/subtitles.vtt")
def subtitles_vtt(video_id: int, db: Session = Depends(get_db)):
    video = _get(db, video_id)
    if not video.subtitle_file:
        raise HTTPException(404, "This video has no subtitles")
    srt = (_video_dir(video) / video.subtitle_file).read_text(encoding="utf-8")
    return PlainTextResponse(srt_to_vtt(srt), media_type="text/vtt")


def _compute_waveform(media: Path, out: Path) -> None:
    """Decode the audio (mono, 8 kHz) and keep the loudest sample of each 10 ms, scaled to 0-255."""
    import numpy as np

    proc = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(media), "-vn", "-ac", "1", "-ar", str(WAVEFORM_SAMPLE_RATE),
         "-f", "s16le", "-"],
        capture_output=True, timeout=900,
    )
    if proc.returncode != 0 or not proc.stdout:
        err = proc.stderr.decode(errors="replace")
        if not proc.stdout and ("does not contain any stream" in err or "matches no streams" in err or proc.returncode == 0):
            raise HTTPException(404, "This video has no audio")
        raise HTTPException(422, f"Couldn't read the audio: {err.strip()[-300:]}")

    samples = np.frombuffer(proc.stdout, dtype=np.int16)
    per = WAVEFORM_SAMPLE_RATE // WAVEFORM_RATE
    samples = np.pad(samples, (0, -len(samples) % per))
    peaks = np.abs(samples.reshape(-1, per).astype(np.int32)).max(axis=1).astype(np.float64)
    # Scale to the loud end of this video (ignoring the odd spike) so quiet recordings still show.
    top = np.percentile(peaks, 99.5) or peaks.max() or 1.0
    data = np.clip(peaks / top * 255, 0, 255).astype(np.uint8)
    tmp = out.with_suffix(".tmp")
    tmp.write_bytes(data.tobytes())
    tmp.replace(out)


@router.get("/{video_id}/waveform")
def waveform(video_id: int, db: Session = Depends(get_db)):
    """Audio peaks for the timeline: raw bytes, one per 1/X-Waveform-Rate seconds. Computed on first request."""
    video = _get(db, video_id)
    if not video.video_file:
        raise HTTPException(404, "This video has no file yet")
    folder = _video_dir(video)
    path = folder / WAVEFORM_FILE
    if not path.exists():
        _compute_waveform(folder / video.video_file, path)
    return FileResponse(
        path,
        media_type="application/octet-stream",
        headers={"X-Waveform-Rate": str(WAVEFORM_RATE), "Cache-Control": "private, max-age=86400"},
    )


@router.put("/{video_id}/subtitles", response_model=schemas.VideoRead)
def replace_subtitles(video_id: int, subtitles: UploadFile = File(...), db: Session = Depends(get_db)):
    """Add or replace a video's .srt subtitles."""
    video = _get(db, video_id)
    if video.status != "ready":
        raise HTTPException(409, "Wait for the video to finish importing")
    folder = _video_dir(video)
    folder.mkdir(parents=True, exist_ok=True)
    _save_srt(folder, subtitles)
    _clear_original(folder)
    video.subtitle_file, video.subtitle_source, video.subtitle_lang = SUBTITLE_FILE, "upload", None
    db.commit()
    db.refresh(video)
    return _read(video)


@router.delete("/{video_id}/subtitles", response_model=schemas.VideoRead)
def delete_subtitles(video_id: int, db: Session = Depends(get_db)):
    video = _get(db, video_id)
    if video.subtitle_file:
        (_video_dir(video) / video.subtitle_file).unlink(missing_ok=True)
        _clear_original(_video_dir(video))
    video.subtitle_file = video.subtitle_source = video.subtitle_lang = None
    db.commit()
    db.refresh(video)
    return _read(video)


@router.put("/{video_id}/edit", response_model=schemas.VideoRead)
def save_edit(video_id: int, payload: schemas.VideoEdit, db: Session = Depends(get_db)):
    """Save the editor's timeline: kept video segments and/or the edited subtitles."""
    video = _get(db, video_id)
    if video.status != "ready" or not video.video_file:
        raise HTTPException(409, "Wait for the video to finish importing")
    data = payload.model_dump(exclude_unset=True)

    if "segments" in data:
        segments = payload.segments
        if segments is not None:
            if not segments:
                raise HTTPException(400, "Keep at least one part of the video")
            limit = (video.duration_s or float("inf")) + 0.5
            prev_end = 0.0
            for start, end in segments:
                if start < prev_end - 1e-3 or end - start < MIN_LENGTH - 1e-6 or end > limit:
                    raise HTTPException(400, "Segments must be in order, not overlap, and lie within the video")
                prev_end = end
            segments = [[round(s, 3), round(e, 3)] for s, e in segments]
        video.segments = segments

    if "cues" in data:
        if payload.cues is None:
            raise HTTPException(400, "cues can't be null; delete the subtitles instead")
        if video.status == "transcribing":
            raise HTTPException(409, "Claude Code is still writing the subtitles")
        for c in payload.cues:
            if c.end - c.start < MIN_LENGTH - 1e-6:
                raise HTTPException(400, "Every subtitle must end after it starts")
        folder = _video_dir(video)
        current = folder / SUBTITLE_FILE
        original = folder / ORIGINAL_SUBTITLE_FILE
        if current.exists() and not original.exists():
            shutil.copyfile(current, original)
        current.write_text(cues_to_srt(payload.cues), encoding="utf-8")
        if not video.subtitle_file:  # subtitles created from scratch in the editor
            video.subtitle_file, video.subtitle_source = SUBTITLE_FILE, "upload"

    db.commit()
    db.refresh(video)
    return _read(video)


@router.delete("/{video_id}/edit", response_model=schemas.VideoRead)
def reset_edit(video_id: int, db: Session = Depends(get_db)):
    """Undo all editing: the whole video again, and the subtitles as they were before the first edit."""
    video = _get(db, video_id)
    folder = _video_dir(video)
    original = folder / ORIGINAL_SUBTITLE_FILE
    if original.exists():
        original.replace(folder / SUBTITLE_FILE)
    video.segments = None
    db.commit()
    db.refresh(video)
    return _read(video)


# --- YouTube download (runs in a worker thread) ------------------------------------------------------------


class _YtdlLogger:
    def debug(self, msg: str) -> None:
        pass

    def info(self, msg: str) -> None:
        pass

    def warning(self, msg: str) -> None:
        logger.warning("yt-dlp: %s", msg)

    def error(self, msg: str) -> None:
        logger.error("yt-dlp: %s", msg)


def _pick_subtitles(info: dict, lang: str) -> str | None:
    """The YouTube track code of the author's captions in `lang` (one of LANGUAGES), if there are any."""
    tracks = {k.lower(): k for k in (info.get("subtitles") or {}) if k != "live_chat"}
    candidates = [c.lower() for c in LANGUAGES[lang]["youtube"]]
    for c in candidates:
        if c in tracks:
            return tracks[c]
    if lang == "en":  # any regional English
        return next((orig for low, orig in tracks.items() if low.startswith("en-")), None)
    return None


def _set(video_id: int, **values) -> bool:
    """Update the video's row; False if it was deleted meanwhile."""
    with SessionLocal() as db:
        result = db.execute(update(models.Video).where(models.Video.id == video_id).values(**values))
        db.commit()
        return result.rowcount > 0


async def _import_youtube(video_id: int, payload: schemas.YouTubeImport) -> None:
    try:
        needs_subtitles = await asyncio.to_thread(_download_youtube, video_id, payload)
        if needs_subtitles:
            await _write_subtitles_with_claude(video_id, payload.subtitle_lang)
    finally:
        _tasks.pop(video_id, None)
        _progress.pop(video_id, None)
        _stage.pop(video_id, None)
        _cancelled.discard(video_id)


def _download_youtube(video_id: int, payload: schemas.YouTubeImport) -> bool:
    """Download the video, and the author's captions if any. True if Claude Code should write subtitles."""
    import yt_dlp
    from yt_dlp.utils import DownloadCancelled

    with SessionLocal() as db:
        video = db.get(models.Video, video_id)
        if video is None:
            return False
        folder = _video_dir(video)
    folder.mkdir(parents=True, exist_ok=True)

    files: dict[str, tuple[int, int]] = {}  # per downloaded file: (bytes done, bytes total)
    expected = 0

    def on_progress(d: dict) -> None:
        if video_id in _cancelled:
            raise DownloadCancelled("Deleted while downloading")
        total = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
        done = total if d.get("status") == "finished" else d.get("downloaded_bytes") or 0
        files[d.get("filename") or ""] = (done, total)
        overall = max(expected, sum(t for _, t in files.values()))
        _progress[video_id] = min(sum(n for n, _ in files.values()) / overall, 0.99) if overall else None
        _stage[video_id] = "Downloading…"

    opts = {
        "paths": {"home": str(folder), "temp": str(folder)},
        "outtmpl": {"default": "video.%(ext)s"},
        # H.264 + AAC in MP4 plays in every browser; fall back to whatever is best.
        "format": "bv*[ext=mp4][vcodec^=avc1]+ba[ext=m4a]/b[ext=mp4]/bv*+ba/b",
        "merge_output_format": "mp4",
        "noplaylist": True,
        "progress_hooks": [on_progress],
        "logger": _YtdlLogger(),
        "noprogress": True,
        "postprocessors": [{"key": "FFmpegSubtitlesConvertor", "format": "srt", "when": "before_dl"}],
    }

    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(payload.url.strip(), download=False, process=False)
            if info.get("_type") in ("playlist", "multi_video"):
                raise ValueError("That's a playlist; paste the link of a single video")
            title = (info.get("title") or payload.url)[:300]
            if not _set(video_id, title=title, duration_s=info.get("duration")):
                return False  # deleted before the download started

            track = _pick_subtitles(info, payload.subtitle_lang)
            if track:
                ydl.params.update(writesubtitles=True, subtitleslangs=[track], subtitlesformat="srt/vtt/best")

            result = ydl.process_ie_result(info, download=False)  # picks formats, so the total size is known
            formats = result.get("requested_formats") or [result]
            expected = sum(f.get("filesize") or f.get("filesize_approx") or 0 for f in formats)
            ydl.process_info(result)

        video_path = next(
            (p for p in folder.iterdir() if p.stem == "video" and p.suffix.lower() in VIDEO_EXTENSIONS), None
        )
        if video_path is None:
            raise RuntimeError("yt-dlp finished but no video file was written")
        sub_path = next(folder.glob("video.*.srt"), None)
        if sub_path is not None:
            sub_path.replace(folder / SUBTITLE_FILE)

        generate = not sub_path and payload.generate_subtitles
        if not _set(
            video_id,
            status="transcribing" if generate else "ready",
            error=None
            if sub_path or not track or generate
            else "The subtitles could not be downloaded (YouTube may be rate-limiting); add an .srt yourself.",
            video_file=video_path.name,
            size_bytes=video_path.stat().st_size,
            duration_s=_probe_duration(video_path) or info.get("duration"),
            subtitle_file=SUBTITLE_FILE if sub_path else None,
            subtitle_source="youtube" if sub_path else None,
            subtitle_lang=payload.subtitle_lang if sub_path else None,
        ):
            shutil.rmtree(folder, ignore_errors=True)
            return False
        return generate
    except DownloadCancelled:
        shutil.rmtree(folder, ignore_errors=True)
        return False
    except Exception as exc:  # noqa: BLE001 - anything yt-dlp raises is shown to the user
        logger.exception("YouTube download %s failed", video_id)
        message = re.sub(r"\x1b\[[0-9;]*m", "", str(exc)).removeprefix("ERROR: ").strip() or type(exc).__name__
        if _set(video_id, status="error", error=message[:2000]):
            # Keep nothing half-downloaded.
            for p in folder.glob("*"):
                p.unlink(missing_ok=True)
        else:
            shutil.rmtree(folder, ignore_errors=True)
        return False


# --- subtitles written by Claude Code -------------------------------------------------------------------------

SUBTITLE_PROMPT = """Write subtitles for the video `{video}` in this folder, in {language}.

1. Transcribe the audio with Whisper (speech-to-text; you can't hear the audio yourself):
   `python {script} {video} transcript.raw.srt`
   It prints the spoken language it detected. This can take a few minutes for a long video.
2. Read `transcript.raw.srt` and write the finished subtitles to `subtitles.srt`:
   - Fix speech-recognition mistakes (misheard words, names, technical terms) using the context of the whole
     transcript and the video title, "{title}". Add proper punctuation and casing.
   - If the spoken language isn't {language_short}, translate into {language_short}, naturally rather than
     word for word.
   - Keep the timings from the transcript. Split cues that are too long to read (more than 2 lines, about 42
     characters a line for English or 16-20 characters a line for Chinese/Japanese, or longer than ~7 seconds),
     dividing their time between the parts; merge tiny fragments into their neighbours. Cues must not overlap.
   - Number the cues 1, 2, 3… in standard SRT format (`00:00:01,000 --> 00:00:03,500`).
   - For a long transcript, work through it in parts and append to `subtitles.srt` as you go, so nothing is
     skipped. Every part of the speech must be covered.
3. Check `subtitles.srt` is complete and valid, then reply with one line saying what you did.

Only create files in this folder. Don't modify `{video}`.
"""


async def _write_subtitles_with_claude(video_id: int, lang: str) -> None:
    """Have Claude Code transcribe (Whisper) and edit subtitles for a downloaded video, in `lang`."""
    from claude_agent_sdk import AssistantMessage, ClaudeAgentOptions, ResultMessage, ToolUseBlock, query

    with SessionLocal() as db:
        video = db.get(models.Video, video_id)
        if video is None:
            return
        folder, title, video_file = _video_dir(video), video.title, video.video_file

    _stage[video_id] = "Waiting for Claude Code…"
    error = None
    try:
        ensure_credentials()
        async with jobs.slots:  # shares the limit on concurrent Claude Code runs with the chat
            _stage[video_id] = "Claude Code is starting…"
            options = ClaudeAgentOptions(
                model=settings.claude_default_model,
                cwd=str(folder),
                system_prompt={"type": "preset", "preset": "claude_code"},
                allowed_tools=["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
                permission_mode="dontAsk",
                max_buffer_size=settings.claude_max_buffer_bytes,
            )
            prompt = SUBTITLE_PROMPT.format(
                video=video_file,
                script=TRANSCRIBE_SCRIPT,
                title=title.replace('"', "'"),
                language=LANGUAGES[lang]["name"],
                language_short=LANGUAGES[lang]["name"].split(" (")[0],
            )
            async for message in query(prompt=prompt, options=options):
                if isinstance(message, AssistantMessage) and message.parent_tool_use_id is None:
                    for block in message.content:
                        if isinstance(block, ToolUseBlock):
                            _stage[video_id] = _describe_step(block.name, block.input)
                elif isinstance(message, ResultMessage) and message.is_error:
                    error = f"Claude Code stopped: {message.result or message.subtype}"
    except asyncio.CancelledError:
        raise  # deleted meanwhile; delete_video removes the folder
    except Exception as exc:  # noqa: BLE001 - shown to the user
        logger.exception("Writing subtitles for video %s failed", video_id)
        error = f"Claude Code couldn't write the subtitles: {exc}"

    path = folder / SUBTITLE_FILE
    ok = False
    if path.exists():
        try:
            path.write_text(_decode_srt(path.read_bytes()), encoding="utf-8")
            ok = True
        except HTTPException as exc:
            error = f"Claude Code wrote invalid subtitles: {exc.detail}"
    elif error is None:
        error = "Claude Code finished without writing subtitles.srt."
    _set(
        video_id,
        status="ready",
        error=None if ok else error,
        subtitle_file=SUBTITLE_FILE if ok else None,
        subtitle_source="claude" if ok else None,
        subtitle_lang=lang if ok else None,
    )


def _describe_step(tool: str, tool_input: dict) -> str:
    command = str(tool_input.get("command", ""))
    if tool == "Bash" and "transcribe.py" in command:
        return "Transcribing the audio with Whisper…"
    if tool in ("Write", "Edit") and str(tool_input.get("file_path", "")).endswith(SUBTITLE_FILE):
        return "Claude Code is writing the subtitles…"
    if tool == "Read":
        return "Claude Code is reading the transcript…"
    return "Claude Code is working on the subtitles…"
