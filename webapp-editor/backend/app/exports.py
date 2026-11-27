"""Export tab: render the edited timeline (kept parts + extra tracks, optionally burnt-in subtitles) to an MP4,
its mixed audio alone, or download the subtitles with edited or source timing.

Renders run ffmpeg in a worker thread, one at a time, into a temporary folder outside the workspace. The browser
downloads the finished file and the server deletes it right after (or after KEEP_S if it's never collected).
"""

import asyncio
import json
import logging
import re
import shutil
import subprocess
import tempfile
import threading
import time
from pathlib import Path
from typing import Literal
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, PlainTextResponse
from starlette.background import BackgroundTask
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app import models
from app.animations import OUTPUT as ANIMATION_OUTPUT
from app.animations import _project_dir
from app.db import SessionLocal, get_db
from app.videos import SUBTITLE_FILE, _get, _srt_time, _video_dir, srt_to_vtt

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/videos", tags=["exports"])

# Renders live here only until the browser downloads them; never in the workspace.
EXPORT_ROOT = Path(tempfile.gettempdir()) / "webapp-editor-exports"
KEEP_S = 3600  # a finished render nobody downloaded is deleted after this
shutil.rmtree(EXPORT_ROOT, ignore_errors=True)  # leftovers from before a restart
AUDIO_FORMATS = {
    "mp3": ["-c:a", "libmp3lame", "-q:a", "2"],
    "m4a": ["-c:a", "aac", "-b:a", "192k"],
    "wav": ["-c:a", "pcm_s16le"],
}
SAMPLE_RATE = 48000
TIME = re.compile(r"(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})")

_state: dict[tuple[int, str], dict] = {}  # (video id, kind) -> running, failed or ready-to-download export
_render_lock = threading.Semaphore(1)  # ffmpeg renders are heavy: one at a time


class ExportRequest(BaseModel):
    kind: Literal["video", "audio"]
    include_tracks: bool = True  # extra tracks dropped from Material
    burn_subtitles: bool = False  # video only
    audio_format: Literal["mp3", "m4a", "wav"] = "mp3"  # audio only


# --- subtitles ------------------------------------------------------------------------------------------------


def _seconds(m: re.Match) -> float:
    h, mi, s, ms = m.groups()
    return int(h) * 3600 + int(mi) * 60 + int(s) + int(ms.ljust(3, "0")) / 1000


def parse_srt(text: str) -> list[tuple[float, float, str]]:
    cues = []
    for block in re.split(r"\n\s*\n", text.replace("\r\n", "\n").strip()):
        lines = block.split("\n")
        for i, line in enumerate(lines):
            if "-->" in line:
                times = list(TIME.finditer(line))
                if len(times) == 2:
                    body = "\n".join(lines[i + 1 :]).strip()
                    cues.append((_seconds(times[0]), _seconds(times[1]), body))
                break
    return cues


def _segments(video: models.Video) -> list[tuple[float, float, dict | None]]:
    """The main track in order: (start, end, None) for a kept part of the source video, or
    (start, end, insert) for material placed on the main track (start/end are times in that material)."""
    if video.segments:
        return [
            (float(seg["start"]), float(seg["end"]), seg) if isinstance(seg, dict) else (float(seg[0]), float(seg[1]), None)
            for seg in video.segments
        ]
    return [(0.0, float(video.duration_s or 0), None)]


def edited_cues(video: models.Video, cues: list[tuple[float, float, str]]) -> list[tuple[float, float, str]]:
    """Cues moved to the edited timeline: cut parts removed, a cue spanning a cut runs across the join."""
    clips, out = [], 0.0
    for s, e, insert in _segments(video):
        if insert is None:
            clips.append((s, e, out))
        out += e - s
    result = []
    for start, end, text in cues:
        first = last = None
        for s, e, o in clips:
            a, b = max(start, s), min(end, e)
            if b - a > 1e-6:
                if first is None:
                    first = o + (a - s)
                last = o + (b - s)
        if first is not None:
            result.append((first, last, text))
    return result


def cues_srt(cues: list[tuple[float, float, str]]) -> str:
    return "\n".join(
        f"{i}\n{_srt_time(s)} --> {_srt_time(e)}\n{t or ' '}\n" for i, (s, e, t) in enumerate(cues, start=1)
    )


def _safe_name(video: models.Video, fallback: str) -> str:
    return re.sub(r"[^\w\- ]+", "", video.title).strip()[:80] or fallback


@router.get("/{video_id}/export/subtitles")
def export_subtitles(
    video_id: int,
    timing: Literal["edited", "source"] = "edited",
    format: Literal["srt", "vtt"] = "srt",
    db: Session = Depends(get_db),
):
    video = _get(db, video_id)
    if not video.subtitle_file:
        raise HTTPException(404, "This video has no subtitles")
    srt = (_video_dir(video) / video.subtitle_file).read_text(encoding="utf-8")
    if timing == "edited":
        srt = cues_srt(edited_cues(video, parse_srt(srt)))
    suffix = "" if timing == "edited" else " (source timing)"
    filename = f"{_safe_name(video, 'subtitles')}{suffix}.{format}"
    body = srt_to_vtt(srt) if format == "vtt" else srt
    media = "text/vtt" if format == "vtt" else "application/x-subrip"
    return PlainTextResponse(
        body,
        media_type=f"{media}; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{quote(filename)}"},
    )


# --- rendering ------------------------------------------------------------------------------------------------


def _probe(path: Path) -> dict:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,width,height,avg_frame_rate",
         "-of", "json", str(path)],
        capture_output=True, text=True, timeout=30, check=True,
    ).stdout
    streams = json.loads(out).get("streams", [])
    info = {"audio": any(s.get("codec_type") == "audio" for s in streams)}
    for s in streams:
        if s.get("codec_type") == "video" and s.get("width"):
            num, _, den = (s.get("avg_frame_rate") or "30/1").partition("/")
            fps = float(num) / float(den or 1) if float(num or 0) else 30.0
            info.update(width=int(s["width"]), height=int(s["height"]), fps=round(min(max(fps, 1), 120), 3))
            break
    return info


def _media_path(db: Session, source: dict) -> Path | None:
    if source.get("type") == "animation":
        anim = db.get(models.Animation, source.get("id"))
        return _project_dir(anim) / ANIMATION_OUTPUT if anim else None
    material = db.get(models.Material, source.get("id"))
    if not material:
        return None
    video = db.get(models.Video, material.video_id)
    return _video_dir(video) / "materials" / material.file if video else None


def _output_name(request: ExportRequest) -> str:
    return "edited.mp4" if request.kind == "video" else f"audio.{request.audio_format}"


def _build_command(db: Session, video: models.Video, request: ExportRequest, folder: Path, out: Path):
    """The ffmpeg command line and the output length (s). Notes list skipped clips."""
    src = _video_dir(video) / video.video_file
    info = _probe(src)
    want_video = request.kind == "video"
    if want_video and "width" not in info:
        raise ValueError("The source has no video stream")
    segments = _segments(video)
    total = sum(e - s for s, e, _ in segments)
    if total <= 0:
        raise ValueError("Nothing left to export")
    if want_video:
        w, h, fps = info["width"], info["height"], info["fps"]
        # Every piece of the main track gets the same frame size, rate and pixel format, so they can be joined.
        norm = (
            f"scale={w}:{h}:force_original_aspect_ratio=decrease,pad={w}:{h}:(ow-iw)/2:(oh-ih)/2:color=black,"
            f"setsar=1,fps={fps},format=yuv420p"
        )
    audio_norm = f"aresample={SAMPLE_RATE},aformat=sample_fmts=fltp:channel_layouts=stereo"

    inputs = ["-i", str(src)]
    graph: list[str] = []
    notes: list[str] = []
    missing = 0
    k = 1  # next ffmpeg input index

    # The main track: kept parts of the source and inserted material, joined end to end.
    parts = []
    for i, (s, e, insert) in enumerate(segments):
        length = e - s
        silence = f"anullsrc=r={SAMPLE_RATE}:cl=stereo,atrim=duration={length:.3f},{audio_norm}[a{i}]"
        if insert is None:
            if want_video:
                graph.append(f"[0:v]trim=start={s:.3f}:end={e:.3f},setpts=PTS-STARTPTS,{norm}[v{i}]")
            if info["audio"]:
                graph.append(f"[0:a]atrim=start={s:.3f}:end={e:.3f},asetpts=PTS-STARTPTS,{audio_norm}[a{i}]")
            else:
                graph.append(silence)
        else:
            path = _media_path(db, insert.get("source") or {})
            media = _probe(path) if path and path.exists() else None
            if media is None:
                missing += 1
                if want_video:
                    graph.append(f"color=c=black:s={w}x{h}:r={fps}:d={length:.3f},format=yuv420p,setsar=1[v{i}]")
                graph.append(silence)
            else:
                inputs += ["-ss", f"{s:.3f}", "-t", f"{length:.3f}", "-i", str(path)]
                if want_video:
                    if "width" in media:
                        # Hold the last frame if the media is a little shorter than its slot.
                        graph.append(
                            f"[{k}:v]setpts=PTS-STARTPTS,{norm},tpad=stop_mode=clone:stop_duration={length:.3f},"
                            f"trim=duration={length:.3f}[v{i}]"
                        )
                    else:
                        graph.append(f"color=c=black:s={w}x{h}:r={fps}:d={length:.3f},format=yuv420p,setsar=1[v{i}]")
                if media["audio"]:
                    graph.append(
                        f"[{k}:a]asetpts=PTS-STARTPTS,{audio_norm},apad=whole_dur={length:.3f},"
                        f"atrim=duration={length:.3f}[a{i}]"
                    )
                else:
                    graph.append(silence)
                k += 1
        parts.append((f"[v{i}]" if want_video else "") + f"[a{i}]")
    n = len(segments)
    graph.append(f"{''.join(parts)}concat=n={n}:v={1 if want_video else 0}:a=1" + ("[base0][main_a]" if want_video else "[main_a]"))

    v_label, mix = "base0", ["[main_a]"]

    # Extra tracks, in timeline order of the list (a later video track draws on top, as in the player).
    if request.include_tracks:
        for track in video.overlays or []:
            for clip in track.get("clips", []):
                start = float(clip["start"])
                if start >= total - 1e-3:
                    continue
                duration = min(float(clip["duration"]), total - start)
                is_video = track.get("kind") == "video"
                audible = not track.get("muted") and not clip.get("muted")
                if not want_video and not audible:
                    continue
                path = _media_path(db, clip.get("source") or {})
                if not path or not path.exists():
                    missing += 1
                    continue
                media = _probe(path)
                use_video = want_video and is_video and "width" in media
                use_audio = audible and media["audio"]
                if not use_video and not use_audio:
                    continue
                inputs += ["-ss", f"{float(clip.get('in', 0)):.3f}", "-t", f"{duration:.3f}", "-i", str(path)]
                if use_video:
                    graph.append(
                        f"[{k}:v]scale={w}:{h}:force_original_aspect_ratio=decrease,"
                        f"pad={w}:{h}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps={fps},"
                        f"setpts=PTS-STARTPTS+{start:.3f}/TB[ov{k}]"
                    )
                    graph.append(
                        f"[{v_label}][ov{k}]overlay=eof_action=pass:"
                        f"enable='between(t,{start:.3f},{start + duration:.3f})'[vo{k}]"
                    )
                    v_label = f"vo{k}"
                if use_audio:
                    graph.append(
                        f"[{k}:a]asetpts=PTS-STARTPTS,aresample={SAMPLE_RATE},aformat=channel_layouts=stereo,"
                        f"adelay={round(start * 1000)}:all=1[oa{k}]"
                    )
                    mix.append(f"[oa{k}]")
                k += 1
    if missing:
        notes.append(f"Skipped {missing} clip{'s' if missing > 1 else ''} whose material was deleted (black/silent).")

    if len(mix) > 1:
        graph.append(f"{''.join(mix)}amix=inputs={len(mix)}:duration=first:normalize=0[aout]")
    else:
        graph.append("[main_a]anull[aout]")

    if want_video and request.burn_subtitles and video.subtitle_file:
        srt_path = _video_dir(video) / video.subtitle_file
        cues = edited_cues(video, parse_srt(srt_path.read_text(encoding="utf-8")))
        if cues:
            burn = folder / "burn.srt"
            burn.write_text(cues_srt(cues), encoding="utf-8")
            # Sizes are in libass units (the script is 288 high): about 6.5% of the shorter side.
            size = round(0.065 * min(w, h) * 288 / h, 1)
            margin = round(0.06 * 288)
            style = (
                f"FontName=Noto Sans CJK TC,FontSize={size},PrimaryColour=&H00FFFFFF,BackColour=&H48000000,"
                f"OutlineColour=&H48000000,BorderStyle=3,Outline=2,Shadow=0,MarginV={margin},Alignment=2"
            )
            graph.append(f"[{v_label}]subtitles=filename={burn}:force_style='{style}'[vsub]")
            v_label = "vsub"

    cmd = ["ffmpeg", "-y", "-hide_banner", "-nostats", "-progress", "pipe:1", *inputs,
           "-filter_complex", ";".join(graph)]
    if want_video:
        cmd += ["-map", f"[{v_label}]", "-map", "[aout]", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
                "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart"]
    else:
        cmd += ["-map", "[aout]", *AUDIO_FORMATS[request.audio_format]]
    cmd += ["-t", f"{total:.3f}", "-f", "mp4" if want_video else {"m4a": "mp4"}.get(request.audio_format, request.audio_format), str(out)]
    return cmd, total, notes


def _discard(key: tuple[int, str]) -> None:
    """Forget an export and delete its files."""
    state = _state.pop(key, None)
    if state and state.get("folder"):
        shutil.rmtree(state["folder"], ignore_errors=True)


def _render(video_id: int, request: ExportRequest, key: tuple[int, str]) -> None:
    state = _state[key]
    with _render_lock:
        if state.get("cancelled"):
            state.update(status="error", error="Stopped")
            return
        state.update(stage="Rendering…", progress=0.0)
        EXPORT_ROOT.mkdir(parents=True, exist_ok=True)
        folder = Path(tempfile.mkdtemp(prefix=f"{video_id}-{request.kind}-", dir=EXPORT_ROOT))
        state["folder"] = folder
        with SessionLocal() as db:
            video = db.get(models.Video, video_id)
            if not video or not video.video_file:
                shutil.rmtree(folder, ignore_errors=True)
                state.update(status="error", error="The video is gone", folder=None)
                return
            out = folder / _output_name(request)
            label = " (edited)" if request.kind == "video" else " (audio)"
            filename = f"{_safe_name(video, 'export')}{label}{out.suffix}"
            try:
                cmd, total, notes = _build_command(db, video, request, folder, out)
            except (ValueError, subprocess.SubprocessError, OSError) as e:
                shutil.rmtree(folder, ignore_errors=True)
                state.update(status="error", error=str(e), folder=None)
                return
        logger.info("Export %s: %s", key, " ".join(cmd))
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        state["proc"] = proc
        tail: list[str] = []

        def read_errors():
            for line in proc.stderr:
                tail.append(line.rstrip())
                del tail[:-20]

        reader = threading.Thread(target=read_errors, daemon=True)
        reader.start()
        for line in proc.stdout:
            if line.startswith("out_time_us=") or line.startswith("out_time_ms="):
                try:
                    state["progress"] = min(int(line.split("=")[1]) / 1e6 / total, 0.999)
                except ValueError:
                    pass
        proc.wait()
        reader.join(timeout=2)
        state.pop("proc", None)
        failed = proc.returncode != 0 or not out.exists()
        if state.get("cancelled") or failed:
            shutil.rmtree(folder, ignore_errors=True)
            if failed and not state.get("cancelled"):
                logger.error("Export %s failed: %s", key, "\n".join(tail))
            error = "Stopped" if state.get("cancelled") else "ffmpeg failed: " + (tail[-1] if tail else f"exit {proc.returncode}")
            state.update(status="error", error=error, folder=None)
            return
        (folder / "burn.srt").unlink(missing_ok=True)
        state.update(
            status="ready",
            path=out,
            filename=filename,
            size_bytes=out.stat().st_size,
            duration_s=round(total, 3),
            created_at=time.time(),
            notes=notes,
        )


def _status(video: models.Video, kind: str) -> dict:
    key = (video.id, kind)
    live = _state.get(key)
    if not live:
        return {"status": "none"}
    if live["status"] in ("queued", "running"):
        return {"status": live["status"], "progress": live.get("progress"), "stage": live.get("stage")}
    if live["status"] == "ready":
        if time.time() - live["created_at"] > KEEP_S or not live["path"].exists():
            _discard(key)
            return {"status": "none"}
        return {k: live[k] for k in ("status", "filename", "size_bytes", "duration_s", "created_at", "notes")}
    if live["status"] == "downloading":
        return {"status": "none"}
    return {"status": "error", "error": live.get("error")}


@router.get("/{video_id}/exports")
def list_exports(video_id: int, db: Session = Depends(get_db)):
    video = _get(db, video_id)
    return {kind: _status(video, kind) for kind in ("video", "audio")}


@router.post("/{video_id}/exports", status_code=202)
async def start_export(video_id: int, request: ExportRequest, db: Session = Depends(get_db)):
    video = _get(db, video_id)
    if video.status != "ready" or not video.video_file:
        raise HTTPException(409, "Wait for the video to finish importing")
    key = (video.id, request.kind)
    live = _state.get(key)
    if live and live["status"] in ("queued", "running"):
        raise HTTPException(409, "This export is already running")
    _discard(key)  # an earlier render nobody downloaded
    _state[key] = {"status": "running", "progress": None, "stage": "Waiting for another export to finish…"}
    _state[key]["task"] = asyncio.create_task(asyncio.to_thread(_render, video.id, request, key))
    return _status(video, request.kind)


@router.post("/{video_id}/exports/{kind}/cancel")
def cancel_export(video_id: int, kind: Literal["video", "audio"], db: Session = Depends(get_db)):
    video = _get(db, video_id)
    key = (video.id, kind)
    live = _state.get(key)
    if live and live["status"] in ("queued", "running"):
        live["cancelled"] = True
        if proc := live.get("proc"):
            proc.terminate()
    elif live and live["status"] == "ready":
        _discard(key)
    return _status(video, kind)


@router.get("/{video_id}/exports/{kind}/file")
def export_file(video_id: int, kind: Literal["video", "audio"], db: Session = Depends(get_db)):
    """Send the finished render to the browser, then delete it from the server."""
    video = _get(db, video_id)
    key = (video.id, kind)
    if _status(video, kind)["status"] != "ready":
        raise HTTPException(404, "Nothing to download: export it again")
    live = _state[key]
    live["status"] = "downloading"  # one download per render
    return FileResponse(live["path"], filename=live["filename"], background=BackgroundTask(_discard, key))
