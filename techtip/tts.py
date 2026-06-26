import os
import subprocess
import sys
from pathlib import Path

from mutagen.mp3 import MP3

from techtip.schema import Tip

DEFAULT_VOICE = "en-US-EricNeural"
TAIL_PADDING = 0.4  # seconds of silence buffer after audio ends

# Prefer the venv bundled with this project so we always use the up-to-date
# edge-tts (which includes the Sec-MS-GEC DRM token).  Fall back to whatever
# Python is on PATH if the venv doesn't exist.
_PROJECT_ROOT = Path(__file__).parent.parent
_VENV_EDGE_TTS = (
    _PROJECT_ROOT / ".venv" / "Scripts" / "edge-tts.exe"  # Windows
    if sys.platform == "win32"
    else _PROJECT_ROOT / ".venv" / "bin" / "edge-tts"
)
_EDGE_TTS_CMD: list[str] = (
    [str(_VENV_EDGE_TTS)]
    if _VENV_EDGE_TTS.exists()
    else [sys.executable, "-m", "edge_tts"]
)


def _synthesize_scene(text: str, voice: str, out_path: Path, rate: str = "+0%") -> None:
    """Render narration to MP3 via the edge-tts CLI subprocess."""
    result = subprocess.run(
        [*_EDGE_TTS_CMD, "--text", text, "--voice", voice, "--rate", rate,
         "--write-media", str(out_path)],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"edge-tts failed: {result.stderr.strip()}")


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

    speed = getattr(tip, "caption_speed", 1.0)
    rate_pct = int(round((speed - 1.0) * 100))
    rate = f"{rate_pct:+d}%"

    updated_scenes = []
    for i, scene in enumerate(tip.scenes):
        if scene.narration.strip():
            out_path = public_dir / f"vo_{i}.mp3"
            _synthesize_scene(scene.narration, voice, out_path, rate=rate)
            duration = _audio_duration(out_path) + TAIL_PADDING
            updated_scenes.append(
                scene.model_copy(update={
                    "audio_src": f"vo_{i}.mp3",
                    "duration_in_seconds": duration,
                    "word_timings": None,
                })
            )
        else:
            updated_scenes.append(scene)

    return tip.model_copy(update={"scenes": updated_scenes})
