import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

from dotenv import load_dotenv

from techtip.schema import Tip

load_dotenv()

SYSTEM = """You are a tech-tip video script generator. Output ONLY a single JSON object — no markdown, no prose, no code fences.

The JSON must match this exact structure:
{
  "topic": "<string>",
  "hook": "<one-line hook — max 8 words>",
  "audio": null,
  "youtube": {
    "title": "<punchy YouTube Shorts title, 50-70 chars, no clickbait>",
    "description": "<2-3 sentences covering what viewers will learn, good for SEO>",
    "hashtags": ["#TechTips", "#Coding", "<3-5 more topic-specific tags>"]
  },
  "scenes": [<Scene>, ...]
}

Scene types (use camelCase keys exactly as shown):
  kinetic: {"type":"kinetic","durationInSeconds":<number>,"narration":"<string>","title":"<string>","subtitle":"<string>"}
  code:    {"type":"code","durationInSeconds":<number>,"narration":"<string>","language":"<string>","code":"<string>"}
  ui:      {"type":"ui","durationInSeconds":<number>,"narration":"<string>","appName":"<string>","steps":["<string>",...]}
  mascot:  {"type":"mascot","durationInSeconds":<number>,"narration":"<string>","emotion":"happy","message":"<string>"}

Rules:
- Scene count and total duration are set by the user message — follow them exactly.
- First scene must be type "kinetic" (the hook).
- Last scene must be type "mascot" (the call to action / CTA).
- Every scene must have a non-empty narration string.
- Output ONLY the JSON object. No other text before or after it."""


def _user_prompt(topic: str, target_seconds: int = 45) -> str:
    min_scenes = max(3, target_seconds // 12)
    max_scenes = min(10, max(min_scenes + 2, target_seconds // 7))
    min_dur = int(target_seconds * 0.85)
    max_dur = int(target_seconds * 1.15)
    return (
        f"Generate a tech-tip video script about: {topic}\n\n"
        f"Target: {min_scenes}–{max_scenes} scenes, "
        f"{min_dur}–{max_dur} seconds total (sum of durationInSeconds)."
    )


def _cli_prompt(topic: str, target_seconds: int = 45) -> str:
    """Embeds system instructions in the user turn — the only reliable way
    to override Claude Code CLI's built-in system prompt."""
    return (
        f"{SYSTEM}\n\n"
        f"{_user_prompt(topic, target_seconds)}\n\n"
        f"Output ONLY the JSON object. No markdown, no headers, no prose."
    )


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


def _generate_cli(topic: str, target_seconds: int = 45) -> Tip:
    claude_exec = shutil.which("claude")
    if not claude_exec:
        raise RuntimeError(
            "Claude Code CLI not found. Install it and log in: https://claude.ai/code"
        )

    timeout = int(os.environ.get("TECHTIP_CLI_TIMEOUT", "300"))

    # Pass the prompt via stdin rather than a -p argument.
    # On Windows, cmd.exe mishandles \" inside quoted strings — the JSON examples
    # in our prompt contain many " characters that list2cmdline escapes as \",
    # which cmd.exe interprets as ending the quoted string, garbling the prompt.
    # Stdin bypasses all shell-escaping entirely.
    # -p without an argument puts claude in print mode and reads the prompt from stdin.
    if sys.platform == "win32":
        # .cmd files cannot run without a shell; invoke via cmd.exe /c explicitly
        # so we can still use shell=False and avoid the escaping problem.
        cmd = ["cmd.exe", "/c", claude_exec,
               "-p", "--output-format", "text", "--max-turns", "1"]
    else:
        cmd = ["claude",
               "-p", "--output-format", "text", "--max-turns", "1"]

    # Run from home dir to avoid loading the project's CLAUDE.md and MCP servers.
    run_cwd = Path.home()
    try:
        result = subprocess.run(
            cmd,
            input=_cli_prompt(topic, target_seconds),
            capture_output=True,
            text=True,
            encoding="utf-8",
            check=True,
            timeout=timeout,
            cwd=run_cwd,
            shell=False,
        )
    except subprocess.TimeoutExpired:
        raise RuntimeError(
            f"Claude CLI timed out after {timeout}s.\n"
            "Options:\n"
            "  1. Increase timeout: set TECHTIP_CLI_TIMEOUT=600 in .env\n"
            "  2. Switch to API backend (faster & more reliable on Windows):\n"
            "       TECHTIP_GEN_BACKEND=api\n"
            "       ANTHROPIC_API_KEY=<your-key>"
        )
    except subprocess.CalledProcessError as exc:
        raise RuntimeError(f"Claude CLI failed:\n{exc.stderr}") from exc

    return _parse(result.stdout)


def _generate_api(topic: str, target_seconds: int = 45) -> Tip:
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
        messages=[{"role": "user", "content": _user_prompt(topic, target_seconds)}],
    )

    raw = message.content[0].text
    return _parse(raw)


def _enforce_cta(tip: Tip) -> Tip:
    """Always end with a Like & Subscribe CTA regardless of what the AI wrote."""
    from techtip.schema import MascotScene
    last = tip.scenes[-1]
    updated_last = last.model_copy(update={
        "narration": "If you found this helpful, smash that like button and subscribe for more tech tips!",
        **({"message": "Like & Subscribe!"} if isinstance(last, MascotScene) else {}),
    })
    return tip.model_copy(update={"scenes": [*tip.scenes[:-1], updated_last]})


def generate_tip(topic: str, target_seconds: int = 45) -> Tip:
    backend = os.environ.get("TECHTIP_GEN_BACKEND", "cli").lower()
    if backend == "cli":
        tip = _generate_cli(topic, target_seconds)
    elif backend == "api":
        tip = _generate_api(topic, target_seconds)
    else:
        raise ValueError(
            f"Unknown TECHTIP_GEN_BACKEND: {backend!r}. Use 'cli' or 'api'."
        )
    return _enforce_cta(tip)
