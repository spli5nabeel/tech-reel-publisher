# CLAUDE.md — Tech-Tip Reels Generator

This file is loaded automatically by Claude Code at the start of every session.
It is the persistent context for the project. Read it, then read the relevant
spec in `specs/` before writing any code.

## What this project is

A pipeline that turns a topic into an animated, vertical (1080×1920) tech-tip
video for Reels/Shorts. Python orchestrates everything; Remotion (React) is the
render engine, called as a subprocess. AI script generation runs through the
Claude Code CLI by default (no API key in the app).

## How we work here (spec-driven)

1. Every feature has a spec in `specs/`. Do not implement anything that isn't
   described in a spec. If a spec is missing or ambiguous, propose an update to
   the spec first and wait for approval — do not invent scope.
2. Work one spec at a time. Before coding, produce a numbered task plan and let
   the human review it (use plan mode). Implement task by task; pause for review
   between tasks that touch multiple files.
3. The scene-JSON schema is the single source of truth and the contract between
   the Python and Remotion halves. It is defined twice — `techtip/schema.py`
   (pydantic) and `remotion/src/types.ts` (zod). If you change one, change the
   other in the same task.
4. Prefer small, reviewable diffs. Keep each task's change focused.

## Architecture

```
topic ─► generate.py ─► Tip (scenes JSON) ─► tts.py ─► render.py ─► out/video.mp4
          (Claude CLI)     (the contract)     (edge-tts)  (Remotion CLI)
```

- `generate.py` selects a backend via `TECHTIP_GEN_BACKEND`: `cli` (Claude Code
  headless, default) or `api` (Anthropic SDK + key).
- `render.py` writes `props.json` and runs the Remotion CLI; Node lives only
  inside `remotion/`.
- A FastAPI app (`server.py`) + single-page UI (`web/index.html`) drives the
  pipeline from the browser. Renders run as background jobs with status polling.

## Tech stack

- Python 3.11+, pydantic v2, FastAPI, uvicorn, edge-tts, python-dotenv.
- Node 20+, Remotion 4, React 18, TypeScript, zod.
- Optional: faster-whisper (local captions), ElevenLabs/OpenAI (better TTS).

## Target repository structure

```
CLAUDE.md
specs/                  feature specs (this methodology)
techtip/                Python pipeline package
  schema.py generate.py tts.py render.py publish.py pipeline.py
server.py main.py
web/index.html
remotion/               React render engine (src/scenes/*, src/types.ts)
out/                    rendered MP4s (gitignored)
```

## Commands

```bash
# setup
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cd remotion && npm install && cd ..

# run
uvicorn server:app --reload        # web UI at http://127.0.0.1:8000
python main.py "topic here"        # one-shot CLI run
cd remotion && npm run studio      # visual scene preview
```

## Conventions

- Scene JSON keys are camelCase (so they serialize straight to Remotion). Keep
  pydantic and zod field names identical.
- Video is always 1080×1920 at 30fps. Total duration is derived from scene
  durations — never hardcode it.
- Four scene types only: `kinetic`, `code`, `ui`, `mascot`. Adding a type means
  updating both schemas, `SceneRouter`, and a new scene component.
- Secrets come from env / `.env`; never commit keys or hardcode them.

## Guardrails — do NOT

- Do not auto-publish. Publishing stays behind an explicit human approval step,
  and AI-generated videos must carry the platform's AI-content label.
- Do not set `ANTHROPIC_API_KEY` in code or shell when using the `cli` backend —
  Claude Code would silently bill the API instead of the subscription.
- Do not break the scene-JSON contract or change the render resolution/fps
  without a spec update.

## Definition of done (per task)

- Code runs locally; `python main.py "<topic>"` produces an MP4.
- Both schema definitions stay in sync.
- No secrets committed; `.env.example` updated if a new variable is introduced.
