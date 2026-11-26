from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import JSON, BigInteger, DateTime, ForeignKey, Integer, String, Text, Uuid, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[int] = mapped_column(primary_key=True)
    uuid: Mapped[UUID] = mapped_column(
        Uuid, unique=True, default=uuid4, server_default=text("gen_random_uuid()")
    )
    title: Mapped[str] = mapped_column(String(200), default="New conversation")
    model: Mapped[str] = mapped_column(String(100))
    # Claude Code session id, used to resume the agent's context on the next turn.
    claude_session_id: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    turns: Mapped[list["Turn"]] = relationship(
        back_populates="conversation", cascade="all, delete-orphan", order_by="Turn.id"
    )


class Turn(Base):
    """One question and Claude Code's answer."""

    __tablename__ = "turns"

    id: Mapped[int] = mapped_column(primary_key=True)
    uuid: Mapped[UUID] = mapped_column(
        Uuid, unique=True, default=uuid4, server_default=text("gen_random_uuid()")
    )
    conversation_id: Mapped[int] = mapped_column(ForeignKey("conversations.id", ondelete="CASCADE"), index=True)
    question: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    model: Mapped[str] = mapped_column(String(100))
    # The answer as Markdown; filled in when the answer is saved.
    content: Mapped[str] = mapped_column(Text, default="", server_default=text("''"))
    # Tool calls and results while answering: [{"type": "tool_use" | "tool_result", ...}]
    activity: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String(20), default="running")  # running | complete | stopped | error
    error: Mapped[str | None] = mapped_column(Text)
    cost_usd: Mapped[float | None]

    conversation: Mapped[Conversation] = relationship(back_populates="turns")


class Video(Base):
    """A source video (uploaded, or downloaded from YouTube) and its optional .srt subtitles.

    Files live in `<videos_dir>/<uuid>/`: the video as `video.<ext>` and the subtitles as `subtitles.srt`.
    """

    __tablename__ = "videos"

    id: Mapped[int] = mapped_column(primary_key=True)
    uuid: Mapped[UUID] = mapped_column(
        Uuid, unique=True, default=uuid4, server_default=text("gen_random_uuid()")
    )
    title: Mapped[str] = mapped_column(String(300))
    source: Mapped[str] = mapped_column(String(20))  # upload | youtube
    source_url: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="ready")  # downloading | transcribing | ready | error
    error: Mapped[str | None] = mapped_column(Text)
    video_file: Mapped[str | None] = mapped_column(String(100))
    subtitle_file: Mapped[str | None] = mapped_column(String(100))
    # Where the subtitles came from: "upload", "youtube" (the author's captions) or "claude" (written by Claude Code).
    subtitle_source: Mapped[str | None] = mapped_column(String(20))
    subtitle_lang: Mapped[str | None] = mapped_column(String(20))
    duration_s: Mapped[float | None]
    size_bytes: Mapped[int | None] = mapped_column(BigInteger)
    # Timeline edit: the parts of the source video that are kept, in order, as [[start_s, end_s], ...].
    # None means the whole video. Non-destructive: video.<ext> itself is never changed.
    segments: Mapped[list[list[float]] | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AppSetting(Base):
    """Small app-wide settings, stored as JSON by key (e.g. "animation_options")."""

    __tablename__ = "app_settings"

    key: Mapped[str] = mapped_column(String(100), primary_key=True)
    value: Mapped[dict[str, Any]] = mapped_column(JSON)


class Animation(Base):
    """An animation Claude Code made (or is making) from selected subtitles of a video.

    Its Remotion project lives in `<animations_dir>/<uuid>/`; the result is `out/animation.mp4` there.
    """

    __tablename__ = "animations"

    id: Mapped[int] = mapped_column(primary_key=True)
    uuid: Mapped[UUID] = mapped_column(
        Uuid, unique=True, default=uuid4, server_default=text("gen_random_uuid()")
    )
    title: Mapped[str] = mapped_column(String(300))
    # The video the subtitles came from (kept as a title if that video is deleted later).
    video_id: Mapped[int | None] = mapped_column(ForeignKey("videos.id", ondelete="SET NULL"), index=True)
    source_title: Mapped[str] = mapped_column(String(300), default="")
    # The selected part of the source video, in source seconds, and its subtitles in animation time.
    start_s: Mapped[float] = mapped_column(default=0)
    end_s: Mapped[float] = mapped_column(default=0)
    cues: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    prompt: Mapped[str] = mapped_column(Text)
    options: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(20), default="queued")  # queued | running | complete | error | stopped
    error: Mapped[str | None] = mapped_column(Text)
    # Claude Code's tool calls and notes while working: [{"type": "tool" | "text", ...}]
    activity: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    duration_s: Mapped[float | None]
    cost_usd: Mapped[float | None]
    claude_session_id: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
