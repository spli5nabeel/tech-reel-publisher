# Spec 002 — Generation backend (Claude CLI + API)

- Status: Draft
- Last updated: 2026-06-02
- Depends on: 001

## Requirements

- R1. `generate_tip(topic) -> Tip` returns a validated `Tip` from a topic string.
- R2. Backend is selected by env `TECHTIP_GEN_BACKEND`: `cli` (default) or `api`.
- R3. `cli` runs Claude Code headless: `claude -p "<user>" --append-system-prompt
  "<rules>" --output-format json --max-turns 1`, then parses the `.result` field.
  It uses the existing Claude login — no API key in the app.
- R4. `api` uses the Anthropic Python SDK with `ANTHROPIC_API_KEY`; the SDK
  import is lazy so the `cli` path doesn't require the `anthropic` package.
- R5. Output parsing tolerates code fences and stray prose, and validates into a
  `Tip`; invalid output raises a clear error.
- R6. `render.py` writes `props.json` into `remotion/` and invokes the Remotion
  CLI; `pipeline.py` and `main.py` wire topic → generate → render.

## Design

- Shared `SYSTEM` prompt instructing strict JSON matching the contract, 4–6
  scenes, 25–40s, kinetic hook first, mascot CTA last.
- `_parse(raw)`: strip fences, try `Tip.model_validate_json`; on failure, slice
  from first `{` to last `}` and retry.
- `cli` backend: `subprocess.run([...], capture_output=True, text=True,
  check=True, timeout=180)`. Map `FileNotFoundError` → "install Claude Code and
  log in"; `CalledProcessError` → surface stderr.
- `render.py`: `subprocess.run(["npx","remotion","render","src/index.ts",
  "TechTip", <abs out>, "--props=props.json"], cwd=remotion, check=True)`.

## Tasks

1. `techtip/generate.py`: `SYSTEM`, `_parse`, `_generate_cli`, `_generate_api`,
   dispatcher `generate_tip`. [multi-file with schema if fields change]
2. `techtip/render.py`: props write + Remotion CLI subprocess.
3. `techtip/pipeline.py` + `main.py`: orchestrate and expose a CLI entry.
4. `.env.example` + `requirements.txt`: document `TECHTIP_GEN_BACKEND`; mark
   `anthropic` optional.

## Acceptance criteria

- (R3) With Claude Code logged in and no `ANTHROPIC_API_KEY`,
  `python main.py "git stash for work in progress"` renders an MP4.
- (R2/R4) `TECHTIP_GEN_BACKEND=api` with a key also works.
- (R5) A forced bad model response raises a validation error, not a crash.

## Out of scope

TTS (003), web UI (004), publishing (005).
