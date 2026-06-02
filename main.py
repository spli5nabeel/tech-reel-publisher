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
    args = parser.parse_args()

    out_path = run(args.topic, Path(args.out))
    print(f"Rendered: {out_path}")


if __name__ == "__main__":
    main()
