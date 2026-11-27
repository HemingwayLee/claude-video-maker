import json
import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy import select, text, update
from sqlalchemy.orm import Session

from app import animations, exports, jobs, materials, models, schemas, videos
from app.claude import MODELS
from app.config import settings
from app.db import Base, engine, get_db

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Dev convenience: create tables on startup. Swap for Alembic migrations later.
    Base.metadata.create_all(bind=engine)
    # create_all doesn't add columns to existing tables; add ones introduced later.
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE videos ADD COLUMN IF NOT EXISTS segments JSON"))
        conn.execute(text("ALTER TABLE videos ADD COLUMN IF NOT EXISTS overlays JSON"))
    if count := jobs.recover_interrupted():
        logger.warning("Marked %d answers interrupted by a restart as errors", count)
    if count := videos.recover_interrupted():
        logger.warning("Marked %d YouTube downloads interrupted by a restart as errors", count)
    if count := animations.recover_interrupted():
        logger.warning("Marked %d animations interrupted by a restart as errors", count)
    yield
    await jobs.cancel_all()  # save partial answers of anything still running


app = FastAPI(title="webapp-editor API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(videos.router)
app.include_router(animations.router)
app.include_router(materials.router)
app.include_router(exports.router)


def _get_conversation(db: Session, conversation_id: int) -> models.Conversation:
    conversation = db.get(models.Conversation, conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


@app.get("/api/health")
def health(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "ok"}


@app.get("/api/models")
def list_models():
    return {"models": MODELS, "default": settings.claude_default_model}


@app.get("/api/prompts/history")
def prompt_history(limit: int = 200, db: Session = Depends(get_db)):
    """Recently sent prompts across all chats, newest first, for Up/Down recall in the composer."""
    stmt = select(models.Turn.question).order_by(models.Turn.id.desc()).limit(min(max(limit, 1), 1000))
    prompts: list[str] = []
    for question in db.scalars(stmt):
        if question and (not prompts or prompts[-1] != question):  # drop consecutive repeats
            prompts.append(question)
    return prompts


@app.get("/api/conversations", response_model=list[schemas.ConversationRead])
def list_conversations(db: Session = Depends(get_db)):
    return db.scalars(select(models.Conversation).order_by(models.Conversation.updated_at.desc())).all()


@app.post("/api/conversations", response_model=schemas.ConversationRead, status_code=201)
def create_conversation(payload: schemas.ConversationCreate, db: Session = Depends(get_db)):
    conversation = models.Conversation(model=payload.model or settings.claude_default_model)
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


@app.get("/api/conversations/{conversation_id}", response_model=schemas.ConversationDetail)
def get_conversation(conversation_id: int, db: Session = Depends(get_db)):
    return _get_conversation(db, conversation_id)


@app.patch("/api/conversations/{conversation_id}", response_model=schemas.ConversationRead)
def update_conversation(
    conversation_id: int, payload: schemas.ConversationUpdate, db: Session = Depends(get_db)
):
    conversation = _get_conversation(db, conversation_id)
    data = payload.model_dump(exclude_unset=True)
    if data:
        # Setting updated_at to itself skips its onupdate, so renaming doesn't reorder the chat list.
        db.execute(
            update(models.Conversation)
            .where(models.Conversation.id == conversation_id)
            .values(**data, updated_at=models.Conversation.updated_at)
        )
        db.commit()
        db.refresh(conversation)
    return conversation


@app.delete("/api/conversations/{conversation_id}", status_code=204)
async def delete_conversation(conversation_id: int, db: Session = Depends(get_db)):
    conversation = _get_conversation(db, conversation_id)
    for turn in conversation.turns:  # stop an answer still being written; there's nowhere to save it
        if turn.status == "running":
            jobs.cancel(turn.id)
    db.delete(conversation)
    db.commit()


def _event_stream(turn_id: int) -> StreamingResponse:
    """Server-sent events for an answer, from its start. Disconnecting stops the stream, not the answer."""

    async def stream():
        async for event in jobs.watch(turn_id):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# Async because it starts a background job on the event loop.
@app.post("/api/conversations/{conversation_id}/messages")
async def send_message(conversation_id: int, payload: schemas.ChatRequest, db: Session = Depends(get_db)):
    """Send a message to Claude Code and stream the answer. The first event is {"type": "turn", "turn_id"}."""
    conversation = _get_conversation(db, conversation_id)
    try:
        turn = jobs.start_turn(db, conversation, payload.content)
    except jobs.Busy as exc:
        raise HTTPException(409, str(exc)) from None
    return _event_stream(turn.id)


@app.get("/api/turns/{turn_id}/stream")
def watch_turn(turn_id: int, db: Session = Depends(get_db)):
    """Watch an answer from its start: a running one live, a finished one as its saved copy."""
    if db.get(models.Turn, turn_id) is None:
        raise HTTPException(404, "Answer not found")
    return _event_stream(turn_id)


@app.post("/api/turns/{turn_id}/cancel", status_code=202)
async def cancel_turn(turn_id: int, db: Session = Depends(get_db)):
    """Stop a running answer (the Stop button). The partial answer is saved as "stopped"."""
    turn = db.get(models.Turn, turn_id)
    if turn is None:
        raise HTTPException(404, "Answer not found")
    return {"stopping": jobs.cancel(turn_id), "status": turn.status}
