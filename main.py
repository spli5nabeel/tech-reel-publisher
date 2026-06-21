import argparse
from pathlib import Path

from dotenv import load_dotenv

from techtip.pipeline import run

load_dotenv()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate a tech-tip reel from a topic."
    )
    parser.add_argument("topic", help="Topic to generate a video about")
    parser.add_argument(
        "--out",
        default="out/video.mp4",
        help="Output path for the rendered MP4 (default: out/video.mp4)",
    )
    parser.add_argument(
        "--bg",
        choices=["particles", "gradient", "grid", "shapes", "random"],
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
    args = parser.parse_args()

    bg_style = None if args.bg == "random" else args.bg
    out_path = run(
        args.topic,
        Path(args.out),
        bg_style=bg_style,
        bg_color=args.color,
        tts=args.tts,
        voice=args.voice,
        music=args.music,
    )
    print(f"Rendered: {out_path}")


if __name__ == "__main__":
    main()
