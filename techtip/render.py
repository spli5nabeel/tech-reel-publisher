import json
import subprocess
import sys
from pathlib import Path

from techtip.schema import Tip

REMOTION_DIR = Path(__file__).parent.parent / "remotion"


def render_tip(
    tip: Tip,
    out_path: Path,
    bg_style: str | None = None,
    bg_color: str | None = None,
) -> None:
    out_path = out_path.resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)

    props = tip.model_dump(by_alias=True)
    if bg_style is not None:
        props["bgStyle"] = bg_style
    if bg_color is not None:
        props["bgColor"] = bg_color

    props_path = REMOTION_DIR / "props.json"
    props_path.write_text(
        json.dumps(props, indent=2),
        encoding="utf-8",
    )

    subprocess.run(
        [
            "npx",
            "remotion",
            "render",
            "src/index.ts",
            "TechTip",
            str(out_path),
            "--props=props.json",
        ],
        cwd=REMOTION_DIR,
        check=True,
        shell=(sys.platform == "win32"),
    )
