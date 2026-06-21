from pathlib import Path
from techtip.schema import Tip
from techtip.render import render_tip
import json

with open("_script.json") as f:
    data = json.load(f)

tip = Tip.model_validate(data)
out = Path("out") / "what-is-python-why-learn-it.mp4"
out.parent.mkdir(parents=True, exist_ok=True)
print(f"Script ready - {len(tip.scenes)} scenes, {sum(s.duration_in_seconds for s in tip.scenes):.0f}s total")
print("Rendering video...")
render_tip(tip, out)
print(f"Done! -> {out}")
