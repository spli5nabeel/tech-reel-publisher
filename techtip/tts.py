import asyncio
import os
from pathlib import Path

import edge_tts

from techtip.schema import Tip

DEFAULT_VOICE = "en-US-EricNeural"


async def _synthesize_scene(text: str, voice: str, out_path: Path) -> None:
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(str(out_path))


def synthesize_tip(
    tip: Tip,
    voice: str | None = None,
    public_dir: Path | None = None,
) -> Tip:
    voice = voice or os.environ.get("TECHTIP_TTS_VOICE", DEFAULT_VOICE)
    public_dir = public_dir or (Path(__file__).parent.parent / "remotion" / "public")
    public_dir.mkdir(parents=True, exist_ok=True)

    updated_scenes = []
    for i, scene in enumerate(tip.scenes):
        if scene.narration.strip():
            out_path = public_dir / f"vo_{i}.mp3"
            asyncio.run(_synthesize_scene(scene.narration, voice, out_path))
            updated_scenes.append(scene.model_copy(update={"audio_src": f"vo_{i}.mp3"}))
        else:
            updated_scenes.append(scene)

    return tip.model_copy(update={"scenes": updated_scenes})
