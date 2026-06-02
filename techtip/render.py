import json
import subprocess
import sys
from pathlib import Path

from techtip.schema import Tip

REMOTION_DIR = Path(__file__).parent.parent / "remotion"


def render_tip(tip: Tip, out_path: Path) -> None:
    out_path = out_path.resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)

    props_path = REMOTION_DIR / "props.json"
    props_path.write_text(
        json.dumps(tip.model_dump(by_alias=True), indent=2),
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
