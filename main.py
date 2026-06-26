import argparse
import sys
from pathlib import Path

from dotenv import load_dotenv

from techtip.pipeline import run, run_batch

load_dotenv()

_BG_CHOICES = [
    "particles", "gradient", "grid", "shapes",
    "aurora-waves", "neon-pulse", "matrix-rain",
    "bokeh", "starfield", "circuit-board", "random",
]
_TRANSITION_CHOICES = ["fade", "slide-left", "slide-up", "zoom", "wipe", "blur-fade", "none"]


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate a tech-tip reel from a topic (or a batch of topics)."
    )
    parser.add_argument(
        "topic",
        nargs="?",
        help="Topic to generate a video about (omit when using --batch)",
    )
    parser.add_argument(
        "--batch",
        metavar="TOPICS_FILE",
        help="Path to a text file with one topic per line. "
             "Saves <topic>.mp4 and <topic>.json for each topic into --out-dir.",
    )
    parser.add_argument(
        "--out",
        default="out/video.mp4",
        help="Output path for single-topic MP4 (default: out/video.mp4)",
    )
    parser.add_argument(
        "--out-dir",
        default="out",
        metavar="DIR",
        help="Output directory for batch mode (default: out/)",
    )
    parser.add_argument(
        "--bg",
        choices=_BG_CHOICES,
        default="random",
        help="Background animation style (default: random — derived from topic)",
    )
    parser.add_argument(
        "--color",
        default=None,
        metavar="#RRGGBB",
        help="Background colour as hex (e.g. --color '#1a0a2e'). Default: #0f0f0f",
    )
    parser.add_argument(
        "--tts",
        action="store_true",
        help="Synthesise narration audio with edge-tts",
    )
    parser.add_argument(
        "--voice",
        default=None,
        help="edge-tts voice name (default: en-US-EricNeural or TECHTIP_TTS_VOICE env var)",
    )
    parser.add_argument(
        "--music",
        default=None,
        metavar="TRACK.mp3",
        help="Background-music filename from remotion/public/music/ "
             "(mutually exclusive with --tts; music takes precedence)",
    )
    parser.add_argument(
        "--duration",
        type=int,
        default=45,
        choices=[30, 45, 60, 90],
        help="Target video duration in seconds (default: 45)",
    )
    parser.add_argument(
        "--speed",
        type=float,
        default=1.0,
        metavar="FLOAT",
        help="Caption highlight speed multiplier, e.g. 1.5 (default: 1.0). "
             "In TTS mode this also adjusts the speaking rate.",
    )
    parser.add_argument(
        "--transition",
        default="fade",
        choices=_TRANSITION_CHOICES,
        help="Scene transition style (default: fade)",
    )
    args = parser.parse_args()

    if not args.batch and not args.topic:
        parser.error("Provide a topic, or use --batch TOPICS_FILE for multiple topics.")

    bg_style = None if args.bg == "random" else args.bg
    shared = dict(
        bg_style=bg_style,
        bg_color=args.color,
        tts=args.tts,
        voice=args.voice,
        music=args.music,
        duration=args.duration,
        caption_speed=args.speed,
        transition=args.transition,
    )

    if args.batch:
        topics_file = Path(args.batch)
        if not topics_file.exists():
            sys.exit(f"Topics file not found: {topics_file}")
        topics = [ln.strip() for ln in topics_file.read_text(encoding="utf-8").splitlines()
                  if ln.strip() and not ln.startswith("#")]
        if not topics:
            sys.exit("Topics file is empty.")
        results = run_batch(topics, Path(args.out_dir), **shared)
        failed = [t for t, _, e in results if e]
        if failed:
            print(f"\nFailed topics ({len(failed)}):")
            for t in failed:
                print(f"  • {t}")
            sys.exit(1)
    else:
        out_path, _ = run(args.topic, Path(args.out), **shared)
        print(f"Rendered: {out_path}")


if __name__ == "__main__":
    main()
