import json
import re
from pathlib import Path

from techtip.generate import generate_tip
from techtip.render import render_tip
from techtip.schema import Tip
from techtip.tts import synthesize_tip

REMOTION_PUBLIC_DIR = Path(__file__).parent.parent / "remotion" / "public"


def _safe_filename(topic: str) -> str:
    """Convert a topic string into a safe filename (max 80 chars)."""
    safe = re.sub(r"[^\w\s-]", "", topic.lower())
    safe = re.sub(r"[\s-]+", "_", safe).strip("_")
    return safe[:80] or "video"


def run(
    topic: str,
    out_path: Path,
    bg_style: str | None = None,
    bg_color: str | None = None,
    tts: bool = False,
    voice: str | None = None,
    music: str | None = None,
    duration: int = 45,
    caption_speed: float = 1.0,
    transition: str = "fade",
    log=print,
) -> tuple[Path, dict | None]:
    log(f"Generating script for: {topic}")
    tip: Tip = generate_tip(topic, target_seconds=duration)
    log(f"Script ready — {len(tip.scenes)} scenes, "
        f"{sum(s.duration_in_seconds for s in tip.scenes):.0f}s total")

    tip = tip.model_copy(update={"caption_speed": caption_speed, "transition": transition})

    if music:
        log(f"Using background music: {music}")
        tip = tip.model_copy(update={"audio": f"music/{music}"})
    elif tts:
        log("Synthesising narration audio...")
        tip = synthesize_tip(tip, voice=voice, public_dir=REMOTION_PUBLIC_DIR)
        log("Audio ready.")

    log("Rendering video (this takes 1-2 minutes)...")
    render_tip(tip, out_path, bg_style=bg_style, bg_color=bg_color)

    youtube = tip.youtube.model_dump(by_alias=True) if tip.youtube else None
    return out_path, youtube


def run_batch(
    topics: list[str],
    out_dir: Path,
    bg_style: str | None = None,
    bg_color: str | None = None,
    tts: bool = False,
    voice: str | None = None,
    music: str | None = None,
    duration: int = 45,
    caption_speed: float = 1.0,
    transition: str = "fade",
    log=print,
) -> list[tuple[str, Path | None, str | None]]:
    """Run the pipeline for every topic in the list.

    For each topic saves:
      out_dir/<safe_topic>.mp4   — rendered video
      out_dir/<safe_topic>.json  — generated script

    Returns a list of (topic, mp4_path | None, error_message | None).
    Failed topics record an error string and do not abort the remaining items.
    """
    out_dir.mkdir(parents=True, exist_ok=True)
    results: list[tuple[str, Path | None, str | None]] = []

    for i, topic in enumerate(topics, 1):
        log(f"\n[{i}/{len(topics)}] {topic}")
        safe = _safe_filename(topic)
        mp4_path = out_dir / f"{safe}.mp4"
        json_path = out_dir / f"{safe}.json"

        try:
            log("  Generating script…")
            tip: Tip = generate_tip(topic, target_seconds=duration)
            log(f"  Script ready — {len(tip.scenes)} scenes, "
                f"{sum(s.duration_in_seconds for s in tip.scenes):.0f}s total")

            json_path.write_text(tip.model_dump_json(indent=2), encoding="utf-8")
            log(f"  Script saved  → {json_path.name}")

            tip = tip.model_copy(update={"caption_speed": caption_speed, "transition": transition})

            if music:
                tip = tip.model_copy(update={"audio": f"music/{music}"})
            elif tts:
                log("  Synthesising audio…")
                tip = synthesize_tip(tip, voice=voice, public_dir=REMOTION_PUBLIC_DIR)
                log("  Audio ready.")

            log("  Rendering video…")
            render_tip(tip, mp4_path, bg_style=bg_style, bg_color=bg_color)
            log(f"  Video saved   → {mp4_path.name}")
            results.append((topic, mp4_path, None))

        except Exception as exc:
            log(f"  ERROR: {exc}")
            results.append((topic, None, str(exc)))

    ok = sum(1 for _, p, _ in results if p is not None)
    log(f"\nBatch complete: {ok}/{len(topics)} succeeded.")
    return results
