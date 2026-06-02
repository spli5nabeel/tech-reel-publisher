from pathlib import Path

from techtip.generate import generate_tip
from techtip.render import render_tip
from techtip.schema import Tip


def run(topic: str, out_path: Path) -> Path:
    tip: Tip = generate_tip(topic)
    render_tip(tip, out_path)
    return out_path
