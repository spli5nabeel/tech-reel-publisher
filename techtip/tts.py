import asyncio
import os
from pathlib import Path

import edge_tts
from mutagen.mp3 import MP3

from techtip.schema import Tip, WordTiming

DEFAULT_VOICE = "en-US-EricNeural"
TAIL_PADDING = 0.4  # seconds of breathing room after the audio file ends
TICKS_PER_SECOND = 10_000_000  # edge-tts offsets are in 100-nanosecond ticks


async def _synthesize_scene(text: str, voice: str, out_path: Path, rate: str = "+0%") -> list[WordTiming]:
    """Synthesise speech, write MP3, and return per-word timestamps."""
    communicate = edge_tts.Communicate(text, voice, boundary="WordBoundary", rate=rate)
    audio_chunks: list[bytes] = []
    timings: list[WordTiming] = []

    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_chunks.append(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            start = chunk["offset"] / TICKS_PER_SECOND
            end = start + chunk["duration"] / TICKS_PER_SECOND
            timings.append(WordTiming(word=chunk["text"], start=round(start, 3), end=round(end, 3)))

    out_path.write_bytes(b"".join(audio_chunks))
    return timings


def _audio_duration(path: Path) -> float:
    return MP3(path).info.length


def synthesize_tip(
    tip: Tip,
    voice: str | None = None,
    public_dir: Path | None = None,
) -> Tip:
    voice = voice or os.environ.get("TECHTIP_TTS_VOICE", DEFAULT_VOICE)
    public_dir = public_dir or (Path(__file__).parent.parent / "remotion" / "public")
    public_dir.mkdir(parents=True, exist_ok=True)

    # Derive edge-tts rate from captionSpeed: 1.0→"+0%", 1.5→"+50%", 0.8→"-20%"
    speed = getattr(tip, "caption_speed", 1.0)
    rate_pct = int(round((speed - 1.0) * 100))
    rate = f"{rate_pct:+d}%"

    updated_scenes = []
    for i, scene in enumerate(tip.scenes):
        if scene.narration.strip():
            out_path = public_dir / f"vo_{i}.mp3"
            timings = asyncio.run(_synthesize_scene(scene.narration, voice, out_path, rate=rate))
            # Scene must contain the WHOLE audio file or the voice gets cut off.
            # The MP3 is typically ~0.8s longer than the last word's end time
            # (edge-tts adds natural trailing silence), so use the real file
            # length and take the max as a safety net.
            measured = _audio_duration(out_path)
            last_word_end = timings[-1].end if timings else measured
            duration = max(measured, last_word_end) + TAIL_PADDING
            updated_scenes.append(
                scene.model_copy(update={
                    "audio_src": f"vo_{i}.mp3",
                    "duration_in_seconds": duration,
                    "word_timings": timings,
                })
            )
        else:
            updated_scenes.append(scene)

    return tip.model_copy(update={"scenes": updated_scenes})
