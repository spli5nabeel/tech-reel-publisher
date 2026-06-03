from pathlib import Path

from techtip.generate import generate_tip
from techtip.render import render_tip
from techtip.schema import Tip
from techtip.tts import synthesize_tip

REMOTION_PUBLIC_DIR = Path(__file__).parent.parent / "remotion" / "public"


def run(
    topic: str,
    out_path: Path,
    bg_style: str | None = None,
    bg_color: str | None = None,
    tts: bool = False,
    voice: str | None = None,
    log=print,
) -> Path:
    log(f"Generating script for: {topic}")
    tip: Tip = generate_tip(topic)
    log(f"Script ready — {len(tip.scenes)} scenes, "
        f"{sum(s.duration_in_seconds for s in tip.scenes):.0f}s total")
    if tts:
        log("Synthesising narration audio...")
        tip = synthesize_tip(tip, voice=voice, public_dir=REMOTION_PUBLIC_DIR)
        log("Audio ready.")
    log("Rendering video (this takes 1-2 minutes)...")
    render_tip(tip, out_path, bg_style=bg_style, bg_color=bg_color)
    return out_path
