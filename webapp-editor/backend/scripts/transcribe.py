"""Speech-to-text for a video or audio file, as a rough SRT: `python /app/scripts/transcribe.py video.mp4 raw.srt`.

Uses faster-whisper on the CPU. The model (WHISPER_MODEL, default "small") is downloaded once and cached.
The spoken language is detected automatically unless --language is given. Prints the detected language.
"""

import argparse
import os
import sys

from faster_whisper import WhisperModel


def timestamp(seconds: float) -> str:
    ms = round(seconds * 1000)
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("media")
    parser.add_argument("out", help="where to write the .srt")
    parser.add_argument("--language", help="spoken language code (e.g. en, zh, ja); detected if omitted")
    parser.add_argument("--model", default=os.environ.get("WHISPER_MODEL", "small"))
    args = parser.parse_args()

    model = WhisperModel(args.model, device="cpu", compute_type="int8")
    segments, info = model.transcribe(args.media, language=args.language, vad_filter=True, beam_size=5)
    print(f"Detected language: {info.language} (probability {info.language_probability:.2f}), "
          f"duration {info.duration:.0f}s", flush=True)

    count = 0
    with open(args.out, "w", encoding="utf-8") as f:
        for seg in segments:
            text = seg.text.strip()
            if not text:
                continue
            count += 1
            f.write(f"{count}\n{timestamp(seg.start)} --> {timestamp(seg.end)}\n{text}\n\n")
            if count % 50 == 0:
                print(f"... {count} cues, at {seg.end:.0f}s", flush=True)
    print(f"Wrote {count} cues to {args.out}")
    if count == 0:
        sys.exit("No speech found")


if __name__ == "__main__":
    main()
