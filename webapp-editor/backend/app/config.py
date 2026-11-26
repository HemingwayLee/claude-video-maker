from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://app:app@localhost:5432/app"
    cors_origins: list[str] = ["http://localhost:5679"]
    # Also allow any port on localhost, 127.0.0.1 and [::1], for local test pages.
    cors_origin_regex: str | None = r"^https?://(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$"

    # Claude Code (Agent SDK) settings
    claude_workspace: str = "/workspace"
    claude_default_model: str = "claude-opus-5-5"
    claude_allowed_tools: list[str] = [
        "Read", "Write", "Edit", "Glob", "Grep", "Bash", "WebSearch", "WebFetch", "TodoWrite",
    ]
    # Largest single message accepted from the Claude Code CLI (SDK default is 1 MB).
    claude_max_buffer_bytes: int = 64 * 1024 * 1024
    # Tool output longer than this is cut off in the chat UI and database.
    tool_result_display_chars: int = 20_000

    # Answers run as background jobs; at most this many Claude Code processes run at once, the rest wait.
    max_concurrent_turns: int = 3

    # Imported videos and subtitles (Video Editing tab). Inside the workspace so Claude Code can use them too.
    videos_dir: str = "/workspace/videos"
    # Remotion projects Claude Code writes for animations (Animation tabs).
    animations_dir: str = "/workspace/animations"
    # Shared Remotion install in the backend image; each animation project links its node_modules here.
    remotion_runtime: str = "/opt/remotion"


settings = Settings()
