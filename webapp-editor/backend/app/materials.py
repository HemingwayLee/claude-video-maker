"""Material for a video's project: video and audio files uploaded from disk (the editor's Material tab).

Files live in the video's folder, `<videos_dir>/<video uuid>/materials/`, so they go when the video is deleted
(the rows go with it through the foreign key). Generated animations are listed by /api/animations.
"""

import json
import shutil
import subprocess
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models, schemas
from app.db import get_db
from app.videos import _video_dir

router = APIRouter(tags=["materials"])

VIDEO_EXTENSIONS = {".mp4", ".mov", ".m4v", ".mkv", ".webm", ".avi"}
AUDIO_EXTENSIONS = {".mp3", ".wav", ".m4a", ".aac", ".ogg", ".oga", ".opus", ".flac"}


def _folder(video: models.Video) -> Path:
    return _video_dir(video) / "materials"


def _path(material: models.Material, db: Session) -> Path:
    return _folder(db.get(models.Video, material.video_id)) / material.file


def _thumb(path: Path) -> Path:
    return path.with_suffix(".thumb.jpg")


def _read(material: models.Material, db: Session) -> schemas.MaterialRead:
    return schemas.MaterialRead.model_validate(material).model_copy(
        update={"has_thumbnail": _thumb(_path(material, db)).exists()}
    )


def _probe(path: Path) -> dict:
    """{'video': bool, 'audio': bool, 'duration', 'width', 'height'}; 400 when ffmpeg can't read it."""
    try:
        out = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries",
             "format=duration:stream=codec_type,width,height:stream_disposition=attached_pic", "-of", "json", str(path)],
            capture_output=True, text=True, timeout=60, check=True,
        ).stdout
        info = json.loads(out)
    except (OSError, subprocess.SubprocessError, ValueError):
        raise HTTPException(400, "That file couldn't be read as video or audio") from None
    streams = info.get("streams", [])
    # Cover art in an MP3/M4A is a "video" stream too; it doesn't make the file a video.
    video = [s for s in streams if s.get("codec_type") == "video" and not s.get("disposition", {}).get("attached_pic")]
    duration = info.get("format", {}).get("duration")
    return {
        "video": bool(video),
        "audio": any(s.get("codec_type") == "audio" for s in streams),
        "duration": float(duration) if duration not in (None, "N/A") else None,
        "width": video[0].get("width") if video else None,
        "height": video[0].get("height") if video else None,
    }


@router.get("/api/videos/{video_id}/materials", response_model=list[schemas.MaterialRead])
def list_materials(video_id: int, db: Session = Depends(get_db)):
    if db.get(models.Video, video_id) is None:
        raise HTTPException(404, "Video not found")
    rows = db.scalars(select(models.Material).where(models.Material.video_id == video_id).order_by(models.Material.id.desc()))
    return [_read(m, db) for m in rows]


@router.post("/api/videos/{video_id}/materials", response_model=schemas.MaterialRead, status_code=201)
def upload_material(video_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Add a video or audio file from disk to this video's material."""
    video = db.get(models.Video, video_id)
    if video is None:
        raise HTTPException(404, "Video not found")
    ext = Path(file.filename or "").suffix.lower()
    if ext not in VIDEO_EXTENSIONS | AUDIO_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file type {ext or '(none)'}: use a video or audio file")

    row = models.Material(video_id=video_id, name=Path(file.filename).name[:300], kind="video", file="")
    db.add(row)
    db.flush()  # assigns the uuid used for the file name
    folder = _folder(video)
    folder.mkdir(parents=True, exist_ok=True)
    target = folder / f"{row.uuid}{ext}"
    try:
        with target.open("wb") as out:
            shutil.copyfileobj(file.file, out, length=1024 * 1024)
        info = _probe(target)
        if not info["video"] and not info["audio"]:
            raise HTTPException(400, "That file has no video or audio in it")
        row.kind = "video" if info["video"] else "audio"
        row.file = target.name
        row.size_bytes = target.stat().st_size
        row.duration_s = info["duration"]
        row.width, row.height = info["width"], info["height"]
        if row.kind == "video":
            at = min(1.0, (info["duration"] or 0) * 0.1)
            subprocess.run(
                ["ffmpeg", "-v", "error", "-y", "-ss", f"{at:.2f}", "-i", str(target), "-frames:v", "1",
                 "-vf", "scale='min(320,iw)':-2", str(_thumb(target))],
                capture_output=True, timeout=60,
            )
        db.commit()
    except BaseException:
        db.rollback()
        target.unlink(missing_ok=True)
        _thumb(target).unlink(missing_ok=True)
        raise
    db.refresh(row)
    return _read(row, db)


def _get(db: Session, material_id: int) -> models.Material:
    material = db.get(models.Material, material_id)
    if material is None:
        raise HTTPException(404, "Material not found")
    return material


@router.get("/api/materials/{material_id}/file")
def material_file(material_id: int, download: bool = False, db: Session = Depends(get_db)):
    material = _get(db, material_id)
    path = _path(material, db)
    if not path.exists():
        raise HTTPException(404, "The file is missing")
    return FileResponse(path, filename=material.name if download else None)


@router.get("/api/materials/{material_id}/thumbnail")
def material_thumbnail(material_id: int, db: Session = Depends(get_db)):
    path = _thumb(_path(_get(db, material_id), db))
    if not path.exists():
        raise HTTPException(404, "No thumbnail")
    return FileResponse(path, media_type="image/jpeg")


@router.delete("/api/materials/{material_id}", status_code=204)
def delete_material(material_id: int, db: Session = Depends(get_db)):
    material = _get(db, material_id)
    path = _path(material, db)
    path.unlink(missing_ok=True)
    _thumb(path).unlink(missing_ok=True)
    db.delete(material)
    db.commit()
