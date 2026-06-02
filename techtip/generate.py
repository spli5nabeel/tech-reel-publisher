import json
import os
import shutil
import subprocess
import sys

from dotenv import load_dotenv

from techtip.schema import Tip

load_dotenv()

SYSTEM = """You are a tech-tip video script generator. Output ONLY a single JSON object — no markdown, no prose, no code fences.

The JSON must match this exact structure:
{
  "topic": "<string>",
  "hook": "<one-line hook — max 8 words>",
  "audio": null,
  "scenes": [<Scene>, ...]
}

Scene types (use camelCase keys exactly as shown):
  kinetic: {"type":"kinetic","durationInSeconds":<number>,"narration":"<string>","title":"<string>","subtitle":"<string>"}
  code:    {"type":"code","durationInSeconds":<number>,"narration":"<string>","language":"<string>","code":"<string>"}
  ui:      {"type":"ui","durationInSeconds":<number>,"narration":"<string>","appName":"<string>","steps":["<string>",...]}
  mascot:  {"type":"mascot","durationInSeconds":<number>,"narration":"<string>","emotion":"happy","message":"<string>"}

Rules:
- 4 to 6 scenes total; total durationInSeconds must be between 25 and 40.
- First scene must be type "kinetic" (the hook).
- Last scene must be type "mascot" (the call to action / CTA).
- Every scene must have a non-empty narration string.
- Output ONLY the JSON object. No other text before or after it."""


def _user_prompt(topic: str) -> str:
    return f"Generate a tech-tip video script about: {topic}"


def _parse(raw: str) -> Tip:
    text = raw.strip()

    for fence in ("```json", "```"):
        if text.startswith(fence):
            text = text[len(fence):]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()
            break

    try:
        return Tip.model_validate_json(text)
    except Exception:
        pass

    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return Tip.model_validate_json(text[start : end + 1])
        except Exception as exc:
            raise ValueError(
                f"Model output could not be parsed as a Tip: {exc}\n\nRaw output:\n{raw[:500]}"
            ) from exc

    raise ValueError(
        f"Model output contains no JSON object.\n\nRaw output:\n{raw[:500]}"
    )


def _generate_cli(topic: str) -> Tip:
    if not shutil.which("claude"):
        raise RuntimeError(
            "Claude Code CLI not found. Install it and log in: https://claude.ai/code"
        )

    cmd = [
        "claude",
        "-p", _user_prompt(topic),
        "--append-system-prompt", SYSTEM,
        "--output-format", "json",
        "--max-turns", "1",
    ]
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding="utf-8",
            check=True,
            timeout=180,
            shell=(sys.platform == "win32"),
        )
    except subprocess.CalledProcessError as exc:
        raise RuntimeError(f"Claude CLI failed:\n{exc.stderr}") from exc

    try:
        data = json.loads(result.stdout)
        raw = data.get("result", result.stdout)
    except json.JSONDecodeError:
        raw = result.stdout

    return _parse(raw)


def _generate_api(topic: str) -> Tip:
    try:
        import anthropic
    except ImportError:
        raise RuntimeError(
            "The 'anthropic' package is required for the api backend. "
            "Install it with: pip install anthropic"
        )

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not set in the environment.")

    client = anthropic.Anthropic(api_key=api_key)
    message = client.messages.create(
        model="claude-opus-4-8",
        max_tokens=2048,
        system=SYSTEM,
        messages=[{"role": "user", "content": _user_prompt(topic)}],
    )

    raw = message.content[0].text
    return _parse(raw)


def generate_tip(topic: str) -> Tip:
    backend = os.environ.get("TECHTIP_GEN_BACKEND", "cli").lower()
    if backend == "cli":
        return _generate_cli(topic)
    if backend == "api":
        return _generate_api(topic)
    raise ValueError(
        f"Unknown TECHTIP_GEN_BACKEND: {backend!r}. Use 'cli' or 'api'."
    )
