# Spec 008 — Target Duration Control

## Goal
Let the user choose how long the generated video should be before hitting Generate.
The LLM script generator uses this target to produce an appropriate number of scenes.

## UI change (`web/index.html`)
Add a **Duration** section in the sidebar above the Generate button:

```
Duration
[ 30 s ]  [ 45 s ]  [ 60 s ]  [ 90 s ]   ← segmented pill selector, default 45 s
```

## API change (`server.py`)
Add `duration: int = 45` to `GenerateRequest` (seconds).

## Pipeline change (`techtip/pipeline.py`)
Pass `duration` to `generate_tip(topic, target_seconds=duration)`.

## Generator change (`techtip/generate.py`)
Inject the target into the system/user prompt:

> "The video should be approximately {target_seconds} seconds total.
> Generate scenes whose `durationInSeconds` values sum to roughly that target."

No schema change — `target_seconds` is a generation hint, not stored in the Tip.

## Definition of done
- Selecting 30 s produces a noticeably shorter script than 90 s.
- `python main.py "topic" --duration 60` works on the CLI.
- No schema (Pydantic/Zod) change required.
