import json
import os
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

    # Render to a temp file first, then move it into place. This means:
    #  - a crashed render never leaves a half-written MP4 behind, and
    #  - if the destination is locked (e.g. the previous video is still loaded
    #    in the browser preview), we get a clear, actionable error instead of a
    #    cryptic "exit status 1".
    tmp_out = out_path.with_name(f".{out_path.stem}.partial{out_path.suffix}")

    result = subprocess.run(
        [
            "npx",
            "remotion",
            "render",
            "src/index.ts",
            "TechTip",
            str(tmp_out),
            "--props=props.json",
        ],
        cwd=REMOTION_DIR,
        shell=(sys.platform == "win32"),
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        if tmp_out.exists():
            tmp_out.unlink()
        # Surface the actual Remotion error (stderr) so the job log is useful.
        detail = (result.stderr or result.stdout or "").strip()
        tail = detail[-1500:] if detail else "(no output captured)"
        raise RuntimeError(
            f"Remotion render failed (exit {result.returncode}):\n{tail}"
        )

    try:
        os.replace(tmp_out, out_path)
    except PermissionError as exc:
        if tmp_out.exists():
            tmp_out.unlink()
        raise RuntimeError(
            f"Render succeeded but '{out_path.name}' could not be written — "
            f"the file is in use. Close it in any video player or browser tab, "
            f"or choose a different output filename, then try again."
        ) from exc
