from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ConversationCreate(BaseModel):
    model: str | None = None


class ConversationUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    model: str | None = None


class ConversationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    uuid: UUID
    title: str
    model: str
    created_at: datetime
    updated_at: datetime


class TurnRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    uuid: UUID
    question: str
    created_at: datetime
    model: str
    content: str
    activity: list[dict[str, Any]]
    status: str
    error: str | None
    cost_usd: float | None


class ConversationDetail(ConversationRead):
    turns: list[TurnRead]


class ChatRequest(BaseModel):
    content: str = Field(min_length=1)


class VideoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    uuid: UUID
    title: str
    source: str
    source_url: str | None
    status: str
    error: str | None
    has_video: bool
    has_subtitles: bool
    subtitle_source: str | None
    subtitle_lang: str | None
    duration_s: float | None
    size_bytes: int | None
    created_at: datetime
    # Download progress, 0..1, while status is "downloading" (None when unknown).
    progress: float | None = None
    # What's happening right now while downloading or transcribing, for the UI.
    stage: str | None = None
    segments: list[list[float]] | None = None
    # True when the subtitles were edited in the editor (the original is kept, for Reset).
    subtitles_edited: bool = False


class YouTubeImport(BaseModel):
    url: str = Field(min_length=1, max_length=2000)
    # Subtitle language. The video author's captions in this language are used when YouTube has them.
    subtitle_lang: Literal["en", "zh_TW", "ja"] = "en"
    # When there are no author captions in that language, have Claude Code write them (speech-to-text + edit).
    generate_subtitles: bool = True


class Cue(BaseModel):
    start: float = Field(ge=0)
    end: float = Field(gt=0)
    text: str = Field(max_length=2000)


class VideoEdit(BaseModel):
    """Editor state to save. Omitted fields are left as they are."""

    # Kept parts of the source video, in source time; null resets to the whole video.
    segments: list[tuple[float, float]] | None = Field(default=None, max_length=5000)
    # The full, edited subtitle list (source time). Rewrites subtitles.srt; the first edit keeps the original.
    cues: list[Cue] | None = Field(default=None, max_length=20000)


class VideoUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=300)


# --- animations ----------------------------------------------------------------------------------------------


class AnimationOptions(BaseModel):
    """How Claude Code makes animations (the "Animation options" tab). Each request may override some."""

    model: str = "claude-opus-5-5"
    effort: Literal["low", "medium", "high", "xhigh", "max"] = "high"
    # Frame: "source" follows the source video's orientation.
    aspect: Literal["source", "16:9", "9:16", "1:1"] = "source"
    resolution: Literal["720p", "1080p"] = "1080p"
    fps: Literal[24, 30, 60] = 30
    # Sound: the voice from the selected part of the source video, or none.
    audio: Literal["original", "none"] = "original"
    # Length: the selected part's length (synced to the subtitles), or a fixed number of seconds.
    length: Literal["match", "custom"] = "match"
    custom_seconds: float = Field(default=10, ge=1, le=300)
    style: Literal["flat", "sticker", "whiteboard", "infographic", "kinetic", "papercut", "custom"] = "flat"
    custom_style: str = Field(default="", max_length=1000)
    palette: str = Field(default="", max_length=300)
    on_screen_text: Literal["none", "keywords", "captions"] = "keywords"
    text_language: Literal["subtitles", "en", "zh_TW", "ja"] = "subtitles"
    # Give Claude Code stills from the source video so the animation matches its subject.
    reference_frames: bool = True
    extra_instructions: str = Field(default="", max_length=4000)
    # Limits per animation: Claude Code stops when either is reached (0 = no limit).
    max_budget_usd: float = Field(default=5, ge=0, le=100)
    max_turns: int = Field(default=120, ge=0, le=1000)


class AnimationOptionsPatch(BaseModel):
    """Overrides for one animation; anything left out comes from the saved options."""

    model_config = ConfigDict(extra="forbid")

    model: str | None = None
    effort: Literal["low", "medium", "high", "xhigh", "max"] | None = None
    aspect: Literal["source", "16:9", "9:16", "1:1"] | None = None
    resolution: Literal["720p", "1080p"] | None = None
    fps: Literal[24, 30, 60] | None = None
    audio: Literal["original", "none"] | None = None
    length: Literal["match", "custom"] | None = None
    custom_seconds: float | None = Field(default=None, ge=1, le=300)
    style: Literal["flat", "sticker", "whiteboard", "infographic", "kinetic", "papercut", "custom"] | None = None
    custom_style: str | None = Field(default=None, max_length=1000)
    palette: str | None = Field(default=None, max_length=300)
    on_screen_text: Literal["none", "keywords", "captions"] | None = None
    text_language: Literal["subtitles", "en", "zh_TW", "ja"] | None = None
    reference_frames: bool | None = None
    extra_instructions: str | None = Field(default=None, max_length=4000)
    max_budget_usd: float | None = Field(default=None, ge=0, le=100)
    max_turns: int | None = Field(default=None, ge=0, le=1000)


class AnimationCreate(BaseModel):
    video_id: int
    # The selected subtitles, in source time (as saved in the video's subtitles).
    cues: list[Cue] = Field(min_length=1, max_length=2000)
    prompt: str = Field(min_length=1, max_length=20000)
    title: str | None = Field(default=None, max_length=300)
    options: AnimationOptionsPatch = Field(default_factory=AnimationOptionsPatch)


class AnimationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    uuid: UUID
    title: str
    video_id: int | None
    source_title: str
    start_s: float
    end_s: float
    cues: list[dict[str, Any]]
    prompt: str
    options: dict[str, Any]
    status: str
    error: str | None
    duration_s: float | None
    cost_usd: float | None
    created_at: datetime
    finished_at: datetime | None
    has_video: bool = False
    stage: str | None = None
    project_dir: str = ""


class AnimationDetail(AnimationRead):
    activity: list[dict[str, Any]] = []
